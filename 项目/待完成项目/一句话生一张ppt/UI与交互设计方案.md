# 一句话生一张PPT - UI/UX 详细交互设计方案

基于项目的极简直入式定位，以及长期沉淀的《UI设计.md》规范（清透果冻系、玻璃拟态、大圆角、去除物理边界感），特制定本项目的界面和组件交互说明。

## 1. 整体视觉风格 (Visual Identity)

* **主色调**: 提取自大模型/AI产品的经典科技光晕感色系（如：`indigo-500` 深紫渐变到 `cyan-400` 亮青）。
* **背景表现**: 弃用纯白或生硬色块。全屏采用微动态光斑网格背景，或大面积的模糊渐变背景 (`slate-50` 到 `gray-100` 或暗黑模式下的 `slate-900`)。
* **容器约束 (Floating Container)**: 采用“浮动式网格”，工作台区域的最大宽度限制在 `80vw`，高度锁死在 `85vh`，不产生内容溢出滚动。

## 2. 界面视图分解与流转规范

本项目不包含复杂的侧边栏和层级菜单，仅有以下几个核心界面的组合与切换：

### 2.1 灵感输入大厅 (Input Dashboard)

这是用户进入模块的第一眼。采用 **居中式英雄层 (Hero Section)** 布局。

* **排版与外层容器 (严格对齐生成漫画)**:
  * 顶部: 简洁的 Logo 或模块名称 (微发光字体)。
  * 核心容器: 高度拟物化且清透的毛玻璃卡片，完全采用生成漫画的参数组：`bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[40px] overflow-hidden shadow-2xl focus-within:ring-8 focus-within:ring-blue-500/10`。
* **交互细节 (输入与工具栏融合)**:
  * **主输入区**: 去除边框的大文本域 (`w-full min-h-[150px] p-8 text-2xl md:text-3xl bg-transparent text-slate-800 font-bold placeholder:text-slate-300`)。
  * **一体式底部栏**: 紧贴输入框底部的操作条 (`px-8 py-4 bg-white/40 border-t border-white/60 flex justify-between items-center`)。
  * **🎙️ 语音输入按钮**: 置于左侧，采用 `text-slate-500 hover:text-slate-900 bg-white/40`，录音状态下呈现 `animate-pulse` 红晕效果。
  * **🎲 随机灵感按钮**: 置于左侧紧随其后，采用琥珀色系 (`text-amber-600 hover:bg-amber-50 rounded-2xl`) 和 Spin 防抖动效。
* **“一键生成”按钮**:
  * 位于工具栏右侧的主突击按钮，使用核心绿色渐变发光质感 (`bg-gradient-to-br from-emerald-400 to-green-500 hover:scale-105 active:scale-95 rounded-[24px] shadow-xl shadow-green-500/30 text-white`)。
* **风格选择胶囊 (Capsule Pills)**:
  * 紧跟大主容器底部的组块区域。
  * 选中态使用靛蓝色强调 (`bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-105 rounded-full`)。
  * 未选态保持清透 (`bg-white/40 text-slate-600 hover:bg-white/70 backdrop-blur-sm rounded-full`)。

### 2.2 黑盒生成悬浮态 (Generation Loading Overlay)

进入魔法生成阶段，禁止使用无聊的市场通用“转圈圈”。

* **实现设计**:
  * 采用大屏遮罩（毛玻璃效果）。
  * 中心展示文字的渐显/轮播：“正在思考绝妙的文案...”、“正在打磨高清背景图...”。
  * 配合一些流光溢彩的动态进度条（利用 Tailwind 的 `animate-pulse` 或 `animate-ping`）。

### 2.3 生成工作台 (Result Workbench)

这是生成结果的核心呈现与微调区，采用 **极简暗室模式 (Darkroom)**。

* **结构**:
  * 左侧/顶部：几颗扁平化的轻量级返回/操作图标按钮。
  * 正中央：核心呈现区。一块绝对比例为 `16:9` 的大卡片，带有优雅的深色投影 (`shadow-2xl`，如 `rgba(0,0,0,0.15)`)。
* **16:9 画布内渲染逻辑 (Canvas Render)**:
  * **底层**: AI 返回的 `bg_image_url`，充满填平，设置适当的暗化渐变遮罩 (`bg-gradient-to-t from-black/80 to-transparent`)，确保其上的白字绝不错乱。
  * **上层 (文案排布)**: `title` 大字号居左/居中展示，`content` 要点以清晰的字号（如 24px-32px）辅以发光容器包裹，直接叠在图片上。
* **动作面板 (Action Bar)**: 在 16:9 画布下方悬浮：
    1. **重新抽卡背景**: （保留文案状态下重新叫号 SD 并替换底层图片，解决图片不满意痛点）。
    2. **扫码拿走**: 点击生成二维码弹窗，去除繁重的本地保存逻辑，扫码直接看大图存手机。
    3. **重新再来**: 重置所有 State，回到 2.1 状态。

## 3. 核心体验原则防偏离提示

根据既有 UI 审查的红线原则：

1. **严禁生硬堆砌**: 拒绝普通的灰色背景、方形按钮。
2. **状态重置**: 点击主工作台上的“返回/重来”按钮，务必调用类似 Zustand 中的 `resetStore()` 彻底清空临时数据。
3. **零弹窗/极简配置表**: 不要抛出二级弹窗让用户去配诸如“模型温度”、“画幅比例”、“画质”这类参数，保持“一句话生一张”的极致易上手特性。
