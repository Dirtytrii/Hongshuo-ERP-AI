import React, { useMemo } from 'react';
import { Building2, ArrowRightLeft, AlertTriangle, Sparkles, Clock, History, Plus, X, Check } from 'lucide-react';
import { Project, InventoryItem, StockLog, FinanceRecord, SystemLog } from '../../types';
import ProjectProgressChart from './ProjectProgressChart';
import FinanceTrendChart from './FinanceTrendChart';
import InventoryStatusChart from './InventoryStatusChart';

interface DashboardProps {
  projects: Project[];
  inventory: InventoryItem[];
  stockLogs: StockLog[];
  financeRecords: FinanceRecord[];
  systemLogs?: SystemLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  inventory, 
  stockLogs, 
  financeRecords,
  systemLogs = []
}) => {
  const StatsCards = () => {
    const totalOutbound = stockLogs.filter(l => l.type === 'out' && l.status === 'approved').reduce((acc, curr) => acc + curr.qty, 0);
    const lowStockCount = inventory.filter(i => i.quantity < i.threshold).length;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: '在建项目', value: projects.filter(p => p.status !== '已完工').length, icon: Building2, color: 'blue', total: projects.length },
          { title: '累计出库量', value: totalOutbound, icon: ArrowRightLeft, color: 'orange', unit: '件' },
          { title: '库存预警', value: lowStockCount, icon: AlertTriangle, color: 'red', total: inventory.length },
          { title: '待审批', value: stockLogs.filter(l => l.status === 'pending').length, icon: Clock, color: 'purple' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`p-3 rounded-xl ${
              s.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              s.color === 'orange' ? 'bg-orange-50 text-orange-600' :
              s.color === 'red' ? 'bg-red-50 text-red-600' :
              'bg-purple-50 text-purple-600'
            }`}>
              <s.icon size={24} />
            </div>
            <div className="flex-1">
              <p className="text-slate-500 text-sm font-medium">{s.title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{s.value}{s.unit || ''}</p>
                {s.total && (
                  <p className="text-xs text-slate-400">/ {s.total}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 最近操作时间线
  const RecentActivityTimeline = () => {
    const recentActivities = useMemo(() => {
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
        .forEach(log => {
          const item = inventory.find(i => i.id === log.itemId);
          activities.push({
            id: `stock-${log.id}`,
            time: log.date,
            type: 'stock',
            title: log.type === 'in' ? '物料入库' : '物料出库',
            description: `${item?.name || '未知物料'} ${log.type === 'in' ? '+' : '-'}${log.qty} ${item?.unit || ''}`,
            icon: log.type === 'in' ? <Plus size={16} /> : <ArrowRightLeft size={16} />,
            color: log.type === 'in' ? 'green' : 'blue'
          });
        });

      // 从财务记录获取最近操作
      financeRecords
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)
        .forEach(record => {
          activities.push({
            id: `finance-${record.id}`,
            time: record.date,
            type: 'finance',
            title: record.type === 'income' ? '财务收入' : '财务支出',
            description: `${record.category} ￥${record.amount.toLocaleString()}`,
            icon: <ArrowRightLeft size={16} />,
            color: record.type === 'income' ? 'green' : 'red'
          });
        });

      // 从系统日志获取
      systemLogs
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 2)
        .forEach(log => {
          activities.push({
            id: `system-${log.id}`,
            time: log.time,
            type: 'system',
            title: log.action,
            description: log.detail,
            icon: <History size={16} />,
            color: 'purple'
          });
        });

      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8);
    }, [stockLogs, inventory, financeRecords, systemLogs]);

    return (
      <div className="bg-white rounded-2xl border shadow-sm p-6">
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
                <div className={`p-2 rounded-lg ${
                  activity.color === 'green' ? 'bg-green-50 text-green-600' :
                  activity.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  activity.color === 'red' ? 'bg-red-50 text-red-600' :
                  'bg-purple-50 text-purple-600'
                } relative z-10`}>
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
                        minute: '2-digit' 
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
    const lowStockItems = inventory.filter(i => i.quantity < i.threshold);
    const pendingApprovals = stockLogs.filter(l => l.status === 'pending');
    const pendingFinance = financeRecords.filter(r => r.status === 'pending');
    const overdueProjects = projects.filter(p => {
      if (!p.endDate || p.status === '已完工') return false;
      return new Date(p.endDate) < new Date() && p.progress < 100;
    });

    const alerts = useMemo(() => {
      const alertList: Array<{
        id: string;
        type: 'warning' | 'danger' | 'info';
        title: string;
        count: number;
        description: string;
        icon: React.ReactNode;
      }> = [];

      if (lowStockItems.length > 0) {
        alertList.push({
          id: 'low-stock',
          type: 'danger',
          title: '低库存预警',
          count: lowStockItems.length,
          description: `${lowStockItems.slice(0, 3).map(i => i.name).join('、')}${lowStockItems.length > 3 ? '等' : ''}库存不足`,
          icon: <AlertTriangle size={18} />
        });
      }

      if (pendingApprovals.length > 0) {
        alertList.push({
          id: 'pending-stock',
          type: 'warning',
          title: '待审批出库',
          count: pendingApprovals.length,
          description: `有${pendingApprovals.length}条出库申请等待审批`,
          icon: <Clock size={18} />
        });
      }

      if (pendingFinance.length > 0) {
        alertList.push({
          id: 'pending-finance',
          type: 'warning',
          title: '待审批财务',
          count: pendingFinance.length,
          description: `有${pendingFinance.length}条财务记录等待审批`,
          icon: <Clock size={18} />
        });
      }

      if (overdueProjects.length > 0) {
        alertList.push({
          id: 'overdue-projects',
          type: 'info',
          title: '逾期项目',
          count: overdueProjects.length,
          description: `${overdueProjects.slice(0, 2).map(p => p.name).join('、')}${overdueProjects.length > 2 ? '等' : ''}已逾期`,
          icon: <Building2 size={18} />
        });
      }

      return alertList;
    }, [lowStockItems, pendingApprovals, pendingFinance, overdueProjects]);

    if (alerts.length === 0) {
      return (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
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
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          预警信息汇总
        </h3>
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border-2 ${
                alert.type === 'danger' ? 'bg-red-50 border-red-200' :
                alert.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.type === 'danger' ? 'bg-red-100 text-red-600' :
                  alert.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {alert.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-bold ${
                      alert.type === 'danger' ? 'text-red-700' :
                      alert.type === 'warning' ? 'text-orange-700' :
                      'text-blue-700'
                    }`}>
                      {alert.title}
                    </p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      alert.type === 'danger' ? 'bg-red-200 text-red-700' :
                      alert.type === 'warning' ? 'bg-orange-200 text-orange-700' :
                      'bg-blue-200 text-blue-700'
                    }`}>
                      {alert.count}项
                    </span>
                  </div>
                  <p className={`text-xs ${
                    alert.type === 'danger' ? 'text-red-600' :
                    alert.type === 'warning' ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {alert.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgressChart projects={projects} />
        <FinanceTrendChart financeRecords={financeRecords} />
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

