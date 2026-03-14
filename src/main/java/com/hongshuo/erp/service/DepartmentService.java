package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Department;
import com.hongshuo.erp.model.dto.DepartmentCostSummaryDto;
import com.hongshuo.erp.repository.DepartmentRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.LoanRepository;
import com.hongshuo.erp.repository.ReimbursementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final FinanceRecordRepository financeRecordRepository;
    private final ReimbursementRepository reimbursementRepository;
    private final LoanRepository loanRepository;

    /**
     * 查询全部部门。
     *
     * @return 部门列表
     */
    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    /**
     * 根据ID查询部门。
     *
     * @param id 部门ID
     * @return 部门详情
     */
    public Optional<Department> findById(Long id) {
        return departmentRepository.findById(id);
    }

    /**
     * 创建部门。
     *
     * @param department 部门数据
     * @return 创建后的部门
     */
    @Transactional
    public Department create(Department department) {
        validateDepartment(department, null);
        department.setId(null);
        return departmentRepository.save(department);
    }

    /**
     * 更新部门。
     *
     * @param id 部门ID
     * @param updates 更新数据
     * @return 更新后的部门
     */
    @Transactional
    public Department update(Long id, Department updates) {
        Department existing = departmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("部门不存在: " + id));
        validateDepartment(updates, id);
        existing.setName(updates.getName().trim());
        existing.setCode(updates.getCode().trim());
        existing.setParentId(updates.getParentId());
        return departmentRepository.save(existing);
    }

    /**
     * 删除部门。
     *
     * @param id 部门ID
     */
    @Transactional
    public void delete(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new RuntimeException("部门不存在: " + id);
        }
        departmentRepository.deleteById(id);
    }

    /**
     * 汇总部门成本（财务支出 + 报销 + 借款）。
     *
     * @return 部门成本汇总列表
     */
    public List<DepartmentCostSummaryDto> getCostSummary() {
        return departmentRepository.findAll().stream()
            .map(this::toCostSummary)
            .toList();
    }

    private DepartmentCostSummaryDto toCostSummary(Department department) {
        BigDecimal finance = nullToZero(financeRecordRepository.sumApprovedExpenseByDepartmentId(department.getId()));
        BigDecimal reimbursement = nullToZero(reimbursementRepository.sumApprovedByDepartmentId(department.getId()));
        BigDecimal loan = nullToZero(loanRepository.sumApprovedByDepartmentId(department.getId()));
        return new DepartmentCostSummaryDto(
            department.getId(),
            department.getName(),
            finance,
            reimbursement,
            loan,
            finance.add(reimbursement).add(loan)
        );
    }

    private void validateDepartment(Department department, Long currentId) {
        if (department.getName() == null || department.getName().isBlank()) {
            throw new RuntimeException("部门名称不能为空");
        }
        if (department.getCode() == null || department.getCode().isBlank()) {
            throw new RuntimeException("部门编码不能为空");
        }
        departmentRepository.findByCode(department.getCode().trim()).ifPresent(existing -> {
            if (currentId == null || !existing.getId().equals(currentId)) {
                throw new RuntimeException("部门编码已存在: " + department.getCode());
            }
        });
        if (department.getParentId() != null && departmentRepository.findById(department.getParentId()).isEmpty()) {
            throw new RuntimeException("上级部门不存在: " + department.getParentId());
        }
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
