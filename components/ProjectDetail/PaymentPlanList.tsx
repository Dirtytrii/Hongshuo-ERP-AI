import React, { useCallback, useEffect, useState } from 'react';
import { Wallet, Plus, Edit2, Trash2 } from 'lucide-react';
import { apiService } from '../../services/apiService';
import SearchableSelect from '../ui/SearchableSelect';

export interface PaymentPlanItemType {
  id: number;
  projectId: number;
  name: string;
  planDate: string;
  planAmount: number;
  receivedAmount: number;
  status: string;
}

interface PaymentPlanListProps {
  projectId: number;
  onRefresh?: () => void | Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待收' },
  { value: 'partial', label: '部分收' },
  { value: 'completed', label: '已收' },
];

const PaymentPlanList: React.FC<PaymentPlanListProps> = ({ projectId, onRefresh }) => {
  const [plans, setPlans] = useState<PaymentPlanItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentPlanItemType | null>(null);
  const [form, setForm] = useState({
    name: '',
    planDate: '',
    planAmount: '',
    receivedAmount: '',
    status: 'pending',
  });
  const [saving, setSaving] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const list = await apiService.getPaymentPlansByProject(projectId);
      setPlans(Array.isArray(list) ? list : []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      name: '',
      planDate: new Date().toISOString().slice(0, 10),
      planAmount: '',
      receivedAmount: '0',
      status: 'pending',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: PaymentPlanItemType) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      planDate: (item.planDate || '').slice(0, 10),
      planAmount: String(item.planAmount ?? 0),
      receivedAmount: String(item.receivedAmount ?? 0),
      status: item.status || 'pending',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const planAmount = parseFloat(form.planAmount);
    const receivedAmount = parseFloat(form.receivedAmount);
    if (isNaN(planAmount) || planAmount < 0) {
      alert('计划金额需为有效数字');
      return;
    }
    if (isNaN(receivedAmount) || receivedAmount < 0) {
      alert('已收金额需为有效数字');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        planDate: form.planDate,
        planAmount,
        receivedAmount,
        status: form.status,
      };
      if (editingItem) {
        await apiService.updatePaymentPlan(editingItem.id, payload);
      } else {
        await apiService.createPaymentPlan(projectId, payload);
      }
      await loadPlans();
      await onRefresh?.();
      closeModal();
    } catch (err: unknown) {
      alert((err as Error)?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: PaymentPlanItemType) => {
    if (!confirm(`确定删除回款节点「${item.name}」吗？`)) return;
    try {
      await apiService.deletePaymentPlan(item.id);
      await loadPlans();
      await onRefresh?.();
    } catch (err: unknown) {
      alert((err as Error)?.message || '删除失败');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Wallet size={18} className="text-amber-600" />
            回款计划
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            可在本页维护该项目的收款节点，仪表盘将根据计划日期展示「近期待催款预警」。已收金额由关联收入自动汇总（录入收入时选择「计入回款计划节点」即可）。
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> 新增回款节点
        </button>
      </div>
      {loading ? (
        <div className="text-center text-slate-400 py-8">加载中...</div>
      ) : plans.length === 0 ? (
        <div className="text-center text-slate-400 py-8">暂无回款计划</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-left">
                <th className="py-2 px-3">节点名称</th>
                <th className="py-2 px-3">计划日期</th>
                <th className="py-2 px-3 text-right">计划金额</th>
                <th className="py-2 px-3 text-right">已收金额</th>
                <th className="py-2 px-3">状态</th>
                <th className="py-2 px-3 w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2 px-3 font-medium text-slate-700">{item.name}</td>
                  <td className="py-2 px-3 text-slate-600">{item.planDate?.slice(0, 10) || '—'}</td>
                  <td className="py-2 px-3 text-right">￥{Number(item.planAmount ?? 0).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">￥{Number(item.receivedAmount ?? 0).toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'partial'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status === 'completed' ? '已收' : item.status === 'partial' ? '部分收' : '待收'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="编辑"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white rounded-3xl shadow-xl border border-slate-100/80 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-slate-700 mb-4">{editingItem ? '编辑回款节点' : '新增回款节点'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">节点名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="如：预付款、进度款、结算款、质保金"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">计划日期</label>
                <input
                  type="date"
                  value={form.planDate}
                  onChange={(e) => setForm((f) => ({ ...f, planDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">计划金额</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.planAmount}
                  onChange={(e) => setForm((f) => ({ ...f, planAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">已收金额</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.receivedAmount}
                  onChange={(e) => setForm((f) => ({ ...f, receivedAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">状态</label>
                <SearchableSelect
                  options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  placeholder="请选择状态..."
                  className="w-full"
                  inputClassName="px-3 py-2 border border-slate-200 rounded-xl"
                  maxHeight="180px"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPlanList;
