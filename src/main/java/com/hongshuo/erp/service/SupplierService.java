package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Supplier;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.StockLogRepository;
import com.hongshuo.erp.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;
    @Autowired
    private StockLogRepository stockLogRepository;
    @Autowired
    private FinanceRecordRepository financeRecordRepository;

    public List<Supplier> findAll() {
        return supplierRepository.findAllByOrderByNameAsc();
    }

    public Optional<Supplier> findById(Long id) {
        return supplierRepository.findById(id);
    }

    @Transactional
    public Supplier create(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier update(Long id, Supplier updates) {
        Supplier existing = supplierRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("供应商不存在: " + id));
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getContactPerson() != null) existing.setContactPerson(updates.getContactPerson());
        if (updates.getContactPhone() != null) existing.setContactPhone(updates.getContactPhone());
        if (updates.getBankInfo() != null) existing.setBankInfo(updates.getBankInfo());
        return supplierRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new RuntimeException("供应商不存在: " + id);
        }
        supplierRepository.deleteById(id);
    }

    /**
     * 单个供应商应付/已付/欠款。
     * 应付 = 该供应商入库金额之和；已付 = 该供应商已审批支出之和；欠款 = 应付 - 已付。
     */
    public Map<String, Object> getBalance(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
            .orElseThrow(() -> new RuntimeException("供应商不存在: " + supplierId));
        BigDecimal payable = stockLogRepository.sumInboundAmountBySupplierId(supplierId);
        if (payable == null) payable = BigDecimal.ZERO;
        BigDecimal paid = financeRecordRepository.sumApprovedExpenseBySupplierId(supplierId);
        if (paid == null) paid = BigDecimal.ZERO;
        BigDecimal balance = payable.subtract(paid);
        return Map.of(
            "supplierId", supplierId,
            "supplierName", supplier.getName(),
            "payable", payable,
            "paid", paid,
            "balance", balance
        );
    }

    /**
     * 按供应商汇总应付、已付、欠款列表，供报表或导出。
     */
    public List<Map<String, Object>> getSupplierBalanceList() {
        List<Supplier> suppliers = supplierRepository.findAllByOrderByNameAsc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Supplier s : suppliers) {
            BigDecimal payable = stockLogRepository.sumInboundAmountBySupplierId(s.getId());
            if (payable == null) payable = BigDecimal.ZERO;
            BigDecimal paid = financeRecordRepository.sumApprovedExpenseBySupplierId(s.getId());
            if (paid == null) paid = BigDecimal.ZERO;
            result.add(Map.of(
                "supplierId", s.getId(),
                "supplierName", s.getName(),
                "payable", payable,
                "paid", paid,
                "balance", payable.subtract(paid)
            ));
        }
        return result;
    }
}
