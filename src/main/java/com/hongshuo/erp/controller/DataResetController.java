package com.hongshuo.erp.controller;

import com.hongshuo.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/data")
public class DataResetController {

    @Autowired
    private SystemLogRepository systemLogRepository;
    
    @Autowired
    private StockLogRepository stockLogRepository;
    
    @Autowired
    private FinanceRecordRepository financeRecordRepository;
    
    @Autowired
    private MilestoneRepository milestoneRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private ProjectDocumentRepository projectDocumentRepository;

    @Autowired
    private LoanRepaymentRepository loanRepaymentRepository;

    @Autowired
    private ReimbursementRepository reimbursementRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private PaymentPlanItemRepository paymentPlanItemRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private ChangeOrderRepository changeOrderRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Value("${app.data.reset-endpoint.enabled:false}")
    private boolean resetEndpointEnabled;

    @PostMapping("/reset")
    @Transactional
    public ResponseEntity<Map<String, Object>> resetData() {
        if (!resetEndpointEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "error", "Data reset endpoint is disabled"
            ));
        }
        try {
            // 清空所有数据（按依赖关系顺序）
            systemLogRepository.deleteAll();
            projectDocumentRepository.deleteAll();
            loanRepaymentRepository.deleteAll();
            reimbursementRepository.deleteAll();
            loanRepository.deleteAll();
            stockLogRepository.deleteAll();
            financeRecordRepository.deleteAll();
            paymentPlanItemRepository.deleteAll();
            contractRepository.deleteAll();
            changeOrderRepository.deleteAll();
            milestoneRepository.deleteAll();
            inventoryItemRepository.deleteAll();
            supplierRepository.deleteAll();
            departmentRepository.deleteAll();
            projectRepository.deleteAll();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "数据已重置，请重启应用以重新初始化数据"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}



