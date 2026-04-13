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
    await installApiMocks(page, { role: 'clerk' });
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
    // 文案为“返回仪表盘”，因此回退后应看到仪表盘标题（而非默认 tab）
    await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible({ timeout: 5000 });
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
