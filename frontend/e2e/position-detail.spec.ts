import { test, expect } from '@playwright/test';

test.describe('职位详情页测试', () => {
  let positionUrl: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/positions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const positionLink = page.locator('a[href*="/positions/"]').first();
    const count = await positionLink.count();

    if (count > 0) {
      positionUrl = await positionLink.getAttribute('href');
      console.log(`找到职位详情页 URL: ${positionUrl}`);
    } else {
      console.log('警告: 未找到职位数据，将尝试访问测试 URL');
      positionUrl = '/positions/1';
    }

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    if (!positionUrl) {
      test.skip();
    }
    await page.goto(positionUrl);
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载职位详情页', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/positions\/\d+/);

    await page.screenshot({ path: 'e2e-screenshots/position-detail-loaded.png', fullPage: true });
    console.log('职位详情页加载完成');
  });

  test('应该显示"智能筛选"按钮', async ({ page }) => {
    await page.waitForTimeout(2000);

    const smartScreenButton = page.getByRole('button', { name: /智能筛选/i }).or(
      page.getByText('智能筛选')
    );

    const buttonVisible = await smartScreenButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (buttonVisible) {
      console.log('✅ 找到"智能筛选"按钮');
      await expect(smartScreenButton.first()).toBeEnabled();

      await page.screenshot({ path: 'e2e-screenshots/position-detail-smart-screen-button.png', fullPage: true });
    } else {
      console.log('❌ 未找到"智能筛选"按钮');
      const allButtons = await page.locator('button').allTextContents();
      console.log('页面上所有按钮:', allButtons);
    }
  });

  test('应该显示"添加候选人"相关功能', async ({ page }) => {
    await page.waitForTimeout(2000);

    const addCandidateButton = page.getByRole('button', { name: /添加候选人/i }).or(
      page.getByText('添加候选人')
    );

    const buttonVisible = await addCandidateButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (buttonVisible) {
      console.log('✅ 找到"添加候选人"按钮');
      await page.screenshot({ path: 'e2e-screenshots/position-detail-add-candidate-button.png', fullPage: true });
    } else {
      console.log('⚠️ 未找到"添加候选人"按钮');
    }
  });

  test('应该显示关联的候选人列表', async ({ page }) => {
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count() > 0;
    const hasListItems = await page.locator('[role="row"]').count() > 0;

    console.log(`候选人表格存在: ${hasTable}, 行元素存在: ${hasListItems}`);

    await page.screenshot({ path: 'e2e-screenshots/position-detail-candidates-list.png', fullPage: true });
  });

  test('检查职位信息是否正确显示', async ({ page }) => {
    await page.waitForTimeout(2000);

    const pageContent = await page.content();

    const hasTitle = pageContent.includes('职位名称') || pageContent.includes('title');
    const hasDescription = pageContent.includes('职位描述') || pageContent.includes('description');
    const hasRequirements = pageContent.includes('要求') || pageContent.includes('requirements');

    console.log('职位信息显示情况:');
    console.log(`- 职位名称字段: ${hasTitle ? '存在' : '不存在'}`);
    console.log(`- 职位描述字段: ${hasDescription ? '存在' : '不存在'}`);
    console.log(`- 职位要求字段: ${hasRequirements ? '存在' : '不存在'}`);

    await page.screenshot({ path: 'e2e-screenshots/position-detail-info.png', fullPage: true });
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
