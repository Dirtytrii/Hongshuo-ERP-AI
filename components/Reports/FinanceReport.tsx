import React from 'react';
import { Wallet } from 'lucide-react';
import { FinanceRecord } from '../../types';

interface FinanceReportProps {
  financeRecords: FinanceRecord[];
}

const FinanceReport: React.FC<FinanceReportProps> = ({ financeRecords }) => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Wallet size={18} />
        财务报表
      </h3>
      <div className="text-center text-slate-400 py-8">
        财务报表功能开发中...
      </div>
    </div>
  );
};

export default FinanceReport;

