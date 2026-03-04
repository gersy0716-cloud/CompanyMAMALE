# ReactBits UI组件 (Components)

17个组件 | 卡片、导航、画廊、Bento布局

**来源**: [ReactBits](https://reactbits.dev/)

## 完整组件列表

Animated List, Scroll Stack, Bubble Menu, Magic Bento, Circular Gallery, Reflective Card, Spotlight Card, Flying Posters, Card Swap, Glass Icons, Decay Card, Flowing Menu, Elastic Slider, Counter, Infinite Menu, Stepper, Bounce Cards

## 热门组件详解

### Spotlight Card - 聚光灯卡片

跟随鼠标的径向"手电筒"效果。

> 源码参考: [SpotlightCard](assets/react-bits/ui-components/SpotlightCard.jsx)

```tsx
<SpotlightCard
  spotlightColor="rgba(255, 255, 255, 0.15)"
  className="custom-card"
>
  <CardContent />
</SpotlightCard>
```

### Infinite Menu - 无限旋转菜单

沿圆形路径无限旋转的菜单。

```tsx
<InfiniteMenu
  items={[
    { image: "/img1.jpg", link: "/page1", title: "Item 1" },
    { image: "/img2.jpg", link: "/page2", title: "Item 2" },
  ]}
  scale={1.2}              // 缩放级别
/>
```

### Bounce Cards - 弹跳卡片

卡片以弹跳方式落入位置。

```tsx
<BounceCards
  images={["/a.jpg", "/b.jpg", "/c.jpg"]}
  animationStagger={0.1}   // 卡片间隔时间
  enableHover={true}       // 悬停倾斜效果
/>
```

### Magic Bento - Bento 网格

带动效的 Bento 风格布局。

```tsx
<MagicBento
  items={[
    { content: <Card1 />, span: "2x1" },
    { content: <Card2 />, span: "1x2" },
  ]}
/>
```

## 推荐场景

| 场景 | 推荐组件 |
|------|----------|
| 产品展示 | Spotlight Card, Reflective Card |
| 导航菜单 | Flowing Menu, Infinite Menu |
| 作品集 | Circular Gallery, Flying Posters |
| 布局 | Magic Bento, Scroll Stack |
| 表单步骤 | Stepper |
