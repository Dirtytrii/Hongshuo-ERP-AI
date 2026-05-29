import React from 'react';
import { HardHat, ChevronLeft, ChevronRight } from 'lucide-react';
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
      className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[calc(100vw-3rem)] shrink-0 bg-white border-r border-slate-200/70 transition-all duration-300 flex flex-col rounded-r-2xl overflow-hidden md:relative md:z-auto md:max-w-none ${
        isOpen ? 'translate-x-0 md:w-72' : '-translate-x-full md:translate-x-0 md:w-24'
      }`}
    >
      <div
        className={`border-b border-slate-100 ${
          isOpen ? 'p-5 flex items-center justify-between gap-3' : 'px-3 py-4 flex flex-col items-center gap-3'
        }`}
      >
        <div className={`flex items-center gap-3 min-w-0 ${!isOpen ? 'justify-center' : ''}`}>
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shrink-0">
            <HardHat size={20} />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <p className="font-bold text-base tracking-tight text-slate-800">宏硕建设 ERP</p>
              <p className="text-xs text-slate-500">ERP 管理中台</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          title={isOpen ? '收起侧栏' : '展开侧栏'}
          aria-label={isOpen ? '收起侧栏' : '展开侧栏'}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.id} className="space-y-1.5">
              {isOpen && (
                <p className="px-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-400">
                  {section.label}
                </p>
              )}
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    activeTab === item.id
                      ? item.special
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-blue-50 text-blue-700'
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
