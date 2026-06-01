import React from 'react';

interface AppPageViewportProps {
  children: React.ReactNode;
}

const AppPageViewport: React.FC<AppPageViewportProps> = ({ children }) => {
  return (
    <div className="page-shell min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-5 md:px-7 md:py-6">
      <div className="mx-auto w-full max-w-[1680px]">{children}</div>
    </div>
  );
};

export default AppPageViewport;
