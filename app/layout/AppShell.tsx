import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ sidebar, header, isSidebarOpen, onCloseSidebar, children }) => {
  return (
    <div className="relative flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {sidebar}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="关闭侧栏"
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px] md:hidden"
          onClick={onCloseSidebar}
        />
      )}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {header}
        {children}
      </main>
    </div>
  );
};

export default AppShell;
