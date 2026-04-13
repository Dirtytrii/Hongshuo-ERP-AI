import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AppUnauthorizedStateProps {
  onBackToDashboard: () => void;
}

const AppUnauthorizedState: React.FC<AppUnauthorizedStateProps> = ({ onBackToDashboard }) => {
  return (
    <div className="p-20 text-center">
      <div className="surface-card p-8 max-w-md mx-auto">
        <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
        <h3 className="text-lg font-bold text-slate-700 mb-2">无访问权限</h3>
        <p className="text-slate-500 mb-4">您当前没有访问此页面的权限，请联系管理员。</p>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          返回仪表盘
        </button>
      </div>
    </div>
  );
};

export default AppUnauthorizedState;
