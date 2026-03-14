import React, { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FinanceRecord } from '../../types';
import { exportFinanceDetailToExcel } from '../../utils/export';

interface FinanceReportProps {
  financeRecords: FinanceRecord[];
  dateFrom?: string;
  dateTo?: string;
  projectId?: number;
}

const costTypeLabel: Record<string, string> = {
  material: '材料',
  labor: '人工',
  other: '其他',
};

const FinanceReport: React.FC<FinanceReportProps> = ({ financeRecords, dateFrom, dateTo, projectId }) => {
  const filtered = useMemo(() => {
    let list = financeRecords.filter((r) => r.status === 'approved');
    if (dateFrom) list = list.filter((r) => r.date >= dateFrom);
    if (dateTo) list = list.filter((r) => r.date <= dateTo);
    if (projectId != null) list = list.filter((r) => r.projectId === projectId);
    return list;
  }, [financeRecords, dateFrom, dateTo, projectId]);

  const { totalIncome, totalExpense, byProject, byCostType, byCategory } = useMemo(() => {
    const income = filtered.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expense = filtered.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const projectMap = new Map<number, { income: number; expense: number }>();
    filtered.forEach((r) => {
      const pid = r.projectId ?? 0;
      if (!projectMap.has(pid)) projectMap.set(pid, { income: 0, expense: 0 });
      const row = projectMap.get(pid)!;
      if (r.type === 'income') row.income += r.amount;
      else row.expense += r.amount;
    });
    const byProject = Array.from(projectMap.entries()).map(([id, v]) => ({
      projectId: id,
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
    }));
    const costMap = new Map<string, number>();
    filtered
      .filter((r) => r.type === 'expense')
      .forEach((r) => {
        const ct = (r as { costType?: string }).costType || 'other';
        costMap.set(ct, (costMap.get(ct) || 0) + r.amount);
      });
    const byCostType = Array.from(costMap.entries()).map(([k, v]) => ({ name: costTypeLabel[k] || k, value: v }));
    const categoryMap = new Map<string, number>();
    filtered.forEach((r) => {
      const key = r.category || '其他';
      categoryMap.set(key, (categoryMap.get(key) || 0) + (r.type === 'income' ? r.amount : -r.amount));
    });
    const byCategory = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 8);
    return { totalIncome: income, totalExpense: expense, byProject, byCostType, byCategory };
  }, [filtered]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6 space-y-6">
      <h3 className="font-bold text-slate-700 flex items-center gap-2">
        <Wallet size={18} />
        财务报表
      </h3>
      <p className="text-sm text-slate-500">
        汇总：收入 ￥{totalIncome.toLocaleString()} · 支出 ￥{totalExpense.toLocaleString()} · 净 ￥
        {(totalIncome - totalExpense).toLocaleString()}
      </p>
      {byProject.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-600 mb-2">按项目汇总</h4>
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-2 px-3 font-bold text-slate-600">项目ID</th>
                  <th className="py-2 px-3 font-bold text-slate-600">收入</th>
                  <th className="py-2 px-3 font-bold text-slate-600">支出</th>
                  <th className="py-2 px-3 font-bold text-slate-600">净收益</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byProject.map((row) => (
                  <tr key={row.projectId}>
                    <td className="py-2 px-3">{row.projectId || '未关联'}</td>
                    <td className="py-2 px-3 text-green-600">￥{row.income.toLocaleString()}</td>
                    <td className="py-2 px-3 text-red-600">￥{row.expense.toLocaleString()}</td>
                    <td className={`py-2 px-3 font-medium ${row.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ￥{row.net.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {byCostType.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-600 mb-2">支出按成本类型</h4>
          <div className="flex flex-wrap gap-4">
            {byCostType.map((row) => (
              <div key={row.name} className="p-3 bg-slate-50 rounded-xl min-w-[120px]">
                <p className="text-xs text-slate-500">{row.name}</p>
                <p className="text-lg font-bold text-slate-700">￥{row.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {byCategory.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-600 mb-2">收支按类别</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => ['￥' + v.toLocaleString(), '金额']} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-slate-600">明细表</h4>
          <button
            type="button"
            onClick={() => exportFinanceDetailToExcel(filtered)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 flex items-center gap-1"
          >
            <Download size={14} />
            导出 Excel
          </button>
        </div>
        <div className="overflow-x-auto border rounded-xl max-h-64 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b sticky top-0">
              <tr>
                <th className="py-2 px-3 font-bold text-slate-600">日期</th>
                <th className="py-2 px-3 font-bold text-slate-600">类型</th>
                <th className="py-2 px-3 font-bold text-slate-600">类别</th>
                <th className="py-2 px-3 font-bold text-slate-600">金额</th>
                <th className="py-2 px-3 font-bold text-slate-600">项目ID</th>
                <th className="py-2 px-3 font-bold text-slate-600">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    暂无记录
                  </td>
                </tr>
              ) : (
                [...filtered]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 px-3">{r.date}</td>
                      <td className="py-2 px-3">{r.type === 'income' ? '收入' : '支出'}</td>
                      <td className="py-2 px-3">{r.category || '-'}</td>
                      <td className={`py-2 px-3 ${r.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        ￥{r.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-3">{r.projectId ?? '-'}</td>
                      <td className="py-2 px-3">{r.status}</td>
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

export default FinanceReport;
