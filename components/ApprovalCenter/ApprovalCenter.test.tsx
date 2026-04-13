import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApprovalCenter from './ApprovalCenter';

const getApprovalTodosMock = vi.fn();

vi.mock('../../services/apiService', () => ({
  apiService: {
    getApprovalTodos: (...args: unknown[]) => getApprovalTodosMock(...args),
  },
}));

describe('ApprovalCenter', () => {
  it('仅展示审批待办并支持点击跳转', async () => {
    getApprovalTodosMock.mockResolvedValue([
      {
        bizType: 'finance',
        bizId: 11,
        title: '材料采购付款',
        applicant: '赵姐',
        amount: 32000,
        status: 'submitted',
        date: '2026-03-28',
      },
    ]);
    const onNavigateTab = vi.fn();
    render(<ApprovalCenter onNavigateTab={onNavigateTab} />);

    await waitFor(() => {
      expect(screen.getByText('审批中心')).toBeInTheDocument();
    });

    expect(screen.getByText('待办列表')).toBeInTheDocument();
    expect(screen.queryByText('消息中心告警（库存阈值 / 里程碑逾期 / 预算预警）')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('进入单据页'));
    expect(onNavigateTab).toHaveBeenCalledWith('finance');
  });
});
