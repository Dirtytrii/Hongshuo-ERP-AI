package com.hongshuo.erp.service;

import com.hongshuo.erp.model.InventoryItem;
import com.hongshuo.erp.repository.InventoryItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {
    
    @Autowired
    private InventoryItemRepository inventoryItemRepository;
    
    public List<InventoryItem> getAllInventory() {
        return inventoryItemRepository.findAll();
    }
    
    public Optional<InventoryItem> getInventoryById(Long id) {
        return inventoryItemRepository.findById(id);
    }
    
    @Transactional
    public InventoryItem createInventoryItem(InventoryItem item) {
        return inventoryItemRepository.save(item);
    }
    
    @Transactional
    public InventoryItem updateInventoryItem(Long id, InventoryItem itemDetails) {
        InventoryItem item = inventoryItemRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("物料不存在: " + id));
        
        item.setName(itemDetails.getName());
        item.setSpec(itemDetails.getSpec());
        item.setUnit(itemDetails.getUnit());
        item.setPrice(itemDetails.getPrice());
        item.setQuantity(itemDetails.getQuantity());
        item.setThreshold(itemDetails.getThreshold());
        
        return inventoryItemRepository.save(item);
    }
    
    @Transactional
    public void deleteInventoryItem(Long id) {
        inventoryItemRepository.deleteById(id);
    }
    
    public List<InventoryItem> getLowStockItems() {
        return inventoryItemRepository.findAll().stream()
            .filter(item -> item.getQuantity() < item.getThreshold())
            .toList();
    }
}

