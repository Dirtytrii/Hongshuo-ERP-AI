package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.Milestone;
import com.hongshuo.erp.model.dto.OverdueMilestoneDto;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.MilestoneRepository;
import com.hongshuo.erp.repository.StockLogRepository;
import com.hongshuo.erp.repository.UserRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private MilestoneRepository milestoneRepository;
    
    @Autowired
    private StockLogRepository stockLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FinanceRecordRepository financeRecordRepository;
    
    /** 根据里程碑完成数计算进度：已完成数/总数*100，仅1个且已完成则为100%；无里程碑为0 */
    private int computeProgressFromMilestones(Project project) {
        List<Milestone> list = milestoneRepository.findByProjectId(project.getId());
        if (list == null || list.isEmpty()) return 0;
        long completed = list.stream().filter(m -> m.getStatus() == Milestone.MilestoneStatus.completed).count();
        return (int) (completed * 100 / list.size());
    }
    
    private void updateProjectProgress(Project project) {
        project.setProgress(computeProgressFromMilestones(project));
        projectRepository.save(project);
    }
    
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    /** 按当前用户角色过滤：pm 仅能看自己负责的项目（managerId = username），其他角色看全部。 */
    public List<Project> getProjectsForCurrentUser(String username, String role) {
        if (username != null && "pm".equalsIgnoreCase(role)) {
            return projectRepository.findByManagerId(username);
        }
        return projectRepository.findAll();
    }
    
    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    /** 为项目填充成本分项（materialCostFromFinance, materialCostFromStock, materialCostTotal），用于详情展示 */
    public Project enrichWithCostSummary(Project project) {
        if (project == null || project.getId() == null) return project;
        java.math.BigDecimal fromFinance = financeRecordRepository.sumApprovedMaterialByProjectId(project.getId());
        java.math.BigDecimal fromStock = getOutboundAmountSum(project.getId());
        if (fromFinance == null) fromFinance = java.math.BigDecimal.ZERO;
        if (fromStock == null) fromStock = java.math.BigDecimal.ZERO;
        project.setMaterialCostFromFinance(fromFinance);
        project.setMaterialCostFromStock(fromStock);
        project.setMaterialCostTotal(fromFinance.add(fromStock));
        java.math.BigDecimal labor = project.getLaborCost() != null ? project.getLaborCost() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal other = project.getOtherCost() != null ? project.getOtherCost() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal actualTotal = project.getMaterialCostTotal().add(labor).add(other);
        project.setActualCostTotal(actualTotal);
        java.math.BigDecimal budget = project.getTotalBudget();
        if (budget != null && budget.compareTo(java.math.BigDecimal.ZERO) > 0) {
            project.setBudgetRatio(actualTotal.divide(budget, 4, java.math.RoundingMode.HALF_UP));
            double ratio = actualTotal.doubleValue() / budget.doubleValue();
            if (ratio >= 1.0) project.setBudgetAlertStatus("red");
            else if (ratio >= 0.8) project.setBudgetAlertStatus("yellow");
            else project.setBudgetAlertStatus("green");
        } else {
            project.setBudgetRatio(null);
            project.setBudgetAlertStatus("green");
        }
        return project;
    }

    /** 获取项目当前实际成本合计（材料财务+出库+人工+其他），用于超预算校验 */
    public BigDecimal getProjectActualCostTotal(Long projectId) {
        Optional<Project> opt = projectRepository.findById(projectId);
        if (opt.isEmpty()) return BigDecimal.ZERO;
        Project p = opt.get();
        BigDecimal fromFinance = financeRecordRepository.sumApprovedMaterialByProjectId(projectId);
        BigDecimal fromStock = stockLogRepository.sumOutboundAmountByProjectId(projectId);
        if (fromFinance == null) fromFinance = BigDecimal.ZERO;
        if (fromStock == null) fromStock = BigDecimal.ZERO;
        BigDecimal labor = p.getLaborCost() != null ? p.getLaborCost() : BigDecimal.ZERO;
        BigDecimal other = p.getOtherCost() != null ? p.getOtherCost() : BigDecimal.ZERO;
        return fromFinance.add(fromStock).add(labor).add(other);
    }

    /** 校验：若项目有预算且（当前实际+本笔金额）超过预算100%，非 admin 则抛异常；admin 允许特批 */
    public void checkOverBudgetAllowAdmin(Long projectId, BigDecimal additionalAmount, String currentUserRole) {
        if (projectId == null || additionalAmount == null) return;
        Optional<Project> opt = projectRepository.findById(projectId);
        if (opt.isEmpty()) return;
        Project p = opt.get();
        BigDecimal budget = p.getTotalBudget();
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) return;
        BigDecimal current = getProjectActualCostTotal(projectId);
        BigDecimal after = current.add(additionalAmount);
        if (after.compareTo(budget) <= 0) return;
        boolean isAdmin = currentUserRole != null && (currentUserRole.contains("admin") || currentUserRole.contains("Admin") || currentUserRole.contains("管理员"));
        if (!isAdmin) {
            throw new RuntimeException("该项目控制预算为 ￥" + budget + "，当前实际成本 ￥" + current + "，本笔将导致超预算，仅管理员可特批。");
        }
    }
    
    /** 按项目汇总已审批/生效的出库金额（qty*price），用于项目详情展示 */
    public BigDecimal getOutboundAmountSum(Long projectId) {
        return stockLogRepository.sumOutboundAmountByProjectId(projectId);
    }
    
    @Transactional
    public Project createProject(Project project) {
        if (projectRepository.existsByCode(project.getCode())) {
            throw new IllegalArgumentException("项目编号已存在: " + project.getCode());
        }
        validateManagerId(project.getManagerId());
        project = projectRepository.save(project);
        Milestone defaultMilestone = new Milestone();
        defaultMilestone.setName("项目启动");
        defaultMilestone.setPlanDate(project.getStartDate() != null ? project.getStartDate() : java.time.LocalDate.now());
        defaultMilestone.setStatus(Milestone.MilestoneStatus.pending);
        defaultMilestone.setProject(project);
        milestoneRepository.save(defaultMilestone);
        project.setProgress(0);
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project updateProject(Long id, Project projectDetails) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("项目不存在: " + id));
        validateManagerId(projectDetails.getManagerId());
        project.setName(projectDetails.getName());
        project.setManagerId(projectDetails.getManagerId());
        project.setContractAmount(projectDetails.getContractAmount());
        if (projectDetails.getTotalBudget() != null) {
            project.setTotalBudget(projectDetails.getTotalBudget());
        }
        // receivedAmount, materialCost, laborCost, otherCost 仅由财务审批回写，不随编辑更新
        project.setStatus(projectDetails.getStatus());
        project.setStartDate(projectDetails.getStartDate());
        project.setEndDate(projectDetails.getEndDate());
        updateProjectProgress(project);
        return project;
    }
    
    @Transactional
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
    
    @Transactional
    public Milestone addMilestone(Long projectId, Milestone milestone) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("项目不存在: " + projectId));
        milestone.setProject(project);
        Milestone saved = milestoneRepository.save(milestone);
        updateProjectProgress(project);
        return saved;
    }
    
    public List<Milestone> getMilestonesByProjectId(Long projectId) {
        return milestoneRepository.findByProjectId(projectId);
    }

    /** 获取当前用户可见项目下的超期未完成里程碑，供仪表盘「里程碑超期预警」使用；与项目列表可见范围一致（getAllProjects）。 */
    public List<OverdueMilestoneDto> getOverdueMilestones() {
        List<Project> projects = getAllProjects();
        if (projects == null || projects.isEmpty()) {
            return List.of();
        }
        List<Long> projectIds = projects.stream().map(Project::getId).filter(id -> id != null).toList();
        if (projectIds.isEmpty()) {
            return List.of();
        }
        List<Milestone> overdue = milestoneRepository.findOverdueByProjectIdInAndPlanDateBeforeAndStatusNot(projectIds, LocalDate.now());
        return overdue.stream()
            .map(m -> new OverdueMilestoneDto(
                m.getId(),
                m.getName(),
                m.getPlanDate(),
                m.getStatus() != null ? m.getStatus().name() : "pending",
                m.getProject() != null ? m.getProject().getId() : null,
                m.getProject() != null ? m.getProject().getName() : null
            ))
            .collect(Collectors.toList());
    }

    @Transactional
    public Milestone updateMilestone(Long projectId, Long milestoneId, Milestone milestoneDetails) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new RuntimeException("里程碑不存在: " + milestoneId));
        if (!milestone.getProject().getId().equals(projectId)) {
            throw new RuntimeException("里程碑不属于该项目");
        }
        milestone.setName(milestoneDetails.getName());
        if (milestoneDetails.getPlanDate() != null) milestone.setPlanDate(milestoneDetails.getPlanDate());
        if (milestoneDetails.getActualDate() != null) milestone.setActualDate(milestoneDetails.getActualDate());
        if (milestoneDetails.getStatus() != null) milestone.setStatus(milestoneDetails.getStatus());
        Milestone saved = milestoneRepository.save(milestone);
        updateProjectProgress(milestone.getProject());
        return saved;
    }

    @Transactional
    public void deleteMilestone(Long projectId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new RuntimeException("里程碑不存在: " + milestoneId));
        if (!milestone.getProject().getId().equals(projectId)) {
            throw new RuntimeException("里程碑不属于该项目");
        }
        Project project = milestone.getProject();
        milestoneRepository.delete(milestone);
        updateProjectProgress(project);
    }

    private void validateManagerId(String managerId) {
        if (managerId == null || managerId.isBlank()) {
            throw new IllegalArgumentException("项目经理不能为空，请从用户列表中选择");
        }
        userRepository.findByUsername(managerId.trim())
            .filter(u -> Boolean.TRUE.equals(u.getEnabled()))
            .orElseThrow(() -> new IllegalArgumentException("项目经理必须是系统已启用的用户，请从下拉列表选择"));
    }
}

