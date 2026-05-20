import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RejectNoteModal from './RejectNoteModal';

type Props = ComponentProps<typeof RejectNoteModal>;

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    rejectNote: '',
    onRejectNoteChange: vi.fn(),
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
}

describe('RejectNoteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('显示标题、说明和输入占位文案', () => {
    render(<RejectNoteModal {...buildProps()} />);

    expect(screen.getByText('拒绝原因')).toBeInTheDocument();
    expect(screen.getByText('请输入拒绝原因（可选）')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入拒绝原因...')).toBeInTheDocument();
  });

  it('输入拒绝原因时调用输入回调', () => {
    const onRejectNoteChange = vi.fn();
    render(<RejectNoteModal {...buildProps({ rejectNote: '资料不完整', onRejectNoteChange })} />);

    expect(screen.getByLabelText('请输入拒绝原因（可选）')).toHaveValue('资料不完整');

    fireEvent.change(screen.getByLabelText('请输入拒绝原因（可选）'), {
      target: { value: '金额需要重新核对' },
    });

    expect(onRejectNoteChange).toHaveBeenCalledWith('金额需要重新核对');
  });

  it('取消按钮和关闭按钮只调用取消回调', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<RejectNoteModal {...buildProps({ onCancel, onConfirm })} />);

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('确认拒绝按钮只调用确认回调', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<RejectNoteModal {...buildProps({ onCancel, onConfirm })} />);

    fireEvent.click(screen.getByRole('button', { name: '确认拒绝' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
