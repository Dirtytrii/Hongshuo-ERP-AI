import React from 'react';
import { Bell, DatabaseBackup, RotateCcw, Trash2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  isSidebarOpen: boolean;
  isBackendConnected: boolean;
  authUsername: string;
  roleLabel: string;
  isAdmin: boolean;
  messageCenterCount: number;
  onToggleSidebar: () => void;
  onToggleMessageCenter: () => void;
  onBackup: () => void;
  onRestore: () => void;
  onResetData: () => void;
  onLogout: () => void;
  messageCenter: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  isSidebarOpen,
  isBackendConnected,
  authUsername,
  roleLabel,
  isAdmin,
  messageCenterCount,
  onToggleSidebar,
  onToggleMessageCenter,
  onBackup,
  onRestore,
  onResetData,
  onLogout,
  messageCenter,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/70 px-6 lg:px-8 flex items-center justify-between shadow-sm z-10 rounded-b-2xl gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          title={isSidebarOpen ? '收起侧栏' : '展开侧栏'}
        >
          {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-800 truncate">{title}</h2>
          <p className="text-xs text-slate-500">按统一页面骨架与领域模块持续收口</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div
          className={`px-3 py-1.5 rounded-full flex items-center gap-2 border ${
            isBackendConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-xs font-medium ${isBackendConnected ? 'text-green-700' : 'text-red-700'}`}>
            {isBackendConnected ? '后端连接正常' : '后端连接失败'}
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={onToggleMessageCenter}
            className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            title="消息通知"
          >
            <Bell size={18} className="text-slate-600" />
            {messageCenterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {messageCenterCount > 99 ? '99+' : messageCenterCount}
              </span>
            )}
          </button>
          {messageCenter}
        </div>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={onBackup}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2"
              title="导出当前数据为 JSON 备份"
            >
              <DatabaseBackup size={14} /> 备份
            </button>
            <button
              type="button"
              onClick={onRestore}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2"
              title="从 JSON 备份恢复"
            >
              <RotateCcw size={14} /> 恢复
            </button>
            <button
              type="button"
              onClick={onResetData}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
              title="重置所有数据（测试用）"
            >
              <Trash2 size={14} /> 重置数据
            </button>
          </>
        )}

        <div className="flex items-center gap-3 pl-1">
          <div className="text-right">
            <p className="text-sm text-slate-700">{authUsername}</p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center gap-2"
          >
            <LogOut size={14} /> 退出
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
