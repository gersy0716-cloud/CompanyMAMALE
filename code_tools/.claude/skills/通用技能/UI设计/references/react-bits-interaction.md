# ReactBits 交互动画 (Interaction Animations)

20个组件 | 鼠标交互、过渡、粒子效果

**来源**: [ReactBits](https://reactbits.dev/)

## 完整组件列表

Animated Content, Fade Content, Electric Border, Pixel Transition, Glare Hover, Antigravity, Logo Loop, Target Cursor, Laser Flow, Magnet Lines, Ghost Cursor, Gradual Blur, Click Spark, Magnet, Sticker Peel, Pixel Trail, Cubes, Metallic Paint, Noise, Shape Blur

## 热门组件详解

### Animated Content - 通用动画包装器

任意元素进入视口时的动画效果。

```tsx
<AnimatedContent
  distance={100}           // 移动距离(px)
  direction="vertical"     // 'vertical' | 'horizontal'
  duration={0.8}           // 动画时长
  ease="power2.out"        // GSAP easing
>
  <YourComponent />
</AnimatedContent>
```

**依赖**: `gsap`

### Magnet - 磁吸效果

元素被鼠标"吸引"的效果。

```tsx
<Magnet
  padding={50}             // 激活区域(px)
  magnetStrength={0.5}     // 吸引强度
  activeTransition="0.3s ease"
>
  <Button>Hover Me</Button>
</Magnet>
```

### Click Spark - 点击火花

点击时产生粒子爆发效果。

```tsx
<ClickSpark
  sparkColor="#FFD700"     // 火花颜色
  sparkCount={10}          // 火花数量
  sparkSize={8}            // 火花大小
  duration={400}           // 消散时间(ms)
>
  <ClickableArea />
</ClickSpark>
```

## 推荐场景

| 场景 | 推荐组件 |
|------|----------|
| 按钮交互 | Magnet, Glare Hover |
| 页面加载 | Animated Content, Fade Content |
| 趣味反馈 | Click Spark, Pixel Trail |
| 鼠标跟随 | Ghost Cursor, Target Cursor |
| 边框效果 | Electric Border |
