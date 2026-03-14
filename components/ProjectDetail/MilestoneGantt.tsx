import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Milestone } from '../../types';

interface MilestoneGanttProps {
  projectName: string;
  startDate: string;
  endDate: string | null;
  milestones: Milestone[];
}

function parseTs(s: string): number {
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function fmtDate(s: string | undefined | null): string {
  if (!s) return '—';
  return s.slice(0, 10);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function generateMonthTicks(startTs: number, endTs: number): { label: string; pct: number }[] {
  const total = endTs - startTs;
  if (total <= 0) return [];
  const ticks: { label: string; pct: number }[] = [];
  const d = new Date(startTs);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  d.setHours(0, 0, 0, 0);
  while (d.getTime() < endTs) {
    const pct = ((d.getTime() - startTs) / total) * 100;
    if (pct > 2 && pct < 98) {
      ticks.push({ label: `${d.getMonth() + 1}月`, pct });
    }
    d.setMonth(d.getMonth() + 1);
  }
  return ticks;
}

type SortField = 'name' | 'planDate' | 'status';

const MilestoneGantt: React.FC<MilestoneGanttProps> = ({ projectName, startDate, endDate, milestones }) => {
  const [sortField, setSortField] = useState<SortField>('planDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const { rows, ticks, startTs, endTs, todayPct } = useMemo(() => {
    const sTs = parseTs(startDate);
    const eTs = endDate ? parseTs(endDate) : sTs + 365 * DAY_MS;
    const totalDays = Math.max(1, (eTs - sTs) / DAY_MS);
    const now = Date.now();
    const tPct = Math.max(0, Math.min(100, ((now - sTs) / DAY_MS / totalDays) * 100));

    const sorted = [...milestones].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'planDate') {
        cmp = parseTs(a.planDate) - parseTs(b.planDate);
      } else {
        const order = { completed: 0, in_progress: 1, pending: 2 };
        cmp = (order[a.status] ?? 9) - (order[b.status] ?? 9);
      }
      return sortAsc ? cmp : -cmp;
    });

    const rowsData = sorted.map((m) => {
      const planTs = parseTs(m.planDate || (m as { dueDate?: string }).dueDate || startDate);
      const planLeft = Math.max(0, Math.min(100, ((planTs - sTs) / DAY_MS / totalDays) * 100));
      const actualTs = m.actualDate ? parseTs(m.actualDate) : null;
      const actualLeft = actualTs ? Math.max(0, Math.min(100, ((actualTs - sTs) / DAY_MS / totalDays) * 100)) : null;
      const isOverdue = m.status !== 'completed' && planTs < now;
      return { ...m, planLeft, actualLeft, isOverdue, planTs };
    });

    return {
      rows: rowsData,
      ticks: generateMonthTicks(sTs, eTs),
      startTs: sTs,
      endTs: eTs,
      todayPct: tPct,
    };
  }, [startDate, endDate, milestones, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === 'completed').length;
    const overdue = milestones.filter((m) => m.status !== 'completed' && parseTs(m.planDate) < Date.now()).length;
    return { total, completed, overdue, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [milestones]);

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <Calendar size={18} className="text-slate-600" />
            里程碑甘特图
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{projectName} · 计划日期轴（仅展示）</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-slate-600">已完成 {stats.completed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-slate-600">进行中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-slate-600">超期 {stats.overdue}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-400" />
            <span className="text-slate-600">待开始</span>
          </div>
          <span className="text-slate-500 font-medium">完成率 {stats.pct}%</span>
        </div>
      </div>

      {/* progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
          style={{ width: `${stats.pct}%` }}
        />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* header */}
          <div className="flex items-center text-xs text-slate-500 border-b border-slate-200 pb-2 mb-1">
            <button
              className="w-32 shrink-0 text-left font-medium flex items-center gap-0.5 hover:text-slate-700"
              onClick={() => toggleSort('name')}
            >
              名称 <SortIcon field="name" />
            </button>
            <div className="flex-1 relative h-5">
              <span className="absolute left-0">{fmtDate(startDate)}</span>
              {ticks.map((t) => (
                <span key={t.label} className="absolute text-slate-400" style={{ left: `${t.pct}%` }}>
                  {t.label}
                </span>
              ))}
              <span className="absolute right-0">{endDate ? fmtDate(endDate) : '—'}</span>
            </div>
            <button
              className="w-24 shrink-0 text-center font-medium flex items-center justify-center gap-0.5 hover:text-slate-700"
              onClick={() => toggleSort('status')}
            >
              状态 <SortIcon field="status" />
            </button>
            <button
              className="w-24 shrink-0 text-right font-medium flex items-center justify-end gap-0.5 hover:text-slate-700"
              onClick={() => toggleSort('planDate')}
            >
              计划日 <SortIcon field="planDate" />
            </button>
          </div>

          {/* rows */}
          {rows.map((m) => {
            const barColor =
              m.status === 'completed'
                ? 'bg-green-500'
                : m.isOverdue
                  ? 'bg-red-500'
                  : m.status === 'in_progress'
                    ? 'bg-amber-500'
                    : 'bg-blue-400';

            const statusLabel =
              m.status === 'completed'
                ? '已完成'
                : m.isOverdue
                  ? '已超期'
                  : m.status === 'in_progress'
                    ? '进行中'
                    : '待开始';

            const statusClass =
              m.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : m.isOverdue
                  ? 'bg-red-100 text-red-700'
                  : m.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600';

            return (
              <div
                key={m.id}
                className={`flex items-center gap-0 py-1.5 border-b border-dashed border-slate-100 last:border-0 transition-colors ${hoveredId === m.id ? 'bg-slate-50' : ''}`}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="w-32 shrink-0 text-sm font-medium text-slate-700 truncate pr-2" title={m.name}>
                  {m.name}
                </div>
                <div className="flex-1 relative h-8 bg-slate-50 rounded-lg overflow-hidden">
                  {/* month gridlines */}
                  {ticks.map((t) => (
                    <div
                      key={t.label}
                      className="absolute top-0 bottom-0 w-px bg-slate-200 opacity-50"
                      style={{ left: `${t.pct}%` }}
                    />
                  ))}
                  {/* today marker */}
                  {todayPct > 0 && todayPct < 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-70 z-10"
                      style={{ left: `${todayPct}%` }}
                      title={`今日: ${new Date().toISOString().slice(0, 10)}`}
                    />
                  )}
                  {/* plan bar */}
                  <div
                    className={`absolute top-1.5 h-2.5 rounded-md min-w-[6px] ${barColor} opacity-90 transition-all`}
                    style={{
                      left: `${Math.min(m.planLeft, 98)}%`,
                      width: m.actualLeft != null ? `${Math.max(6, Math.abs(m.actualLeft - m.planLeft))}%` : '6px',
                    }}
                  />
                  {/* plan marker (diamond) */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 ${barColor} rotate-45 rounded-sm z-10`}
                    style={{ left: `calc(${Math.min(m.planLeft, 97)}% - 6px)` }}
                    title={`计划: ${fmtDate(m.planDate)}`}
                  />
                  {/* actual marker (circle) */}
                  {m.actualLeft != null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-600 rounded-full border-2 border-white z-10"
                      style={{ left: `calc(${Math.min(m.actualLeft, 97)}% - 6px)` }}
                      title={`实际: ${fmtDate(m.actualDate)}`}
                    />
                  )}
                  {/* tooltip */}
                  {hoveredId === m.id && (
                    <div
                      className="absolute bottom-full mb-1 bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 z-20 whitespace-nowrap shadow-lg pointer-events-none"
                      style={{ left: `${Math.min(Math.max(m.planLeft, 5), 70)}%` }}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div>计划: {fmtDate(m.planDate)}</div>
                      {m.actualDate && <div>实际: {fmtDate(m.actualDate)}</div>}
                      <div>状态: {statusLabel}</div>
                    </div>
                  )}
                </div>
                <span className={`w-24 shrink-0 text-center px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
                  {statusLabel}
                </span>
                <span className="w-24 shrink-0 text-right text-xs text-slate-500">{fmtDate(m.planDate)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 图例说明 */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-400 rotate-45 rounded-sm inline-block" />
          <span>计划日期</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-600 rounded-full inline-block" />
          <span>实际完成日</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-0.5 h-3 bg-red-400 inline-block" />
          <span>今日</span>
        </div>
      </div>
    </div>
  );
};

export default MilestoneGantt;
