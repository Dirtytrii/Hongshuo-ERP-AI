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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.inOrder;

@ExtendWith(MockitoExtension.class)
class BusinessDataResetServiceTest {

    @Mock
    private SystemLogRepository systemLogRepository;

    @Mock
    private ProjectDocumentRepository projectDocumentRepository;

    @Mock
    private LoanRepaymentRepository loanRepaymentRepository;

    @Mock
    private ReimbursementRepository reimbursementRepository;

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private StockLogRepository stockLogRepository;

    @Mock
    private FinanceRecordRepository financeRecordRepository;

    @Mock
    private PaymentPlanItemRepository paymentPlanItemRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ChangeOrderRepository changeOrderRepository;

    @Mock
    private MilestoneRepository milestoneRepository;

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private BusinessDataResetService businessDataResetService;

    @Test
    void resetBusinessDataShouldDeleteAllBusinessTablesInDependencyOrder() {
        businessDataResetService.resetBusinessData();

        InOrder inOrder = inOrder(
            systemLogRepository,
            projectDocumentRepository,
            loanRepaymentRepository,
            reimbursementRepository,
            loanRepository,
            stockLogRepository,
            financeRecordRepository,
            paymentPlanItemRepository,
            contractRepository,
            changeOrderRepository,
            milestoneRepository,
            inventoryItemRepository,
            supplierRepository,
            departmentRepository,
            projectRepository
        );
        inOrder.verify(systemLogRepository).deleteAll();
        inOrder.verify(projectDocumentRepository).deleteAll();
        inOrder.verify(loanRepaymentRepository).deleteAll();
        inOrder.verify(reimbursementRepository).deleteAll();
        inOrder.verify(loanRepository).deleteAll();
        inOrder.verify(stockLogRepository).deleteAll();
        inOrder.verify(financeRecordRepository).deleteAll();
        inOrder.verify(paymentPlanItemRepository).deleteAll();
        inOrder.verify(contractRepository).deleteAll();
        inOrder.verify(changeOrderRepository).deleteAll();
        inOrder.verify(milestoneRepository).deleteAll();
        inOrder.verify(inventoryItemRepository).deleteAll();
        inOrder.verify(supplierRepository).deleteAll();
        inOrder.verify(departmentRepository).deleteAll();
        inOrder.verify(projectRepository).deleteAll();
    }
}
