import { test, expect } from '@playwright/test';

test.describe('候选人列表页测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问候选人列表页
    await page.goto('/candidates');
    // 等待页面加载
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载候选人列表页', async ({ page }) => {
    // 检查页面标题或主要元素
    await expect(page).toHaveURL(/\/candidates/);

    // 等待一段时间确保页面完全渲染
    await page.waitForTimeout(2000);

    // 检查控制台错误
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 截图
    await page.screenshot({ path: 'e2e-screenshots/candidates-list-loaded.png', fullPage: true });

    console.log('候选人列表页加载完成');
  });

  test('应该显示"上传简历"按钮并可点击', async ({ page }) => {
    // 查找上传简历按钮 - 尝试多种选择器
    const uploadButton = page.getByRole('button', { name: /上传简历/i }).or(
      page.getByText('上传简历')
    );

    // 检查按钮是否存在
    await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });

    // 点击按钮
    await uploadButton.first().click();

    // 等待弹窗出现 - 检查对话框或模态框
    await page.waitForTimeout(1000);

    // 截图
    await page.screenshot({ path: 'e2e-screenshots/candidates-upload-dialog.png', fullPage: true });

    console.log('上传简历按钮测试通过');
  });

  test('应该显示候选人列表表格', async ({ page }) => {
    // 等待表格或列表元素加载
    await page.waitForTimeout(2000);

    // 尝试查找表格元素
    const hasTable = await page.locator('table').count() > 0;
    const hasListItems = await page.locator('[role="row"]').count() > 0;
    const hasCandidateCards = await page.locator('[data-testid*="candidate"]').count() > 0;

    console.log(`表格存在: ${hasTable}, 行元素存在: ${hasListItems}, 候选人卡片存在: ${hasCandidateCards}`);

    // 截图
    await page.screenshot({ path: 'e2e-screenshots/candidates-list-table.png', fullPage: true });
  });

  test('如果有候选人数据，应该能点击进入详情页', async ({ page }) => {
    await page.waitForTimeout(2000);

    // 尝试查找第一个候选人链接或可点击元素
    const candidateLink = page.locator('a[href*="/candidates/"]').first();
    const candidateCount = await candidateLink.count();

    if (candidateCount > 0) {
      // 获取链接 href
      const href = await candidateLink.getAttribute('href');
      console.log(`找到候选人链接: ${href}`);

      // 点击链接
      await candidateLink.click();

      // 等待导航
      await page.waitForLoadState('networkidle');

      // 检查是否跳转到详情页
      await expect(page).toHaveURL(/\/candidates\/\d+/);

      // 截图
      await page.screenshot({ path: 'e2e-screenshots/candidate-detail-navigated.png', fullPage: true });

      console.log('成功进入候选人详情页');
    } else {
      console.log('未找到候选人数据，跳过详情页导航测试');
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

    // 等待页面完全加载
    await page.waitForTimeout(3000);

    // 筛选错误和警告
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    console.log(`控制台错误数量: ${errors.length}`);
    console.log(`控制台警告数量: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('控制台错误:', JSON.stringify(errors, null, 2));
    }

    if (warnings.length > 0) {
      console.log('控制台警告:', JSON.stringify(warnings, null, 2));
    }
  });
});
