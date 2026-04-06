import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckSquare, RefreshCcw } from 'lucide-react';
import { apiService } from '../../services/apiService';
import type { ApprovalTodoItem, InventoryItem, Project } from '../../types';
import { buildAlertSummary } from '../../modules/dashboard/services/alertSummary';

interface ApprovalCenterProps {
  onNavigateTab?: (tab: string) => void;
  projects?: Project[];
  inventory?: InventoryItem[];
  overdueMilestones?: Array<{ name: string; projectName?: string }>;
}

const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  onNavigateTab,
  projects = [],
  inventory = [],
  overdueMilestones = [],
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todos, setTodos] = useState<ApprovalTodoItem[]>([]);
  const [bizType, setBizType] = useState('');
  const [keyword, setKeyword] = useState('');

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await apiService.getApprovalTodos({
        bizType: bizType || undefined,
        keyword: keyword.trim() || undefined,
      });
      setTodos(Array.isArray(data) ? (data as ApprovalTodoItem[]) : []);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message || '加载审批待办失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [bizType]);

  const bizLabel = (type: string) => {
    switch (type) {
      case 'finance':
        return '财务单';
      case 'change_order':
        return '变更单';
      case 'reimbursement':
        return '报销单';
      case 'loan':
        return '借款单';
      case 'loan_repayment':
        return '还款单';
      default:
        return type;
    }
  };

  const jumpToBizPage = (item: ApprovalTodoItem) => {
    const map: Record<string, string> = {
      finance: 'finance',
      change_order: 'change-orders',
      reimbursement: 'reimbursements',
      loan: 'loans',
      loan_repayment: 'loans',
    };
    const tab = map[item.bizType];
    if (tab && onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const messageAlerts = buildAlertSummary({
    inventory,
    stockLogs: [],
    financeRecords: [],
    projects,
    overdueMilestones,
  }).filter((a) => ['low-stock', 'overdue-milestones', 'budget-alert'].includes(a.id));

  if (loading) {
    return <div className="p-8 text-center text-slate-500">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-4">
        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" />
          消息中心告警（库存阈值 / 里程碑逾期 / 预算预警）
        </h4>
        {messageAlerts.length === 0 ? (
          <p className="text-sm text-slate-500">暂无关键告警</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {messageAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className="text-left border rounded-xl p-3 hover:bg-slate-50"
                onClick={() => alert.targetTab && onNavigateTab?.(alert.targetTab)}
              >
                <div className="text-xs text-slate-500">{alert.title}</div>
                <div className="text-lg font-bold text-slate-700">{alert.count}</div>
                <div className="text-xs text-slate-500 line-clamp-2">{alert.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <CheckSquare size={18} /> 审批中心
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={bizType}
              onChange={(e) => setBizType(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">全部类型</option>
              <option value="finance">财务单</option>
              <option value="change_order">变更单</option>
              <option value="reimbursement">报销单</option>
              <option value="loan">借款单</option>
              <option value="loan_repayment">还款单</option>
            </select>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
              placeholder="按申请人/标题搜索"
            />
            <button
              type="button"
              onClick={loadTodos}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm flex items-center gap-1 hover:bg-slate-50"
            >
              <RefreshCcw size={14} /> 刷新
            </button>
          </div>
        </div>
        {error && <p className="px-6 py-2 text-sm text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="p-4 font-semibold text-slate-700">类型</th>
                <th className="p-4 font-semibold text-slate-700">标题</th>
                <th className="p-4 font-semibold text-slate-700">申请人</th>
                <th className="p-4 font-semibold text-slate-700 text-right">金额</th>
                <th className="p-4 font-semibold text-slate-700">日期</th>
                <th className="p-4 font-semibold text-slate-700">状态</th>
                <th className="p-4 font-semibold text-slate-700 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {todos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    当前无待办
                  </td>
                </tr>
              ) : (
                todos.map((item) => (
                  <tr key={`${item.bizType}-${item.bizId}`} className="border-b border-slate-100">
                    <td className="p-4">{bizLabel(item.bizType)}</td>
                    <td className="p-4">{item.title}</td>
                    <td className="p-4">{item.applicant}</td>
                    <td className="p-4 text-right">￥{Number(item.amount || 0).toLocaleString()}</td>
                    <td className="p-4">{item.date}</td>
                    <td className="p-4">{item.status}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => jumpToBizPage(item)} className="text-blue-600 hover:underline">
                        进入单据页
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApprovalCenter;
