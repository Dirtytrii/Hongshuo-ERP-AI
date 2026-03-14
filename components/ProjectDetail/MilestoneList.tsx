import React, { useMemo, useState } from 'react';
import { Clock, Check, X, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Milestone } from '../../types';
import { apiService } from '../../services/apiService';
import SearchableSelect from '../ui/SearchableSelect';

interface MilestoneListProps {
  projectId: number;
  milestones: Milestone[];
  onRefresh?: () => void | Promise<void>;
  canEdit?: boolean;
}

const STATUS_OPTIONS: { value: Milestone['status']; label: string }[] = [
  { value: 'pending', label: '未开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

const MilestoneList: React.FC<MilestoneListProps> = ({ projectId, milestones, onRefresh, canEdit }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [form, setForm] = useState({ name: '', planDate: '', status: 'pending' as Milestone['status'] });
  const [saving, setSaving] = useState(false);

  const now = useMemo(() => new Date(), []);

  const openAdd = () => {
    setEditingMilestone(null);
    setForm({ name: '', planDate: new Date().toISOString().slice(0, 10), status: 'pending' });
    setIsModalOpen(true);
  };

  const openEdit = (m: Milestone) => {
    setEditingMilestone(m);
    setForm({
      name: m.name,
      planDate: m.planDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      status: m.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMilestone(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), planDate: form.planDate, status: form.status };
      if (editingMilestone) {
        await apiService.updateMilestone(projectId, editingMilestone.id, payload);
      } else {
        await apiService.addMilestone(projectId, payload);
      }
      await onRefresh?.();
      closeModal();
    } catch (err: unknown) {
      alert((err as Error)?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Milestone) => {
    if (!confirm(`确定删除里程碑「${m.name}」吗？`)) return;
    try {
      await apiService.deleteMilestone(projectId, m.id);
      await onRefresh?.();
    } catch (err: unknown) {
      alert((err as Error)?.message || '删除失败');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Clock size={18} />
          项目里程碑
        </h3>
        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={16} /> 新增里程碑
          </button>
        )}
      </div>
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <div className="text-center text-slate-400 py-8">暂无里程碑</div>
        ) : (
          milestones.map((milestone) => {
            const planDateStr = milestone.planDate || milestone.dueDate || '';
            const isOverdue = milestone.status !== 'completed' && planDateStr ? new Date(planDateStr) < now : false;
            return (
              <div key={milestone.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{milestone.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{milestone.description || '无描述'}</p>
                  <p className="text-xs text-slate-400 mt-1">计划日期: {planDateStr || '未设置'}</p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {milestone.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
                      <Check size={14} /> 已完成
                    </span>
                  ) : milestone.status === 'in_progress' ? (
                    <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-bold">
                      <Clock size={14} /> 进行中
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold">
                      <X size={14} /> 未开始
                    </span>
                  )}
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold">
                      <AlertTriangle size={14} /> 超期
                    </span>
                  )}
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(milestone)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="编辑"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(milestone)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white rounded-3xl shadow-xl border border-slate-100/80 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-slate-700 mb-4">{editingMilestone ? '编辑里程碑' : '新增里程碑'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="里程碑名称"
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">状态</label>
                <SearchableSelect
                  options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v as Milestone['status'] }))}
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

export default MilestoneList;
