import type { FinanceRecord, InventoryItem, Project, StockLog } from '../../../types';

export type AlertSummaryItem = {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  count: number;
  description: string;
  targetTab?: string;
};

type PaymentPlanUpcomingItem = {
  projectName?: string;
  planAmount: number;
  receivedAmount: number;
};

type OverdueMilestoneItem = {
  projectName?: string;
  name: string;
};

export function buildAlertSummary(params: {
  inventory: InventoryItem[];
  stockLogs: StockLog[];
  financeRecords: FinanceRecord[];
  projects: Project[];
  upcomingPaymentPlans?: PaymentPlanUpcomingItem[];
  overdueMilestones?: OverdueMilestoneItem[];
  now?: Date;
}): AlertSummaryItem[] {
  const {
    inventory,
    stockLogs,
    financeRecords,
    projects,
    upcomingPaymentPlans = [],
    overdueMilestones = [],
    now = new Date(),
  } = params;

  const lowStockItems = inventory.filter((i) => i.quantity < i.threshold);
  // 口径：待审批出库 = stockLogs 中 status=pending 且 type=out
  const pendingApprovals = stockLogs.filter((l) => l.status === 'pending' && l.type === 'out');
  const pendingFinance = financeRecords.filter((r) => r.status === 'pending');
  const overdueProjects = projects.filter((p) => {
    if (!p.endDate || p.status === '已完工') return false;
    return new Date(p.endDate) < now && p.progress < 100;
  });

  const alertList: AlertSummaryItem[] = [];

  if (lowStockItems.length > 0) {
    alertList.push({
      id: 'low-stock',
      type: 'danger',
      title: '低库存预警',
      count: lowStockItems.length,
      description: `${lowStockItems
        .slice(0, 3)
        .map((i) => i.name)
        .join('、')}${lowStockItems.length > 3 ? '等' : ''}库存不足`,
      targetTab: 'inventory',
    });
  }

  if (pendingApprovals.length > 0) {
    alertList.push({
      id: 'pending-stock',
      type: 'warning',
      title: '待审批出库',
      count: pendingApprovals.length,
      description: `有${pendingApprovals.length}条出库申请等待审批`,
      targetTab: 'inventory',
    });
  }

  if (pendingFinance.length > 0) {
    alertList.push({
      id: 'pending-finance',
      type: 'warning',
      title: '待审批财务',
      count: pendingFinance.length,
      description: `有${pendingFinance.length}条财务记录等待审批`,
      targetTab: 'finance',
    });
  }

  if (overdueProjects.length > 0) {
    alertList.push({
      id: 'overdue-projects',
      type: 'info',
      title: '逾期项目',
      count: overdueProjects.length,
      description: `${overdueProjects
        .slice(0, 2)
        .map((p) => p.name)
        .join('、')}${overdueProjects.length > 2 ? '等' : ''}已逾期`,
      targetTab: 'projects',
    });
  }

  const upcomingReceivable = upcomingPaymentPlans.filter((item) => item.planAmount > (item.receivedAmount || 0));
  if (upcomingReceivable.length > 0) {
    alertList.push({
      id: 'upcoming-receivable',
      type: 'warning',
      title: '近期待催款',
      count: upcomingReceivable.length,
      description: `${upcomingReceivable
        .slice(0, 2)
        .map((p) => p.projectName || '未命名项目')
        .join('、')}${upcomingReceivable.length > 2 ? '等' : ''}存在待回款节点`,
      targetTab: 'dashboard',
    });
  }

  if (overdueMilestones.length > 0) {
    alertList.push({
      id: 'overdue-milestones',
      type: 'danger',
      title: '里程碑超期',
      count: overdueMilestones.length,
      description: `${overdueMilestones
        .slice(0, 2)
        .map((m) => `${m.projectName || '项目'}:${m.name}`)
        .join('、')}${overdueMilestones.length > 2 ? '等' : ''}需要处理`,
      targetTab: 'projects',
    });
  }

  const overBudgetProjects = projects.filter((p) => p.budgetAlertStatus === 'red' || p.budgetAlertStatus === 'yellow');
  if (overBudgetProjects.length > 0) {
    alertList.push({
      id: 'budget-alert',
      type: overBudgetProjects.some((p) => p.budgetAlertStatus === 'red') ? 'danger' : 'warning',
      title: '预算预警',
      count: overBudgetProjects.length,
      description: `${overBudgetProjects
        .slice(0, 2)
        .map((p) => p.name)
        .join('、')}${overBudgetProjects.length > 2 ? '等' : ''}预算已达预警阈值`,
      targetTab: 'projects',
    });
  }

  const typePriority: Record<AlertSummaryItem['type'], number> = {
    danger: 0,
    warning: 1,
    info: 2,
  };

  const businessPriority: Record<string, number> = {
    'overdue-milestones': 10,
    'low-stock': 20,
    'budget-alert': 30,
    'pending-stock': 40,
    'pending-finance': 50,
    'upcoming-receivable': 60,
    'overdue-projects': 70,
  };

  return [...alertList].sort((a, b) => {
    const byType = typePriority[a.type] - typePriority[b.type];
    if (byType !== 0) return byType;
    const ap = businessPriority[a.id] ?? Number.MAX_SAFE_INTEGER;
    const bp = businessPriority[b.id] ?? Number.MAX_SAFE_INTEGER;
    if (ap !== bp) return ap - bp;
    return a.id.localeCompare(b.id);
  });
}
