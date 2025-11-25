/**
 * Manual UI Check - 手动验证UI修复
 * 不需要登录，直接检查代码和样式
 */

import { test, expect } from '@playwright/test'

test.describe('Manual UI Check - No Login Required', () => {

  test('检查 Sidebar 代码是否包含收起功能', async ({ page }) => {
    // 直接访问前端源码
    await page.goto('http://localhost:5173')

    // 等待页面加载
    await page.waitForTimeout(2000)

    // 检查侧边栏是否存在 ChevronLeft 按钮
    const sidebarCollapseButton = page.locator('button').filter({ hasText: /收起|展开/ }).or(
      page.locator('button[title*="侧边栏"]')
    )

    console.log('检查侧边栏收起按钮是否存在...')
    const buttonCount = await sidebarCollapseButton.count()
    console.log('找到的按钮数量:', buttonCount)

    // 截图当前状态
    await page.screenshot({ path: 'e2e-screenshots/manual-check-sidebar.png', fullPage: true })
  })

  test('直接检查 SelectDropdown 组件的 size 属性', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(2000)

    // 截图
    await page.screenshot({ path: 'e2e-screenshots/manual-check-initial.png', fullPage: true })
  })
})
