/**
 * UI Fixes Verification Test
 * 验证UI修复：下拉框字体大小一致性和侧边栏收起功能
 */

import { test, expect } from '@playwright/test'

test.describe('UI Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到登录页面并登录
    await page.goto('/login')

    // 填写登录信息
    await page.fill('input[type="email"]', 'join2@priorshape.com')
    await page.fill('input[type="password"]', 'TestPassword123!')

    // 点击登录按钮
    await page.click('button[type="submit"]')

    // 等待导航完成
    await page.waitForURL('/candidates')
  })

  test('Issue 3: PositionDetail - 检查状态筛选和排序下拉框字体大小一致性', async ({ page }) => {
    // 导航到职位列表
    await page.goto('/positions')
    await page.waitForLoadState('networkidle')

    // 点击第一个职位进入详情页
    const firstPosition = page.locator('table tbody tr').first()
    await firstPosition.click()

    // 等待详情页加载
    await page.waitForURL(/\/positions\/\d+/)
    await page.waitForLoadState('networkidle')

    // 滚动到候选人管理区域
    await page.locator('h2:has-text("候选人管理")').scrollIntoViewIfNeeded()

    // 找到两个下拉框
    const statusDropdown = page.locator('button:has-text("状态筛选")').or(page.locator('button:has-text("全部状态")')).first()
    const sortDropdown = page.locator('button:has-text("排序方式")').or(page.locator('button:has-text("按匹配度排序")')).first()

    // 获取两个下拉框的字体大小
    const statusFontSize = await statusDropdown.evaluate((el) => {
      return window.getComputedStyle(el).fontSize
    })

    const sortFontSize = await sortDropdown.evaluate((el) => {
      return window.getComputedStyle(el).fontSize
    })

    console.log('状态筛选下拉框字体大小:', statusFontSize)
    console.log('排序方式下拉框字体大小:', sortFontSize)

    // 验证字体大小一致
    expect(statusFontSize).toBe(sortFontSize)
  })

  test('Issue 3: PositionDetail - 验证下拉框内容完整显示（不被遮挡）', async ({ page }) => {
    // 导航到职位列表
    await page.goto('/positions')
    await page.waitForLoadState('networkidle')

    // 点击第一个职位进入详情页
    const firstPosition = page.locator('table tbody tr').first()
    await firstPosition.click()

    // 等待详情页加载
    await page.waitForURL(/\/positions\/\d+/)
    await page.waitForLoadState('networkidle')

    // 滚动到候选人管理区域
    await page.locator('h2:has-text("候选人管理")').scrollIntoViewIfNeeded()

    // 点击状态筛选下拉框
    const statusDropdown = page.locator('button:has-text("状态筛选")').or(page.locator('button:has-text("全部状态")')).first()
    await statusDropdown.click()

    // 等待下拉菜单出现
    await page.waitForTimeout(300)

    // 检查下拉菜单是否可见
    const dropdownMenu = page.locator('div').filter({ hasText: '筛选中' }).filter({ hasText: '面试中' }).first()
    await expect(dropdownMenu).toBeVisible()

    // 截图验证
    await page.screenshot({ path: 'e2e-screenshots/position-detail-status-dropdown.png' })

    // 关闭下拉框
    await page.keyboard.press('Escape')

    // 点击排序下拉框
    const sortDropdown = page.locator('button:has-text("排序方式")').or(page.locator('button:has-text("按匹配度排序")')).first()
    await sortDropdown.click()

    // 等待下拉菜单出现
    await page.waitForTimeout(300)

    // 检查下拉菜单是否可见
    const sortMenu = page.locator('div').filter({ hasText: '按添加时间排序' }).first()
    await expect(sortMenu).toBeVisible()

    // 截图验证
    await page.screenshot({ path: 'e2e-screenshots/position-detail-sort-dropdown.png' })
  })

  test('Issue 4: Sidebar - 测试收起/展开功能', async ({ page }) => {
    // 确保在人才库页面
    await page.goto('/candidates')
    await page.waitForLoadState('networkidle')

    // 找到侧边栏
    const sidebar = page.locator('div').filter({ hasText: 'AI 简历筛选' }).filter({ hasText: '智能人才管理系统' }).first()

    // 获取初始宽度（应该是展开状态 w-64 = 256px）
    const initialWidth = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).width
    })
    console.log('侧边栏初始宽度:', initialWidth)

    // 截图展开状态
    await page.screenshot({ path: 'e2e-screenshots/sidebar-expanded.png' })

    // 点击收起按钮（左箭头）
    const collapseButton = page.locator('button[title="收起侧边栏"]')
    await collapseButton.click()

    // 等待动画完成
    await page.waitForTimeout(500)

    // 获取收起后的宽度（应该是 w-16 = 64px）
    const collapsedWidth = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).width
    })
    console.log('侧边栏收起后宽度:', collapsedWidth)

    // 截图收起状态
    await page.screenshot({ path: 'e2e-screenshots/sidebar-collapsed.png' })

    // 验证宽度变化
    expect(collapsedWidth).not.toBe(initialWidth)
    expect(parseInt(collapsedWidth)).toBeLessThan(parseInt(initialWidth))

    // 验证文字是否隐藏
    const sidebarText = page.locator('p:has-text("智能人才管理系统")')
    await expect(sidebarText).not.toBeVisible()

    // 点击展开按钮（右箭头）
    const expandButton = page.locator('button[title="展开侧边栏"]')
    await expandButton.click()

    // 等待动画完成
    await page.waitForTimeout(500)

    // 获取展开后的宽度
    const expandedWidth = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).width
    })
    console.log('侧边栏展开后宽度:', expandedWidth)

    // 验证恢复到初始宽度
    expect(expandedWidth).toBe(initialWidth)

    // 验证文字是否显示
    await expect(sidebarText).toBeVisible()

    // 截图最终状态
    await page.screenshot({ path: 'e2e-screenshots/sidebar-expanded-again.png' })
  })

  test('Issue 4: Sidebar - 验证主内容区域随侧边栏调整', async ({ page }) => {
    // 确保在人才库页面
    await page.goto('/candidates')
    await page.waitForLoadState('networkidle')

    // 获取主内容区域
    const mainContent = page.locator('main')

    // 获取初始宽度
    const initialMainWidth = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).width
    })
    console.log('主内容区初始宽度:', initialMainWidth)

    // 点击收起按钮
    const collapseButton = page.locator('button[title="收起侧边栏"]')
    await collapseButton.click()

    // 等待动画完成
    await page.waitForTimeout(500)

    // 获取收起后主内容区宽度
    const collapsedMainWidth = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).width
    })
    console.log('主内容区收起后宽度:', collapsedMainWidth)

    // 验证主内容区域宽度增加（因为侧边栏变窄了）
    expect(parseInt(collapsedMainWidth)).toBeGreaterThan(parseInt(initialMainWidth))
  })
})
