# Logo 设置说明

## 放置 Logo 文件

请将您的 `logo.png` 文件放置在以下位置：

```
frontend/public/logo.png
```

## Logo 规格建议

- **格式**: PNG（支持透明背景）
- **尺寸**: 建议 256x256px 或更大（会自动缩放）
- **背景**: 建议使用透明背景
- **颜色**: 适配橙色主题（#f97316）

## 使用位置

Logo 已经集成到以下页面：

1. **侧边栏** (`/src/components/layout/Sidebar.tsx`)
   - 显示尺寸: 32x32px
   - 位置: 左上角，产品名旁边

2. **登录页面** (`/src/pages/auth/LoginPage.tsx`)
   - 显示尺寸: 64px 高度，自动宽度
   - 位置: 页面顶部，产品名上方

3. **注册页面** (`/src/pages/auth/RegisterPage.tsx`)
   - 显示尺寸: 64px 高度，自动宽度
   - 位置: 页面顶部，产品名上方

## 验证

放置 logo 文件后，刷新浏览器即可看到 logo 显示。

如果 logo 未找到，系统会优雅降级，显示默认的建筑图标。
