import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import ProjectDetail from './ProjectDetail';
import type { Project, FinanceRecord, StockLog } from '../../types';

vi.mock('./MilestoneList', () => ({
  default: ({ milestones }: { milestones: { name: string; status: string }[] }) => (
    <div data-testid="milestone-list">
      {milestones.length === 0
        ? '暂无里程碑'
        : milestones.map((m) => (
            <span key={m.name}>
              {m.name}: {m.status}
            </span>
          ))}
    </div>
  ),
}));
vi.mock('./ProjectFinance', () => ({ default: () => <div data-testid="project-finance" /> }));

const mockProject: Project = {
  id: 1,
  name: '测试项目A',
  code: 'P001',
  managerId: '李工',
  contractAmount: 100000,
  receivedAmount: 60000,
  materialCost: 20000,
  laborCost: 15000,
  otherCost: 5000,
  status: '施工中',
  progress: 50,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  milestones: [
    { id: 1, name: '阶段一', planDate: '2025-06-01', actualDate: null, status: 'completed' },
    { id: 2, name: '阶段二', planDate: '2025-09-01', actualDate: null, status: 'in_progress' },
  ],
};

const mockFinanceRecords: FinanceRecord[] = [];
const mockStockLogs: StockLog[] = [];

describe('ProjectDetail', () => {
  it('renders project name and basic info', () => {
    render(
      <ProjectDetail
        project={mockProject}
        financeRecords={mockFinanceRecords}
        stockLogs={mockStockLogs}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('测试项目A')).toBeInTheDocument();
    expect(screen.getByText('P001')).toBeInTheDocument();
    expect(screen.getByText('项目基本信息')).toBeInTheDocument();
    expect(screen.getByText('项目成本分析')).toBeInTheDocument();
  });

  it('shows contract amount and progress', () => {
    render(
      <ProjectDetail
        project={mockProject}
        financeRecords={mockFinanceRecords}
        stockLogs={mockStockLogs}
        onClose={() => {}}
      />
    );
    // 精确断言“项目基本信息”卡片中的合同金额与已收款
    const basicInfoSection = screen.getByText('项目基本信息').closest('div');
    expect(basicInfoSection).toBeInTheDocument();
    const withinBasic = within(basicInfoSection as HTMLElement);
    expect(withinBasic.getByText(/100,000/)).toBeInTheDocument();
    expect(withinBasic.getByText(/60,000/)).toBeInTheDocument();
    // 页面上会有多个 "50%"，使用 getAllByText 避免歧义
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
  });

  it('calls onClose when 返回 is clicked', async () => {
    const onClose = vi.fn();
    render(
      <ProjectDetail
        project={mockProject}
        financeRecords={mockFinanceRecords}
        stockLogs={mockStockLogs}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('返回'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows 编辑项目 when onEdit is provided and calls onEdit when clicked', () => {
    const onEdit = vi.fn();
    render(
      <ProjectDetail
        project={mockProject}
        financeRecords={mockFinanceRecords}
        stockLogs={mockStockLogs}
        onClose={() => {}}
        onEdit={onEdit}
      />
    );
    const editBtn = screen.getByText('编辑项目');
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(mockProject);
  });

  it('shows 删除项目 when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(
      <ProjectDetail
        project={mockProject}
        financeRecords={mockFinanceRecords}
        stockLogs={mockStockLogs}
        onClose={() => {}}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText('删除项目')).toBeInTheDocument();
  });

  it('renders milestone list with project milestones', () => {
    render(
      <ProjectDetail
        project={mockProject}
        financeRecords={mockFinanceRecords}
        stockLogs={mockStockLogs}
        onClose={() => {}}
      />
    );
    const list = screen.getByTestId('milestone-list');
    expect(list).toBeInTheDocument();
    expect(within(list).getByText(/阶段一/)).toBeInTheDocument();
    expect(within(list).getByText(/阶段二/)).toBeInTheDocument();
  });

  it('renders project finance section', () => {
    render(
      <ProjectDetail
        project={mockProject}
        financeRecords={mockFinanceRecords}
        stockLogs={mockStockLogs}
        onClose={() => {}}
      />
    );
    expect(screen.getByTestId('project-finance')).toBeInTheDocument();
  });
});
