import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryReport from './InventoryReport';
import type { InventoryItem, StockLog, Project } from '../../types';

const exportMock = vi.fn();

vi.mock('../../utils/export', () => ({
  exportLowStockToExcel: (...args: unknown[]) => exportMock(...args),
}));

const inventory: InventoryItem[] = [
  { id: 1, name: '水泥', spec: '42.5', unit: '吨', price: 500, quantity: 10, threshold: 20 },
  { id: 2, name: '砂石', spec: '中砂', unit: '吨', price: 80, quantity: 50, threshold: 20 },
];

const projects: Project[] = [
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
  {
    id: 2,
    name: '项目B',
    code: 'P002',
    managerId: 'M2',
    contractAmount: 80000,
    receivedAmount: 30000,
    materialCost: 15000,
    laborCost: 8000,
    otherCost: 4000,
    status: '施工中',
    progress: 40,
    startDate: '2025-02-01',
    endDate: '',
    milestones: [],
  },
];

const stockLogs: StockLog[] = [
  {
    id: '1',
    type: 'out',
    itemId: 1,
    qty: 5,
    price: 500,
    projectId: 1,
    status: 'active',
    date: '2025-02-01',
    creator: '张三',
  },
  {
    id: '2',
    type: 'out',
    itemId: 2,
    qty: 3,
    price: 80,
    projectId: 2,
    status: 'active',
    date: '2025-02-02',
    creator: '李四',
  },
];

describe('InventoryReport', () => {
  beforeEach(() => {
    exportMock.mockReset();
  });

  it('按 projectId 过滤时，仅显示对应项目的出库汇总', () => {
    render(<InventoryReport inventory={inventory} stockLogs={stockLogs} projects={projects} projectId={1} />);

    expect(screen.getByText('项目A')).toBeInTheDocument();
    expect(screen.queryByText('项目B')).not.toBeInTheDocument();
  });

  it('点击“导出 Excel”时，仅导出低库存物料列表', () => {
    render(<InventoryReport inventory={inventory} stockLogs={stockLogs} projects={projects} />);

    const exportButton = screen.getByText('导出 Excel');
    fireEvent.click(exportButton);

    expect(exportMock).toHaveBeenCalledTimes(1);
    const [arg] = exportMock.mock.calls[0];
    expect(Array.isArray(arg)).toBe(true);
    const list = arg as Array<{ name: string; quantity: number }>;
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('水泥');
  });
});
