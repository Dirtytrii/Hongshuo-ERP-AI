import React, { useEffect, useState } from 'react';
import { Building2, Plus, Download } from 'lucide-react';
import { apiService } from '../../services/apiService';
import type { Department, DepartmentCostSummary } from '../../types';
import * as XLSX from 'xlsx';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [costSummary, setCostSummary] = useState<DepartmentCostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', code: '', parentId: '' as number | '' });

  const load = async () => {
    try {
      setLoading(true);
      const [deptData, costData] = await Promise.all([
        apiService.getDepartments(),
        apiService.getDepartmentCostSummary(),
      ]);
      setDepartments(Array.isArray(deptData) ? (deptData as Department[]) : []);
      setCostSummary(Array.isArray(costData) ? (costData as DepartmentCostSummary[]) : []);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message || '加载部门数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', parentId: '' });
    setIsModalOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ name: d.name, code: d.code, parentId: d.parentId ?? '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      setError('部门名称和编码不能为空');
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        parentId: form.parentId === '' ? null : Number(form.parentId),
      };
      if (editing) {
        await apiService.updateDepartment(editing.id, payload);
      } else {
        await apiService.createDepartment(payload);
      }
      setIsModalOpen(false);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该部门吗？')) return;
    try {
      await apiService.deleteDepartment(id);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '删除失败');
    }
  };

  const exportCost = () => {
    const rows = costSummary.map((r) => ({
      部门: r.departmentName,
      财务支出: r.financeExpenseAmount,
      报销: r.reimbursementAmount,
      借款: r.loanAmount,
      合计: r.totalAmount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '部门成本');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `部门成本_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Building2 size={18} /> 部门主数据
          </h3>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={16} /> 新建部门
          </button>
        </div>
        {error && <p className="px-6 py-2 text-sm text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left font-semibold text-slate-700">部门名称</th>
                <th className="p-4 text-left font-semibold text-slate-700">编码</th>
                <th className="p-4 text-left font-semibold text-slate-700">上级部门ID</th>
                <th className="p-4 text-right font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    暂无部门
                  </td>
                </tr>
              ) : (
                departments.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="p-4 text-slate-700">{d.name}</td>
                    <td className="p-4 text-slate-700">{d.code}</td>
                    <td className="p-4 text-slate-700">{d.parentId ?? '—'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(d)} className="text-blue-600 hover:underline mr-2">
                        编辑
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:underline">
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold text-slate-700">部门成本汇总</h3>
          <button
            type="button"
            onClick={exportCost}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
          >
            <Download size={16} /> 导出
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left font-semibold text-slate-700">部门</th>
                <th className="p-4 text-right font-semibold text-slate-700">财务支出</th>
                <th className="p-4 text-right font-semibold text-slate-700">报销</th>
                <th className="p-4 text-right font-semibold text-slate-700">借款</th>
                <th className="p-4 text-right font-semibold text-slate-700">合计</th>
              </tr>
            </thead>
            <tbody>
              {costSummary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    暂无成本数据
                  </td>
                </tr>
              ) : (
                costSummary.map((r) => (
                  <tr key={r.departmentId} className="border-b border-slate-100">
                    <td className="p-4 text-slate-700">{r.departmentName}</td>
                    <td className="p-4 text-right">￥{Number(r.financeExpenseAmount).toLocaleString()}</td>
                    <td className="p-4 text-right">￥{Number(r.reimbursementAmount).toLocaleString()}</td>
                    <td className="p-4 text-right">￥{Number(r.loanAmount).toLocaleString()}</td>
                    <td className="p-4 text-right font-medium">￥{Number(r.totalAmount).toLocaleString()}</td>
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
              <h3 className="text-lg font-bold text-slate-700">{editing ? '编辑部门' : '新建部门'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2"
                placeholder="部门名称"
              />
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2"
                placeholder="部门编码"
              />
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : '' })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2"
              >
                <option value="">无上级部门</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}({d.code})
                  </option>
                ))}
              </select>
              <div className="pt-2 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-xl font-bold">
                  取消
                </button>
                <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold">
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
