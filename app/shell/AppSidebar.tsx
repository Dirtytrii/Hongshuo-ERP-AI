import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getVisibleSidebarSections } from '../navigation/sidebarItems';

interface AppSidebarProps {
  activeTab: string;
  currentUserId: string;
  hasPermission: (permission: string) => boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSelectTab: (tabId: string) => void;
  onOpenPermissions: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  currentUserId,
  hasPermission,
  isOpen,
  onToggle,
  onSelectTab,
  onOpenPermissions,
}) => {
  const sections = getVisibleSidebarSections({ currentUserId, hasPermission });

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[calc(100vw-3rem)] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-[#fbfcfd] transition-all duration-300 md:relative md:z-auto md:max-w-none ${
        isOpen ? 'translate-x-0 md:w-72' : '-translate-x-full md:translate-x-0 md:w-24'
      }`}
    >
      <div
        className={`border-b border-slate-200 ${
          isOpen ? 'flex items-center justify-between gap-3 p-5' : 'flex flex-col items-center gap-3 px-3 py-4'
        }`}
      >
        <div className={`flex min-w-0 items-center gap-3 ${!isOpen ? 'justify-center' : ''}`}>
          <img
            src="/images/hongshuo-logo.png"
            alt=""
            className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover"
          />
          {isOpen && (
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight text-slate-950">宏硕建设 ERP</p>
              <p className="text-xs text-slate-500">ERP 管理中台</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100"
          title={isOpen ? '收起侧栏' : '展开侧栏'}
          aria-label={isOpen ? '收起侧栏' : '展开侧栏'}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.id} className="space-y-1.5">
              {isOpen && <p className="px-3 text-[11px] font-semibold text-slate-400">{section.label}</p>}
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'permissions') {
                      onOpenPermissions();
                    } else {
                      onSelectTab(item.id);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    activeTab === item.id
                      ? item.special
                        ? 'bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]'
                        : 'bg-[#e7f0fb] text-[#0f4c81]'
                      : 'text-slate-600 hover:bg-slate-100'
                  } ${!isOpen ? 'justify-center' : ''}`}
                  title={item.label}
                >
                  <item.icon size={18} />
                  {isOpen && <span className="font-medium text-sm">{item.label}</span>}
                </button>
              ))}
            </section>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default AppSidebar;
