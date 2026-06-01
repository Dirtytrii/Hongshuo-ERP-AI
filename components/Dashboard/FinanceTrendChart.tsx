import React, { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { FinanceRecord } from '../../types';

interface FinanceTrendChartProps {
  financeRecords: FinanceRecord[];
  onFinanceCardClick?: (type: 'income' | 'expense' | 'all') => void;
}

const FinanceTrendChart: React.FC<FinanceTrendChartProps> = ({ financeRecords, onFinanceCardClick }) => {
  // 按月份聚合财务数据，按 year-month 排序后取最近 6 个月
  const monthlyData = useMemo(() => {
    const approvedRecords = financeRecords.filter((r) => r.status === 'approved');
    const monthlyMap = new Map<string, { income: number; expense: number; monthKey: string; month: string }>();

    approvedRecords.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${date.getMonth() + 1}月`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expense: 0, monthKey, month: monthLabel });
      }

      const data = monthlyMap.get(monthKey)!;
      if (record.type === 'income') {
        data.income += record.amount;
      } else {
        data.expense += record.amount;
      }
    });

    return Array.from(monthlyMap.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6);
  }, [financeRecords]);

  const totalIncome = financeRecords
    .filter((r) => r.type === 'income' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = financeRecords
    .filter((r) => r.type === 'expense' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="dashboard-panel p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
        <Wallet size={18} />
        财务收支趋势
      </h3>
      <div className="space-y-4">
        {/* 趋势图 */}
        {monthlyData.length > 0 ? (
          <div className="h-[220px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `￥${(value / 10000).toFixed(1)}万`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px',
                  }}
                  formatter={(value: number) => `￥${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="收入"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="支出"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8 text-sm">暂无财务趋势数据</div>
        )}

        {/* 汇总卡片 - 可点击查看细项 */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onFinanceCardClick?.('income')}
            className={`flex flex-col items-center rounded-xl border border-transparent bg-emerald-50 p-3 text-left transition-colors hover:border-emerald-200 ${onFinanceCardClick ? 'cursor-pointer' : ''}`}
          >
            <span className="text-xs text-slate-600 mb-1">总收入</span>
            <span className="text-sm font-bold text-emerald-600">￥{(totalIncome / 10000).toFixed(1)}万</span>
          </button>
          <button
            type="button"
            onClick={() => onFinanceCardClick?.('expense')}
            className={`flex flex-col items-center rounded-xl border border-transparent bg-red-50 p-3 text-left transition-colors hover:border-red-200 ${onFinanceCardClick ? 'cursor-pointer' : ''}`}
          >
            <span className="text-xs text-slate-600 mb-1">总支出</span>
            <span className="text-sm font-bold text-red-600">￥{(totalExpense / 10000).toFixed(1)}万</span>
          </button>
          <button
            type="button"
            onClick={() => onFinanceCardClick?.('all')}
            className={`flex flex-col items-center rounded-xl border border-transparent bg-blue-50 p-3 text-left transition-colors hover:border-blue-200 ${onFinanceCardClick ? 'cursor-pointer' : ''}`}
          >
            <span className="text-xs text-slate-600 mb-1">净收益</span>
            <span
              className={`text-sm font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              ￥{((totalIncome - totalExpense) / 10000).toFixed(1)}万
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceTrendChart;
