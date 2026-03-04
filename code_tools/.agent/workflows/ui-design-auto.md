---
description: UI设计全流程自动化：从需求分析到高质量产出的一键式设计工作流
---

# 🎨 UI 设计自动化工作流

一键执行完整的 UI 设计流程，整合所有本地 skill 资源。

---

## 阶段 1：需求分析与风格定向

### 1.1 明确设计目标

// turbo

1. 分析项目类型：`移动端 H5` / `PC Web` / `小程序` / `跨端`
2. 确认用户群体和使用场景
3. 技术栈约束：`原生 CSS` / `Tailwind` / `React + Semi` / `Vue`

### 1.2 选择视觉方向

参考 [核心视觉风格/SKILL.md](.claude/skills/通用技能/UI设计/核心视觉风格/SKILL.md)

| 风格 | 特点 | 适用场景 |
|-----|------|---------|
| 清透空气感 | 低饱和、柔光、透明 | 工具类、阅读类 |
| 科技商务 | 深色、渐变、动效 | SaaS、企业后台 |
| 极简克制 | 大留白、强对比 | 品牌官网、作品集 |
| 活泼趣味 | 高饱和、圆润、插画 | 社交、儿童教育 |

---

## 阶段 2：设计系统搭建

### 2.1 配色方案

// turbo

1. 从 [配色/SKILL.md](.claude/skills/通用技能/UI设计/配色/SKILL.md) 选择配色方案
2. 或使用 [SemiDesign组件库/SKILL.md](.claude/skills/通用技能/UI设计/SemiDesign组件库/SKILL.md) 的 Design Tokens

```css
:root {
  /* 主色 */
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;
  
  /* 语义色 */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  
  /* 中性色 */
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-border: #e2e8f0;
}
```

### 2.2 排版系统

参考 [排版与空间/SKILL.md](.claude/skills/通用技能/UI设计/排版与空间/SKILL.md)

```css
:root {
  /* 字阶 */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  
  /* 间距 (4px 基准) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  
  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

### 2.3 材质与阴影

参考 [材质与质感/SKILL.md](.claude/skills/通用技能/UI设计/材质与质感/SKILL.md)

```css
:root {
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  
  /* 玻璃态 */
  --glass-bg: rgba(255,255,255,0.7);
  --glass-blur: blur(10px);
  --glass-border: 1px solid rgba(255,255,255,0.2);
}
```

---

## 阶段 3：组件开发

### 3.1 选择图标库

// turbo
优先顺序（本地可用资源）：

1. **Semi Icons** - [SemiDesign组件库/SKILL.md](.claude/skills/通用技能/UI设计/SemiDesign组件库/SKILL.md)

   ```bash
   npm install @douyinfe/semi-icons
   ```

2. **Lucide** - [Lucide动画图标/SKILL.md](.claude/skills/通用技能/UI设计/Lucide动画图标/SKILL.md)

   ```bash
   npm install lucide-react
   ```

3. **IconPark** - [IconPark图标库/SKILL.md](.claude/skills/通用技能/UI设计/IconPark图标库/SKILL.md)

   ```bash
   npm install @icon-park/react
   ```

### 3.2 构建基础组件

参考 [组件规范/SKILL.md](.claude/skills/通用技能/UI设计/组件规范/SKILL.md)

| 组件 | 规范要点 |
|-----|---------|
| **按钮** | 主按钮仅一个/视图，明确文字标签 |
| **卡片** | 标题区+内容区+操作区，外圆角=内圆角×2 |
| **表单** | 标签左对齐，垂直扫描，即时校验 |
| **模态框** | 聚焦任务，主操作明确，键盘可访问 |

### 3.3 动效增强

参考 [交互动画/SKILL.md](.claude/skills/通用技能/UI设计/交互动画/SKILL.md) 和 [ReactBits动效组件/SKILL.md](.claude/skills/通用技能/UI设计/ReactBits动效组件/SKILL.md)

```css
/* 过渡时长 */
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* 缓动函数 */
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 阶段 4：布局实现

### 4.1 选择布局模式

| 模式 | 适用场景 | 参考 |
|-----|---------|------|
| **Bento Grid** | 功能展示、仪表盘 | [BentoUI便当布局/SKILL.md](.claude/skills/通用技能/UI设计/BentoUI便当布局/SKILL.md) |
| **圣杯布局** | 后台管理系统 | 侧边栏+主内容+顶栏 |
| **瀑布流** | 图片展示、社交 | CSS Grid / Masonry |
| **单栏聚焦** | 阅读、表单 | max-width: 65ch |

### 4.2 响应式断点

```css
/* 移动优先 */
--breakpoint-sm: 640px;   /* 手机横屏 */
--breakpoint-md: 768px;   /* 平板竖屏 */
--breakpoint-lg: 1024px;  /* 平板横屏 */
--breakpoint-xl: 1280px;  /* 桌面 */
--breakpoint-2xl: 1536px; /* 大屏 */
```

---

## 阶段 5：质量检查

// turbo

### 5.1 视觉自检

- [ ] 行宽不超过 700px (60-70 字符)
- [ ] 嵌套圆角：外 = 内 × 2
- [ ] 首屏有且仅有一个主 CTA
- [ ] 危险操作使用红色 + 确认

### 5.2 交互自检

- [ ] 所有可点击元素有 hover/active 状态
- [ ] 加载状态有骨架屏或 spinner
- [ ] 表单有即时校验反馈
- [ ] 键盘可完成核心操作

### 5.3 避免 AI 通用风

参考 [前端界面设计/SKILL.md](.claude/skills/通用技能/UI设计/前端界面设计/SKILL.md)

- [ ] 不使用默认字体 (Inter/Roboto/Arial)
- [ ] 不是紫色渐变 + 白底
- [ ] 有独特记忆点
- [ ] 布局非对称或有破格元素

---

## 快速命令

```bash
# 安装完整图标库
npm install @douyinfe/semi-icons lucide-react @icon-park/react

# 安装 Semi Design 组件库
npm install @douyinfe/semi-ui

# 安装动效库
npm install framer-motion
```

---

*整合自本地 UI 设计技能库 · 2026-01-30*
