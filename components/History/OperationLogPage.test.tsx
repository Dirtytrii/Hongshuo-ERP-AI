import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemLog } from '../../types';
import OperationLogPage from './OperationLogPage';

vi.mock('../ui/SearchableSelect', () => ({
  default: ({
    options,
    value,
    onChange,
  }: {
    options: Array<{ value: string | number; label: string }>;
    value: string | number;
    onChange: (value: string | number) => void;
  }) => (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={String(option.value)} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const oldLog: SystemLog = {
  id: 1,
  time: '2026-05-14T08:00:00Z',
  user: '张三',
  action: '登录',
  detail: '旧日志',
};

const newLog: SystemLog = {
  id: 2,
  time: '2026-05-15T08:00:00Z',
  user: '李四',
  action: '删除',
  detail: '新日志',
};

type Props = ComponentProps<typeof OperationLogPage>;

function buildProps(overrides: Partial<Props> = {}): Props {
  const systemLogs = [oldLog, newLog];

  return {
    systemLogs,
    displayedLogs: systemLogs,
    canDelete: true,
    logFilterUser: '',
    logFilterAction: '',
    onFilterUserChange: vi.fn(),
    onFilterActionChange: vi.fn(),
    onDeleteLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('OperationLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('按时间倒序渲染日志', () => {
    render(<OperationLogPage {...buildProps()} />);

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('新日志')).toBeInTheDocument();
    expect(within(rows[2]).getByText('旧日志')).toBeInTheDocument();
  });

  it('操作人筛选和操作类型筛选会调用对应回调', () => {
    const onFilterUserChange = vi.fn();
    const onFilterActionChange = vi.fn();
    render(<OperationLogPage {...buildProps({ onFilterUserChange, onFilterActionChange })} />);

    const [userSelect, actionSelect] = screen.getAllByRole('combobox');
    fireEvent.change(userSelect, { target: { value: '张三' } });
    fireEvent.change(actionSelect, { target: { value: '删除' } });

    expect(onFilterUserChange).toHaveBeenCalledWith('张三');
    expect(onFilterActionChange).toHaveBeenCalledWith('删除');
  });

  it('canDelete=false 时不显示删除列和删除按钮', () => {
    render(<OperationLogPage {...buildProps({ canDelete: false })} />);

    expect(screen.queryByText('操作')).not.toBeInTheDocument();
    expect(screen.queryByTitle('删除')).not.toBeInTheDocument();
  });

  it('canDelete=true 时点击删除按钮调用 onDeleteLog', () => {
    const onDeleteLog = vi.fn().mockResolvedValue(undefined);
    render(<OperationLogPage {...buildProps({ displayedLogs: [newLog], onDeleteLog })} />);

    fireEvent.click(screen.getByTitle('删除'));

    expect(onDeleteLog).toHaveBeenCalledWith(newLog);
  });

  it('空数据时显示暂无操作日志', () => {
    render(<OperationLogPage {...buildProps({ displayedLogs: [] })} />);

    expect(screen.getByText('暂无操作日志')).toBeInTheDocument();
  });
});
