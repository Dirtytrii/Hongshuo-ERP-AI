import React, { useEffect, useState } from 'react';
import { Truck, Plus, Trash2, Edit2, Download } from 'lucide-react';
import { apiService } from '../../services/apiService';
import * as XLSX from 'xlsx';

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  contactPhone?: string;
  bankInfo?: string;
}

interface BalanceRow {
  supplierId: number;
  supplierName: string;
  payable: number;
  paid: number;
  balance: number;
}

const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [balanceList, setBalanceList] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', contactPhone: '', bankInfo: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [list, balance] = await Promise.all([apiService.getSuppliers(), apiService.getSupplierBalanceList()]);
      setSuppliers(Array.isArray(list) ? list : []);
      setBalanceList(Array.isArray(balance) ? balance : []);
    } catch (e) {
      setError((e as Error).message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', contactPerson: '', contactPhone: '', bankInfo: '' });
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || '',
      contactPhone: s.contactPhone || '',
      bankInfo: s.bankInfo || '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('供应商名称不能为空');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (editing) {
        await apiService.updateSupplier(editing.id, form);
      } else {
        await apiService.createSupplier(form);
      }
      await load();
      setIsModalOpen(false);
    } catch (e: unknown) {
      setError((e as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`确定要删除供应商「${s.name}」吗？`)) return;
    try {
      setSaving(true);
      await apiService.deleteSupplier(s.id);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '删除失败');
    } finally {
      setSaving(false);
    }
  };

  const exportBalance = () => {
    const rows = balanceList.map((r) => ({
      供应商ID: r.supplierId,
      供应商名称: r.supplierName,
      应付: r.payable,
      已付: r.paid,
      欠款: r.balance,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '供应商应付已付欠款');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `供应商应付已付欠款_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      {/* 供应商主数据 */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Truck size={18} /> 供应商管理
          </h3>
          <button
            type="button"
            onClick={openNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={16} /> 新增供应商
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 font-semibold text-slate-700">名称</th>
                <th className="text-left p-4 font-semibold text-slate-700">联系人</th>
                <th className="text-left p-4 font-semibold text-slate-700">电话</th>
                <th className="text-left p-4 font-semibold text-slate-700">银行信息</th>
                <th className="text-right p-4 font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    暂无供应商，请点击「新增供应商」
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-800">{s.name}</td>
                    <td className="p-4 text-slate-600">{s.contactPerson || '-'}</td>
                    <td className="p-4 text-slate-600">{s.contactPhone || '-'}</td>
                    <td className="p-4 text-slate-600 max-w-xs truncate" title={s.bankInfo}>
                      {s.bankInfo || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-blue-600 hover:underline mr-3 flex items-center gap-1 inline-flex"
                      >
                        <Edit2 size={14} /> 编辑
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="text-red-600 hover:underline flex items-center gap-1 inline-flex"
                      >
                        <Trash2 size={14} /> 删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 供应商应付/已付/欠款报表 */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Truck size={18} /> 供应商应付 / 已付 / 欠款
          </h3>
          <button
            type="button"
            onClick={exportBalance}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
          >
            <Download size={16} /> 导出
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 font-semibold text-slate-700">供应商名称</th>
                <th className="text-right p-4 font-semibold text-slate-700">应付（元）</th>
                <th className="text-right p-4 font-semibold text-slate-700">已付（元）</th>
                <th className="text-right p-4 font-semibold text-slate-700">欠款（元）</th>
              </tr>
            </thead>
            <tbody>
              {balanceList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    暂无数据（入库/支出关联供应商后可在此汇总）
                  </td>
                </tr>
              ) : (
                balanceList.map((r) => (
                  <tr key={r.supplierId} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-800">{r.supplierName}</td>
                    <td className="p-4 text-right text-slate-700">￥{Number(r.payable).toLocaleString()}</td>
                    <td className="p-4 text-right text-slate-700">￥{Number(r.paid).toLocaleString()}</td>
                    <td className="p-4 text-right font-medium text-slate-800">
                      ￥{Number(r.balance).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-700">{editing ? '编辑供应商' : '新增供应商'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">供应商名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入名称"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">联系人</label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">联系电话</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">银行信息</label>
                <textarea
                  value={form.bankInfo}
                  onChange={(e) => setForm({ ...form, bankInfo: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="可选"
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

export default SupplierManagement;
