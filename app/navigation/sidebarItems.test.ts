import { describe, expect, it } from 'vitest';
import { getTabTitle, getVisibleSidebarItems, getVisibleSidebarSections } from './sidebarItems';

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

  it('按业务域输出侧栏分组', () => {
    const sections = getVisibleSidebarSections({
      currentUserId: 'pm',
      hasPermission: (permission) => ['projects.view', 'inventory.view', 'approval-center.view'].includes(permission),
    });

    expect(sections.map((section) => section.label)).toEqual(['经营', '项目', '资源', '协同']);
    expect(sections.find((section) => section.id === 'projects')?.items.map((item) => item.id)).toEqual([
      'projects',
      'change-orders',
    ]);
    expect(sections.find((section) => section.id === 'collaboration')?.items.map((item) => item.id)).toEqual([
      'approval-center',
    ]);
  });

  it('为 tab 提供统一标题映射', () => {
    expect(getTabTitle('approval-center')).toBe('审批中心');
    expect(getTabTitle('unknown')).toBe('工作台');
  });
});
