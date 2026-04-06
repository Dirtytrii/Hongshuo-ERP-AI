import { describe, expect, it } from 'vitest';
import { getVisibleSidebarItems } from './sidebarItems';

describe('getVisibleSidebarItems', () => {
  it('管理员可见 adminOnly 菜单', () => {
    const items = getVisibleSidebarItems({
      currentUserId: 'admin',
      hasPermission: () => true,
    });

    const ids = items.map((i) => i.id);
    expect(ids).toContain('users');
    expect(ids).toContain('roles');
    expect(ids).toContain('permissions');
  });

  it('非管理员不可见 adminOnly 菜单，且按权限过滤', () => {
    const items = getVisibleSidebarItems({
      currentUserId: 'pm',
      hasPermission: (permission) => permission === 'projects.view' || permission === 'inventory.view',
    });

    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('users');
    expect(ids).not.toContain('roles');
    expect(ids).not.toContain('permissions');
    expect(ids).toContain('projects');
    expect(ids).toContain('inventory');
    expect(ids).not.toContain('finance');
  });
});
