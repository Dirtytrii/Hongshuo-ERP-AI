import React, { useCallback, useEffect, useState } from 'react';
import { HandCoins, Plus } from 'lucide-react';
import { apiService } from '../../services/apiService';
import type { Department, Loan, LoanRepayment, Project } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';

interface LoanManagementProps {
  projects: Project[];
  departments: Department[];
  approverName?: string;
  currentUserName?: string;
}

const LoanManagement: React.FC<LoanManagementProps> = ({
  projects,
  departments,
  approverName = '当前用户',
  currentUserName = '当前用户',
}) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [loanForm, setLoanForm] = useState({
    projectId: '' as number | '',
    departmentId: '' as number | '',
    borrower: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    reason: '',
  });
  const [repaymentForm, setRepaymentForm] = useState({
    loanId: '' as number | '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getLoans();
      const list = Array.isArray(data) ? (data as Loan[]) : [];
      setLoans(list);
      if (selectedLoanId == null && list.length > 0) {
        setSelectedLoanId(list[0].id);
      }
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message || '加载借款单失败');
    } finally {
      setLoading(false);
    }
  }, [selectedLoanId]);

  const loadRepayments = useCallback(async (loanId: number | null) => {
    if (loanId == null) {
      setRepayments([]);
      return;
    }
    try {
      const data = await apiService.getLoanRepayments({ loanId });
      setRepayments(Array.isArray(data) ? (data as LoanRepayment[]) : []);
    } catch {
      setRepayments([]);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  useEffect(() => {
    loadRepayments(selectedLoanId);
  }, [loadRepayments, selectedLoanId]);

  const getProjectName = (projectId?: number | null) =>
    projectId == null ? '—' : projects.find((p) => p.id === projectId)?.name || `项目#${projectId}`;
  const getDepartmentName = (departmentId?: number | null) =>
    departmentId == null ? '—' : departments.find((d) => d.id === departmentId)?.name || `部门#${departmentId}`;

  const createLoan = async () => {
    try {
      await apiService.createLoan({
        projectId: loanForm.projectId === '' ? null : Number(loanForm.projectId),
        departmentId: loanForm.departmentId === '' ? null : Number(loanForm.departmentId),
        borrower: loanForm.borrower || currentUserName,
        amount: Number(loanForm.amount),
        date: loanForm.date,
        reason: loanForm.reason,
        creator: currentUserName,
      });
      setLoanModalOpen(false);
      await loadLoans();
    } catch (e: unknown) {
      setError((e as Error).message || '创建借款单失败');
    }
  };

  const createRepayment = async () => {
    try {
      await apiService.createLoanRepayment({
        loanId: Number(repaymentForm.loanId),
        amount: Number(repaymentForm.amount),
        date: repaymentForm.date,
        note: repaymentForm.note,
        creator: currentUserName,
      });
      setRepaymentModalOpen(false);
      await loadRepayments(selectedLoanId);
    } catch (e: unknown) {
      setError((e as Error).message || '创建还款单失败');
    }
  };

  const submitLoan = async (id: number) => {
    try {
      await apiService.submitLoan(id);
      await loadLoans();
    } catch (e: unknown) {
      setError((e as Error).message || '提交失败');
    }
  };

  const approveLoan = async (id: number, approved: boolean) => {
    try {
      await apiService.approveLoan(id, approverName, approved);
      await loadLoans();
    } catch (e: unknown) {
      setError((e as Error).message || '审批失败');
    }
  };

  const submitRepayment = async (id: number) => {
    try {
      await apiService.submitLoanRepayment(id);
      await loadRepayments(selectedLoanId);
    } catch (e: unknown) {
      setError((e as Error).message || '提交失败');
    }
  };

  const approveRepayment = async (id: number, approved: boolean) => {
    try {
      await apiService.approveLoanRepayment(id, approverName, approved);
      await loadRepayments(selectedLoanId);
    } catch (e: unknown) {
      setError((e as Error).message || '审批失败');
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
            <HandCoins size={18} /> 借款单
          </h3>
          <button
            type="button"
            onClick={() => {
              setLoanForm({
                projectId: projects[0]?.id ?? '',
                departmentId: departments[0]?.id ?? '',
                borrower: currentUserName,
                amount: 0,
                date: new Date().toISOString().slice(0, 10),
                reason: '',
              });
              setLoanModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={16} /> 新建借款单
          </button>
        </div>
        {error && <p className="px-6 py-2 text-sm text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left font-semibold text-slate-700">借款人</th>
                <th className="p-4 text-left font-semibold text-slate-700">项目</th>
                <th className="p-4 text-left font-semibold text-slate-700">部门</th>
                <th className="p-4 text-right font-semibold text-slate-700">金额</th>
                <th className="p-4 text-left font-semibold text-slate-700">状态</th>
                <th className="p-4 text-right font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    暂无借款单
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr
                    key={loan.id}
                    className={`border-b border-slate-100 ${selectedLoanId === loan.id ? 'bg-blue-50/40' : ''}`}
                  >
                    <td className="p-4 text-slate-700">{loan.borrower}</td>
                    <td className="p-4 text-slate-700">{getProjectName(loan.projectId)}</td>
                    <td className="p-4 text-slate-700">{getDepartmentName(loan.departmentId)}</td>
                    <td className="p-4 text-right font-medium">￥{Number(loan.amount).toLocaleString()}</td>
                    <td className="p-4 text-slate-700">
                      {loan.status === 'draft'
                        ? '草稿'
                        : loan.status === 'submitted'
                          ? '已提交'
                          : loan.status === 'approved'
                            ? '已通过'
                            : '已拒绝'}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedLoanId(loan.id)} className="text-blue-600 hover:underline mr-2">
                        查看还款
                      </button>
                      {loan.status === 'draft' && (
                        <button onClick={() => submitLoan(loan.id)} className="text-indigo-600 hover:underline mr-2">
                          提交
                        </button>
                      )}
                      {loan.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => approveLoan(loan.id, true)}
                            className="text-green-600 hover:underline mr-2"
                          >
                            通过
                          </button>
                          <button onClick={() => approveLoan(loan.id, false)} className="text-red-600 hover:underline">
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

      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold text-slate-700">还款单{selectedLoanId ? `（借款#${selectedLoanId}）` : ''}</h3>
          <button
            type="button"
            disabled={selectedLoanId == null}
            onClick={() => {
              setRepaymentForm({
                loanId: selectedLoanId ?? '',
                amount: 0,
                date: new Date().toISOString().slice(0, 10),
                note: '',
              });
              setRepaymentModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            新建还款单
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left font-semibold text-slate-700">日期</th>
                <th className="p-4 text-right font-semibold text-slate-700">金额</th>
                <th className="p-4 text-left font-semibold text-slate-700">状态</th>
                <th className="p-4 text-right font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {repayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    暂无还款单
                  </td>
                </tr>
              ) : (
                repayments.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="p-4 text-slate-700">{r.date}</td>
                    <td className="p-4 text-right font-medium">￥{Number(r.amount).toLocaleString()}</td>
                    <td className="p-4 text-slate-700">
                      {r.status === 'draft'
                        ? '草稿'
                        : r.status === 'submitted'
                          ? '已提交'
                          : r.status === 'approved'
                            ? '已通过'
                            : '已拒绝'}
                    </td>
                    <td className="p-4 text-right">
                      {r.status === 'draft' && (
                        <button onClick={() => submitRepayment(r.id)} className="text-indigo-600 hover:underline mr-2">
                          提交
                        </button>
                      )}
                      {r.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => approveRepayment(r.id, true)}
                            className="text-green-600 hover:underline mr-2"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => approveRepayment(r.id, false)}
                            className="text-red-600 hover:underline"
                          >
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

      {loanModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-slate-700 mb-4">新建借款单</h3>
            <div className="space-y-3">
              <input
                value={loanForm.borrower}
                onChange={(e) => setLoanForm({ ...loanForm, borrower: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2"
                placeholder="借款人"
              />
              <div className="grid grid-cols-2 gap-3">
                <SearchableSelect
                  options={[
                    { value: '', label: '不关联项目' },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  value={loanForm.projectId}
                  onChange={(v) => setLoanForm({ ...loanForm, projectId: v === '' ? '' : Number(v) })}
                  placeholder="选择项目"
                />
                <SearchableSelect
                  options={[
                    { value: '', label: '不关联部门' },
                    ...departments.map((d) => ({ value: d.id, label: `${d.name}(${d.code})` })),
                  ]}
                  value={loanForm.departmentId}
                  onChange={(v) => setLoanForm({ ...loanForm, departmentId: v === '' ? '' : Number(v) })}
                  placeholder="选择部门"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={loanForm.amount || ''}
                  onChange={(e) => setLoanForm({ ...loanForm, amount: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2"
                  placeholder="借款金额"
                />
                <input
                  type="date"
                  value={loanForm.date}
                  onChange={(e) => setLoanForm({ ...loanForm, date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2"
                />
              </div>
              <textarea
                rows={3}
                value={loanForm.reason}
                onChange={(e) => setLoanForm({ ...loanForm, reason: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2"
                placeholder="借款事由"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setLoanModalOpen(false)} className="flex-1 py-2 border rounded-xl font-bold">
                  取消
                </button>
                <button onClick={createLoan} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold">
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {repaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-700 mb-4">新建还款单</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={repaymentForm.amount || ''}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2"
                  placeholder="还款金额"
                />
                <input
                  type="date"
                  value={repaymentForm.date}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2"
                />
              </div>
              <textarea
                rows={3}
                value={repaymentForm.note}
                onChange={(e) => setRepaymentForm({ ...repaymentForm, note: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2"
                placeholder="备注"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setRepaymentModalOpen(false)}
                  className="flex-1 py-2 border rounded-xl font-bold"
                >
                  取消
                </button>
                <button onClick={createRepayment} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold">
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

export default LoanManagement;
