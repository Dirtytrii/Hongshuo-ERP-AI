import React from 'react';
import { Wallet } from 'lucide-react';
import { FinanceRecord } from '../../types';

interface ProjectFinanceProps {
  projectId: number;
  financeRecords?: FinanceRecord[];
}

const ProjectFinance: React.FC<ProjectFinanceProps> = ({ projectId, financeRecords = [] }) => {
  const projectFinance = financeRecords.filter(r => r.projectId === projectId);

  const totalIncome = projectFinance
    .filter(r => r.type === 'income' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalExpense = projectFinance
    .filter(r => r.type === 'expense' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Wallet size={18} />
        项目财务关联
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">项目收入</p>
            <p className="text-lg font-bold text-green-600">￥{totalIncome.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">项目支出</p>
            <p className="text-lg font-bold text-red-600">￥{totalExpense.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">净收益</p>
            <p className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ￥{(totalIncome - totalExpense).toLocaleString()}
            </p>
          </div>
        </div>
        {projectFinance.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-600 mb-2">财务记录 ({projectFinance.length}条)</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projectFinance.map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{record.category}</p>
                    <p className="text-xs text-slate-500">{record.date}</p>
                  </div>
                  <span className={`text-sm font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.type === 'income' ? '+' : '-'}￥{record.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectFinance;

