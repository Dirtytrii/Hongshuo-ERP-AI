import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Milestone } from '../../types';

interface MilestoneGanttProps {
  projectName: string;
  startDate: string;
  endDate: string | null;
  milestones: Milestone[];
}

/** 将日期字符串转为时间戳（天）便于计算比例 */
function parseDate(s: string): number {
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

const MilestoneGantt: React.FC<MilestoneGanttProps> = ({ projectName, startDate, endDate, milestones }) => {
  const { rows } = useMemo(() => {
    const start = parseDate(startDate);
    const end = endDate ? parseDate(endDate) : start + 365 * 24 * 60 * 60 * 1000;
    const total = Math.max(1, (end - start) / (24 * 60 * 60 * 1000));
    const rowsData = milestones.map((m) => {
      const planTs = parseDate(m.planDate || (m as { dueDate?: string }).dueDate || startDate);
      const left = Math.max(0, ((planTs - start) / (24 * 60 * 60 * 1000) / total) * 100);
      return { ...m, left: Math.min(100, left) };
    });
    return { rows: rowsData };
  }, [startDate, endDate, milestones]);

  if (milestones.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-slate-600" />
          里程碑甘特图
        </h3>
        <p className="text-slate-500 text-sm">暂无里程碑，无法展示甘特图。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
        <Calendar size={18} className="text-slate-600" />
        里程碑甘特图
      </h3>
      <p className="text-xs text-slate-500 mb-4">{projectName} · 计划日期轴（仅展示）</p>
      <div className="overflow-x-auto">
        <div className="min-w-[400px] space-y-3">
          <div className="flex text-xs text-slate-500 border-b border-slate-200 pb-1">
            <span className="w-28 shrink-0">{startDate?.slice(0, 10) || '—'}</span>
            <div className="flex-1 h-2 bg-gradient-to-r from-slate-100 to-slate-200 rounded" />
            <span className="w-28 shrink-0 text-right">{endDate?.slice(0, 10) || '—'}</span>
          </div>
          {rows.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <div className="w-28 shrink-0 text-sm font-medium text-slate-700 truncate" title={m.name}>
                {m.name}
              </div>
              <div className="flex-1 relative h-7 bg-slate-50 rounded-lg overflow-hidden">
                <div
                  className="absolute top-1 bottom-1 rounded-md min-w-[8px] bg-blue-500 opacity-90"
                  style={{ left: `${m.left}%`, width: '8px' }}
                  title={`计划: ${(m.planDate || (m as { dueDate?: string }).dueDate || '').slice(0, 10)}`}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-xs text-slate-500 ml-2"
                  style={{ left: `${m.left}%` }}
                >
                  {(m.planDate || (m as { dueDate?: string }).dueDate || '').slice(0, 10)}
                </span>
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                  m.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : m.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {m.status === 'completed' ? '已完成' : m.status === 'in_progress' ? '进行中' : '待开始'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MilestoneGantt;
