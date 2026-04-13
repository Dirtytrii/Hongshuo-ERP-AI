import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions }) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-slate-800">
          {icon}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {description && <p className="text-sm text-slate-500 mt-1 leading-6">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
