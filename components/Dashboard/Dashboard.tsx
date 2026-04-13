import React from 'react';
import {
  Building2,
  ArrowRightLeft,
  AlertTriangle,
  Sparkles,
  Clock,
  History,
  Plus,
  Check,
  Wallet,
} from 'lucide-react';
import {
  Project,
  InventoryItem,
  StockLog,
  FinanceRecord,
  SystemLog,
  OperationDashboardSummary,
  BudgetExecutionItem,
} from '../../types';
import ProjectProgressChart from './ProjectProgressChart';
import FinanceTrendChart from './FinanceTrendChart';
import InventoryStatusChart from './InventoryStatusChart';
import { buildAlertSummary } from '../../modules/dashboard/services/alertSummary';

interface DashboardProps {
  projects: Project[];
  inventory: InventoryItem[];
  stockLogs: StockLog[];
  financeRecords: FinanceRecord[];
  systemLogs?: SystemLog[];
  upcomingPaymentPlans?: Array<{
    id: number;
    projectId: number;
    name: string;
    planDate: string;
    planAmount: number;
    receivedAmount: number;
    status: string;
  }>;
  overdueMilestones?: Array<{
    id: number;
    name: string;
    planDate: string;
    status: string;
    projectId: number;
    projectName?: string;
  }>;
  operationDashboard?: OperationDashboardSummary | null;
  budgetExecutionDashboard?: BudgetExecutionItem[];
  onProjectClick?: (projectId: number) => void;
  onFinanceCardClick?: (type: 'income' | 'expense' | 'all') => void;
  onTabNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  inventory,
  stockLogs,
  financeRecords,
  systemLogs = [],
  upcomingPaymentPlans = [],
  overdueMilestones = [],
  operationDashboard = null,
  budgetExecutionDashboard = [],
  onProjectClick,
  onFinanceCardClick,
  onTabNavigate,
}) => {
  const StatsCards = () => {
    const totalOutbound = stockLogs
      .filter((l) => l.type === 'out' && l.status === 'approved')
      .reduce((acc, curr) => acc + curr.qty, 0);
    const lowStockCount = inventory.filter((i) => i.quantity < i.threshold).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: '在建项目',
            value: projects.filter((p) => p.status !== '已完工').length,
            icon: Building2,
            color: 'blue',
            total: projects.length,
          },
          { title: '累计出库量', value: totalOutbound, icon: ArrowRightLeft, color: 'orange', unit: '件' },
          { title: '库存预警', value: lowStockCount, icon: AlertTriangle, color: 'red', total: inventory.length },
          {
            title: '待审批',
            value: stockLogs.filter((l) => l.status === 'pending').length,
            icon: Clock,
            color: 'purple',
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 flex items-center gap-4 hover:shadow-md transition-all"
          >
            <div
              className={`p-3 rounded-xl ${
                s.color === 'blue'
                  ? 'bg-blue-50 text-blue-600'
                  : s.color === 'orange'
                    ? 'bg-orange-50 text-orange-600'
                    : s.color === 'red'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-purple-50 text-purple-600'
              }`}
            >
              <s.icon size={24} />
            </div>
            <div className="flex-1">
              <p className="text-slate-500 text-sm font-medium">{s.title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {s.value}
                  {s.unit || ''}
                </p>
                {s.total && <p className="text-xs text-slate-400">/ {s.total}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 最近操作时间线
  const RecentActivityTimeline = () => {
    const recentActivities = (() => {
      const activities: Array<{
        id: string;
        time: string;
        type: 'stock' | 'finance' | 'project' | 'system';
        title: string;
        description: string;
        icon: React.ReactNode;
        color: string;
      }> = [];

      // 从库存日志获取最近操作
      stockLogs
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .forEach((log) => {
          const item = inventory.find((i) => i.id === log.itemId);
          activities.push({
            id: `stock-${log.id}`,
            time: log.date,
            type: 'stock',
            title: log.type === 'in' ? '物料入库' : '物料出库',
            description: `${item?.name || '未知物料'} ${log.type === 'in' ? '+' : '-'}${log.qty} ${item?.unit || ''}`,
            icon: log.type === 'in' ? <Plus size={16} /> : <ArrowRightLeft size={16} />,
            color: log.type === 'in' ? 'green' : 'blue',
          });
        });

      // 从财务记录获取最近操作
      financeRecords
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)
        .forEach((record) => {
          activities.push({
            id: `finance-${record.id}`,
            time: record.date,
            type: 'finance',
            title: record.type === 'income' ? '财务收入' : '财务支出',
            description: `${record.category} ￥${record.amount.toLocaleString()}`,
            icon: <ArrowRightLeft size={16} />,
            color: record.type === 'income' ? 'green' : 'red',
          });
        });

      // 从系统日志获取
      systemLogs
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 2)
        .forEach((log) => {
          activities.push({
            id: `system-${log.id}`,
            time: log.time,
            type: 'system',
            title: log.action,
            description: log.detail,
            icon: <History size={16} />,
            color: 'purple',
          });
        });

      return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
    })();

    return (
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Clock size={18} />
          最近操作时间线
        </h3>
        {recentActivities.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">暂无操作记录</div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3 relative">
                {index < recentActivities.length - 1 && (
                  <div className="absolute left-5 top-8 w-0.5 h-full bg-slate-200"></div>
                )}
                <div
                  className={`p-2 rounded-lg ${
                    activity.color === 'green'
                      ? 'bg-green-50 text-green-600'
                      : activity.color === 'blue'
                        ? 'bg-blue-50 text-blue-600'
                        : activity.color === 'red'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-purple-50 text-purple-600'
                  } relative z-10`}
                >
                  {activity.icon}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{activity.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                      {new Date(activity.time).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 预警信息汇总面板
  const AlertSummaryPanel = () => {
    const alerts = buildAlertSummary({
      inventory,
      stockLogs,
      financeRecords,
      projects,
      upcomingPaymentPlans,
      overdueMilestones,
    });

    if (alerts.length === 0) {
      return (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Check size={18} className="text-green-600" />
            预警信息汇总
          </h3>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Check size={32} className="text-green-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500">暂无预警信息，一切正常</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          预警信息汇总
        </h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <button
              type="button"
              onClick={() => {
                if (alert.targetTab) {
                  onTabNavigate?.(alert.targetTab);
                }
              }}
              key={alert.id}
              className={`p-4 rounded-xl border-2 text-left w-full hover:shadow-sm transition ${
                alert.type === 'danger'
                  ? 'bg-red-50 border-red-200'
                  : alert.type === 'warning'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    alert.type === 'danger'
                      ? 'bg-red-100 text-red-600'
                      : alert.type === 'warning'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {alert.type === 'danger' ? (
                    <AlertTriangle size={18} />
                  ) : alert.type === 'warning' ? (
                    <Clock size={18} />
                  ) : (
                    <Building2 size={18} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className={`text-sm font-bold ${
                        alert.type === 'danger'
                          ? 'text-red-700'
                          : alert.type === 'warning'
                            ? 'text-orange-700'
                            : 'text-blue-700'
                      }`}
                    >
                      {alert.title}
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        alert.type === 'danger'
                          ? 'bg-red-200 text-red-700'
                          : alert.type === 'warning'
                            ? 'bg-orange-200 text-orange-700'
                            : 'bg-blue-200 text-blue-700'
                      }`}
                    >
                      {alert.count}项
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      alert.type === 'danger'
                        ? 'text-red-600'
                        : alert.type === 'warning'
                          ? 'text-orange-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {alert.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <StatsCards />
      {operationDashboard && (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            经营看板
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                label: '合同签订额',
                value: operationDashboard.contractSignedAmount,
                className: 'text-blue-700 bg-blue-50',
                onClick: () => onTabNavigate?.('contracts'),
              },
              {
                label: '合同结算额',
                value: operationDashboard.contractSettledAmount,
                className: 'text-indigo-700 bg-indigo-50',
                onClick: () => onTabNavigate?.('contracts'),
              },
              {
                label: '已审批收入',
                value: operationDashboard.approvedIncomeAmount,
                className: 'text-green-700 bg-green-50',
                onClick: () => onFinanceCardClick?.('income'),
              },
              {
                label: '已审批支出',
                value: operationDashboard.approvedExpenseAmount,
                className: 'text-red-700 bg-red-50',
                onClick: () => onFinanceCardClick?.('expense'),
              },
              {
                label: '近期待催款金额',
                value: operationDashboard.upcomingReceivableAmount,
                suffix: `${operationDashboard.upcomingReceivableCount || 0} 笔`,
                className: 'text-amber-700 bg-amber-50',
                onClick: () => onTabNavigate?.('projects'),
              },
              {
                label: '逾期待收金额',
                value: operationDashboard.overdueReceivableAmount,
                className: 'text-orange-700 bg-orange-50',
                onClick: () => onTabNavigate?.('projects'),
              },
              {
                label: '超预算项目数',
                value: operationDashboard.overBudgetProjectCount,
                plain: true,
                className: 'text-rose-700 bg-rose-50',
                onClick: () => onTabNavigate?.('projects'),
              },
            ].map((kpi) => (
              <button
                type="button"
                key={kpi.label}
                onClick={kpi.onClick}
                className={`rounded-2xl border border-slate-100 p-4 ${kpi.className} text-left hover:shadow-sm transition`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{kpi.label}</p>
                <p className="text-xl font-bold mt-2">
                  {kpi.plain ? String(kpi.value ?? 0) : `￥${Number(kpi.value || 0).toLocaleString()}`}
                </p>
                {kpi.suffix && <p className="text-xs mt-1 opacity-80">{kpi.suffix}</p>}
              </button>
            ))}
          </div>
        </div>
      )}
      {(operationDashboard || budgetExecutionDashboard.length > 0 || overdueMilestones.length > 0) && (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-600" />
            运营风险（可穿透）
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => onTabNavigate?.('projects')}
              className="text-left rounded-2xl border border-red-100 bg-red-50 p-4 hover:shadow-sm transition"
            >
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">超预算项目</p>
              <p className="text-2xl font-bold text-red-700 mt-2">
                {budgetExecutionDashboard.filter((i) => i.budgetAlertStatus === 'red').length}
              </p>
              <p className="text-xs text-red-600 mt-1">点击查看项目明细</p>
            </button>
            <button
              type="button"
              onClick={() => onTabNavigate?.('projects')}
              className="text-left rounded-2xl border border-orange-100 bg-orange-50 p-4 hover:shadow-sm transition"
            >
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">里程碑超期</p>
              <p className="text-2xl font-bold text-orange-700 mt-2">{overdueMilestones.length}</p>
              <p className="text-xs text-orange-600 mt-1">点击查看项目明细</p>
            </button>
            <button
              type="button"
              onClick={() => onTabNavigate?.('finance')}
              className="text-left rounded-2xl border border-amber-100 bg-amber-50 p-4 hover:shadow-sm transition"
            >
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">逾期待收金额</p>
              <p className="text-2xl font-bold text-amber-700 mt-2">
                ￥{Number(operationDashboard?.overdueReceivableAmount || 0).toLocaleString()}
              </p>
              <p className="text-xs text-amber-600 mt-1">点击跳转财务页核查</p>
            </button>
          </div>
        </div>
      )}
      {upcomingPaymentPlans.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-amber-600" />
            近期待催款预警（未来15日内）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-left">
                  <th className="py-2 px-3">项目</th>
                  <th className="py-2 px-3">节点名称</th>
                  <th className="py-2 px-3">计划日期</th>
                  <th className="py-2 px-3">计划金额</th>
                  <th className="py-2 px-3">已收金额</th>
                </tr>
              </thead>
              <tbody>
                {upcomingPaymentPlans.map((plan) => {
                  const project = projects.find((p) => p.id === plan.projectId);
                  return (
                    <tr key={plan.id} className="border-b border-slate-100">
                      <td className="py-2 px-3">
                        {project ? (
                          onProjectClick ? (
                            <button
                              type="button"
                              onClick={() => onProjectClick(project.id)}
                              className="text-blue-600 hover:underline"
                            >
                              {project.name}
                            </button>
                          ) : (
                            project.name
                          )
                        ) : (
                          `项目#${plan.projectId}`
                        )}
                      </td>
                      <td className="py-2 px-3">{plan.name}</td>
                      <td className="py-2 px-3">{plan.planDate}</td>
                      <td className="py-2 px-3">￥{Number(plan.planAmount).toLocaleString()}</td>
                      <td className="py-2 px-3">￥{Number(plan.receivedAmount || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {overdueMilestones.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600" />
            里程碑超期预警（计划日期已过且未完成）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-left">
                  <th className="py-2 px-3">项目</th>
                  <th className="py-2 px-3">里程碑</th>
                  <th className="py-2 px-3">计划日期</th>
                  <th className="py-2 px-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {overdueMilestones.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="py-2 px-3">
                      {onProjectClick ? (
                        <button
                          type="button"
                          onClick={() => onProjectClick(m.projectId)}
                          className="text-blue-600 hover:underline"
                        >
                          {m.projectName || `项目#${m.projectId}`}
                        </button>
                      ) : (
                        m.projectName || `项目#${m.projectId}`
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700">{m.name}</td>
                    <td className="py-2 px-3 text-slate-600">{m.planDate}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        超期未完成
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {budgetExecutionDashboard.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle
              size={18}
              className={
                budgetExecutionDashboard.some((p) => p.budgetAlertStatus === 'red') ? 'text-red-600' : 'text-amber-600'
              }
            />
            预算执行看板（预算 vs 实际成本）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-left">
                  <th className="py-2 px-3">项目</th>
                  <th className="py-2 px-3 text-right">控制预算</th>
                  <th className="py-2 px-3 text-right">实际成本</th>
                  <th className="py-2 px-3 text-right">执行率</th>
                  <th className="py-2 px-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {budgetExecutionDashboard.map((p) => (
                  <tr key={p.projectId} className="border-b border-slate-100">
                    <td className="py-2 px-3">
                      {onProjectClick ? (
                        <button
                          type="button"
                          onClick={() => onProjectClick(p.projectId)}
                          className="text-blue-600 hover:underline"
                        >
                          {p.projectName}
                        </button>
                      ) : (
                        p.projectName
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">￥{Number(p.totalBudget || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">￥{Number(p.actualCostTotal || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      {p.budgetRatio != null ? (p.budgetRatio * 100).toFixed(1) : '0'}%
                    </td>
                    <td className="py-2 px-3">
                      {p.totalBudget == null || Number(p.totalBudget) <= 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          未设预算
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            p.budgetAlertStatus === 'red'
                              ? 'bg-red-100 text-red-700'
                              : p.budgetAlertStatus === 'yellow'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.budgetAlertStatus === 'red'
                                ? 'bg-red-500'
                                : p.budgetAlertStatus === 'yellow'
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                            }`}
                          />
                          {p.budgetAlertStatus === 'red'
                            ? '已超预算'
                            : p.budgetAlertStatus === 'yellow'
                              ? '预算预警'
                              : '正常'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgressChart projects={projects} onProjectClick={onProjectClick} />
        <FinanceTrendChart financeRecords={financeRecords} onFinanceCardClick={onFinanceCardClick} />
      </div>
      <InventoryStatusChart inventory={inventory} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityTimeline />
        <AlertSummaryPanel />
      </div>
    </div>
  );
};

export default Dashboard;
