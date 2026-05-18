import React, { useMemo } from 'react';
import { Package, Download } from 'lucide-react';
import { InventoryItem, StockLog, Project } from '../../types';
import { exportLowStockToExcel } from '../../utils/export';

interface InventoryReportProps {
  inventory: InventoryItem[];
  stockLogs: StockLog[];
  projects: Project[];
  dateFrom?: string;
  dateTo?: string;
  projectId?: number;
}

const InventoryReport: React.FC<InventoryReportProps> = ({
  inventory,
  stockLogs,
  projects,
  dateFrom,
  dateTo,
  projectId,
}) => {
  const filteredLogs = useMemo(() => {
    let list = stockLogs;
    if (dateFrom) list = list.filter((l) => l.date >= dateFrom);
    if (dateTo) list = list.filter((l) => l.date <= dateTo);
    if (projectId != null) list = list.filter((l) => l.projectId === projectId);
    return list;
  }, [stockLogs, dateFrom, dateTo, projectId]);

  const { totalValue, lowStockCount, lowStockItems } = useMemo(() => {
    const total = inventory.reduce((s, i) => s + i.price * i.quantity, 0);
    const low = inventory.filter((i) => i.quantity < i.threshold);
    return { totalValue: total, lowStockCount: low.length, lowStockItems: low };
  }, [inventory]);

  const byItem = useMemo(() => {
    const map = new Map<number, { in: number; out: number; name: string; unit: string }>();
    inventory.forEach((i) => map.set(i.id, { in: 0, out: 0, name: i.name, unit: i.unit }));
    filteredLogs.forEach((log) => {
      const row = map.get(log.itemId);
      if (!row) return;
      if (log.type === 'in') row.in += log.qty;
      else if (log.status === 'active') row.out += log.qty;
    });
    return Array.from(map.entries()).map(([itemId, v]) => ({ itemId, ...v }));
  }, [inventory, filteredLogs]);

  const byProjectOut = useMemo(() => {
    const map = new Map<number, number>();
    filteredLogs
      .filter((l) => l.type === 'out' && l.status === 'active' && l.projectId != null)
      .forEach((l) => {
        const pid = l.projectId!;
        map.set(pid, (map.get(pid) || 0) + l.qty * l.price);
      });
    return Array.from(map.entries()).map(([pid, amount]) => ({
      projectId: pid,
      projectName: projects.find((p) => p.id === pid)?.name ?? String(pid),
      amount,
    }));
  }, [filteredLogs, projects]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6 space-y-6">
      <h3 className="font-bold text-slate-700 flex items-center gap-2">
        <Package size={18} />
        库存报表
      </h3>
      <p className="text-sm text-slate-500">
        库存总值 ￥{totalValue.toLocaleString()} · 低库存品种 {lowStockCount} 个
      </p>
      {byItem.some((r) => r.in > 0 || r.out > 0) && (
        <div>
          <h4 className="text-sm font-bold text-slate-600 mb-2">按物料进出库统计（筛选期内）</h4>
          <div className="overflow-x-auto border rounded-xl max-h-48 overflow-y-auto">
            <table className="w-full min-w-[620px] text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-2 px-3 font-bold text-slate-600">物料</th>
                  <th className="py-2 px-3 font-bold text-slate-600">入库量</th>
                  <th className="py-2 px-3 font-bold text-slate-600">出库量</th>
                  <th className="py-2 px-3 font-bold text-slate-600">单位</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byItem
                  .filter((r) => r.in > 0 || r.out > 0)
                  .map((r) => (
                    <tr key={r.itemId}>
                      <td className="py-2 px-3 font-medium">{r.name}</td>
                      <td className="py-2 px-3 text-green-600">+{r.in}</td>
                      <td className="py-2 px-3 text-red-600">-{r.out}</td>
                      <td className="py-2 px-3 text-slate-500">{r.unit}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {byProjectOut.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-600 mb-2">领用按项目汇总（筛选期内）</h4>
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full min-w-[520px] text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-2 px-3 font-bold text-slate-600">项目</th>
                  <th className="py-2 px-3 font-bold text-slate-600">出库金额</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byProjectOut.map((r) => (
                  <tr key={r.projectId}>
                    <td className="py-2 px-3">{r.projectName}</td>
                    <td className="py-2 px-3 font-medium">￥{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-slate-600">低库存明细（可导出）</h4>
          {lowStockItems.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportLowStockToExcel(
                  lowStockItems.map((i) => ({
                    name: i.name,
                    spec: i.spec,
                    unit: i.unit,
                    quantity: i.quantity,
                    threshold: i.threshold,
                  }))
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 flex items-center gap-1"
            >
              <Download size={14} />
              导出 Excel
            </button>
          )}
        </div>
        {lowStockItems.length > 0 ? (
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full min-w-[680px] text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-2 px-3 font-bold text-slate-600">物料名称</th>
                  <th className="py-2 px-3 font-bold text-slate-600">规格</th>
                  <th className="py-2 px-3 font-bold text-slate-600">当前库存</th>
                  <th className="py-2 px-3 font-bold text-slate-600">预警阈值</th>
                  <th className="py-2 px-3 font-bold text-slate-600">单位</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lowStockItems.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 px-3 font-medium text-slate-700">{i.name}</td>
                    <td className="py-2 px-3 text-slate-600">{i.spec}</td>
                    <td className="py-2 px-3 text-red-600 font-mono">{i.quantity}</td>
                    <td className="py-2 px-3 text-slate-600">{i.threshold}</td>
                    <td className="py-2 px-3 text-slate-500">{i.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-2">暂无低库存物料</p>
        )}
      </div>
    </div>
  );
};

export default InventoryReport;
