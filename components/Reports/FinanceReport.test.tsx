import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import FinanceReport from './FinanceReport';
import type { FinanceRecord } from '../../types';

const exportMock = vi.fn();

vi.mock('../../utils/export', () => ({
  exportFinanceDetailToExcel: (...args: unknown[]) => exportMock(...args),
}));

const baseRecords: FinanceRecord[] = [
  {
    id: '1',
    type: 'income',
    category: '合同款',
    amount: 100000,
    projectId: 1,
    status: 'approved',
    date: '2025-01-05',
    creator: '财务',
  },
  {
    id: '2',
    type: 'expense',
    category: '材料',
    amount: 30000,
    projectId: 1,
    status: 'approved',
    date: '2025-01-10',
    creator: '财务',
    // 额外字段：成本类型，组件内部通过类型断言读取
    // @ts-expect-error extra field for test
    costType: 'material',
  },
  {
    id: '3',
    type: 'expense',
    category: '材料',
    amount: 5000,
    projectId: 2,
    status: 'pending',
    date: '2025-01-15',
    creator: '财务',
  },
];

describe('FinanceReport', () => {
  it('汇总只统计已审批记录，并正确显示收入/支出/净额', () => {
    render(<FinanceReport financeRecords={baseRecords} />);
    expect(screen.getByText('财务报表')).toBeInTheDocument();
    // 只统计 status === approved 的前两条：收入 100000，支出 30000，净 70000
    expect(screen.getByText(/收入 ￥100,000 · 支出 ￥30,000 · 净 ￥70,000/)).toBeInTheDocument();
  });

  it('按 projectId 过滤时，仅显示对应项目记录', () => {
    render(<FinanceReport financeRecords={baseRecords} projectId={1} />);
    // “按项目汇总”表格中只应包含 projectId 1
    const summaryHeading = screen.getByText('按项目汇总');
    const summarySection = summaryHeading.closest('div');
    expect(summarySection).toBeInTheDocument();
    const summaryTable = within(summarySection as HTMLElement).getByRole('table');
    const cellsInSummary = within(summaryTable).getAllByRole('cell');
    expect(cellsInSummary.some((cell) => cell.textContent === '1')).toBe(true);
    expect(cellsInSummary.some((cell) => cell.textContent === '2')).toBe(false);

    // 明细表中 projectId 2 的记录也应被过滤掉（页面上不再出现“2”作为项目ID）
    expect(screen.queryAllByText('2').length).toBe(0);
  });

  it('在无记录时显示 “暂无记录”', () => {
    render(<FinanceReport financeRecords={[]} />);
    expect(screen.getByText('暂无记录')).toBeInTheDocument();
  });

  it('明细状态显示中文徽标，不暴露英文枚举值', () => {
    render(<FinanceReport financeRecords={baseRecords} />);

    expect(screen.getAllByText('已审批')).toHaveLength(2);
    expect(screen.queryByText('approved')).not.toBeInTheDocument();
  });

  it('点击“导出 Excel”时，调用导出函数并传入当前筛选结果', () => {
    exportMock.mockReset();
    render(<FinanceReport financeRecords={baseRecords} />);

    fireEvent.click(screen.getByText('导出 Excel'));

    expect(exportMock).toHaveBeenCalledTimes(1);
    const [arg] = exportMock.mock.calls[0];
    // 只会导出 status === approved 的两条
    expect(Array.isArray(arg)).toBe(true);
    expect((arg as unknown[]).length).toBe(2);
  });
});
