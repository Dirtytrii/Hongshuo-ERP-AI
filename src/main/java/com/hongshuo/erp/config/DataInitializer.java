package com.hongshuo.erp.config;

import com.hongshuo.erp.model.*;
import com.hongshuo.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;

/**
 * 数据初始化组件
 * 在应用启动时自动执行，初始化基础数据
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private MilestoneRepository milestoneRepository;
    
    @Autowired
    private InventoryItemRepository inventoryItemRepository;
    
    @Autowired
    private FinanceRecordRepository financeRecordRepository;
    
    @Autowired
    private StockLogRepository stockLogRepository;
    
    @Autowired
    private SystemLogRepository systemLogRepository;

    @Value("${app.data.reset-on-startup:false}")
    private boolean resetOnStartup;

    @Override
    public void run(String... args) {
        boolean hasData = projectRepository.count() > 0;
        
        // 如果配置为不重置，且已有数据，则跳过初始化
        if (!resetOnStartup && hasData) {
            System.out.println("数据库已有数据，跳过初始化（app.data.reset-on-startup=false）");
            return;
        }

        // 如果配置为重置，清空所有数据
        if (resetOnStartup && hasData) {
            System.out.println("检测到 app.data.reset-on-startup=true，清空现有数据...");
            systemLogRepository.deleteAll();
            stockLogRepository.deleteAll();
            financeRecordRepository.deleteAll();
            milestoneRepository.deleteAll();
            projectRepository.deleteAll();
            inventoryItemRepository.deleteAll();
            System.out.println("数据清空完成");
        }

        System.out.println("开始初始化数据库...");

        // 1. 初始化项目
        Project project1 = createProject("宏硕·云端大厦", "HS-2024-001", "pm", 
            new BigDecimal("5000000.00"), new BigDecimal("2000000.00"),
            new BigDecimal("1200000.00"), new BigDecimal("800000.00"), 
            new BigDecimal("100000.00"), "施工中", 45,
            LocalDate.of(2024, 1, 10), LocalDate.of(2024, 12, 30));
        project1 = projectRepository.save(project1);

        Project project2 = createProject("宏硕·科技园区", "HS-2024-002", "pm",
            new BigDecimal("8000000.00"), new BigDecimal("3000000.00"),
            new BigDecimal("2000000.00"), new BigDecimal("1500000.00"),
            new BigDecimal("200000.00"), "施工中", 30,
            LocalDate.of(2024, 3, 1), LocalDate.of(2025, 6, 30));
        project2 = projectRepository.save(project2);

        Project project3 = createProject("宏硕·商业中心", "HS-2023-003", "pm",
            new BigDecimal("12000000.00"), new BigDecimal("10000000.00"),
            new BigDecimal("3500000.00"), new BigDecimal("2800000.00"),
            new BigDecimal("300000.00"), "验收中", 95,
            LocalDate.of(2023, 6, 1), LocalDate.of(2024, 5, 31));
        project3 = projectRepository.save(project3);

        // 2. 初始化里程碑
        createMilestone(project1, "基础施工完成", LocalDate.of(2024, 3, 15), 
            LocalDate.of(2024, 3, 20), Milestone.MilestoneStatus.completed);
        createMilestone(project1, "主体结构封顶", LocalDate.of(2024, 6, 30), 
            null, Milestone.MilestoneStatus.in_progress);
        createMilestone(project1, "装修工程开始", LocalDate.of(2024, 8, 1), 
            null, Milestone.MilestoneStatus.pending);
        createMilestone(project1, "竣工验收", LocalDate.of(2024, 12, 15), 
            null, Milestone.MilestoneStatus.pending);

        createMilestone(project2, "土地平整完成", LocalDate.of(2024, 4, 1), 
            LocalDate.of(2024, 4, 5), Milestone.MilestoneStatus.completed);
        createMilestone(project2, "基础开挖", LocalDate.of(2024, 5, 15), 
            null, Milestone.MilestoneStatus.in_progress);
        createMilestone(project2, "主体施工", LocalDate.of(2024, 8, 1), 
            null, Milestone.MilestoneStatus.pending);

        createMilestone(project3, "竣工验收", LocalDate.of(2024, 5, 20), 
            LocalDate.of(2024, 5, 25), Milestone.MilestoneStatus.completed);
        createMilestone(project3, "交付使用", LocalDate.of(2024, 5, 31), 
            null, Milestone.MilestoneStatus.in_progress);

        // 3. 初始化库存物料
        InventoryItem item1 = createInventoryItem("42.5级硅酸盐水泥", "50kg/袋", "袋", 
            new BigDecimal("28.00"), 1500, 200);
        InventoryItem item2 = createInventoryItem("螺纹钢 Φ12", "12m/根", "吨", 
            new BigDecimal("3850.00"), 45, 10);
        InventoryItem item3 = createInventoryItem("螺纹钢 Φ16", "12m/根", "吨", 
            new BigDecimal("3950.00"), 38, 8);
        InventoryItem item4 = createInventoryItem("C30混凝土", "标准配比", "立方米", 
            new BigDecimal("320.00"), 120, 30);
        InventoryItem item5 = createInventoryItem("红砖", "240×115×53mm", "块", 
            new BigDecimal("0.45"), 50000, 10000);
        InventoryItem item6 = createInventoryItem("钢筋网片", "2m×6m", "片", 
            new BigDecimal("85.00"), 200, 50);
        InventoryItem item7 = createInventoryItem("防水卷材", "3mm厚", "平方米", 
            new BigDecimal("25.00"), 800, 200);
        InventoryItem item8 = createInventoryItem("保温材料", "50mm厚", "平方米", 
            new BigDecimal("35.00"), 600, 150);
        InventoryItem item9 = createInventoryItem("门窗", "标准尺寸", "套", 
            new BigDecimal("1200.00"), 45, 10);
        InventoryItem item10 = createInventoryItem("电线电缆", "BV2.5mm²", "米", 
            new BigDecimal("8.50"), 5000, 1000);

        // 4. 初始化财务记录
        createFinanceRecord(FinanceRecord.FinanceType.income, "项目收款", 
            new BigDecimal("2000000.00"), project1.getId(), "approved",
            LocalDate.of(2024, 1, 15), "王总 (Admin)", "宏硕·云端大厦首期款");
        createFinanceRecord(FinanceRecord.FinanceType.income, "项目收款", 
            new BigDecimal("3000000.00"), project2.getId(), "approved",
            LocalDate.of(2024, 3, 10), "王总 (Admin)", "宏硕·科技园区首期款");
        createFinanceRecord(FinanceRecord.FinanceType.expense, "材料采购", 
            new BigDecimal("500000.00"), project1.getId(), "approved",
            LocalDate.of(2024, 2, 1), "赵姐 (Finance)", "水泥、钢筋等基础材料");
        createFinanceRecord(FinanceRecord.FinanceType.expense, "人工费用", 
            new BigDecimal("300000.00"), project1.getId(), "approved",
            LocalDate.of(2024, 2, 15), "赵姐 (Finance)", "2月份工人工资");
        createFinanceRecord(FinanceRecord.FinanceType.expense, "设备租赁", 
            new BigDecimal("80000.00"), project1.getId(), "approved",
            LocalDate.of(2024, 3, 1), "赵姐 (Finance)", "塔吊、挖掘机租赁");
        createFinanceRecord(FinanceRecord.FinanceType.expense, "材料采购", 
            new BigDecimal("1200000.00"), project2.getId(), "pending",
            LocalDate.of(2024, 4, 10), "赵姐 (Finance)", "大批量钢材采购（需审核）");
        createFinanceRecord(FinanceRecord.FinanceType.income, "项目收款", 
            new BigDecimal("1000000.00"), project3.getId(), "approved",
            LocalDate.of(2024, 5, 1), "王总 (Admin)", "宏硕·商业中心尾款");

        // 5. 初始化库存操作日志
        createStockLog(StockLog.StockType.in, item1.getId(), 2000, 
            new BigDecimal("28.00"), null, "active",
            LocalDate.of(2024, 1, 20), "小张 (Clerk)", "水泥入库");
        createStockLog(StockLog.StockType.out, item1.getId(), 500, 
            new BigDecimal("28.00"), project1.getId(), "active",
            LocalDate.of(2024, 2, 5), "李工 (PM)", "项目1使用");
        createStockLog(StockLog.StockType.in, item2.getId(), 50, 
            new BigDecimal("3850.00"), null, "active",
            LocalDate.of(2024, 2, 10), "小张 (Clerk)", "螺纹钢入库");
        createStockLog(StockLog.StockType.out, item2.getId(), 15, 
            new BigDecimal("3850.00"), project1.getId(), "active",
            LocalDate.of(2024, 2, 15), "李工 (PM)", "项目1使用");
        createStockLog(StockLog.StockType.in, item3.getId(), 40, 
            new BigDecimal("3950.00"), null, "active",
            LocalDate.of(2024, 3, 1), "小张 (Clerk)", "螺纹钢Φ16入库");
        createStockLog(StockLog.StockType.out, item3.getId(), 12, 
            new BigDecimal("3950.00"), project2.getId(), "pending",
            LocalDate.of(2024, 4, 12), "小张 (Clerk)", "项目2申请出库（待审核）");
        createStockLog(StockLog.StockType.in, item4.getId(), 150, 
            new BigDecimal("320.00"), null, "active",
            LocalDate.of(2024, 3, 15), "小张 (Clerk)", "混凝土入库");
        createStockLog(StockLog.StockType.out, item4.getId(), 80, 
            new BigDecimal("320.00"), project1.getId(), "active",
            LocalDate.of(2024, 3, 20), "李工 (PM)", "项目1使用");

        // 6. 初始化系统日志
        createSystemLog("2024-01-10 09:00:00", "王总 (Admin)", "系统初始化", "系统首次启动，初始化数据");
        createSystemLog("2024-01-15 10:30:00", "王总 (Admin)", "项目收款", "宏硕·云端大厦首期款 200万元");
        createSystemLog("2024-02-01 14:20:00", "赵姐 (Finance)", "材料采购", "采购基础材料 50万元");
        createSystemLog("2024-02-05 11:15:00", "李工 (PM)", "物料出库", "项目1出库水泥500袋");
        createSystemLog("2024-02-15 09:45:00", "李工 (PM)", "物料出库", "项目1出库螺纹钢15吨");
        createSystemLog("2024-03-01 16:00:00", "小张 (Clerk)", "物料入库", "螺纹钢Φ16入库40吨");
        createSystemLog("2024-04-12 13:30:00", "小张 (Clerk)", "申请出库", "项目2申请出库螺纹钢12吨（待审核）");

        System.out.println("数据库初始化完成！");
    }

    private Project createProject(String name, String code, String managerId,
                                 BigDecimal contractAmount, BigDecimal receivedAmount,
                                 BigDecimal materialCost, BigDecimal laborCost, BigDecimal otherCost,
                                 String status, Integer progress, LocalDate startDate, LocalDate endDate) {
        Project project = new Project();
        project.setName(name);
        project.setCode(code);
        project.setManagerId(managerId);
        project.setContractAmount(contractAmount);
        project.setReceivedAmount(receivedAmount);
        project.setMaterialCost(materialCost);
        project.setLaborCost(laborCost);
        project.setOtherCost(otherCost);
        project.setStatus(status);
        project.setProgress(progress);
        project.setStartDate(startDate);
        project.setEndDate(endDate);
        return project;
    }

    private void createMilestone(Project project, String name, LocalDate planDate, 
                                 LocalDate actualDate, Milestone.MilestoneStatus status) {
        Milestone milestone = new Milestone();
        milestone.setName(name);
        milestone.setPlanDate(planDate);
        milestone.setActualDate(actualDate);
        milestone.setStatus(status);
        milestone.setProject(project);
        milestoneRepository.save(milestone);
    }

    private InventoryItem createInventoryItem(String name, String spec, String unit,
                                              BigDecimal price, Integer quantity, Integer threshold) {
        InventoryItem item = new InventoryItem();
        item.setName(name);
        item.setSpec(spec);
        item.setUnit(unit);
        item.setPrice(price);
        item.setQuantity(quantity);
        item.setThreshold(threshold);
        return inventoryItemRepository.save(item);
    }

    private void createFinanceRecord(FinanceRecord.FinanceType type, String category,
                                    BigDecimal amount, Long projectId, String status,
                                    LocalDate date, String creator, String description) {
        FinanceRecord record = new FinanceRecord();
        record.setType(type);
        record.setCategory(category);
        record.setAmount(amount);
        record.setProjectId(projectId);
        record.setStatus(status);
        record.setDate(date);
        record.setCreator(creator);
        record.setDescription(description);
        financeRecordRepository.save(record);
    }

    private void createStockLog(StockLog.StockType type, Long itemId, Integer qty,
                               BigDecimal price, Long projectId, String status,
                               LocalDate date, String creator, String note) {
        StockLog log = new StockLog();
        log.setType(type);
        log.setItemId(itemId);
        log.setQty(qty);
        log.setPrice(price);
        log.setProjectId(projectId);
        log.setStatus(status);
        log.setDate(date);
        log.setCreator(creator);
        log.setNote(note);
        stockLogRepository.save(log);
    }

    private void createSystemLog(String timeStr, String user, String action, String detail) {
        SystemLog log = new SystemLog();
        // 解析时间字符串 "yyyy-MM-dd HH:mm:ss"
        String[] parts = timeStr.split(" ");
        String[] dateParts = parts[0].split("-");
        String[] timeParts = parts[1].split(":");
        log.setTime(java.time.LocalDateTime.of(
            Integer.parseInt(dateParts[0]),
            Integer.parseInt(dateParts[1]),
            Integer.parseInt(dateParts[2]),
            Integer.parseInt(timeParts[0]),
            Integer.parseInt(timeParts[1]),
            Integer.parseInt(timeParts[2])
        ));
        log.setUser(user);
        log.setAction(action);
        log.setDetail(detail);
        systemLogRepository.save(log);
    }
}

