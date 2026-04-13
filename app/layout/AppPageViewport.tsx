import React from 'react';

interface AppPageViewportProps {
  children: React.ReactNode;
}

const AppPageViewport: React.FC<AppPageViewportProps> = ({ children }) => {
  return <div className="flex-1 overflow-y-auto p-8 page-shell">{children}</div>;
};

export default AppPageViewport;
