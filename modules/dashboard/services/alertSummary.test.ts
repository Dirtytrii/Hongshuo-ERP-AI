import { describe, expect, it } from 'vitest';
import type { FinanceRecord, InventoryItem, Project, StockLog } from '../../../types';
import { buildAlertSummary } from './alertSummary';

const inventory: InventoryItem[] = [
  { id: 1, name: '水泥', spec: 'P.O42.5', unit: '吨', price: 500, quantity: 10, threshold: 50 },
  { id: 2, name: '钢筋', spec: 'HRB400', unit: '吨', price: 4200, quantity: 60, threshold: 20 },
];

const stockLogs: StockLog[] = [
  { id: '1', type: 'out', itemId: 1, qty: 2, price: 500, status: 'pending', date: '2026-03-01', creator: '库管' },
  { id: '2', type: 'in', itemId: 2, qty: 5, price: 4200, status: 'approved', date: '2026-03-01', creator: '库管' },
];

const financeRecords: FinanceRecord[] = [
  {
    id: '1',
    type: 'expense',
    category: '材料费',
    amount: 12000,
    projectId: 1,
    status: 'pending',
    date: '2026-03-02',
    creator: '财务',
  },
];

const projects: Project[] = [
  {
    id: 1,
    name: '一期厂房项目',
    code: 'P001',
    managerId: 'pm1',
    contractAmount: 200000,
    receivedAmount: 100000,
    materialCost: 30000,
    laborCost: 15000,
    otherCost: 5000,
    status: '施工中',
    progress: 60,
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    milestones: [],
  },
  {
    id: 2,
    name: '二期仓储项目',
    code: 'P002',
    managerId: 'pm2',
    contractAmount: 300000,
    receivedAmount: 120000,
    materialCost: 60000,
    laborCost: 20000,
    otherCost: 10000,
    status: '已完工',
    progress: 100,
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    milestones: [],
  },
];

describe('buildAlertSummary', () => {
  it('聚合四类预警并返回可跳转 tab', () => {
    const alerts = buildAlertSummary({
      inventory,
      stockLogs,
      financeRecords,
      projects,
      now: new Date('2026-03-28T00:00:00Z'),
    });

    expect(alerts.map((a) => a.id)).toEqual(['low-stock', 'pending-stock', 'pending-finance', 'overdue-projects']);
    expect(alerts.map((a) => a.targetTab)).toEqual(['inventory', 'inventory', 'finance', 'projects']);
  });

  it('待审批出库口径：pending-in 不应计入', () => {
    const alerts = buildAlertSummary({
      inventory: [],
      stockLogs: [
        { id: '1', type: 'in', itemId: 1, qty: 2, price: 500, status: 'pending', date: '2026-03-01', creator: '库管' },
        { id: '2', type: 'out', itemId: 1, qty: 1, price: 500, status: 'pending', date: '2026-03-01', creator: '库管' },
      ],
      financeRecords: [],
      projects: [],
      now: new Date('2026-03-28T00:00:00Z'),
    });

    const pendingStock = alerts.find((a) => a.id === 'pending-stock');
    expect(pendingStock?.count).toBe(1);
    expect(pendingStock?.description).toContain('出库');
  });
  it('无命中项时返回空数组', () => {
    const alerts = buildAlertSummary({
      inventory: inventory.map((i) => ({ ...i, quantity: i.threshold + 1 })),
      stockLogs: stockLogs.map((s) => ({ ...s, status: 'approved' })),
      financeRecords: financeRecords.map((f) => ({ ...f, status: 'approved' })),
      projects: projects.map((p) => ({ ...p, status: '已完工', progress: 100 })),
      now: new Date('2026-03-28T00:00:00Z'),
    });

    expect(alerts).toEqual([]);
  });

  it('包含近期待催款与里程碑超期预警', () => {
    const alerts = buildAlertSummary({
      inventory: [],
      stockLogs: [],
      financeRecords: [],
      projects: [],
      upcomingPaymentPlans: [
        { projectName: 'A项目', planAmount: 100000, receivedAmount: 40000 },
        { projectName: 'B项目', planAmount: 200000, receivedAmount: 0 },
      ],
      overdueMilestones: [
        { projectName: 'A项目', name: '主体封顶' },
        { projectName: 'B项目', name: '竣工验收' },
      ],
      now: new Date('2026-03-28T00:00:00Z'),
    });

    // danger 优先于 warning：里程碑超期应排在近期待催款之前
    expect(alerts.map((a) => a.id)).toEqual(['overdue-milestones', 'upcoming-receivable']);
    expect(alerts[0].description).toContain('A项目');
    expect(alerts[0].description).toContain('主体封顶');
  });

  it('包含预算预警项目时生成 budget-alert', () => {
    const alerts = buildAlertSummary({
      inventory: [],
      stockLogs: [],
      financeRecords: [],
      projects: [
        { ...projects[0], budgetAlertStatus: 'yellow' },
        { ...projects[1], budgetAlertStatus: 'red', status: '施工中', progress: 80 },
      ],
      now: new Date('2026-03-28T00:00:00Z'),
    });

    expect(alerts.map((a) => a.id)).toContain('budget-alert');
    const budgetAlert = alerts.find((a) => a.id === 'budget-alert');
    expect(budgetAlert?.type).toBe('danger');
  });

  it('排序稳定：按 danger>warning>info，再按业务优先级', () => {
    const alerts = buildAlertSummary({
      inventory,
      stockLogs: [
        {
          id: 'p-out',
          type: 'out',
          itemId: 1,
          qty: 2,
          price: 500,
          status: 'pending',
          date: '2026-03-01',
          creator: '库管',
        },
      ],
      financeRecords,
      projects: [{ ...projects[0], budgetAlertStatus: 'yellow' }, ...projects.slice(1)],
      upcomingPaymentPlans: [{ projectName: 'A项目', planAmount: 100000, receivedAmount: 40000 }],
      overdueMilestones: [{ projectName: 'A项目', name: '主体封顶' }],
      now: new Date('2026-03-28T00:00:00Z'),
    });

    // danger: overdue-milestones -> low-stock -> budget-alert
    // warning: pending-stock -> pending-finance -> upcoming-receivable
    // info: overdue-projects
    expect(alerts.map((a) => a.id)).toEqual([
      'overdue-milestones',
      'low-stock',
      'budget-alert',
      'pending-stock',
      'pending-finance',
      'upcoming-receivable',
      'overdue-projects',
    ]);
  });
});
