package com.hongshuo.erp.service;

import com.hongshuo.erp.model.InventoryItem;
import com.hongshuo.erp.repository.InventoryItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @InjectMocks
    private InventoryService inventoryService;

    @Test
    void getAllInventory_returnsFromRepository() {
        InventoryItem item = createItem(1L, "水泥", "42.5R", "吨", 10);
        when(inventoryItemRepository.findAll()).thenReturn(List.of(item));

        List<InventoryItem> result = inventoryService.getAllInventory();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("水泥");
    }

    @Test
    void getInventoryById_whenExists_returnsOptional() {
        InventoryItem item = createItem(1L, "水泥", "42.5R", "吨", 10);
        when(inventoryItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThat(inventoryService.getInventoryById(1L)).contains(item);
    }

    @Test
    void getInventoryById_whenNotExists_returnsEmpty() {
        when(inventoryItemRepository.findById(999L)).thenReturn(Optional.empty());
        assertThat(inventoryService.getInventoryById(999L)).isEmpty();
    }

    @Test
    void createInventoryItem_savesAndReturns() {
        InventoryItem input = createItem(null, "钢筋", "HRB400", "吨", 0);
        InventoryItem saved = createItem(1L, "钢筋", "HRB400", "吨", 0);
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(saved);

        InventoryItem result = inventoryService.createInventoryItem(input);

        assertThat(result.getId()).isEqualTo(1L);
        verify(inventoryItemRepository).save(input);
    }

    @Test
    void updateInventoryItem_whenExists_updatesAndReturns() {
        InventoryItem existing = createItem(1L, "水泥", "42.5R", "吨", 10);
        InventoryItem details = createItem(null, "水泥更新", "42.5R", "吨", 20);
        when(inventoryItemRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryItem result = inventoryService.updateInventoryItem(1L, details);

        assertThat(result.getName()).isEqualTo("水泥更新");
        assertThat(existing.getQuantity()).isEqualTo(20);
        verify(inventoryItemRepository).save(existing);
    }

    @Test
    void updateInventoryItem_whenNotExists_throws() {
        InventoryItem details = createItem(null, "x", "s", "个", 0);
        when(inventoryItemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.updateInventoryItem(999L, details))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("物料不存在");
        verify(inventoryItemRepository, never()).save(any());
    }

    @Test
    void deleteInventoryItem_callsRepository() {
        inventoryService.deleteInventoryItem(1L);
        verify(inventoryItemRepository).deleteById(1L);
    }

    @Test
    void getLowStockItems_filtersByQuantityBelowThreshold() {
        InventoryItem low = createItem(1L, "水泥", "42.5R", "吨", 5);
        low.setThreshold(10);
        InventoryItem ok = createItem(2L, "钢筋", "HRB400", "吨", 100);
        ok.setThreshold(50);
        when(inventoryItemRepository.findAll()).thenReturn(List.of(low, ok));

        List<InventoryItem> result = inventoryService.getLowStockItems();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("水泥");
        assertThat(result.get(0).getQuantity()).isLessThan(result.get(0).getThreshold());
    }

    private static InventoryItem createItem(Long id, String name, String spec, String unit, int qty) {
        InventoryItem item = new InventoryItem();
        if (id != null) item.setId(id);
        item.setName(name);
        item.setSpec(spec);
        item.setUnit(unit);
        item.setPrice(BigDecimal.valueOf(500));
        item.setQuantity(qty);
        item.setThreshold(10);
        return item;
    }
}
