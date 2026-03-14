import { test, expect } from '@playwright/test';

test.describe('Projects flow', () => {
  test('project list shows 查看详情 when projects exist', async ({ page }) => {
    await page.goto('/');
    await page.getByText('项目管理').first().click();
    const detailBtn = page.getByRole('button', { name: '查看详情' }).first();
    if (await detailBtn.isVisible().catch(() => false)) {
      await detailBtn.click();
      await expect(page.getByText('项目基本信息').or(page.getByText('项目成本分析'))).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('返回').first()).toBeVisible();
    }
  });

  test('new project button visible for admin role', async ({ page }) => {
    await page.goto('/');
    await page.getByText('项目管理').first().click();
    const newBtn = page.getByRole('button', { name: '新建项目' });
    await expect(newBtn).toBeVisible({ timeout: 5000 });
  });
});
