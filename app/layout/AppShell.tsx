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
    <div className="relative flex h-[100dvh] min-h-[100dvh] min-w-0 overflow-hidden bg-[#f3f6f8] font-sans text-slate-950">
      {sidebar}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="关闭侧栏"
          className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[1px] md:hidden"
          onClick={onCloseSidebar}
        />
      )}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {header}
        {children}
      </main>
    </div>
  );
};

export default AppShell;
