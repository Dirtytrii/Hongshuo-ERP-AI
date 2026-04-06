import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectProgressChart from './ProjectProgressChart';
import type { Project } from '../../types';

const barChartSpy = vi.fn();

vi.mock('lucide-react', () => ({
  Building2: () => <span data-testid="building-icon" />,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive">{children}</div>,
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => {
    barChartSpy(data);
    return <div data-testid="bar-chart">{children}</div>;
  },
  Bar: ({ children, onClick }: { children: React.ReactNode; onClick?: (d: { projectId?: number }) => void }) => (
    <div>
      <button type="button" data-testid="bar-click" onClick={() => onClick?.({ projectId: 2 })}>
        click-bar
      </button>
      {children}
    </div>
  ),
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Cell: () => <div data-testid="cell" />,
}));

const baseProjects: Project[] = [
  {
    id: 1,
    name: '第一项目-超长名称用于截断',
    code: 'P-001',
    managerId: 'M-1',
    contractAmount: 100000,
    receivedAmount: 20000,
    materialCost: 12000,
    laborCost: 8000,
    otherCost: 3000,
    status: '施工中',
    progress: 20,
    startDate: '2026-01-01',
    endDate: '',
    milestones: [],
  },
  {
    id: 2,
    name: '第二项目',
    code: 'P-002',
    managerId: 'M-2',
    contractAmount: 120000,
    receivedAmount: 40000,
    materialCost: 18000,
    laborCost: 10000,
    otherCost: 5000,
    status: '验收中',
    progress: 68,
    startDate: '2026-01-02',
    endDate: '',
    milestones: [],
  },
];

describe('ProjectProgressChart', () => {
  beforeEach(() => {
    barChartSpy.mockClear();
  });

  it('在无项目时显示空状态文案', () => {
    render(<ProjectProgressChart projects={[]} />);

    expect(screen.getByText('项目进度概览')).toBeInTheDocument();
    expect(screen.getByText('暂无项目数据')).toBeInTheDocument();
  });

  it('项目数量不超过 5 时，按 10 字符规则截断名称', () => {
    render(<ProjectProgressChart projects={baseProjects} />);

    expect(barChartSpy).toHaveBeenCalledTimes(1);
    const [chartData] = barChartSpy.mock.calls[0] as [Array<{ name: string; fullName: string }>];
    expect(chartData[0].name).toBe('第一项目-超长名称用...');
    expect(chartData[0].fullName).toBe('第一项目-超长名称用于截断');
    expect(chartData[1].name).toBe('第二项目');
  });

  it('点击柱状图时回调对应 projectId', () => {
    const onProjectClick = vi.fn();
    render(<ProjectProgressChart projects={baseProjects} onProjectClick={onProjectClick} />);

    fireEvent.click(screen.getByTestId('bar-click'));
    expect(onProjectClick).toHaveBeenCalledWith(2);
  });
});
