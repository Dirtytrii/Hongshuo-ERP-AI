import React, { useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { apiService } from '../../services/apiService';
import type { Contract, Project } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';

interface ContractManagementProps {
  projects: Project[];
  onProjectRefresh?: () => void;
}

const settlementStatusLabel: Record<string, string> = {
  unsettled: '未结算',
  partial: '部分结算',
  settled: '已结算',
};

const monitoringStatusLabel: Record<string, string> = {
  normal: '正常',
  warning: '预警',
  risk: '风险',
};

const ContractManagement: React.FC<ContractManagementProps> = ({ projects, onProjectRefresh }) => {
  const [list, setList] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<number | ''>('');
  const [filterSettlementStatus, setFilterSettlementStatus] = useState<string>('');
  const [filterMonitoringStatus, setFilterMonitoringStatus] = useState<string>('');
  const [editing, setEditing] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: '' as number | '',
    contractNo: '',
    name: '',
    contractAmount: 0,
    signedDate: '',
    settlementStatus: 'unsettled',
    monitoringStatus: 'normal',
    remark: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const params: { projectId?: number; settlementStatus?: string; monitoringStatus?: string } = {};
      if (filterProjectId !== '') params.projectId = filterProjectId;
      if (filterSettlementStatus) params.settlementStatus = filterSettlementStatus;
      if (filterMonitoringStatus) params.monitoringStatus = filterMonitoringStatus;
      const data = await apiService.getContracts(params);
      setList(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message || '加载合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterProjectId, filterSettlementStatus, filterMonitoringStatus]);

  const openNew = () => {
    setEditing(null);
    setForm({
      projectId: projects[0]?.id ?? '',
      contractNo: '',
      name: '',
      contractAmount: 0,
      signedDate: new Date().toISOString().slice(0, 10),
      settlementStatus: 'unsettled',
      monitoringStatus: 'normal',
      remark: '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (contract: Contract) => {
    setEditing(contract);
    setForm({
      projectId: contract.projectId,
      contractNo: contract.contractNo,
      name: contract.name,
      contractAmount: Number(contract.contractAmount || 0),
      signedDate: contract.signedDate,
      settlementStatus: contract.settlementStatus || 'unsettled',
      monitoringStatus: contract.monitoringStatus || 'normal',
      remark: contract.remark || '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (form.projectId === '' || !Number(form.projectId)) {
      setError('请选择关联项目');
      return;
    }
    if (!form.contractNo.trim()) {
      setError('合同编号不能为空');
      return;
    }
    if (!form.name.trim()) {
      setError('合同名称不能为空');
      return;
    }
    if (!form.signedDate) {
      setError('签订日期不能为空');
      return;
    }
    if (form.contractAmount < 0) {
      setError('合同金额不能为负数');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        projectId: Number(form.projectId),
        contractNo: form.contractNo.trim(),
        name: form.name.trim(),
        contractAmount: Number(form.contractAmount || 0),
        signedDate: form.signedDate,
        settlementStatus: form.settlementStatus,
        monitoringStatus: form.monitoringStatus,
        remark: form.remark?.trim() || undefined,
      };
      if (editing) {
        await apiService.updateContract(editing.id, payload);
      } else {
        await apiService.createContract(payload);
      }
      await load();
      onProjectRefresh?.();
      setIsModalOpen(false);
    } catch (e: unknown) {
      setError((e as Error).message || '保存合同失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!confirm(`确定删除合同「${contract.name}」吗？`)) return;
    try {
      setSaving(true);
      await apiService.deleteContract(contract.id);
      await load();
      onProjectRefresh?.();
    } catch (e: unknown) {
      setError((e as Error).message || '删除合同失败');
    } finally {
      setSaving(false);
    }
  };

  const getProjectName = (projectId: number) => projects.find((p) => p.id === projectId)?.name ?? `项目#${projectId}`;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <FileText size={18} /> 合同全生命周期管理
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
              value={filterSettlementStatus}
              onChange={(e) => setFilterSettlementStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">全部结算状态</option>
              <option value="unsettled">未结算</option>
              <option value="partial">部分结算</option>
              <option value="settled">已结算</option>
            </select>
            <select
              value={filterMonitoringStatus}
              onChange={(e) => setFilterMonitoringStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">全部监控状态</option>
              <option value="normal">正常</option>
              <option value="warning">预警</option>
              <option value="risk">风险</option>
            </select>
            <button
              type="button"
              onClick={openNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={16} /> 新增合同
            </button>
          </div>
        </div>
        {error && <p className="px-6 py-2 text-red-600 text-sm">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 font-semibold text-slate-700">关联项目</th>
                <th className="text-left p-4 font-semibold text-slate-700">合同名称</th>
                <th className="text-left p-4 font-semibold text-slate-700">合同编号</th>
                <th className="text-left p-4 font-semibold text-slate-700">签订日期</th>
                <th className="text-right p-4 font-semibold text-slate-700">合同金额</th>
                <th className="text-left p-4 font-semibold text-slate-700">结算状态</th>
                <th className="text-left p-4 font-semibold text-slate-700">监控状态</th>
                <th className="text-right p-4 font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    暂无合同数据
                  </td>
                </tr>
              ) : (
                list.map((contract) => (
                  <tr key={contract.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 text-slate-700">{getProjectName(contract.projectId)}</td>
                    <td className="p-4 text-slate-700">{contract.name}</td>
                    <td className="p-4 text-slate-700">{contract.contractNo}</td>
                    <td className="p-4 text-slate-700">{contract.signedDate}</td>
                    <td className="p-4 text-right font-medium">￥{Number(contract.contractAmount || 0).toLocaleString()}</td>
                    <td className="p-4 text-slate-700">{settlementStatusLabel[contract.settlementStatus] || contract.settlementStatus}</td>
                    <td className="p-4 text-slate-700">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          contract.monitoringStatus === 'risk'
                            ? 'bg-red-100 text-red-700'
                            : contract.monitoringStatus === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {monitoringStatusLabel[contract.monitoringStatus] || contract.monitoringStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(contract)} className="text-blue-600 hover:underline mr-2">
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(contract)}
                        disabled={saving}
                        className="text-red-600 hover:underline disabled:text-slate-400"
                      >
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-700">{editing ? '编辑合同' : '新增合同'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">关联项目 *</label>
                  <SearchableSelect
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    value={form.projectId === '' ? '' : form.projectId}
                    onChange={(v) => setForm({ ...form, projectId: v === '' ? '' : Number(v) })}
                    placeholder="选择项目"
                    maxHeight="220px"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">合同编号 *</label>
                  <input
                    value={form.contractNo}
                    onChange={(e) => setForm({ ...form, contractNo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="如：HT-2026-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">合同名称 *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="如：云端大厦总包合同"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">签订日期 *</label>
                  <input
                    type="date"
                    value={form.signedDate}
                    onChange={(e) => setForm({ ...form, signedDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">合同金额（元）*</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.contractAmount || ''}
                    onChange={(e) => setForm({ ...form, contractAmount: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">结算状态</label>
                  <select
                    value={form.settlementStatus}
                    onChange={(e) => setForm({ ...form, settlementStatus: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                  >
                    <option value="unsettled">未结算</option>
                    <option value="partial">部分结算</option>
                    <option value="settled">已结算</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">监控状态</label>
                  <select
                    value={form.monitoringStatus}
                    onChange={(e) => setForm({ ...form, monitoringStatus: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                  >
                    <option value="normal">正常</option>
                    <option value="warning">预警</option>
                    <option value="risk">风险</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">备注</label>
                <textarea
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="可填写合同补充说明、结算进展等"
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

export default ContractManagement;
