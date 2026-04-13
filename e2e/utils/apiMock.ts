import type { Page, Route, Request } from '@playwright/test';

export type MockRole = 'admin' | 'clerk';

type Json = unknown;

function json(route: Route, status: number, body: Json) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function safePostJson<T>(request: Request): T | undefined {
  try {
    return request.postDataJSON() as T;
  } catch {
    return undefined;
  }
}

export async function installApiMocks(page: Page, params: { role: MockRole }) {
  const { role } = params;
  const base = '/api';

  const rolePermissions: Record<MockRole, Record<string, string[]>> = {
    admin: {
      'inventory.view': ['admin', 'clerk', 'finance'],
      'finance.view': ['admin', 'finance'],
      'projects.view': ['admin', 'finance'],
      'approval-center.view': ['admin', 'finance', 'pm'],
      'reports.view': ['admin'],
      'ai.view': ['admin', 'finance'],
    },
    clerk: {
      'inventory.view': ['admin', 'clerk', 'finance'],
      'inventory.create': ['admin', 'pm', 'clerk'],
      'inventory.outbound.request': ['clerk'],
    },
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(base, '');
    const method = request.method().toUpperCase();

    // ========== Auth ==========
    if (path === '/auth/login' && method === 'POST') {
      const body = safePostJson<{ username: string; password: string }>(request);
      const username = body?.username ?? (role === 'admin' ? 'admin' : 'clerk');
      return json(route, 200, {
        token: 'e2e-token',
        user: { id: role === 'admin' ? 1 : 2, username, role, enabled: true },
      });
    }
    if (path === '/auth/me' && method === 'GET') {
      return json(route, 200, { id: role === 'admin' ? 1 : 2, username: role, role, enabled: true });
    }

    // ========== Permissions / roles / config ==========
    if (path === '/permissions' && method === 'GET') {
      return json(route, 200, rolePermissions[role]);
    }
    if (path === '/roles' && method === 'GET') {
      return json(route, 200, [
        { id: 1, code: 'admin', name: '管理员', description: '系统管理员', enabled: true },
        { id: 2, code: 'clerk', name: '录入员', description: '基础录入', enabled: true },
      ]);
    }
    if (path === '/config' && method === 'GET') {
      return json(route, 200, { lowStockThreshold: '100', largeExpenseThreshold: '100000' });
    }

    // ========== Core data ==========
    if (path === '/inventory' && method === 'GET') {
      return json(route, 200, []);
    }
    if (path === '/stock' && method === 'GET') {
      // 提供 1 条 pending out，用于消息中心/待审批预警链路
      return json(route, 200, [
        { id: 's1', type: 'out', itemId: 1, qty: 1, price: 1, status: 'pending', date: '2026-03-01', creator: '库管' },
      ]);
    }
    if (path === '/finance' && method === 'GET') {
      return json(route, 200, []);
    }
    if (path === '/projects' && method === 'GET') {
      return json(route, 200, []);
    }
    if (path.startsWith('/dashboard/operation') && method === 'GET') {
      return json(route, 200, { days: 15, metrics: {}, trend: [], financeTrend: [], inventoryTrend: [] });
    }

    // ========== 默认策略：离线优先，未 mock 直接报错 ==========
    return json(route, 500, { error: `missing mock: ${method} ${path}` });
  });
}
