import React from 'react';

interface AppPageViewportProps {
  children: React.ReactNode;
}

const AppPageViewport: React.FC<AppPageViewportProps> = ({ children }) => {
  return (
    <div className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden p-4 md:p-8 page-shell">{children}</div>
  );
};

export default AppPageViewport;
