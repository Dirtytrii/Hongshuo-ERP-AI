import React, { useMemo } from 'react';
import { Building2, Download } from 'lucide-react';
import { Project } from '../../types';
import { exportProjectReportToExcel } from '../../utils/export';

interface ProjectReportProps {
  projects: Project[];
  dateFrom?: string;
  dateTo?: string;
  projectId?: number;
}

const ProjectReport: React.FC<ProjectReportProps> = ({ projects, dateFrom, dateTo, projectId }) => {
  const filtered = useMemo(() => {
    let list = projects;
    if (projectId != null) list = list.filter((p) => p.id === projectId);
    if (dateFrom || dateTo) {
      list = list.filter((p) => {
        const start = p.startDate || '';
        const end = p.endDate || '';
        if (dateFrom && end && end < dateFrom) return false;
        if (dateTo && start && start > dateTo) return false;
        return true;
      });
    }
    return list;
  }, [projects, projectId, dateFrom, dateTo]);

  const rows = useMemo(() => {
    return filtered.map((p) => {
      const totalCost = p.materialCost + p.laborCost + p.otherCost;
      const profit = p.receivedAmount - totalCost;
      const margin = p.contractAmount > 0 ? ((profit / p.contractAmount) * 100).toFixed(1) : '0';
      return {
        name: p.name,
        code: p.code,
        contractAmount: p.contractAmount,
        receivedAmount: p.receivedAmount,
        materialCost: p.materialCost,
        laborCost: p.laborCost,
        otherCost: p.otherCost,
        totalCost,
        profit,
        margin: margin + '%',
        progress: p.progress + '%',
      };
    });
  }, [filtered]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Building2 size={18} />
          项目报表
        </h3>
        <button
          type="button"
          onClick={() => exportProjectReportToExcel(rows)}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 flex items-center gap-2"
        >
          <Download size={16} />
          导出 Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
              <th className="py-3 px-2 font-bold">项目名称</th>
              <th className="py-3 px-2 font-bold">编号</th>
              <th className="py-3 px-2 font-bold">合同金额</th>
              <th className="py-3 px-2 font-bold">已收款</th>
              <th className="py-3 px-2 font-bold">材料成本</th>
              <th className="py-3 px-2 font-bold">人工成本</th>
              <th className="py-3 px-2 font-bold">其他成本</th>
              <th className="py-3 px-2 font-bold">总成本</th>
              <th className="py-3 px-2 font-bold">净利润</th>
              <th className="py-3 px-2 font-bold">利润率</th>
              <th className="py-3 px-2 font-bold">进度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  暂无符合条件的数据
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={filtered[i].id} className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-medium text-slate-800">{r.name}</td>
                  <td className="py-3 px-2 text-slate-600">{r.code}</td>
                  <td className="py-3 px-2">￥{r.contractAmount.toLocaleString()}</td>
                  <td className="py-3 px-2 text-green-600">￥{r.receivedAmount.toLocaleString()}</td>
                  <td className="py-3 px-2">￥{r.materialCost.toLocaleString()}</td>
                  <td className="py-3 px-2">￥{r.laborCost.toLocaleString()}</td>
                  <td className="py-3 px-2">￥{r.otherCost.toLocaleString()}</td>
                  <td className="py-3 px-2">￥{r.totalCost.toLocaleString()}</td>
                  <td className={`py-3 px-2 font-medium ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ￥{r.profit.toLocaleString()}
                  </td>
                  <td className={`py-3 px-2 ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{r.margin}</td>
                  <td className="py-3 px-2">{r.progress}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">进度 vs 成本参考</p>
            <p className="text-sm text-slate-600">进度% 由里程碑计算，成本由财务审批汇总</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectReport;
