import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Department, Project } from '../../types';
import FinanceRecordModal, { type FinanceRecordForm } from './FinanceRecordModal';

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

const defaultForm: FinanceRecordForm = {
  type: 'expense',
  category: '材料采购',
  amount: 1000,
  projectId: null,
  departmentId: null,
  paymentPlanItemId: null,
  supplierId: null,
  desc: '',
};

const projects: Project[] = [
  {
    id: 1,
    name: '云端大厦',
    code: 'P-001',
    managerId: 'pm',
    contractAmount: 1000000,
    receivedAmount: 200000,
    materialCost: 100000,
    laborCost: 50000,
    otherCost: 20000,
    status: '施工中',
    progress: 45,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    milestones: [],
  },
  {
    id: 2,
    name: '商业中心',
    code: 'P-002',
    managerId: 'pm',
    contractAmount: 800000,
    receivedAmount: 100000,
    materialCost: 80000,
    laborCost: 40000,
    otherCost: 10000,
    status: '施工中',
    progress: 20,
    startDate: '2026-02-01',
    endDate: '2026-10-31',
    milestones: [],
  },
];

const departments: Department[] = [
  {
    id: 10,
    name: '工程部',
    code: 'ENG',
  },
];

type Props = ComponentProps<typeof FinanceRecordModal>;

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    financeForm: defaultForm,
    financeCategories: [
      { code: '材料采购', label: '材料采购', costType: 'material' },
      { code: '人工支出', label: '人工支出', costType: 'labor' },
    ],
    paymentPlanOptionsForFinance: [{ id: 100, name: '首期款' }],
    projects,
    departments,
    suppliers: [{ id: 200, name: '宏硕供应商' }],
    onFinanceFormChange: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

describe('FinanceRecordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('默认支出模式显示标题、类别并支持创建', () => {
    const onSubmit = vi.fn();
    render(<FinanceRecordModal {...buildProps({ onSubmit })} />);

    expect(screen.getByText('新增财务记录')).toBeInTheDocument();
    expect(screen.getByText('类别')).toBeInTheDocument();
    expect(screen.getByLabelText('请选择类别...')).toHaveValue('材料采购');

    fireEvent.click(screen.getByRole('button', { name: '创建' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('切换收入时同步写回默认收入类别', () => {
    const onFinanceFormChange = vi.fn();
    render(<FinanceRecordModal {...buildProps({ onFinanceFormChange })} />);

    fireEvent.change(screen.getByLabelText('请选择类型...'), { target: { value: 'income' } });

    expect(onFinanceFormChange).toHaveBeenCalledWith({
      ...defaultForm,
      type: 'income',
      category: '项目收款',
    });
  });

  it('收入且已关联项目时显示回款计划节点', () => {
    render(
      <FinanceRecordModal
        {...buildProps({
          financeForm: { ...defaultForm, type: 'income', category: '项目收款', projectId: 1 },
        })}
      />
    );

    expect(screen.getByText('计入回款计划节点（可选）')).toBeInTheDocument();
    expect(screen.getByLabelText('请选择回款节点...')).toBeInTheDocument();
  });

  it('选择项目会写回项目 id 并清空回款计划节点', () => {
    const onFinanceFormChange = vi.fn();
    const financeForm: FinanceRecordForm = {
      ...defaultForm,
      type: 'income',
      category: '项目收款',
      projectId: 1,
      paymentPlanItemId: 100,
    };
    render(<FinanceRecordModal {...buildProps({ financeForm, onFinanceFormChange })} />);

    fireEvent.change(screen.getByLabelText('请选择或检索项目...'), { target: { value: '2' } });

    expect(onFinanceFormChange).toHaveBeenCalledWith({
      ...financeForm,
      projectId: 2,
      paymentPlanItemId: null,
    });
  });

  it('供应商和部门空值会写回 null', () => {
    const onFinanceFormChange = vi.fn();
    const financeForm: FinanceRecordForm = {
      ...defaultForm,
      departmentId: 10,
      supplierId: 200,
    };
    render(<FinanceRecordModal {...buildProps({ financeForm, onFinanceFormChange })} />);

    fireEvent.change(screen.getByLabelText('请选择或检索部门...'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('请选择或检索供应商...'), { target: { value: '' } });

    expect(onFinanceFormChange).toHaveBeenCalledWith({ ...financeForm, departmentId: null });
    expect(onFinanceFormChange).toHaveBeenCalledWith({ ...financeForm, supplierId: null });
  });

  it('取消按钮和关闭按钮会调用关闭回调', () => {
    const onClose = vi.fn();
    render(<FinanceRecordModal {...buildProps({ onClose })} />);

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
