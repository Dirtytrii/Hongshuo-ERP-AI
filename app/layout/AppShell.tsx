import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ sidebar, header, children }) => {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {sidebar}
      <main className="flex-1 flex flex-col overflow-hidden">
        {header}
        {children}
      </main>
    </div>
  );
};

export default AppShell;
