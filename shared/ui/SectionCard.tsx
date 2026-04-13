import React from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon,
  actions,
  children,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <section className={`surface-card overflow-hidden ${className}`.trim()}>
      {(title || actions || description) && (
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              {title && (
                <div className="flex items-center gap-2 text-slate-700">
                  {icon}
                  <h3 className="font-bold">{title}</h3>
                </div>
              )}
              {description && <p className="text-sm text-slate-500 mt-1 leading-6">{description}</p>}
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        </div>
      )}
      <div className={`px-6 py-5 ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
};

export default SectionCard;
