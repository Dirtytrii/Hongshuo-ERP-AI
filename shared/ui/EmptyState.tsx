import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, compact = false }) => {
  return (
    <div className={`text-center ${compact ? 'py-6 px-4' : 'py-10 px-6'}`}>
      {icon && <div className="w-fit mx-auto mb-3 p-2 rounded-full bg-slate-100 text-slate-500">{icon}</div>}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1 leading-6">{description}</p>}
    </div>
  );
};

export default EmptyState;
