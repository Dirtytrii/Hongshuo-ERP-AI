package com.hongshuo.erp.service;

import com.hongshuo.erp.model.StockLog;
import com.hongshuo.erp.model.InventoryItem;
import com.hongshuo.erp.repository.StockLogRepository;
import com.hongshuo.erp.repository.InventoryItemRepository;
import com.hongshuo.erp.repository.SystemLogRepository;
import com.hongshuo.erp.model.SystemLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StockService {
    
    @Autowired
    private StockLogRepository stockLogRepository;
    
    @Autowired
    private InventoryItemRepository inventoryItemRepository;
    
    @Autowired
    private SystemLogRepository systemLogRepository;
    
    /**
     * 创建库存操作记录（入库或出库申请）
     * 出库需要项目经理审核，入库直接生效
     */
    @Transactional
    public StockLog createStockLog(StockLog stockLog, String creatorRole) {
        InventoryItem item = inventoryItemRepository.findById(stockLog.getItemId())
            .orElseThrow(() -> new RuntimeException("物料不存在: " + stockLog.getItemId()));
        
        // 出库操作需要审核
        if (stockLog.getType() == StockLog.StockType.out) {
            // 检查库存是否充足
            if (item.getQuantity() < stockLog.getQty()) {
                throw new RuntimeException("库存不足，当前库存: " + item.getQuantity() + ", 申请出库: " + stockLog.getQty());
            }
            
            // 出库需要项目经理审核（pm 角色）
            stockLog.setStatus("pending");
            stockLog.setCreator(creatorRole);
            stockLog.setDate(LocalDate.now());
            
            // 记录系统日志
            logSystemAction(creatorRole, "申请出库", 
                String.format("物料: %s, 数量: %d, 项目ID: %s", item.getName(), stockLog.getQty(), stockLog.getProjectId()));
        } else {
            // 入库直接生效
            item.setQuantity(item.getQuantity() + stockLog.getQty());
            inventoryItemRepository.save(item);
            stockLog.setStatus("active");
            stockLog.setCreator(creatorRole);
            stockLog.setDate(LocalDate.now());
            
            // 记录系统日志
            logSystemAction(creatorRole, "物料入库", 
                String.format("物料: %s, 数量: %d", item.getName(), stockLog.getQty()));
        }
        
        return stockLogRepository.save(stockLog);
    }
    
    /**
     * 审核出库申请
     * 只有项目经理（pm）可以审核
     */
    @Transactional
    public StockLog approveStockOut(Long logId, String approverRole, String approvalNote, boolean approved) {
        StockLog stockLog = stockLogRepository.findById(logId)
            .orElseThrow(() -> new RuntimeException("出库记录不存在: " + logId));
        
        if (stockLog.getType() != StockLog.StockType.out) {
            throw new RuntimeException("只能审核出库记录");
        }
        
        if (!"pending".equals(stockLog.getStatus())) {
            throw new RuntimeException("该记录已处理，无法再次审核");
        }
        
        // 检查权限：只有项目经理可以审核
        if (!approverRole.contains("pm") && !approverRole.contains("PM")) {
            throw new RuntimeException("只有项目经理可以审核出库申请");
        }
        
        InventoryItem item = inventoryItemRepository.findById(stockLog.getItemId())
            .orElseThrow(() -> new RuntimeException("物料不存在"));
        
        if (approved) {
            // 批准：更新库存
            if (item.getQuantity() < stockLog.getQty()) {
                throw new RuntimeException("库存不足，无法批准出库");
            }
            item.setQuantity(item.getQuantity() - stockLog.getQty());
            inventoryItemRepository.save(item);
            
            stockLog.setStatus("active");
            stockLog.setApprover(approverRole);
            stockLog.setApprovalDate(LocalDate.now());
            stockLog.setApprovalNote(approvalNote);
            
            logSystemAction(approverRole, "批准出库", 
                String.format("物料: %s, 数量: %d", item.getName(), stockLog.getQty()));
        } else {
            // 拒绝
            stockLog.setStatus("rejected");
            stockLog.setApprover(approverRole);
            stockLog.setApprovalDate(LocalDate.now());
            stockLog.setApprovalNote(approvalNote);
            
            logSystemAction(approverRole, "拒绝出库", 
                String.format("物料: %s, 数量: %d, 原因: %s", item.getName(), stockLog.getQty(), approvalNote));
        }
        
        return stockLogRepository.save(stockLog);
    }
    
    public List<StockLog> getAllStockLogs() {
        return stockLogRepository.findAll();
    }
    
    public List<StockLog> getPendingStockLogs() {
        return stockLogRepository.findByStatus("pending");
    }
    
    public Optional<StockLog> getStockLogById(Long id) {
        return stockLogRepository.findById(id);
    }
    
    private void logSystemAction(String user, String action, String detail) {
        SystemLog log = new SystemLog();
        log.setTime(LocalDateTime.now());
        log.setUser(user);
        log.setAction(action);
        log.setDetail(detail);
        systemLogRepository.save(log);
    }
}

