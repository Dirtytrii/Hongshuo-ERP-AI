import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApprovalCenter from './ApprovalCenter';
import type { InventoryItem, Project } from '../../types';

const getApprovalTodosMock = vi.fn();

vi.mock('../../services/apiService', () => ({
  apiService: {
    getApprovalTodos: (...args: unknown[]) => getApprovalTodosMock(...args),
  },
}));

const projects: Project[] = [
  {
    id: 1,
    name: '预算预警项目',
    code: 'P001',
    managerId: 'pm1',
    contractAmount: 100000,
    receivedAmount: 20000,
    materialCost: 12000,
    laborCost: 8000,
    otherCost: 2000,
    status: '施工中',
    progress: 60,
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    milestones: [],
    budgetAlertStatus: 'yellow',
  },
];

const inventory: InventoryItem[] = [
  { id: 1, name: '水泥', spec: '42.5', unit: '吨', price: 500, quantity: 20, threshold: 100 },
];

describe('ApprovalCenter', () => {
  it('展示关键告警并支持点击跳转', async () => {
    getApprovalTodosMock.mockResolvedValue([]);
    const onNavigateTab = vi.fn();
    render(
      <ApprovalCenter
        onNavigateTab={onNavigateTab}
        projects={projects}
        inventory={inventory}
        overdueMilestones={[{ name: '主体封顶', projectName: '预算预警项目' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('审批中心')).toBeInTheDocument();
    });

    expect(screen.getByText('消息中心告警（库存阈值 / 里程碑逾期 / 预算预警）')).toBeInTheDocument();
    expect(screen.getByText('低库存预警')).toBeInTheDocument();
    expect(screen.getByText('里程碑超期')).toBeInTheDocument();
    expect(screen.getByText('预算预警')).toBeInTheDocument();

    fireEvent.click(screen.getByText('预算预警'));
    expect(onNavigateTab).toHaveBeenCalledWith('projects');
  });
});
