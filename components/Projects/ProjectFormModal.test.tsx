import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../types';
import ProjectFormModal, { type ProjectFormValues } from './ProjectFormModal';

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

const defaultForm: ProjectFormValues = {
  name: '宏硕总部改造',
  code: 'P-001',
  managerId: 'pm',
  contractAmount: 1200000,
  receivedAmount: 300000,
  materialCost: 100000,
  laborCost: 80000,
  otherCost: 20000,
  totalBudget: 900000,
  status: '施工中',
  progress: 35,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
};

const editingProject: Project = {
  id: 1,
  ...defaultForm,
  totalBudget: 900000,
  milestones: [],
};

type Props = ComponentProps<typeof ProjectFormModal>;

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    projectForm: defaultForm,
    editingProject: null,
    userOptions: [
      { id: 1, username: 'pm' },
      { id: 2, username: 'finance' },
    ],
    onProjectFormChange: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

describe('ProjectFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('根据是否编辑显示新建或编辑标题与提交按钮文案', () => {
    const { rerender } = render(<ProjectFormModal {...buildProps()} />);

    expect(screen.getByText('新建项目')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建' })).toBeInTheDocument();

    rerender(<ProjectFormModal {...buildProps({ editingProject })} />);

    expect(screen.getByText('编辑项目')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });

  it('编辑项目时项目编号输入禁用', () => {
    render(<ProjectFormModal {...buildProps({ editingProject })} />);

    expect(screen.getByLabelText('项目编号 *')).toBeDisabled();
  });

  it('项目经理和项目状态选择会写回表单', () => {
    const onProjectFormChange = vi.fn();
    render(<ProjectFormModal {...buildProps({ onProjectFormChange })} />);

    fireEvent.change(screen.getByLabelText('请选择用户...'), { target: { value: 'finance' } });
    fireEvent.change(screen.getByLabelText('请选择状态...'), { target: { value: '验收中' } });

    expect(onProjectFormChange).toHaveBeenCalledWith({ ...defaultForm, managerId: 'finance' });
    expect(onProjectFormChange).toHaveBeenCalledWith({ ...defaultForm, status: '验收中' });
  });

  it('控制预算空值和数字都会按原语义写回', () => {
    const onProjectFormChange = vi.fn();
    render(<ProjectFormModal {...buildProps({ onProjectFormChange })} />);

    fireEvent.change(screen.getByLabelText('控制预算（可选）'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('控制预算（可选）'), { target: { value: '500000' } });

    expect(onProjectFormChange).toHaveBeenCalledWith({ ...defaultForm, totalBudget: '' });
    expect(onProjectFormChange).toHaveBeenCalledWith({ ...defaultForm, totalBudget: 500000 });
  });

  it('展示只读财务和进度字段', () => {
    render(<ProjectFormModal {...buildProps()} />);

    expect(screen.getByText('￥300,000（由财务收入审批自动汇总）')).toBeInTheDocument();
    expect(screen.getByText('35%（由里程碑自动计算，请在项目详情中维护里程碑）')).toBeInTheDocument();
    expect(screen.getByText('￥100,000（由财务支出审批自动汇总）')).toBeInTheDocument();
    expect(screen.getByText('￥80,000（由财务支出审批自动汇总）')).toBeInTheDocument();
    expect(screen.getByText('￥20,000（由财务支出审批自动汇总）')).toBeInTheDocument();
  });

  it('取消按钮和关闭按钮会调用关闭回调', () => {
    const onClose = vi.fn();
    render(<ProjectFormModal {...buildProps({ onClose })} />);

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('创建和更新按钮会调用提交回调', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<ProjectFormModal {...buildProps({ onSubmit })} />);

    fireEvent.click(screen.getByRole('button', { name: '创建' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(<ProjectFormModal {...buildProps({ editingProject, onSubmit })} />);
    fireEvent.click(screen.getByRole('button', { name: '更新' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
