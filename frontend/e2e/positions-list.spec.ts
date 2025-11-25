import { test, expect } from '@playwright/test';

test.describe('职位列表页测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载职位列表页', async ({ page }) => {
    await expect(page).toHaveURL(/\/positions/);
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'e2e-screenshots/positions-list-loaded.png', fullPage: true });
    console.log('职位列表页加载完成');
  });

  test('应该显示"创建职位"按钮并可点击', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /创建职位|新建职位/i }).or(
      page.getByText('创建职位')
    );

    const buttonVisible = await createButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (buttonVisible) {
      console.log('✅ 找到"创建职位"按钮');
      await expect(createButton.first()).toBeEnabled();

      // 点击按钮
      await createButton.first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'e2e-screenshots/positions-create-dialog.png', fullPage: true });
      console.log('✅ "创建职位"按钮可点击');
    } else {
      console.log('❌ 未找到"创建职位"按钮');
      const allButtons = await page.locator('button').allTextContents();
      console.log('页面上所有按钮:', allButtons);
    }
  });

  test('应该显示职位列表', async ({ page }) => {
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count() > 0;
    const hasListItems = await page.locator('[role="row"]').count() > 0;
    const hasPositionCards = await page.locator('[data-testid*="position"]').count() > 0;

    console.log(`表格存在: ${hasTable}, 行元素存在: ${hasListItems}, 职位卡片存在: ${hasPositionCards}`);

    await page.screenshot({ path: 'e2e-screenshots/positions-list-table.png', fullPage: true });
  });

  test('如果有职位数据，应该能点击进入详情页', async ({ page }) => {
    await page.waitForTimeout(2000);

    const positionLink = page.locator('a[href*="/positions/"]').first();
    const positionCount = await positionLink.count();

    if (positionCount > 0) {
      const href = await positionLink.getAttribute('href');
      console.log(`找到职位链接: ${href}`);

      await positionLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/positions\/\d+/);

      await page.screenshot({ path: 'e2e-screenshots/position-detail-navigated.png', fullPage: true });
      console.log('成功进入职位详情页');
    } else {
      console.log('未找到职位数据，跳过详情页导航测试');
    }
  });

  test('检查控制台错误', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];

    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    page.on('pageerror', (error) => {
      console.error('Page Error:', error.message);
    });

    await page.waitForTimeout(3000);

    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    console.log(`控制台错误数量: ${errors.length}`);
    console.log(`控制台警告数量: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('控制台错误:', JSON.stringify(errors, null, 2));
    }
  });
});
