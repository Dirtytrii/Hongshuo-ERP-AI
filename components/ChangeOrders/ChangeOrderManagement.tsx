import React, { useEffect, useState } from 'react';
import { FileEdit, Plus, Trash2, Check, X } from 'lucide-react';
import { apiService, type ChangeOrderType } from '../../services/apiService';
import { Project } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';

interface ChangeOrderManagementProps {
  projects: Project[];
  approverName?: string;
  onProjectRefresh?: () => void;
}

const ChangeOrderManagement: React.FC<ChangeOrderManagementProps> = ({
  projects,
  approverName = '当前用户',
  onProjectRefresh,
}) => {
  const [list, setList] = useState<ChangeOrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProjectId, setFilterProjectId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [editing, setEditing] = useState<ChangeOrderType | null>(null);
  const [form, setForm] = useState({ projectId: 0 as number | '', reason: '', amount: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: { projectId?: number; status?: string } = {};
      if (filterProjectId !== '') params.projectId = filterProjectId;
      if (filterStatus) params.status = filterStatus;
      const data = await apiService.getChangeOrders(params);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterProjectId, filterStatus]);

  const openNew = () => {
    setEditing(null);
    setForm({ projectId: projects[0]?.id ?? '', reason: '', amount: 0 });
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (order: ChangeOrderType) => {
    if (order.status !== 'pending') return;
    setEditing(order);
    setForm({ projectId: order.projectId, reason: order.reason, amount: order.amount });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.reason.trim()) {
      setError('事由不能为空');
      return;
    }
    if (form.projectId === '' || form.projectId === 0) {
      setError('请选择关联项目');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (editing) {
        await apiService.updateChangeOrder(editing.id, { reason: form.reason, amount: form.amount });
      } else {
        await apiService.createChangeOrder({
          projectId: form.projectId as number,
          reason: form.reason.trim(),
          amount: form.amount,
        });
      }
      await load();
      setIsModalOpen(false);
      onProjectRefresh?.();
    } catch (e: unknown) {
      setError((e as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (order: ChangeOrderType) => {
    if (order.status !== 'pending') {
      setError('仅待审批状态可删除');
      return;
    }
    if (!confirm(`确定要删除变更单「${order.reason}」吗？`)) return;
    try {
      setSaving(true);
      await apiService.deleteChangeOrder(order.id);
      await load();
      onProjectRefresh?.();
    } catch (e: unknown) {
      setError((e as Error).message || '删除失败');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (order: ChangeOrderType, approved: boolean) => {
    try {
      setApprovingId(order.id);
      await apiService.approveChangeOrder(order.id, approverName, approved);
      await load();
      onProjectRefresh?.();
    } catch (e: unknown) {
      setError((e as Error).message || '审批失败');
    } finally {
      setApprovingId(null);
    }
  };

  const getProjectName = (projectId: number) => projects.find((p) => p.id === projectId)?.name ?? `项目#${projectId}`;
  const statusLabel: Record<string, string> = { pending: '待审批', approved: '已通过', rejected: '已拒绝' };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <FileEdit size={18} /> 变更/签证单
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <SearchableSelect
              options={[{ value: '', label: '全部项目' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
              value={filterProjectId === '' ? '' : filterProjectId}
              onChange={(v) => setFilterProjectId(v === '' ? '' : Number(v))}
              placeholder="按项目筛选"
              maxHeight="200px"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">全部状态</option>
              <option value="pending">待审批</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
            <button
              type="button"
              onClick={openNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={16} /> 新增变更单
            </button>
          </div>
        </div>
        {error && <p className="px-6 py-2 text-red-600 text-sm">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 font-semibold text-slate-700">关联项目</th>
                <th className="text-left p-4 font-semibold text-slate-700">事由</th>
                <th className="text-right p-4 font-semibold text-slate-700">预估增加金额</th>
                <th className="text-left p-4 font-semibold text-slate-700">状态</th>
                <th className="text-right p-4 font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    暂无变更单
                  </td>
                </tr>
              ) : (
                list.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 text-slate-700">{getProjectName(order.projectId)}</td>
                    <td className="p-4 text-slate-700 max-w-xs truncate" title={order.reason}>
                      {order.reason}
                    </td>
                    <td className="p-4 text-right font-medium">￥{Number(order.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          order.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => openEdit(order)} className="text-blue-600 hover:underline mr-2">
                            编辑
                          </button>
                          <button
                            onClick={() => handleApprove(order, true)}
                            disabled={approvingId === order.id}
                            className="text-green-600 hover:underline mr-2"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleApprove(order, false)}
                            disabled={approvingId === order.id}
                            className="text-red-600 hover:underline mr-2"
                          >
                            拒绝
                          </button>
                          <button onClick={() => handleDelete(order)} className="text-slate-500 hover:underline">
                            删除
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-700">{editing ? '编辑变更单' : '新增变更单'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {!editing && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">关联项目 *</label>
                  <SearchableSelect
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    value={form.projectId === '' ? '' : form.projectId}
                    onChange={(v) => setForm({ ...form, projectId: v === '' ? '' : Number(v) })}
                    placeholder="选择项目"
                    maxHeight="200px"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">事由 *</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="变更/签证事由"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">预估增加金额（元）*</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border rounded-xl font-bold hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeOrderManagement;
