import React, { useEffect, useState } from 'react';
import { Receipt, Plus } from 'lucide-react';
import { apiService } from '../../services/apiService';
import type { Department, Project, Reimbursement } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';

interface ReimbursementManagementProps {
  projects: Project[];
  departments: Department[];
  approverName?: string;
  currentUserName?: string;
}

const ReimbursementManagement: React.FC<ReimbursementManagementProps> = ({
  projects,
  departments,
  approverName = '当前用户',
  currentUserName = '当前用户',
}) => {
  const [list, setList] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reimbursement | null>(null);
  const [form, setForm] = useState({
    projectId: '' as number | '',
    departmentId: '' as number | '',
    applicant: '',
    amount: 0,
    category: '差旅',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiService.getReimbursements({ status: filterStatus || undefined });
      setList(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message || '加载报销单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  const getProjectName = (projectId?: number | null) =>
    projectId == null ? '—' : projects.find((p) => p.id === projectId)?.name || `项目#${projectId}`;
  const getDepartmentName = (departmentId?: number | null) =>
    departmentId == null ? '—' : departments.find((d) => d.id === departmentId)?.name || `部门#${departmentId}`;

  const openCreate = () => {
    setEditing(null);
    setForm({
      projectId: projects[0]?.id ?? '',
      departmentId: departments[0]?.id ?? '',
      applicant: currentUserName,
      amount: 0,
      category: '差旅',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (row: Reimbursement) => {
    setEditing(row);
    setForm({
      projectId: row.projectId ?? '',
      departmentId: row.departmentId ?? '',
      applicant: row.applicant,
      amount: row.amount,
      category: row.category,
      date: row.date,
      description: row.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.applicant.trim()) {
      setError('报销人不能为空');
      return;
    }
    if (!form.amount || form.amount <= 0) {
      setError('报销金额必须大于0');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        projectId: form.projectId === '' ? null : Number(form.projectId),
        departmentId: form.departmentId === '' ? null : Number(form.departmentId),
        applicant: form.applicant.trim(),
        amount: Number(form.amount),
        category: form.category.trim(),
        date: form.date,
        description: form.description.trim() || undefined,
        creator: currentUserName,
      };
      if (editing) {
        await apiService.updateReimbursement(editing.id, payload);
      } else {
        await apiService.createReimbursement(payload);
      }
      setIsModalOpen(false);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await apiService.submitReimbursement(id);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '提交失败');
    }
  };

  const handleApprove = async (id: number, approved: boolean) => {
    try {
      await apiService.approveReimbursement(id, approverName, approved);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '审批失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该报销单吗？')) return;
    try {
      await apiService.deleteReimbursement(id);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '删除失败');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Receipt size={18} /> 员工报销单
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="submitted">已提交</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={16} /> 新建报销单
            </button>
          </div>
        </div>
        {error && <p className="px-6 py-2 text-sm text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 font-semibold text-slate-700">日期</th>
                <th className="text-left p-4 font-semibold text-slate-700">报销人</th>
                <th className="text-left p-4 font-semibold text-slate-700">项目</th>
                <th className="text-left p-4 font-semibold text-slate-700">部门</th>
                <th className="text-left p-4 font-semibold text-slate-700">类别</th>
                <th className="text-right p-4 font-semibold text-slate-700">金额</th>
                <th className="text-left p-4 font-semibold text-slate-700">状态</th>
                <th className="text-right p-4 font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    暂无报销单
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="p-4 text-slate-700">{row.date}</td>
                    <td className="p-4 text-slate-700">{row.applicant}</td>
                    <td className="p-4 text-slate-700">{getProjectName(row.projectId)}</td>
                    <td className="p-4 text-slate-700">{getDepartmentName(row.departmentId)}</td>
                    <td className="p-4 text-slate-700">{row.category}</td>
                    <td className="p-4 text-right font-medium">￥{Number(row.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          row.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : row.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : row.status === 'submitted'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.status === 'draft'
                          ? '草稿'
                          : row.status === 'submitted'
                            ? '已提交'
                            : row.status === 'approved'
                              ? '已通过'
                              : '已拒绝'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {row.status === 'draft' && (
                        <>
                          <button onClick={() => openEdit(row)} className="text-blue-600 hover:underline mr-2">
                            编辑
                          </button>
                          <button onClick={() => handleSubmit(row.id)} className="text-indigo-600 hover:underline mr-2">
                            提交
                          </button>
                          <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline">
                            删除
                          </button>
                        </>
                      )}
                      {row.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => handleApprove(row.id, true)}
                            className="text-green-600 hover:underline mr-2"
                          >
                            通过
                          </button>
                          <button onClick={() => handleApprove(row.id, false)} className="text-red-600 hover:underline">
                            拒绝
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
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-700">{editing ? '编辑报销单' : '新建报销单'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">报销人 *</label>
                <input
                  value={form.applicant}
                  onChange={(e) => setForm({ ...form, applicant: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">项目（可选）</label>
                  <SearchableSelect
                    options={[
                      { value: '', label: '不关联项目' },
                      ...projects.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                    value={form.projectId}
                    onChange={(v) => setForm({ ...form, projectId: v === '' ? '' : Number(v) })}
                    placeholder="选择项目"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">部门（可选）</label>
                  <SearchableSelect
                    options={[
                      { value: '', label: '不关联部门' },
                      ...departments.map((d) => ({ value: d.id, label: `${d.name}(${d.code})` })),
                    ]}
                    value={form.departmentId}
                    onChange={(v) => setForm({ ...form, departmentId: v === '' ? '' : Number(v) })}
                    placeholder="选择部门"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">类别 *</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">金额 *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">说明</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2"
                />
              </div>
              <div className="pt-3 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-xl font-bold">
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
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

export default ReimbursementManagement;
