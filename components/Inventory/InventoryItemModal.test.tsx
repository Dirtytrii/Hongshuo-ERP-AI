import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InventoryItem } from '../../types';
import InventoryItemModal, { type InventoryItemForm } from './InventoryItemModal';

const defaultForm: InventoryItemForm = {
  name: '水泥',
  spec: '50kg/袋',
  unit: '袋',
  price: 28.5,
  quantity: 100,
  threshold: 20,
};

const editingInventoryItem: InventoryItem = {
  id: 1,
  ...defaultForm,
};

type Props = ComponentProps<typeof InventoryItemModal>;

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    inventoryForm: defaultForm,
    editingInventoryItem: null,
    onInventoryFormChange: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

describe('InventoryItemModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('根据是否编辑显示新建或编辑标题', () => {
    const { rerender } = render(<InventoryItemModal {...buildProps()} />);

    expect(screen.getByText('新建物料')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建' })).toBeInTheDocument();

    rerender(<InventoryItemModal {...buildProps({ editingInventoryItem })} />);

    expect(screen.getByText('编辑物料')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });

  it('显示字段值并在输入时回传更新后的表单', () => {
    const onInventoryFormChange = vi.fn();
    render(<InventoryItemModal {...buildProps({ onInventoryFormChange })} />);

    expect(screen.getByLabelText('物料名称 *')).toHaveValue('水泥');
    expect(screen.getByLabelText('规格参数 *')).toHaveValue('50kg/袋');
    expect(screen.getByLabelText('单位 *')).toHaveValue('袋');
    expect(screen.getByLabelText('参考单价（元）')).toHaveValue(28.5);
    expect(screen.getByLabelText('初始库存数量')).toHaveValue(100);
    expect(screen.getByLabelText('低库存预警阈值 *')).toHaveValue(20);

    fireEvent.change(screen.getByLabelText('物料名称 *'), { target: { value: '钢筋' } });
    fireEvent.change(screen.getByLabelText('规格参数 *'), { target: { value: 'HRB400' } });
    fireEvent.change(screen.getByLabelText('单位 *'), { target: { value: '吨' } });
    fireEvent.change(screen.getByLabelText('参考单价（元）'), { target: { value: '4200' } });
    fireEvent.change(screen.getByLabelText('初始库存数量'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('低库存预警阈值 *'), { target: { value: '5' } });

    expect(onInventoryFormChange).toHaveBeenNthCalledWith(1, { ...defaultForm, name: '钢筋' });
    expect(onInventoryFormChange).toHaveBeenNthCalledWith(2, { ...defaultForm, spec: 'HRB400' });
    expect(onInventoryFormChange).toHaveBeenNthCalledWith(3, { ...defaultForm, unit: '吨' });
    expect(onInventoryFormChange).toHaveBeenNthCalledWith(4, { ...defaultForm, price: 4200 });
    expect(onInventoryFormChange).toHaveBeenNthCalledWith(5, { ...defaultForm, quantity: 30 });
    expect(onInventoryFormChange).toHaveBeenNthCalledWith(6, { ...defaultForm, threshold: 5 });
  });

  it('低库存预警阈值旁的单位跟随表单单位变化', () => {
    const { rerender } = render(<InventoryItemModal {...buildProps()} />);

    expect(screen.getByText('袋')).toBeInTheDocument();

    rerender(<InventoryItemModal {...buildProps({ inventoryForm: { ...defaultForm, unit: '吨' } })} />);
    expect(screen.getByText('吨')).toBeInTheDocument();

    rerender(<InventoryItemModal {...buildProps({ inventoryForm: { ...defaultForm, unit: '' } })} />);
    expect(screen.getByText('单位')).toBeInTheDocument();
  });

  it('取消按钮和关闭按钮会调用关闭回调', () => {
    const onClose = vi.fn();
    render(<InventoryItemModal {...buildProps({ onClose })} />);

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('点击保存按钮会调用提交回调', () => {
    const onSubmit = vi.fn();
    render(<InventoryItemModal {...buildProps({ onSubmit })} />);

    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
