import React from 'react';

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ children, className = '' }) => {
  return <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>{children}</div>;
};

export default Toolbar;
