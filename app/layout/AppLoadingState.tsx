import React from 'react';

const AppLoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full min-h-[18rem]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-500">加载数据中...</p>
      </div>
    </div>
  );
};

export default AppLoadingState;
