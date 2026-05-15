import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserManagementPage from './UserManagementPage';

type Props = ComponentProps<typeof UserManagementPage>;

const users: Props['users'] = [
  {
    id: 1,
    username: 'zhangsan',
    role: 'admin',
    enabled: true,
  },
  {
    id: 2,
    username: 'lisi',
    role: 'warehouse',
    enabled: false,
  },
  {
    id: 3,
    username: 'wangwu',
    role: 'finance',
    enabled: true,
  },
];

const roleLabels: Record<string, string> = {
  admin: '管理员',
  warehouse: '仓库主管',
  finance: '财务专员',
};

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    users,
    search: '',
    getRoleLabel: (role) => roleLabels[role] ?? role,
    onSearchChange: vi.fn(),
    onCreateUser: vi.fn(),
    onEditUser: vi.fn(),
    onDeleteUser: vi.fn(),
    ...overrides,
  };
}

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染用户列表、角色标签和启用禁用状态', () => {
    render(<UserManagementPage {...buildProps()} />);

    expect(screen.getByText('zhangsan')).toBeInTheDocument();
    expect(screen.getByText('lisi')).toBeInTheDocument();
    expect(screen.getByText('wangwu')).toBeInTheDocument();
    expect(screen.getByText('管理员')).toBeInTheDocument();
    expect(screen.getByText('仓库主管')).toBeInTheDocument();
    expect(screen.getByText('财务专员')).toBeInTheDocument();
    expect(screen.getAllByText('启用')).toHaveLength(2);
    expect(screen.getByText('禁用')).toBeInTheDocument();
  });

  it('输入搜索词时通知父组件，并可按用户名过滤列表', () => {
    const onSearchChange = vi.fn();
    const { rerender } = render(<UserManagementPage {...buildProps({ onSearchChange })} />);

    fireEvent.change(screen.getByPlaceholderText('搜索用户名或角色...'), { target: { value: 'lisi' } });
    expect(onSearchChange).toHaveBeenCalledWith('lisi');

    rerender(<UserManagementPage {...buildProps({ search: 'lisi', onSearchChange })} />);
    expect(screen.getByText('lisi')).toBeInTheDocument();
    expect(screen.queryByText('zhangsan')).not.toBeInTheDocument();
    expect(screen.queryByText('wangwu')).not.toBeInTheDocument();
  });

  it('可按角色标签过滤列表', () => {
    render(<UserManagementPage {...buildProps({ search: '财务' })} />);

    expect(screen.getByText('wangwu')).toBeInTheDocument();
    expect(screen.getByText('财务专员')).toBeInTheDocument();
    expect(screen.queryByText('zhangsan')).not.toBeInTheDocument();
    expect(screen.queryByText('lisi')).not.toBeInTheDocument();
  });

  it('点击新建、编辑、删除时调用对应回调', () => {
    const onCreateUser = vi.fn();
    const onEditUser = vi.fn();
    const onDeleteUser = vi.fn();
    render(<UserManagementPage {...buildProps({ onCreateUser, onEditUser, onDeleteUser })} />);

    fireEvent.click(screen.getByRole('button', { name: /新建用户/ }));
    expect(onCreateUser).toHaveBeenCalledTimes(1);

    const lisiRow = screen.getByText('lisi').closest('tr');
    expect(lisiRow).not.toBeNull();

    fireEvent.click(within(lisiRow as HTMLTableRowElement).getByTitle('编辑'));
    expect(onEditUser).toHaveBeenCalledWith(users[1]);

    fireEvent.click(within(lisiRow as HTMLTableRowElement).getByTitle('删除'));
    expect(onDeleteUser).toHaveBeenCalledWith(users[1]);
  });

  it('空列表显示暂无用户', () => {
    render(<UserManagementPage {...buildProps({ users: [] })} />);

    expect(screen.getByText('暂无用户')).toBeInTheDocument();
  });
});
