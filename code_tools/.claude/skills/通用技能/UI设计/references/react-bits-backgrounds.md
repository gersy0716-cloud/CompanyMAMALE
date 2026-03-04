# ReactBits 背景效果 (Backgrounds)

25个组件 | 粒子、流体、极光、网格

**来源**: [ReactBits](https://reactbits.dev/)

## 完整组件列表

Liquid Ether, Prism, Dark Veil, Light Pillar, Silk, Floating Lines, Light Rays, Pixel Blast, Color Bends, Aurora, Plasma, Particles, Gradient Blinds, Grid Scan, Beams, Pixel Snow, Lightning, Prismatic Burst, Galaxy, Dither, Faulty Terminal, Ripple Grid, Dot Grid, Threads, Hyperspeed

## 热门组件详解

### Aurora - 极光效果

流动的空灵光线背景。

```tsx
<Aurora
  colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
  speed={0.5}              // 动画速率
  amplitude={1.0}          // 波动强度
/>
```

### Particles - 粒子系统

高度可定制的 2D 粒子效果。

```tsx
<Particles
  particleCount={100}
  particleColor="#ffffff"
  speed={0.5}
  moveParticlesOnHover={true}  // 鼠标交互
  alphaParticles={true}        // 透明度变化
/>
```

**性能提示**: 移动端降低 `particleCount`

### Liquid Ether - 流体模拟

复杂的交互式流体模拟。

```tsx
<LiquidEther
  mouseForce={0.5}         // 交互强度
  resolution={0.5}         // 0.1-1.0 (质量/性能)
  isViscous={true}         // 粘稠效果
/>
```

**依赖**: `three.js`  
**性能提示**: 低端设备降低 `resolution`

### Hyperspeed - 超速星空

类似星际穿越的效果。

```tsx
<Hyperspeed
  starCount={5000}
  speed={1}
  starColor="#ffffff"
/>
```

## 推荐场景

| 场景 | 推荐组件 |
|------|----------|
| 着陆页 | Aurora, Liquid Ether, Hyperspeed |
| 暗色主题 | Galaxy, Dark Veil, Plasma |
| 科技感 | Grid Scan, Faulty Terminal, Beams |
| 轻量级 | Particles, Dot Grid, Threads |
| 动感 | Prismatic Burst, Lightning |

## 性能优化

| 属性 | 优化方式 |
|------|----------|
| `resolution` | 降低以提升性能 (0.3-0.5) |
| `particleCount` | 移动端减少 50% |
| 3D 背景 | 使用 `will-change: transform` |
