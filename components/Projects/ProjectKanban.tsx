import React from 'react';
import { Building2, Eye, DollarSign, TrendingUp } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectKanbanProps {
  projects: Project[];
  onSelect: (projectId: number) => void;
}

interface KanbanColumn {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  headerBg: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    key: '施工中',
    label: '施工中',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    headerBg: 'bg-blue-100',
  },
  {
    key: '验收中',
    label: '验收中',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    headerBg: 'bg-purple-100',
  },
  {
    key: '已完工',
    label: '已完工',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    headerBg: 'bg-green-100',
  },
];

function getBudgetColor(status?: string): string {
  if (status === 'red') return 'text-red-600';
  if (status === 'yellow') return 'text-amber-600';
  return 'text-green-600';
}

const ProjectKanban: React.FC<ProjectKanbanProps> = ({ projects, onSelect }) => {
  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: projects.filter((p) => p.status === col.key),
  }));

  const otherProjects = projects.filter((p) => !COLUMNS.some((c) => c.key === p.status));
  if (otherProjects.length > 0) {
    grouped.push({
      key: 'other',
      label: '其他',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      headerBg: 'bg-slate-100',
      items: otherProjects,
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-h-[400px]">
      {grouped.map((col) => (
        <div key={col.key} className={`rounded-2xl border ${col.borderColor} ${col.bgColor} flex flex-col`}>
          <div className={`${col.headerBg} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
            <h4 className={`font-bold text-sm ${col.color} flex items-center gap-1.5`}>
              <Building2 size={15} />
              {col.label}
            </h4>
            <span className={`${col.color} text-xs font-bold px-2 py-0.5 rounded-full bg-white/60`}>
              {col.items.length}
            </span>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[600px]">
            {col.items.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">暂无项目</p>
            ) : (
              col.items.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => onSelect(project.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h5>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{project.code}</p>
                    </div>
                    <button
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(project.id);
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  </div>

                  {/* progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">进度</span>
                      <span className="text-xs font-bold text-slate-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          project.progress >= 100
                            ? 'bg-green-500'
                            : project.progress >= 50
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(project.progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* finance summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <DollarSign size={12} className="text-slate-400" />
                      <span>合同: </span>
                      <span className="font-mono font-medium text-slate-700">
                        {(project.contractAmount / 10000).toFixed(0)}万
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <TrendingUp size={12} className="text-green-500" />
                      <span>已收: </span>
                      <span className="font-mono font-medium text-green-600">
                        {(project.receivedAmount / 10000).toFixed(0)}万
                      </span>
                    </div>
                  </div>

                  {/* budget alert */}
                  {project.totalBudget && project.budgetAlertStatus && project.budgetAlertStatus !== 'green' && (
                    <div className={`mt-2 text-xs font-bold ${getBudgetColor(project.budgetAlertStatus)}`}>
                      {project.budgetAlertStatus === 'red' ? '预算超支' : '预算预警'}
                      {project.budgetRatio != null && ` (${Math.round(project.budgetRatio * 100)}%)`}
                    </div>
                  )}

                  {/* date range */}
                  <div className="mt-2 text-xs text-slate-400">
                    {project.startDate?.slice(0, 10)} → {project.endDate?.slice(0, 10) || '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectKanban;
