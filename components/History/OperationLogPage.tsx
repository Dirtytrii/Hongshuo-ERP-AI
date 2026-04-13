import React from 'react';
import { History, Trash2 } from 'lucide-react';
import type { SystemLog } from '../../types';
import SearchableSelect from '../ui/SearchableSelect';

interface OperationLogPageProps {
  systemLogs: SystemLog[];
  displayedLogs: SystemLog[];
  canDelete: boolean;
  logFilterUser: string;
  logFilterAction: string;
  onFilterUserChange: (value: string) => void;
  onFilterActionChange: (value: string) => void;
  onDeleteLog: (log: SystemLog) => Promise<void>;
}

const OperationLogPage: React.FC<OperationLogPageProps> = ({
  systemLogs,
  displayedLogs,
  canDelete,
  logFilterUser,
  logFilterAction,
  onFilterUserChange,
  onFilterActionChange,
  onDeleteLog,
}) => {
  const filtered = [...displayedLogs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <History size={18} /> 系统操作日志
          </h3>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <span className="text-sm text-slate-500">操作人</span>
            <SearchableSelect
              options={[
                { value: '', label: '全部' },
                ...Array.from(new Set(systemLogs.map((log) => log.user)))
                  .sort()
                  .map((user) => ({ value: user, label: user })),
              ]}
              value={logFilterUser}
              onChange={(value) => onFilterUserChange(String(value))}
              placeholder="全部"
              className="min-w-[120px]"
              inputClassName="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
              maxHeight="220px"
            />
            <span className="text-sm text-slate-500 ml-2">操作类型</span>
            <SearchableSelect
              options={[
                { value: '', label: '全部' },
                ...Array.from(new Set(systemLogs.map((log) => log.action)))
                  .sort()
                  .map((action) => ({ value: action, label: action })),
              ]}
              value={logFilterAction}
              onChange={(value) => onFilterActionChange(String(value))}
              placeholder="全部"
              className="min-w-[120px]"
              inputClassName="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
              maxHeight="220px"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">时间</th>
                <th className="px-6 py-4 font-bold">操作人</th>
                <th className="px-6 py-4 font-bold">操作类型</th>
                <th className="px-6 py-4 font-bold">详细信息</th>
                {canDelete && <th className="px-6 py-4 font-bold w-20">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 5 : 4} className="px-6 py-12 text-center text-slate-400">
                    暂无操作日志
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{new Date(log.time).toLocaleString('zh-CN')}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{log.user}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{log.detail}</td>
                    {canDelete && (
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => void onDeleteLog(log)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
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

export default OperationLogPage;
