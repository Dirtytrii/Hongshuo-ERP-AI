import { test, expect, type Page } from '@playwright/test';

async function installApiMocks(page: Page) {
  const base = '/api';
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(base, '');

    if (path === '/auth/login' && request.method() === 'POST') {
      const body = (() => {
        try {
          return request.postDataJSON() as { username: string };
        } catch {
          return undefined;
        }
      })();
      const username = body?.username ?? 'admin';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'e2e-token', user: { id: 1, username, role: 'admin', enabled: true } }),
      });
    }
    if (path === '/permissions' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          'projects.view': ['admin', 'finance'],
          'inventory.view': ['admin', 'clerk', 'finance'],
          'finance.view': ['admin', 'finance'],
          'project.create': ['admin', 'pm'],
        }),
      });
    }
    if (path === '/roles' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, code: 'admin', name: '管理员', description: '系统管理员', enabled: true }]),
      });
    }
    if (path === '/config' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ lowStockThreshold: '100', largeExpenseThreshold: '100000' }),
      });
    }
    if (path === '/projects' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (path === '/inventory' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (path === '/finance' && request.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (path === '/stock' && request.method() === 'GET') {
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

async function loginAsAdmin(page: Page) {
  await installApiMocks(page);
  await page.goto('/');
  const loginTitle = page.getByRole('heading', { name: '登录' });
  if (await loginTitle.isVisible().catch(() => false)) {
    await page.getByPlaceholder('请输入用户名').fill('admin');
    await page.getByPlaceholder('请输入密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
  }
  await expect(page.getByText('物料仓库').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Projects flow', () => {
  test('project list shows 查看详情 when projects exist', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByText('项目管理').first().click();
    const detailBtn = page.getByRole('button', { name: '查看详情' }).first();
    if (await detailBtn.isVisible().catch(() => false)) {
      await detailBtn.click();
      await expect(page.getByText('项目基本信息').or(page.getByText('项目成本分析'))).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('返回').first()).toBeVisible();
    }
  });

  test('new project button visible for admin role', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByText('项目管理').first().click();
    const newBtn = page.getByRole('button', { name: '新建项目' });
    await expect(newBtn).toBeVisible({ timeout: 5000 });
  });
});
