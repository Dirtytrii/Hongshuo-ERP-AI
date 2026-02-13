package com.hongshuo.erp.service;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.SystemLogRepository;
import com.hongshuo.erp.model.SystemLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FinanceService {
    
    // 大额支出阈值：10万元
    private static final BigDecimal LARGE_EXPENSE_THRESHOLD = new BigDecimal("100000");
    
    @Autowired
    private FinanceRecordRepository financeRecordRepository;
    
    @Autowired
    private SystemLogRepository systemLogRepository;
    
    /**
     * 创建财务记录
     * 大额支出（>=10万）需要管理员审核
     */
    @Transactional
    public FinanceRecord createFinanceRecord(FinanceRecord record, String creatorRole) {
        // 判断是否需要审核
        if (record.getType() == FinanceRecord.FinanceType.expense 
            && record.getAmount().compareTo(LARGE_EXPENSE_THRESHOLD) >= 0) {
            // 大额支出需要管理员审核
            record.setStatus("pending");
            logSystemAction(creatorRole, "申请大额财务支出", 
                String.format("类型: %s, 金额: %s, 项目ID: %s", record.getCategory(), record.getAmount(), record.getProjectId()));
        } else {
            // 小额支出或收入直接生效
            record.setStatus("approved");
            logSystemAction(creatorRole, record.getType() == FinanceRecord.FinanceType.income ? "财务收入" : "财务支出", 
                String.format("类型: %s, 金额: %s", record.getCategory(), record.getAmount()));
        }
        
        record.setCreator(creatorRole);
        record.setDate(LocalDate.now());
        
        return financeRecordRepository.save(record);
    }
    
    /**
     * 审核财务记录
     * 只有管理员（admin）可以审核大额支出
     */
    @Transactional
    public FinanceRecord approveFinanceRecord(Long recordId, String approverRole, String approvalNote, boolean approved) {
        FinanceRecord record = financeRecordRepository.findById(recordId)
            .orElseThrow(() -> new RuntimeException("财务记录不存在: " + recordId));
        
        if (!"pending".equals(record.getStatus())) {
            throw new RuntimeException("该记录已处理，无法再次审核");
        }
        
        // 检查权限：只有管理员可以审核大额支出
        if (!approverRole.contains("admin") && !approverRole.contains("Admin") && !approverRole.contains("管理员")) {
            throw new RuntimeException("只有管理员可以审核大额财务支出");
        }
        
        if (approved) {
            record.setStatus("approved");
            record.setApprover(approverRole);
            record.setApprovalDate(LocalDate.now());
            record.setApprovalNote(approvalNote);
            
            logSystemAction(approverRole, "批准财务支出", 
                String.format("类型: %s, 金额: %s", record.getCategory(), record.getAmount()));
        } else {
            record.setStatus("rejected");
            record.setApprover(approverRole);
            record.setApprovalDate(LocalDate.now());
            record.setApprovalNote(approvalNote);
            
            logSystemAction(approverRole, "拒绝财务支出", 
                String.format("类型: %s, 金额: %s, 原因: %s", record.getCategory(), record.getAmount(), approvalNote));
        }
        
        return financeRecordRepository.save(record);
    }
    
    public List<FinanceRecord> getAllFinanceRecords() {
        return financeRecordRepository.findAll();
    }
    
    public List<FinanceRecord> getPendingFinanceRecords() {
        return financeRecordRepository.findByStatus("pending");
    }
    
    public Optional<FinanceRecord> getFinanceRecordById(Long id) {
        return financeRecordRepository.findById(id);
    }
    
    public List<FinanceRecord> getFinanceRecordsByProjectId(Long projectId) {
        return financeRecordRepository.findByProjectId(projectId);
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

