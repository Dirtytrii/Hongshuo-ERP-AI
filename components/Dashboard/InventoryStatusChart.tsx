import React, { useMemo } from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { InventoryItem } from '../../types';

interface InventoryStatusChartProps {
  inventory: InventoryItem[];
}

const InventoryStatusChart: React.FC<InventoryStatusChartProps> = ({ inventory }) => {
  const lowStockItems = inventory.filter((i) => i.quantity < i.threshold);
  const normalStockItems = inventory.filter((i) => i.quantity >= i.threshold);

  // 库存分布饼图数据
  const pieData = useMemo(
    () => [
      { name: '正常库存', value: normalStockItems.length, color: '#10b981' },
      { name: '低库存预警', value: lowStockItems.length, color: '#ef4444' },
    ],
    [normalStockItems.length, lowStockItems.length]
  );

  // 预警物料柱状图数据（按库存比例排序，取前5个）
  const warningBarData = useMemo(() => {
    return lowStockItems
      .map((item) => ({
        name: item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name,
        fullName: item.name,
        当前库存: item.quantity,
        预警阈值: item.threshold,
        比例: Math.round((item.quantity / item.threshold) * 100),
      }))
      .sort((a, b) => a.比例 - b.比例)
      .slice(0, 5);
  }, [lowStockItems]);

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Package size={18} />
        库存状态分析
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 库存分布饼图 */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-3">库存分布</h4>
          {inventory.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">暂无库存数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 预警物料柱状图 */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            低库存预警物料 (前5项)
          </h4>
          {warningBarData.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">暂无低库存物料</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={warningBarData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, '库存比例']}
                  labelFormatter={(label) => {
                    const item = warningBarData.find((d) => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Bar dataKey="比例" radius={[0, 8, 8, 0]} fill="#ef4444">
                  {warningBarData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.比例 < 50 ? '#ef4444' : entry.比例 < 80 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryStatusChart;
