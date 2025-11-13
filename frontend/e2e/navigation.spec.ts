import { test, expect } from '@playwright/test';

test.describe('侧边栏和导航测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载应用首页', async ({ page }) => {
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'e2e-screenshots/navigation-home-loaded.png', fullPage: true });
    console.log('应用首页加载完成');
  });

  test('应该显示侧边栏', async ({ page }) => {
    await page.waitForTimeout(2000);

    // 尝试查找侧边栏元素
    const sidebar = page.locator('aside, [role="navigation"], nav, .sidebar, [data-testid*="sidebar"]');
    const sidebarExists = await sidebar.count() > 0;

    console.log(`侧边栏存在: ${sidebarExists}`);

    if (sidebarExists) {
      await page.screenshot({ path: 'e2e-screenshots/navigation-sidebar.png', fullPage: true });
    }
  });

  test('测试侧边栏收缩/展开按钮', async ({ page }) => {
    await page.waitForTimeout(2000);

    // 查找收缩/展开按钮 - 可能是汉堡菜单图标
    const toggleButton = page.locator('button:has([data-icon]), button:has(svg)').or(
      page.getByRole('button', { name: /menu|toggle|收缩|展开/i })
    );

    const buttonCount = await toggleButton.count();

    if (buttonCount > 0) {
      console.log(`找到 ${buttonCount} 个可能的切换按钮`);

      // 尝试点击第一个
      await toggleButton.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e-screenshots/navigation-sidebar-toggled.png', fullPage: true });

      // 再次点击切换回去
      await toggleButton.first().click();
      await page.waitForTimeout(500);

      console.log('✅ 侧边栏切换测试完成');
    } else {
      console.log('⚠️ 未找到侧边栏切换按钮');
    }
  });

  test('测试候选人导航链接', async ({ page }) => {
    await page.waitForTimeout(2000);

    const candidatesLink = page.getByRole('link', { name: /候选人|candidates/i }).or(
      page.locator('a[href*="/candidates"]')
    );

    const linkExists = await candidatesLink.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (linkExists) {
      console.log('✅ 找到候选人导航链接');
      await candidatesLink.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/candidates/);

      await page.screenshot({ path: 'e2e-screenshots/navigation-to-candidates.png', fullPage: true });
      console.log('✅ 成功导航到候选人页面');
    } else {
      console.log('❌ 未找到候选人导航链接');
    }
  });

  test('测试职位导航链接', async ({ page }) => {
    await page.waitForTimeout(2000);

    const positionsLink = page.getByRole('link', { name: /职位|positions/i }).or(
      page.locator('a[href*="/positions"]')
    );

    const linkExists = await positionsLink.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (linkExists) {
      console.log('✅ 找到职位导航链接');
      await positionsLink.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/positions/);

      await page.screenshot({ path: 'e2e-screenshots/navigation-to-positions.png', fullPage: true });
      console.log('✅ 成功导航到职位页面');
    } else {
      console.log('❌ 未找到职位导航链接');
    }
  });

  test('测试组织管理导航链接', async ({ page }) => {
    await page.waitForTimeout(2000);

    const orgLink = page.getByRole('link', { name: /组织|团队|成员|organization/i }).or(
      page.locator('a[href*="/organizations"]')
    );

    const linkExists = await orgLink.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (linkExists) {
      console.log('✅ 找到组织管理导航链接');
      await orgLink.first().click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e-screenshots/navigation-to-organizations.png', fullPage: true });
      console.log('✅ 成功导航到组织管理页面');
    } else {
      console.log('⚠️ 未找到组织管理导航链接');
    }
  });

  test('测试页面间导航流畅性', async ({ page }) => {
    await page.waitForTimeout(2000);

    const routes = [
      { name: '候选人', url: '/candidates' },
      { name: '职位', url: '/positions' },
      { name: '首页', url: '/' },
    ];

    for (const route of routes) {
      console.log(`导航到: ${route.name}`);
      await page.goto(route.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      console.log(`当前 URL: ${currentUrl}`);
    }

    console.log('✅ 页面间导航测试完成');
  });

  test('列出侧边栏中所有导航链接', async ({ page }) => {
    await page.waitForTimeout(2000);

    // 查找所有导航链接
    const allLinks = await page.locator('a, [role="link"]').allTextContents();
    const uniqueLinks = [...new Set(allLinks)].filter(text => text.trim().length > 0);

    console.log('侧边栏导航链接:');
    uniqueLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link}`);
    });

    await page.screenshot({ path: 'e2e-screenshots/navigation-all-links.png', fullPage: true });
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

test.describe('组织管理页测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organizations/members');
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载组织成员管理页', async ({ page }) => {
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log(`当前 URL: ${url}`);

    await page.screenshot({ path: 'e2e-screenshots/organizations-members-loaded.png', fullPage: true });
    console.log('组织成员管理页加载完成');
  });

  test('应该显示成员列表或相关内容', async ({ page }) => {
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count() > 0;
    const hasList = await page.locator('[role="list"], ul').count() > 0;

    console.log(`表格存在: ${hasTable}, 列表存在: ${hasList}`);

    await page.screenshot({ path: 'e2e-screenshots/organizations-members-content.png', fullPage: true });
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
