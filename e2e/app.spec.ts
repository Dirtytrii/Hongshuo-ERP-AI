import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/');
  const loginTitle = page.getByRole('heading', { name: '登录' });
  if (await loginTitle.isVisible().catch(() => false)) {
    await page.getByPlaceholder('请输入用户名').fill('admin');
    await page.getByPlaceholder('请输入密码').fill('admin');
    await page.getByRole('button', { name: '登录' }).click();
  }
  await expect(page.getByText('仪表盘').first()).toBeVisible({ timeout: 10000 });
}

test.describe('App navigation and permissions', () => {
  test('loads and shows sidebar with main nav items', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('项目管理').first()).toBeVisible();
    await expect(page.getByText('物料仓库').first()).toBeVisible();
    await expect(page.getByText('财务收支').first()).toBeVisible();
  });

  test('can switch to 项目管理 and see project list or empty state', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByText('项目管理').first().click();
    await expect(
      page
        .getByText('项目列表')
        .or(page.getByText('暂无项目'))
        .or(page.getByRole('button', { name: '新建项目' }))
    ).toBeVisible({ timeout: 5000 });
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
