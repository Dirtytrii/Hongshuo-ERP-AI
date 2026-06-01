import React from 'react';
import { Bell, DatabaseBackup, RotateCcw, Trash2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  isSidebarOpen: boolean;
  isBackendConnected: boolean;
  authUsername: string;
  roleLabel: string;
  isAdmin: boolean;
  showDemoControls: boolean;
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
  showDemoControls,
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
    <header className="z-10 flex flex-none flex-col justify-between gap-3 overflow-visible border-b border-slate-200 bg-white/95 px-3 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:px-4 md:h-16 md:flex-row md:items-center md:px-6 md:py-0 lg:px-7">
      <div className="flex min-w-0 items-center gap-3 md:w-auto md:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100"
          title={isSidebarOpen ? '收起侧栏' : '展开侧栏'}
          aria-label={isSidebarOpen ? '收起侧栏' : '展开侧栏'}
        >
          {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="truncate text-xs text-slate-500">项目、物料、财务一体化</p>
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 md:w-auto md:shrink-0 md:flex md:flex-nowrap md:gap-2.5">
        <div
          className={`col-start-1 row-start-1 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-1.5 ${
            isBackendConnected ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
          }`}
        >
          <div className={`h-2 w-2 rounded-full ${isBackendConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className={`text-xs font-semibold ${isBackendConnected ? 'text-emerald-700' : 'text-red-700'}`}>
            {isBackendConnected ? '服务正常' : '服务异常'}
          </span>
        </div>

        <div className="relative col-start-2 row-start-1 shrink-0">
          <button
            type="button"
            onClick={onToggleMessageCenter}
            className="relative rounded-xl border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-100"
            title="消息通知"
            aria-label="消息通知"
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

        {isAdmin && showDemoControls && (
          <div className="col-span-4 row-start-2 flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 md:overflow-visible md:pb-0">
            <button
              type="button"
              onClick={onBackup}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              title="导出当前数据为 JSON 备份"
            >
              <DatabaseBackup size={14} /> 备份
            </button>
            <button
              type="button"
              onClick={onRestore}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              title="从 JSON 备份恢复"
            >
              <RotateCcw size={14} /> 恢复
            </button>
            <button
              type="button"
              onClick={onResetData}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              title="重置所有数据（测试用）"
            >
              <Trash2 size={14} /> 重置数据
            </button>
          </div>
        )}

        <div className="col-start-3 row-start-1 shrink-0 justify-self-end text-right">
          <p className="text-sm font-medium leading-5 text-slate-800">{authUsername}</p>
          <p className="text-xs leading-4 text-slate-500">{roleLabel}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="col-start-4 row-start-1 flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          <LogOut size={14} /> 退出
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
