import React from 'react';
import { Download, Plus, Wallet } from 'lucide-react';
import type { FinanceRecord, Project } from '../../types';

interface FinanceManagementPageProps {
  financeRecords: FinanceRecord[];
  projects: Project[];
  currentUserId: string;
  currentUserName: string;
  authRole?: string;
  canCreateFinance: boolean;
  canApproveFinance: boolean;
  onExport: () => void;
  onDownloadTemplate: () => void;
  onImport: () => void;
  onCreate: () => void;
  onApprove: (recordId: number, approved: boolean) => Promise<void>;
  onReject: (recordId: number) => void;
  onReverse: (recordId: number) => Promise<void>;
}

const FinanceManagementPage: React.FC<FinanceManagementPageProps> = ({
  financeRecords,
  projects,
  currentUserId,
  currentUserName,
  authRole,
  canCreateFinance,
  canApproveFinance,
  onExport,
  onDownloadTemplate,
  onImport,
  onCreate,
  onApprove,
  onReject,
  onReverse,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Wallet size={18} /> 财务收支记录
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExport}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Download size={16} /> 导出 Excel
            </button>
            {canCreateFinance && (
              <>
                <button
                  type="button"
                  onClick={onDownloadTemplate}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  下载模板
                </button>
                <button
                  type="button"
                  onClick={onImport}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  导入 Excel
                </button>
                <button
                  type="button"
                  onClick={onCreate}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg"
                >
                  <Plus size={16} /> 新建财务记录
                </button>
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">日期</th>
                <th className="px-6 py-4 font-bold">类型</th>
                <th className="px-6 py-4 font-bold">类别</th>
                <th className="px-6 py-4 font-bold">金额</th>
                <th className="px-6 py-4 font-bold">关联项目</th>
                <th className="px-6 py-4 font-bold">状态</th>
                <th className="px-6 py-4 font-bold">创建人</th>
                {canApproveFinance && <th className="px-6 py-4 font-bold">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {financeRecords.length === 0 ? (
                <tr>
                  <td colSpan={canApproveFinance ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
                    暂无财务记录
                  </td>
                </tr>
              ) : (
                financeRecords.map((record) => {
                  const project = projects.find((projectItem) => projectItem.id === record.projectId);
                  const canReverseCurrentRecord =
                    record.status === 'approved' &&
                    !record.isReversal &&
                    (currentUserId === 'admin' || authRole === 'finance' || currentUserName.includes('财务'));

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-slate-600">{record.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            record.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {record.type === 'income' ? '收入' : '支出'}
                          {record.isReversal && <span className="ml-1 text-amber-600">冲销</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{record.category}</td>
                      <td
                        className={`px-6 py-4 font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {record.type === 'income' ? '+' : '-'} RMB {record.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{project?.name || '未关联'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            record.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : record.status === 'pending'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {record.status === 'approved' ? '已批准' : record.status === 'pending' ? '待审批' : '已拒绝'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{record.creator}</td>
                      {canApproveFinance && (
                        <td className="px-6 py-4">
                          {record.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void onApprove(Number(record.id), true)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                              >
                                批准
                              </button>
                              <button
                                type="button"
                                onClick={() => onReject(Number(record.id))}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                              >
                                拒绝
                              </button>
                            </div>
                          ) : canReverseCurrentRecord ? (
                            <button
                              type="button"
                              onClick={() => void onReverse(Number(record.id))}
                              className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                            >
                              冲销
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceManagementPage;
