import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MessageCenterPopover from './MessageCenterPopover';
import type { AlertSummaryItem } from '../../modules/dashboard/services/alertSummary';

const alerts: AlertSummaryItem[] = [
  {
    id: 'low-stock',
    type: 'danger',
    title: '低库存预警',
    count: 2,
    description: '水泥、钢筋库存不足',
    targetTab: 'inventory',
  },
  {
    id: 'pending-finance',
    type: 'warning',
    title: '待审批财务',
    count: 1,
    description: '有1条财务记录等待审批',
    targetTab: 'finance',
  },
];

describe('MessageCenterPopover', () => {
  it('isOpen=false 时不渲染', () => {
    const onClose = vi.fn();
    const onNavigateTab = vi.fn();

    const { queryByTestId } = render(
      <div className="relative">
        <MessageCenterPopover alerts={alerts} isOpen={false} onClose={onClose} onNavigateTab={onNavigateTab} />
      </div>
    );

    expect(queryByTestId('message-center-popover')).not.toBeInTheDocument();
    expect(screen.queryByText('消息中心')).not.toBeInTheDocument();
  });

  it('alerts=[] 时渲染 EmptyState（标题/描述存在即可）', () => {
    const onClose = vi.fn();
    const onNavigateTab = vi.fn();

    render(
      <div className="relative">
        <MessageCenterPopover alerts={[]} isOpen onClose={onClose} onNavigateTab={onNavigateTab} />
      </div>
    );

    expect(screen.getByText('暂无新消息')).toBeInTheDocument();
    expect(screen.getByText('当前没有待处理的库存、审批、回款或预算预警。')).toBeInTheDocument();
  });

  it('点击 overlay 会触发 onClose', () => {
    const onClose = vi.fn();
    const onNavigateTab = vi.fn();

    render(
      <div className="relative">
        <MessageCenterPopover alerts={alerts} isOpen onClose={onClose} onNavigateTab={onNavigateTab} />
      </div>
    );

    fireEvent.click(screen.getByTestId('message-center-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('点击没有 targetTab 的 alert：只 close 不 navigate', () => {
    const onClose = vi.fn();
    const onNavigateTab = vi.fn();
    const noTargetAlerts: AlertSummaryItem[] = [
      {
        id: 'just-close',
        type: 'info',
        title: '仅关闭',
        count: 1,
        description: '该预警不支持跳转',
      },
    ];

    render(
      <div className="relative">
        <MessageCenterPopover alerts={noTargetAlerts} isOpen onClose={onClose} onNavigateTab={onNavigateTab} />
      </div>
    );

    fireEvent.click(screen.getByText('仅关闭'));
    expect(onNavigateTab).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('展示聚合预警并支持跳转', () => {
    const onClose = vi.fn();
    const onNavigateTab = vi.fn();

    render(
      <div className="relative">
        <MessageCenterPopover alerts={alerts} isOpen onClose={onClose} onNavigateTab={onNavigateTab} />
      </div>
    );

    expect(screen.getByText('消息中心')).toBeInTheDocument();
    expect(screen.getByText('低库存预警')).toBeInTheDocument();
    expect(screen.getByText('待审批财务')).toBeInTheDocument();

    fireEvent.click(screen.getByText('低库存预警'));
    expect(onNavigateTab).toHaveBeenCalledWith('inventory');
    expect(onClose).toHaveBeenCalled();
  });
});
