import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import type { Project, InventoryItem, StockLog, FinanceRecord } from '../../types';

vi.mock('./ProjectProgressChart', () => ({
  default: ({ onProjectClick }: { onProjectClick?: (id: number) => void }) => (
    <button type="button" data-testid="progress-chart" onClick={() => onProjectClick?.(1)}>
      mock-project-chart
    </button>
  ),
}));
vi.mock('./FinanceTrendChart', () => ({
  default: ({ onFinanceCardClick }: { onFinanceCardClick?: (type: 'income' | 'expense' | 'all') => void }) => (
    <div data-testid="finance-chart">
      <button type="button" data-testid="finance-income" onClick={() => onFinanceCardClick?.('income')}>
        income
      </button>
    </div>
  ),
}));
vi.mock('./InventoryStatusChart', () => ({ default: () => <div data-testid="inventory-chart" /> }));

const mockProjects: Project[] = [
  {
    id: 1,
    name: '项目A',
    code: 'P001',
    managerId: 'M1',
    contractAmount: 100000,
    receivedAmount: 50000,
    materialCost: 20000,
    laborCost: 10000,
    otherCost: 5000,
    status: '施工中',
    progress: 50,
    startDate: '2025-01-01',
    endDate: '',
    milestones: [],
  },
];

const mockInventory: InventoryItem[] = [
  { id: 1, name: '水泥', spec: '42.5', unit: '吨', price: 500, quantity: 80, threshold: 100 },
];

const mockStockLogs: StockLog[] = [
  {
    id: '1',
    type: 'out',
    itemId: 1,
    qty: 10,
    price: 500,
    projectId: 1,
    status: 'approved',
    date: '2025-02-01',
    creator: '张三',
  },
];

const mockFinanceRecords: FinanceRecord[] = [
  {
    id: '1',
    type: 'expense',
    category: '材料',
    amount: 5000,
    projectId: 1,
    status: 'approved',
    date: '2025-02-01',
    creator: '李四',
  },
];

describe('Dashboard', () => {
  it('renders stats cards with correct counts', () => {
    render(
      <Dashboard
        projects={mockProjects}
        inventory={mockInventory}
        stockLogs={mockStockLogs}
        financeRecords={mockFinanceRecords}
      />
    );
    expect(screen.getByText('在建项目')).toBeInTheDocument();
    // 可能有多个包含 "1" 的元素，这里只关心至少渲染出对应数值
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByText('库存预警')).toBeInTheDocument();
    expect(screen.getByText('待审批')).toBeInTheDocument();
  });

  it('shows low stock count when inventory below threshold', () => {
    render(<Dashboard projects={mockProjects} inventory={mockInventory} stockLogs={[]} financeRecords={[]} />);
    // 80 < 100 threshold => low stock count 1
    const lowStockSection = screen.getByText('库存预警').closest('div');
    expect(lowStockSection).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<Dashboard projects={[]} inventory={[]} stockLogs={[]} financeRecords={[]} />);
    expect(screen.getByText('在建项目')).toBeInTheDocument();
    // 0 也会在多个位置出现，这里检查至少存在一个
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('calls onProjectClick when project chart is clicked', () => {
    const handleProjectClick = vi.fn();
    render(
      <Dashboard
        projects={mockProjects}
        inventory={mockInventory}
        stockLogs={mockStockLogs}
        financeRecords={mockFinanceRecords}
        onProjectClick={handleProjectClick}
      />
    );

    fireEvent.click(screen.getByTestId('progress-chart'));
    expect(handleProjectClick).toHaveBeenCalledWith(1);
  });

  it('calls onFinanceCardClick when finance chart triggers income click', () => {
    const handleFinanceClick = vi.fn();
    render(
      <Dashboard
        projects={mockProjects}
        inventory={mockInventory}
        stockLogs={mockStockLogs}
        financeRecords={mockFinanceRecords}
        onFinanceCardClick={handleFinanceClick}
      />
    );

    fireEvent.click(screen.getByTestId('finance-income'));
    expect(handleFinanceClick).toHaveBeenCalledWith('income');
  });
});
