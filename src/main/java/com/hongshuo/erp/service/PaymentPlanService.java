package com.hongshuo.erp.service;

import com.hongshuo.erp.model.PaymentPlanItem;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.PaymentPlanItemRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentPlanService {

    @Autowired
    private PaymentPlanItemRepository paymentPlanItemRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FinanceRecordRepository financeRecordRepository;

    public List<PaymentPlanItem> getByProjectId(Long projectId) {
        List<PaymentPlanItem> list = paymentPlanItemRepository.findByProjectIdOrderByPlanDateAsc(projectId);
        enrichReceivedAmountFromLinkedIncome(list);
        return list;
    }

    public List<PaymentPlanItem> getUpcoming(int days) {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(days);
        return paymentPlanItemRepository.findUpcoming(start, end);
    }

    public PaymentPlanItem getById(Long id) {
        PaymentPlanItem item = paymentPlanItemRepository.findById(id).orElse(null);
        if (item != null) {
            BigDecimal sum = financeRecordRepository.sumApprovedIncomeByPaymentPlanItemId(id);
            if (sum != null && sum.compareTo(BigDecimal.ZERO) > 0) {
                item.setReceivedAmount(sum);
            }
        }
        return item;
    }

    /** 用已审批且关联到本节点的收入汇总覆盖/补充已收金额（用于展示） */
    private void enrichReceivedAmountFromLinkedIncome(List<PaymentPlanItem> list) {
        for (PaymentPlanItem item : list) {
            BigDecimal sum = financeRecordRepository.sumApprovedIncomeByPaymentPlanItemId(item.getId());
            if (sum != null && sum.compareTo(BigDecimal.ZERO) > 0) {
                item.setReceivedAmount(sum);
            }
        }
    }

    @Transactional
    public PaymentPlanItem create(Long projectId, PaymentPlanItem item) {
        if (projectRepository.findById(projectId).isEmpty()) {
            throw new RuntimeException("项目不存在: " + projectId);
        }
        item.setProjectId(projectId);
        if (item.getStatus() == null || item.getStatus().isBlank()) {
            item.setStatus("pending");
        }
        if (item.getReceivedAmount() == null) {
            item.setReceivedAmount(java.math.BigDecimal.ZERO);
        }
        return paymentPlanItemRepository.save(item);
    }

    @Transactional
    public PaymentPlanItem update(Long id, PaymentPlanItem updates) {
        PaymentPlanItem existing = paymentPlanItemRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("回款计划不存在: " + id));
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getPlanDate() != null) existing.setPlanDate(updates.getPlanDate());
        if (updates.getPlanAmount() != null) existing.setPlanAmount(updates.getPlanAmount());
        if (updates.getReceivedAmount() != null) existing.setReceivedAmount(updates.getReceivedAmount());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        return paymentPlanItemRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        if (!paymentPlanItemRepository.existsById(id)) {
            throw new RuntimeException("回款计划不存在: " + id);
        }
        paymentPlanItemRepository.deleteById(id);
    }
}
