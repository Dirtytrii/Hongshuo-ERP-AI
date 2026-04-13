import { test, expect } from '@playwright/test';

type MockRole = 'admin' | 'clerk';

async function installApiMocks(page: import('@playwright/test').Page, role: MockRole) {
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

    // Auth
    if (path === '/auth/login' && request.method() === 'POST') {
      const body = request.postDataJSON?.() as { username: string; password: string } | undefined;
      const username = body?.username ?? (role === 'admin' ? 'admin' : 'clerk');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'e2e-token',
          user: { id: role === 'admin' ? 1 : 2, username, role, enabled: true },
        }),
      });
    }
    if (path === '/auth/me' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: role === 'admin' ? 1 : 2, username: role, role, enabled: true }),
      });
    }

    // Permissions / roles / config
    if (path === '/permissions' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rolePermissions[role]),
      });
    }
    if (path === '/roles' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, code: 'admin', name: '管理员', description: '系统管理员', enabled: true },
          { id: 2, code: 'clerk', name: '录入员', description: '基础录入', enabled: true },
        ]),
      });
    }
    if (path === '/config' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ lowStockThreshold: '100', largeExpenseThreshold: '100000' }),
      });
    }

    // Inventory / stock / finance / projects / dashboard：返回最小可渲染数据，保证壳层与导航可测
    if (path === '/inventory' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (path === '/stock' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 's1',
            type: 'out',
            itemId: 1,
            qty: 1,
            price: 1,
            status: 'pending',
            date: '2026-03-01',
            creator: '库管',
          },
        ]),
      });
    }
    if (path === '/finance' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (path === '/projects' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (path.startsWith('/dashboard/operation') && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ days: 15, metrics: {}, trend: [], financeTrend: [], inventoryTrend: [] }),
      });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
}

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await installApiMocks(page, 'admin');
  await page.goto('/');
  const loginTitle = page.getByRole('heading', { name: '登录' });
  if (await loginTitle.isVisible().catch(() => false)) {
    await page.getByPlaceholder('请输入用户名').fill('admin');
    await page.getByPlaceholder('请输入密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
  }
  // 默认 Tab 可能不是“仪表盘”，以侧栏稳定菜单项作为登录完成标识
  await expect(page.getByText('物料仓库').first()).toBeVisible({ timeout: 10000 });
}

test.describe('App navigation and permissions', () => {
  test('loads and shows sidebar with main nav items', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('项目管理').first()).toBeVisible();
    await expect(page.getByText('物料仓库').first()).toBeVisible();
    await expect(page.getByText('财务收支').first()).toBeVisible();
  });

  test('message center: click alert navigates to target tab', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByTitle('消息通知').click();
    await expect(page.getByText('消息中心').first()).toBeVisible({ timeout: 5000 });

    // 使用种子数据里的待审批出库预警；点击后应跳转到库存相关页
    await page.getByText('待审批出库').first().click();
    await expect(page.getByText(/物料|库存|入库|出库/).first()).toBeVisible({ timeout: 5000 });
  });

  test('permissions: unauthorized shows state and can go back to dashboard', async ({ page }) => {
    await installApiMocks(page, 'clerk');
    // 必须在首次加载时带上 tab 参数，否则应用不会监听后续 URL 变更
    await page.goto('/?tab=projects');
    const loginTitle = page.getByRole('heading', { name: '登录' });
    if (await loginTitle.isVisible().catch(() => false)) {
      await page.getByPlaceholder('请输入用户名').fill('clerk');
      await page.getByPlaceholder('请输入密码').fill('123456');
      await page.getByRole('button', { name: '登录' }).click();
    }
    await expect(page.getByText('物料仓库').first()).toBeVisible({ timeout: 10000 });

    // clerk 无 projects.view 权限：直接访问 projects tab，应展示无权限态
    await expect(page.getByText('无访问权限').first()).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '返回仪表盘' }).click();
    await expect(page.getByText('物料仓库').first()).toBeVisible({ timeout: 5000 });
  });

  test('can switch to 项目管理 and see project list or empty state', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByText('项目管理').first().click();
    await expect(page.getByText(/项目名称|新建项目|暂无项目/).first()).toBeVisible({ timeout: 5000 });
  });

  test('can switch to 物料仓库', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByText('物料仓库').first().click();
    await expect(page.getByText(/物料|库存|入库|出库/).first()).toBeVisible({ timeout: 5000 });
  });

  test('can switch to 财务收支', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByText('财务收支').first().click();
    await expect(page.getByText(/财务|收支|记录/).first()).toBeVisible({ timeout: 5000 });
  });
});
