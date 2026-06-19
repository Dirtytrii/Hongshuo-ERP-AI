package com.hongshuo.erp.integration;

import com.hongshuo.erp.model.InventoryItem;
import com.hongshuo.erp.model.StockLog;
import com.hongshuo.erp.repository.InventoryItemRepository;
import com.hongshuo.erp.repository.StockLogRepository;
import com.hongshuo.erp.repository.SystemLogRepository;
import com.hongshuo.erp.service.StockService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class StockConcurrencyIntegrationTest {

    @Autowired
    private StockService stockService;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private StockLogRepository stockLogRepository;

    @Autowired
    private SystemLogRepository systemLogRepository;

    @BeforeEach
    void setUp() {
        stockLogRepository.deleteAll();
        inventoryItemRepository.deleteAll();
        systemLogRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        stockLogRepository.deleteAll();
        inventoryItemRepository.deleteAll();
        systemLogRepository.deleteAll();
    }

    @Test
    void approveStockOut_whenSamePendingLogApprovedConcurrently_onlyOneApprovalDeductsStock() throws Exception {
        InventoryItem item = inventoryItemRepository.save(createItem(10));
        StockLog pending = stockLogRepository.save(createStockLog(item.getId(), 5));

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> approveTask = () -> {
            ready.countDown();
            assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
            try {
                stockService.approveStockOut(pending.getId(), "pm", "ok", true);
                return true;
            } catch (RuntimeException ex) {
                return false;
            }
        };

        Future<Boolean> first = executor.submit(approveTask);
        Future<Boolean> second = executor.submit(approveTask);
        assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        start.countDown();

        List<Boolean> results = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
        executor.shutdown();
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();

        assertThat(results).containsExactlyInAnyOrder(true, false);
        assertThat(inventoryItemRepository.findById(item.getId()).orElseThrow().getQuantity()).isEqualTo(5);
        assertThat(stockLogRepository.findById(pending.getId()).orElseThrow().getStatus()).isEqualTo("active");
    }

    @Test
    void approveStockOut_whenDifferentPendingLogsCompeteForInsufficientStock_onlyOneApprovalSucceeds() throws Exception {
        InventoryItem item = inventoryItemRepository.save(createItem(10));
        StockLog firstPending = stockLogRepository.save(createStockLog(item.getId(), 8));
        StockLog secondPending = stockLogRepository.save(createStockLog(item.getId(), 8));

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> approveFirst = createConcurrentApprovalTask(firstPending.getId(), ready, start);
        Callable<Boolean> approveSecond = createConcurrentApprovalTask(secondPending.getId(), ready, start);

        Future<Boolean> first = executor.submit(approveFirst);
        Future<Boolean> second = executor.submit(approveSecond);
        assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        start.countDown();

        List<Boolean> results = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
        executor.shutdown();
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();

        StockLog firstReloaded = stockLogRepository.findById(firstPending.getId()).orElseThrow();
        StockLog secondReloaded = stockLogRepository.findById(secondPending.getId()).orElseThrow();

        assertThat(results).containsExactlyInAnyOrder(true, false);
        assertThat(inventoryItemRepository.findById(item.getId()).orElseThrow().getQuantity()).isEqualTo(2);
        assertThat(List.of(firstReloaded.getStatus(), secondReloaded.getStatus()))
            .containsExactlyInAnyOrder("active", "pending");
    }

    private Callable<Boolean> createConcurrentApprovalTask(
            Long stockLogId, CountDownLatch ready, CountDownLatch start) {
        return () -> {
            ready.countDown();
            assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
            try {
                stockService.approveStockOut(stockLogId, "pm", "ok", true);
                return true;
            } catch (RuntimeException ex) {
                return false;
            }
        };
    }

    private static InventoryItem createItem(int quantity) {
        InventoryItem item = new InventoryItem();
        item.setName("concurrent-item");
        item.setSpec("spec");
        item.setUnit("unit");
        item.setPrice(BigDecimal.TEN);
        item.setQuantity(quantity);
        item.setThreshold(1);
        return item;
    }

    private static StockLog createStockLog(Long itemId, int qty) {
        StockLog log = new StockLog();
        log.setType(StockLog.StockType.out);
        log.setItemId(itemId);
        log.setQty(qty);
        log.setPrice(BigDecimal.TEN);
        log.setStatus("pending");
        log.setDate(LocalDate.now());
        log.setCreator("clerk");
        log.setIsReversal(false);
        return log;
    }
}
