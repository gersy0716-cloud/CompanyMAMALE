# ReactBits 创意 UI 动效库

React | 110+ 组件 | 动画 | 交互 | 背景 | 开源免费

**官网**: <https://reactbits.dev/>  
**仓库**: <https://github.com/DavidHDev/react-bits>

## 核心特点

| 特性 | 说明 |
|------|------|
| **110+ 组件** | 文字动画、UI 元素、背景效果，每周更新 |
| **4 种变体** | JS-CSS, JS-TW, TS-CSS, TS-TW |
| **模块化** | 按需复制，无需安装整个库 |
| **轻量级** | 最小依赖，支持 tree-shaking |

## 安装方式

```bash
# shadcn 方式
npx shadcn@latest add https://reactbits.dev/api/shadcn/<组件名>

# jsrepo 方式  
npx jsrepo add reactbits/<分类>/<组件名>

# 或直接复制源码
```

**常见依赖**: `framer-motion`, `gsap`, `three.js`

## 组件库目录 (References)

| 分类 | 详细参考 |
|------|----------|
| **文字动画** | [react-bits-text.md](react-bits-text.md) |
| **交互动画** | [react-bits-interaction.md](react-bits-interaction.md) |
| **UI 组件** | [react-bits-ui.md](react-bits-ui.md) |
| **背景效果** | [react-bits-backgrounds.md](react-bits-backgrounds.md) |

## 快速选择指南

| 场景 | 推荐组件 |
|------|----------|
| 着陆页标题 | Glitch Text, Shiny Text, Split Text |
| 产品展示 | Spotlight Card, Magic Bento, Tilted Card |
| 页面背景 | Aurora, Particles, Liquid Chrome |
| 导航菜单 | Dock, Flowing Menu, Infinite Menu |
| 按钮交互 | Magnet, Glare Hover, Click Spark |
| 加载动画 | Text Type, Scrambled Text |

## 性能提示

- **移动端**: 降低 `particleCount`、`resolution`
- **3D 背景**: 使用 `will-change: transform`
- **按需加载**: 仅导入使用的组件
