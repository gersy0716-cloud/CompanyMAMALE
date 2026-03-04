# ReactBits 文字动画 (Text Animations)

23个组件 | 打字、模糊、故障、渐变等

**来源**: [ReactBits](https://reactbits.dev/)

## 完整组件列表

Split Text, Blur Text, Circular Text, Text Type, Shuffle, Shiny Text, Text Pressure, Curved Loop, Fuzzy Text, Gradient Text, Falling Text, Text Cursor, Decrypted Text, True Focus, Scroll Float, Scroll Reveal, ASCII Text, Scrambled Text, Rotating Text, Glitch Text, Scroll Velocity, Variable Proximity, Count Up

## 热门组件详解

### Split Text - 拆分文字动画

将文本按字符/单词/行拆分并逐个动画。

```tsx
<SplitText
  text="Hello World"
  splitType="chars"      // 'chars' | 'words' | 'lines'
  delay={50}             // 元素间延迟(ms)
  duration={0.5}         // 动画时长
  from={{ opacity: 0, y: 20 }}
  to={{ opacity: 1, y: 0 }}
/>
```

**依赖**: `gsap`

### Blur Text - 模糊渐现

从模糊状态平滑显现。

```tsx
<BlurText
  text="Appearing from blur"
  animateBy="words"      // 'words' | 'chars'
  direction="top"        // 'top' | 'bottom'
  stepDuration={0.3}     // 每步时长
/>
```

### Glitch Text - 故障效果

数字故障/毛刺效果，适合科技主题。

```tsx
<GlitchText
  text="GLITCH"
  speed={1}              // 速度乘数
  enableShadows={true}   // 阴影效果
  hover={true}           // 仅悬停时触发
/>
```

## 推荐场景

| 场景 | 推荐组件 |
|------|----------|
| 着陆页主标题 | Glitch Text, Shiny Text, Gradient Text |
| 加载状态 | Text Type, Scrambled Text |
| 滚动展示 | Scroll Reveal, Scroll Float |
| 数据展示 | Count Up |
| 创意标题 | Circular Text, Curved Loop |
