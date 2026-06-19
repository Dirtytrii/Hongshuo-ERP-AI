package com.hongshuo.erp.service;

import com.hongshuo.erp.model.InventoryItem;
import com.hongshuo.erp.model.StockLog;
import com.hongshuo.erp.repository.InventoryItemRepository;
import com.hongshuo.erp.repository.StockLogRepository;
import com.hongshuo.erp.repository.SystemLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private StockLogRepository stockLogRepository;

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private SystemLogRepository systemLogRepository;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private StockService stockService;

    @Test
    void createStockLog_whenInbound_usesInventoryWriteLock() {
        InventoryItem item = createItem(1L, 10);
        StockLog input = createStockLog(null, StockLog.StockType.in, 1L, 5, "draft");
        when(inventoryItemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(stockLogRepository.save(any(StockLog.class))).thenAnswer(inv -> inv.getArgument(0));

        StockLog result = stockService.createStockLog(input, "clerk");

        assertThat(item.getQuantity()).isEqualTo(15);
        assertThat(result.getStatus()).isEqualTo("active");
        verify(inventoryItemRepository).findByIdForUpdate(1L);
        verify(inventoryItemRepository, never()).findById(1L);
    }

    @Test
    void createStockLog_whenAdminOutbound_usesInventoryWriteLockBeforeDeducting() {
        InventoryItem item = createItem(1L, 10);
        StockLog input = createStockLog(null, StockLog.StockType.out, 1L, 4, "draft");
        when(inventoryItemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(stockLogRepository.save(any(StockLog.class))).thenAnswer(inv -> inv.getArgument(0));

        StockLog result = stockService.createStockLog(input, "admin");

        assertThat(item.getQuantity()).isEqualTo(6);
        assertThat(result.getStatus()).isEqualTo("active");
        verify(inventoryItemRepository).findByIdForUpdate(1L);
        verify(inventoryItemRepository, never()).findById(1L);
    }

    @Test
    void approveStockOut_whenApproved_usesStockLogAndInventoryWriteLocks() {
        StockLog pending = createStockLog(9L, StockLog.StockType.out, 1L, 4, "pending");
        InventoryItem item = createItem(1L, 10);
        when(stockLogRepository.findByIdForUpdate(9L)).thenReturn(Optional.of(pending));
        when(inventoryItemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(stockLogRepository.save(any(StockLog.class))).thenAnswer(inv -> inv.getArgument(0));

        StockLog result = stockService.approveStockOut(9L, "pm", "ok", true);

        assertThat(result.getStatus()).isEqualTo("active");
        assertThat(item.getQuantity()).isEqualTo(6);
        verify(stockLogRepository).findByIdForUpdate(9L);
        verify(stockLogRepository, never()).findById(9L);
        verify(inventoryItemRepository).findByIdForUpdate(1L);
        verify(inventoryItemRepository, never()).findById(1L);
    }

    @Test
    void approveReversal_whenApproved_usesReversalAndInventoryWriteLocks() {
        StockLog reversal = createStockLog(11L, StockLog.StockType.out, 1L, -4, "pending");
        reversal.setIsReversal(true);
        InventoryItem item = createItem(1L, 10);
        when(stockLogRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(reversal));
        when(inventoryItemRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(stockLogRepository.save(any(StockLog.class))).thenAnswer(inv -> inv.getArgument(0));

        StockLog result = stockService.approveReversal(11L, "admin", "ok", true);

        assertThat(result.getStatus()).isEqualTo("active");
        assertThat(item.getQuantity()).isEqualTo(14);
        verify(stockLogRepository).findByIdForUpdate(11L);
        verify(stockLogRepository, never()).findById(11L);
        verify(inventoryItemRepository).findByIdForUpdate(1L);
        verify(inventoryItemRepository, never()).findById(1L);
    }

    private static InventoryItem createItem(Long id, int quantity) {
        InventoryItem item = new InventoryItem();
        item.setId(id);
        item.setName("item-" + id);
        item.setSpec("spec");
        item.setUnit("unit");
        item.setPrice(BigDecimal.TEN);
        item.setQuantity(quantity);
        item.setThreshold(1);
        return item;
    }

    private static StockLog createStockLog(Long id, StockLog.StockType type, Long itemId, int qty, String status) {
        StockLog log = new StockLog();
        log.setId(id);
        log.setType(type);
        log.setItemId(itemId);
        log.setQty(qty);
        log.setPrice(BigDecimal.TEN);
        log.setStatus(status);
        log.setDate(LocalDate.now());
        log.setCreator("tester");
        log.setIsReversal(false);
        return log;
    }
}
