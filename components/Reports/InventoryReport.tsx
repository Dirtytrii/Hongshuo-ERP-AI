import React from 'react';
import { Package } from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryReportProps {
  inventory: InventoryItem[];
}

const InventoryReport: React.FC<InventoryReportProps> = ({ inventory }) => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Package size={18} />
        库存报表
      </h3>
      <div className="text-center text-slate-400 py-8">
        库存报表功能开发中...
      </div>
    </div>
  );
};

export default InventoryReport;

