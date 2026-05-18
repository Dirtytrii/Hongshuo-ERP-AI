import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '../../types';
import PermissionsConfigModal, { type PermissionsConfigForm } from './PermissionsConfigModal';

const permissionsConfig: Record<string, string[]> = {
  'projects.view': ['admin'],
  'inventory.create': ['admin', 'clerk'],
};

const permissions: Record<string, string[]> = {
  'projects.view': ['admin'],
  'inventory.create': ['clerk'],
};

const roleLabelMap: Record<string, Role> = {
  admin: { id: 'admin', name: '管理员', label: '管理员' },
  clerk: { id: 'clerk', name: '仓管员', label: '仓管员' },
};

const configForm: PermissionsConfigForm = {
  lowStockThreshold: '100',
  largeExpenseThreshold: '100000',
};

function renderModal(overrides: Partial<ComponentProps<typeof PermissionsConfigModal>> = {}) {
  return render(
    <PermissionsConfigModal
      permissionsConfig={permissionsConfig}
      permissions={permissions}
      roleLabelMap={roleLabelMap}
      configForm={configForm}
      onPermissionChange={vi.fn()}
      onConfigFormChange={vi.fn()}
      onClose={vi.fn()}
      onCancel={vi.fn()}
      onSave={vi.fn()}
      {...overrides}
    />
  );
}

describe('PermissionsConfigModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('按页面权限和功能权限分组渲染', () => {
    renderModal();

    expect(screen.getByText('权限管理')).toBeInTheDocument();
    expect(screen.getByText('页面访问权限')).toBeInTheDocument();
    expect(screen.getByText('项目管理页面')).toBeInTheDocument();
    expect(screen.getByText('功能操作权限')).toBeInTheDocument();
    expect(screen.getByText('创建物料')).toBeInTheDocument();
  });

  it('根据角色权限显示勾选状态', () => {
    renderModal();

    const projectPermission = screen.getByText('项目管理页面').closest('div');
    expect(projectPermission).not.toBeNull();
    expect(within(projectPermission as HTMLElement).getByLabelText('管理员')).toBeChecked();
    expect(within(projectPermission as HTMLElement).getByLabelText('仓管员')).not.toBeChecked();

    const inventoryPermission = screen.getByText('创建物料').closest('div');
    expect(inventoryPermission).not.toBeNull();
    expect(within(inventoryPermission as HTMLElement).getByLabelText('仓管员')).toBeChecked();
  });

  it('勾选角色权限时调用权限变更回调', () => {
    const onPermissionChange = vi.fn();
    renderModal({ onPermissionChange });

    const projectPermission = screen.getByText('项目管理页面').closest('div') as HTMLElement;
    fireEvent.click(within(projectPermission).getByLabelText('仓管员'));

    expect(onPermissionChange).toHaveBeenCalledWith('projects.view', 'clerk', true);
  });

  it('配置输入会写回配置表单', () => {
    const onConfigFormChange = vi.fn();
    renderModal({ onConfigFormChange });

    fireEvent.change(screen.getByLabelText('低库存标准阈值'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('大额财务审批标准（元）'), { target: { value: '200000' } });

    expect(onConfigFormChange).toHaveBeenCalledWith({ ...configForm, lowStockThreshold: '80' });
    expect(onConfigFormChange).toHaveBeenCalledWith({ ...configForm, largeExpenseThreshold: '200000' });
  });

  it('取消、关闭和保存按钮调用对应回调', () => {
    const onClose = vi.fn();
    const onCancel = vi.fn();
    const onSave = vi.fn();
    renderModal({ onClose, onCancel, onSave });

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    fireEvent.click(screen.getByRole('button', { name: '保存所有配置' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
