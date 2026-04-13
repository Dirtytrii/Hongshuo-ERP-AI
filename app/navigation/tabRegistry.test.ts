import { describe, expect, it } from 'vitest';
import { canAccessTab, parseInitialTabState } from './tabRegistry';

describe('tabRegistry', () => {
  it('支持从 URL 解析项目页初始状态', () => {
    expect(parseInitialTabState('?tab=projects&id=18')).toEqual({
      tabId: 'projects',
      projectId: 18,
    });
  });

  it('忽略未知 tab', () => {
    expect(parseInitialTabState('?tab=unknown&id=1')).toEqual({});
  });

  it('按 tab 注册源统一判断访问权限', () => {
    expect(
      canAccessTab({
        tabId: 'change-orders',
        currentUserId: 'pm',
        hasPermission: (permission) => permission === 'projects.view',
      })
    ).toBe(true);

    expect(
      canAccessTab({
        tabId: 'roles',
        currentUserId: 'pm',
        hasPermission: () => true,
      })
    ).toBe(false);
  });
});
