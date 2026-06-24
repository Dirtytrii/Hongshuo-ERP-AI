package com.hongshuo.erp.service;

import com.hongshuo.erp.repository.ChangeOrderRepository;
import com.hongshuo.erp.repository.ContractRepository;
import com.hongshuo.erp.repository.DepartmentRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.InventoryItemRepository;
import com.hongshuo.erp.repository.LoanRepaymentRepository;
import com.hongshuo.erp.repository.LoanRepository;
import com.hongshuo.erp.repository.MilestoneRepository;
import com.hongshuo.erp.repository.PaymentPlanItemRepository;
import com.hongshuo.erp.repository.ProjectDocumentRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.ReimbursementRepository;
import com.hongshuo.erp.repository.StockLogRepository;
import com.hongshuo.erp.repository.SupplierRepository;
import com.hongshuo.erp.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BusinessDataResetService {
    private final SystemLogRepository systemLogRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final LoanRepaymentRepository loanRepaymentRepository;
    private final ReimbursementRepository reimbursementRepository;
    private final LoanRepository loanRepository;
    private final StockLogRepository stockLogRepository;
    private final FinanceRecordRepository financeRecordRepository;
    private final PaymentPlanItemRepository paymentPlanItemRepository;
    private final ContractRepository contractRepository;
    private final ChangeOrderRepository changeOrderRepository;
    private final MilestoneRepository milestoneRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final SupplierRepository supplierRepository;
    private final DepartmentRepository departmentRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public void resetBusinessData() {
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
    }
}
