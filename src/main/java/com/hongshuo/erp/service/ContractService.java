package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Contract;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.repository.ChangeOrderRepository;
import com.hongshuo.erp.repository.ContractRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ContractService {
    private final ContractRepository contractRepository;

    private final ProjectRepository projectRepository;

    private final ChangeOrderRepository changeOrderRepository;

    private final ProjectDocumentAutoCollectService projectDocumentAutoCollectService;

    /**
     * 查询合同列表，支持按项目/结算状态/监控状态筛选。
     *
     * @param projectId 项目ID（可空）
     * @param settlementStatus 结算状态（可空）
     * @param monitoringStatus 监控状态（可空）
     * @return 合同列表
     */
    public List<Contract> findAll(Long projectId, String settlementStatus, String monitoringStatus) {
        List<Contract> base = projectId != null
            ? contractRepository.findByProjectIdOrderBySignedDateDesc(projectId)
            : contractRepository.findAll();
        return base.stream()
            .filter(c -> settlementStatus == null || settlementStatus.isBlank() || settlementStatus.equals(c.getSettlementStatus()))
            .filter(c -> monitoringStatus == null || monitoringStatus.isBlank() || monitoringStatus.equals(c.getMonitoringStatus()))
            .toList();
    }

    /**
     * 按ID查询合同详情。
     *
     * @param id 合同ID
     * @return 合同详情
     */
    public Optional<Contract> findById(Long id) {
        return contractRepository.findById(id);
    }

    /**
     * 创建合同并在存在合同主数据时回写项目合同额。
     *
     * @param contract 合同实体
     * @return 创建后的合同
     */
    @Transactional
    public Contract create(Contract contract) {
        validateContract(contract);
        Contract saved = contractRepository.save(contract);
        recalculateProjectContractAmount(saved.getProjectId());
        autoCollectContractDocument(saved);
        return saved;
    }

    /**
     * 更新合同并同步项目合同额。
     *
     * @param id 合同ID
     * @param updates 更新内容
     * @return 更新后的合同
     */
    @Transactional
    public Contract update(Long id, Contract updates) {
        Contract existing = contractRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("合同不存在: " + id));
        if (updates.getProjectId() == null) {
            updates.setProjectId(existing.getProjectId());
        }
        validateContract(updates);

        Long oldProjectId = existing.getProjectId();
        existing.setProjectId(updates.getProjectId());
        existing.setContractNo(updates.getContractNo().trim());
        existing.setName(updates.getName().trim());
        existing.setContractAmount(updates.getContractAmount());
        existing.setSignedDate(updates.getSignedDate());
        existing.setSettlementStatus(updates.getSettlementStatus().trim());
        existing.setMonitoringStatus(updates.getMonitoringStatus().trim());
        existing.setRemark(updates.getRemark());

        Contract saved = contractRepository.save(existing);
        recalculateProjectContractAmount(saved.getProjectId());
        if (!oldProjectId.equals(saved.getProjectId())) {
            recalculateProjectContractAmount(oldProjectId);
        }
        return saved;
    }

    /**
     * 删除合同并同步项目合同额。
     *
     * @param id 合同ID
     */
    @Transactional
    public void delete(Long id) {
        Contract existing = contractRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("合同不存在: " + id));
        Long projectId = existing.getProjectId();
        contractRepository.deleteById(id);
        recalculateProjectContractAmount(projectId);
    }

    private void validateContract(Contract contract) {
        if (contract.getProjectId() == null) {
            throw new RuntimeException("合同必须关联项目");
        }
        if (projectRepository.findById(contract.getProjectId()).isEmpty()) {
            throw new RuntimeException("项目不存在: " + contract.getProjectId());
        }
        if (contract.getContractNo() == null || contract.getContractNo().isBlank()) {
            throw new RuntimeException("合同编号不能为空");
        }
        if (contract.getName() == null || contract.getName().isBlank()) {
            throw new RuntimeException("合同名称不能为空");
        }
        if (contract.getContractAmount() == null || contract.getContractAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("合同金额必须大于或等于0");
        }
        if (contract.getSignedDate() == null) {
            throw new RuntimeException("签订日期不能为空");
        }
        if (contract.getSettlementStatus() == null || contract.getSettlementStatus().isBlank()) {
            contract.setSettlementStatus("unsettled");
        }
        if (contract.getMonitoringStatus() == null || contract.getMonitoringStatus().isBlank()) {
            contract.setMonitoringStatus("normal");
        }
    }

    /**
     * 当项目存在合同主数据时，将项目合同额回写为「合同金额汇总 + 已审批变更单金额汇总」。
     * 若项目没有任何合同主数据，则保留既有项目合同额，避免影响历史数据口径。
     *
     * @param projectId 项目ID
     */
    @Transactional
    public void recalculateProjectContractAmount(Long projectId) {
        if (projectId == null) {
            return;
        }
        if (contractRepository.countByProjectId(projectId) == 0) {
            return;
        }
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("项目不存在: " + projectId));

        BigDecimal contractTotal = contractRepository.sumContractAmountByProjectId(projectId);
        BigDecimal approvedChangeOrderTotal = changeOrderRepository.sumApprovedAmountByProjectId(projectId);
        if (contractTotal == null) {
            contractTotal = BigDecimal.ZERO;
        }
        if (approvedChangeOrderTotal == null) {
            approvedChangeOrderTotal = BigDecimal.ZERO;
        }
        project.setContractAmount(contractTotal.add(approvedChangeOrderTotal));
        projectRepository.save(project);
    }

    private void autoCollectContractDocument(Contract contract) {
        String link = "/contracts/" + contract.getId();
        String remark = "合同签订，金额: " + contract.getContractAmount() + "，编号: " + contract.getContractNo();
        projectDocumentAutoCollectService.collect(
            contract.getProjectId(),
            "contract",
            "合同 " + contract.getName(),
            link,
            remark
        );
    }
}
