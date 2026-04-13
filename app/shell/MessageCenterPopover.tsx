import React from 'react';
import { AlertTriangle, ArrowRight, Clock, Inbox } from 'lucide-react';
import type { AlertSummaryItem } from '../../modules/dashboard/services/alertSummary';
import EmptyState from '../../shared/ui/EmptyState';

interface MessageCenterPopoverProps {
  alerts: AlertSummaryItem[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

const MessageCenterPopover: React.FC<MessageCenterPopoverProps> = ({ alerts, isOpen, onClose, onNavigateTab }) => {
  if (!isOpen) {
    return null;
  }

  const iconForType = (type: AlertSummaryItem['type']) => {
    if (type === 'danger') return <AlertTriangle size={14} className="text-red-500" />;
    if (type === 'warning') return <Clock size={14} className="text-amber-500" />;
    return <Inbox size={14} className="text-blue-500" />;
  };

  return (
    <>
      <div data-testid="message-center-overlay" className="fixed inset-0 z-40" onClick={onClose} />
      <div
        data-testid="message-center-popover"
        className="absolute right-0 mt-2 w-[22rem] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b bg-slate-50">
          <p className="font-semibold text-slate-700 text-sm">消息中心</p>
          <p className="text-xs text-slate-500 mt-0.5">经营预警与待处理信号统一归口展示</p>
        </div>
        <div className="p-2 space-y-1 max-h-[28rem] overflow-y-auto">
          {alerts.length === 0 ? (
            <EmptyState
              icon={<Inbox size={18} />}
              title="暂无新消息"
              description="当前没有待处理的库存、审批、回款或预算预警。"
              compact
            />
          ) : (
            alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => {
                  if (alert.targetTab) {
                    onNavigateTab(alert.targetTab);
                  }
                  onClose();
                }}
                className="w-full text-left px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconForType(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700">{alert.title}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                        {alert.count}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-5">{alert.description}</p>
                  </div>
                  {alert.targetTab && <ArrowRight size={14} className="text-slate-300 shrink-0 mt-1" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default MessageCenterPopover;
