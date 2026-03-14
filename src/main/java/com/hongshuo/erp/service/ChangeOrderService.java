package com.hongshuo.erp.service;

import com.hongshuo.erp.model.ChangeOrder;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.repository.ChangeOrderRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ChangeOrderService {

    @Autowired
    private ChangeOrderRepository changeOrderRepository;
    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ContractService contractService;

    @Autowired
    private ProjectDocumentAutoCollectService projectDocumentAutoCollectService;

    @Autowired
    private WorkflowNotifyService workflowNotifyService;

    public List<ChangeOrder> findAll() {
        return changeOrderRepository.findAll();
    }

    public List<ChangeOrder> findByProjectId(Long projectId) {
        return changeOrderRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public Optional<ChangeOrder> findById(Long id) {
        return changeOrderRepository.findById(id);
    }

    @Transactional
    public ChangeOrder create(ChangeOrder order) {
        if (order.getProjectId() == null) {
            throw new RuntimeException("变更单必须关联项目");
        }
        if (projectRepository.findById(order.getProjectId()).isEmpty()) {
            throw new RuntimeException("项目不存在: " + order.getProjectId());
        }
        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("pending");
        }
        ChangeOrder saved = changeOrderRepository.save(order);
        workflowNotifyService.notifySubmitted(
            "变更单",
            saved.getId(),
            "项目#" + saved.getProjectId(),
            "金额: " + saved.getAmount()
        );
        return saved;
    }

    @Transactional
    public ChangeOrder update(Long id, ChangeOrder updates) {
        ChangeOrder existing = changeOrderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("变更单不存在: " + id));
        if ("approved".equals(existing.getStatus()) || "rejected".equals(existing.getStatus())) {
            throw new RuntimeException("已审批的变更单不可修改");
        }
        if (updates.getReason() != null) existing.setReason(updates.getReason());
        if (updates.getAmount() != null) existing.setAmount(updates.getAmount());
        return changeOrderRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        ChangeOrder existing = changeOrderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("变更单不存在: " + id));
        if ("approved".equals(existing.getStatus())) {
            throw new RuntimeException("已审批通过的变更单不可删除");
        }
        changeOrderRepository.deleteById(id);
    }

    @Transactional
    public ChangeOrder approve(Long id, String approverRole, boolean approved, String approvalNote) {
        ChangeOrder order = changeOrderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("变更单不存在: " + id));
        if (!"pending".equals(order.getStatus())) {
            throw new RuntimeException("该变更单已处理，无法再次审批");
        }
        order.setApprover(approverRole);
        order.setApprovalDate(LocalDate.now());
        order.setApprovalNote(approvalNote != null ? approvalNote : "");
        order.setStatus(approved ? "approved" : "rejected");
        if (approved && order.getAmount() != null && order.getProjectId() != null) {
            Project project = projectRepository.findById(order.getProjectId())
                .orElseThrow(() -> new RuntimeException("项目不存在: " + order.getProjectId()));
            BigDecimal newContract = (project.getContractAmount() != null ? project.getContractAmount() : BigDecimal.ZERO).add(order.getAmount());
            project.setContractAmount(newContract);
            projectRepository.save(project);
            // 若项目已启用合同主数据，回写规则以「合同汇总 + 已审批变更单」为准，避免口径漂移
            contractService.recalculateProjectContractAmount(order.getProjectId());
            String link = "/change-orders/" + order.getId();
            String remark = "变更单审批通过，金额: " + order.getAmount() + "，事由: " + order.getReason();
            projectDocumentAutoCollectService.collect(
                order.getProjectId(),
                "change_order",
                "变更单 #" + order.getId(),
                link,
                remark
            );
        }
        ChangeOrder saved = changeOrderRepository.save(order);
        workflowNotifyService.notifyApprovalResult("变更单", saved.getId(), approved, approverRole);
        return saved;
    }
}
