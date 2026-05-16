import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InventoryItem, Project } from '../../types';
import StockMovementModal from './StockMovementModal';

vi.mock('../ui/SearchableSelect', () => ({
  default: ({
    options,
    value,
    onChange,
    placeholder,
  }: {
    options: Array<{ value: string | number; label: string }>;
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
  }) => (
    <select aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={String(option.value)} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const inventory: InventoryItem[] = [
  {
    id: 1,
    name: '水泥',
    spec: '50kg/袋',
    unit: '袋',
    price: 28,
    quantity: 100,
    threshold: 20,
  },
  {
    id: 2,
    name: '钢筋',
    spec: 'HRB400',
    unit: '吨',
    price: 4200,
    quantity: 30,
    threshold: 5,
  },
];

const projects: Project[] = [
  {
    id: 10,
    name: '云端大厦',
    code: 'P-001',
    managerId: 'pm',
    contractAmount: 1000000,
    receivedAmount: 500000,
    materialCost: 100000,
    laborCost: 50000,
    otherCost: 20000,
    status: '施工中',
    progress: 50,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    milestones: [],
  },
];

type Props = ComponentProps<typeof StockMovementModal>;

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    type: 'in',
    inventory,
    projects,
    suppliers: [{ id: 100, name: '宏硕供应商' }],
    selectedItemId: 1,
    stockAmount: 3,
    targetProjectId: 10,
    stockSupplierId: null,
    onSelectedItemIdChange: vi.fn(),
    onStockAmountChange: vi.fn(),
    onTargetProjectIdChange: vi.fn(),
    onStockSupplierIdChange: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

describe('StockMovementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('入库模式显示供应商选择和确认入库', () => {
    const onSubmit = vi.fn();
    render(<StockMovementModal {...buildProps({ onSubmit })} />);

    expect(screen.getByText('物料入库登记')).toBeInTheDocument();
    expect(screen.getByText('供应商（可选）')).toBeInTheDocument();
    expect(screen.queryByText('关联项目')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '确认入库' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('出库模式显示关联项目和确认出库', () => {
    const onSubmit = vi.fn();
    render(<StockMovementModal {...buildProps({ type: 'out', onSubmit })} />);

    expect(screen.getByText('物料出库申请')).toBeInTheDocument();
    expect(screen.getByText('关联项目')).toBeInTheDocument();
    expect(screen.queryByText('供应商（可选）')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '确认出库' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('物料选择和数量输入会调用对应回调', () => {
    const onSelectedItemIdChange = vi.fn();
    const onStockAmountChange = vi.fn();
    render(<StockMovementModal {...buildProps({ onSelectedItemIdChange, onStockAmountChange })} />);

    fireEvent.change(screen.getByLabelText('请选择或输入检索物料...'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('请输入数量...'), { target: { value: '12' } });

    expect(onSelectedItemIdChange).toHaveBeenCalledWith(2);
    expect(onStockAmountChange).toHaveBeenCalledWith(12);
  });

  it('取消按钮和关闭按钮会调用关闭回调', () => {
    const onClose = vi.fn();
    render(<StockMovementModal {...buildProps({ onClose })} />);

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
