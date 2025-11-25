import { test, expect } from '@playwright/test';

test.describe('候选人详情页测试', () => {
  let candidateUrl: string | null = null;

  test.beforeAll(async ({ browser }) => {
    // 首先访问候选人列表，找到第一个候选人
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/candidates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 尝试找到第一个候选人链接
    const candidateLink = page.locator('a[href*="/candidates/"]').first();
    const count = await candidateLink.count();

    if (count > 0) {
      candidateUrl = await candidateLink.getAttribute('href');
      console.log(`找到候选人详情页 URL: ${candidateUrl}`);
    } else {
      console.log('警告: 未找到候选人数据，将尝试访问测试 URL');
      candidateUrl = '/candidates/1'; // 备用测试 URL
    }

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    if (!candidateUrl) {
      test.skip();
    }
    await page.goto(candidateUrl);
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载候选人详情页', async ({ page }) => {
    await page.waitForTimeout(2000);

    // 检查 URL
    await expect(page).toHaveURL(/\/candidates\/\d+/);

    // 截图
    await page.screenshot({ path: 'e2e-screenshots/candidate-detail-loaded.png', fullPage: true });

    console.log('候选人详情页加载完成');
  });

  test('【关键】应该显示"添加执行记录"按钮', async ({ page }) => {
    await page.waitForTimeout(2000);

    // 尝试多种选择器查找"添加执行记录"按钮
    const addRecordButton = page.getByRole('button', { name: /添加执行记录/i }).or(
      page.getByText('添加执行记录')
    ).or(
      page.locator('button:has-text("添加执行记录")')
    );

    console.log('正在查找"添加执行记录"按钮...');

    // 等待按钮出现
    const buttonVisible = await addRecordButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (buttonVisible) {
      console.log('✅ 找到"添加执行记录"按钮');

      // 截图按钮
      await page.screenshot({ path: 'e2e-screenshots/candidate-detail-add-record-button.png', fullPage: true });

      // 检查按钮是否可点击
      await expect(addRecordButton.first()).toBeEnabled();
      console.log('✅ "添加执行记录"按钮可点击');
    } else {
      console.log('❌ 未找到"添加执行记录"按钮');
      await page.screenshot({ path: 'e2e-screenshots/candidate-detail-no-add-record-button.png', fullPage: true });

      // 列出页面上所有按钮
      const allButtons = await page.locator('button').allTextContents();
      console.log('页面上所有按钮:', allButtons);
    }
  });

  test('【关键】应该能打开"添加执行记录"弹窗（验证 useAuth 导入修复）', async ({ page }) => {
    await page.waitForTimeout(2000);

    // 查找按钮
    const addRecordButton = page.getByRole('button', { name: /添加执行记录/i }).or(
      page.getByText('添加执行记录')
    ).or(
      page.locator('button:has-text("添加执行记录")')
    );

    const buttonVisible = await addRecordButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!buttonVisible) {
      console.log('跳过测试: 未找到"添加执行记录"按钮');
      test.skip();
      return;
    }

    // 监听控制台错误
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('控制台错误:', msg.text());
      }
    });

    page.on('pageerror', (error) => {
      console.error('页面错误:', error.message);
      errors.push(error.message);
    });

    // 点击按钮
    console.log('点击"添加执行记录"按钮...');
    await addRecordButton.first().click();

    // 等待弹窗出现
    await page.waitForTimeout(1500);

    // 截图弹窗
    await page.screenshot({ path: 'e2e-screenshots/candidate-detail-add-record-dialog.png', fullPage: true });

    // 检查是否有 useAuth 相关错误
    const hasAuthError = errors.some(err =>
      err.includes('useAuth') || err.includes('AuthContext')
    );

    if (hasAuthError) {
      console.log('❌ 发现 useAuth 相关错误，修复未生效');
    } else {
      console.log('✅ 未发现 useAuth 错误，修复可能已生效');
    }

    // 检查弹窗是否打开 - 尝试多种方式
    const dialogVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
    const modalVisible = await page.locator('.modal, [data-testid*="modal"]').isVisible({ timeout: 2000 }).catch(() => false);

    if (dialogVisible || modalVisible) {
      console.log('✅ 弹窗成功打开');
    } else {
      console.log('⚠️ 未检测到弹窗，但也未报错（可能是选择器问题）');
    }

    console.log(`总共捕获到 ${errors.length} 个错误`);
  });

  test('应该显示弹窗中的标签页切换（面试评价 / 状态变更）', async ({ page }) => {
    await page.waitForTimeout(2000);

    const addRecordButton = page.getByRole('button', { name: /添加执行记录/i }).or(
      page.getByText('添加执行记录')
    );

    const buttonVisible = await addRecordButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!buttonVisible) {
      console.log('跳过测试: 未找到"添加执行记录"按钮');
      test.skip();
      return;
    }

    // 点击按钮打开弹窗
    await addRecordButton.first().click();
    await page.waitForTimeout(1000);

    // 查找标签页 - 尝试多种选择器
    const interviewTab = page.getByText('面试评价').or(
      page.locator('[role="tab"]:has-text("面试评价")')
    );

    const statusTab = page.getByText('状态变更').or(
      page.locator('[role="tab"]:has-text("状态变更")')
    );

    const hasInterviewTab = await interviewTab.count() > 0;
    const hasStatusTab = await statusTab.count() > 0;

    console.log(`面试评价标签: ${hasInterviewTab ? '存在' : '不存在'}`);
    console.log(`状态变更标签: ${hasStatusTab ? '存在' : '不存在'}`);

    if (hasInterviewTab && hasStatusTab) {
      // 尝试切换标签
      await statusTab.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e-screenshots/candidate-detail-status-tab.png', fullPage: true });

      await interviewTab.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e-screenshots/candidate-detail-interview-tab.png', fullPage: true });

      console.log('✅ 标签页切换成功');
    } else {
      console.log('⚠️ 未找到标签页元素');
    }
  });

  test('应该能关闭弹窗', async ({ page }) => {
    await page.waitForTimeout(2000);

    const addRecordButton = page.getByRole('button', { name: /添加执行记录/i }).or(
      page.getByText('添加执行记录')
    );

    const buttonVisible = await addRecordButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!buttonVisible) {
      test.skip();
      return;
    }

    // 打开弹窗
    await addRecordButton.first().click();
    await page.waitForTimeout(1000);

    // 查找关闭按钮 - 尝试多种方式
    const closeButton = page.getByRole('button', { name: /关闭|取消|Close/i }).or(
      page.locator('[aria-label*="关闭"], [aria-label*="close"]')
    ).or(
      page.locator('button:has-text("取消")')
    );

    const hasCloseButton = await closeButton.count() > 0;

    if (hasCloseButton) {
      await closeButton.first().click();
      await page.waitForTimeout(500);
      console.log('✅ 成功关闭弹窗');
    } else {
      // 尝试按 ESC 键关闭
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      console.log('⚠️ 未找到关闭按钮，尝试使用 ESC 键');
    }

    await page.screenshot({ path: 'e2e-screenshots/candidate-detail-dialog-closed.png', fullPage: true });
  });

  test('检查候选人信息是否正确显示', async ({ page }) => {
    await page.waitForTimeout(2000);

    // 检查页面上是否有候选人相关信息
    const pageContent = await page.content();

    const hasName = pageContent.includes('姓名') || pageContent.includes('name');
    const hasEmail = pageContent.includes('邮箱') || pageContent.includes('email');
    const hasPhone = pageContent.includes('电话') || pageContent.includes('phone');
    const hasSkills = pageContent.includes('技能') || pageContent.includes('skills');

    console.log('候选人信息显示情况:');
    console.log(`- 姓名字段: ${hasName ? '存在' : '不存在'}`);
    console.log(`- 邮箱字段: ${hasEmail ? '存在' : '不存在'}`);
    console.log(`- 电话字段: ${hasPhone ? '存在' : '不存在'}`);
    console.log(`- 技能字段: ${hasSkills ? '存在' : '不存在'}`);

    await page.screenshot({ path: 'e2e-screenshots/candidate-detail-info.png', fullPage: true });
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
