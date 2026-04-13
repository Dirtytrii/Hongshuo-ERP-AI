import React from 'react';
import type { FinanceRecord, InventoryItem, Project, StockLog } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';
import FinanceReport from './FinanceReport';
import InventoryReport from './InventoryReport';
import ProjectReport from './ProjectReport';

interface ReportsPageProps {
  projects: Project[];
  financeRecords: FinanceRecord[];
  inventory: InventoryItem[];
  stockLogs: StockLog[];
  dateFrom: string;
  dateTo: string;
  projectId: number | '';
  subTab: 'finance' | 'inventory' | 'project';
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onProjectIdChange: (value: number | '') => void;
  onSubTabChange: (value: 'finance' | 'inventory' | 'project') => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({
  projects,
  financeRecords,
  inventory,
  stockLogs,
  dateFrom,
  dateTo,
  projectId,
  subTab,
  onDateFromChange,
  onDateToChange,
  onProjectIdChange,
  onSubTabChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-4 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-slate-600">日期范围</span>
        <input
          type="date"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
        <span className="text-slate-400">至</span>
        <input
          type="date"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
        <span className="text-sm font-medium text-slate-600 ml-2">项目</span>
        <SearchableSelect
          options={[
            { value: '', label: '全部项目' },
            ...projects.map((project) => ({ value: String(project.id), label: project.name })),
          ]}
          value={projectId === '' ? '' : String(projectId)}
          onChange={(value) => onProjectIdChange(value === '' ? '' : Number(value))}
          placeholder="全部项目"
          className="min-w-[160px]"
          inputClassName="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          maxHeight="220px"
        />
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['finance', 'inventory', 'project'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSubTabChange(key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              subTab === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {key === 'finance' ? '财务报表' : key === 'inventory' ? '库存报表' : '项目报表'}
          </button>
        ))}
      </div>

      {subTab === 'finance' && (
        <FinanceReport
          financeRecords={financeRecords}
          dateFrom={dateFrom || undefined}
          dateTo={dateTo || undefined}
          projectId={projectId === '' ? undefined : projectId}
        />
      )}
      {subTab === 'inventory' && (
        <InventoryReport
          inventory={inventory}
          stockLogs={stockLogs}
          projects={projects}
          dateFrom={dateFrom || undefined}
          dateTo={dateTo || undefined}
          projectId={projectId === '' ? undefined : projectId}
        />
      )}
      {subTab === 'project' && (
        <ProjectReport
          projects={projects}
          dateFrom={dateFrom || undefined}
          dateTo={dateTo || undefined}
          projectId={projectId === '' ? undefined : projectId}
        />
      )}
    </div>
  );
};

export default ReportsPage;
