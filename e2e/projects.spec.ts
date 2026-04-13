import { test, expect, type Page } from '@playwright/test';
import { installApiMocks } from './utils/apiMock';

async function loginAsAdmin(page: Page) {
  await installApiMocks(page, { role: 'admin' });
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
