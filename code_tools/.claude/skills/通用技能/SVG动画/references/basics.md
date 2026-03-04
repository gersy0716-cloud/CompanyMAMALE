# SVG动画基础

## 什么是SVG

SVG (Scalable Vector Graphics) 是一种基于XML的矢量图形格式，用于绘制二维图形。与位图不同，SVG图形可以无限放大而不失真，非常适合用于动画和交互式图形。

## 基本SVG结构

```html
<svg width="840" height="420" viewBox="0 0 840 420" xmlns="http://www.w3.org/2000/svg">
    <!-- 图形元素 -->
</svg>
```

## 常用SVG元素

### 基本形状
- `circle` - 圆形
- `rect` - 矩形
- `ellipse` - 椭圆
- `line` - 直线
- `path` - 路径
- `polygon` - 多边形

### 文本
- `text` - 文本

### 分组和变换
- `g` - 分组
- `transform` - 变换（平移、旋转、缩放）

### 渐变和滤镜
- `linearGradient` - 线性渐变
- `radialGradient` - 径向渐变
- `filter` - 滤镜
- `clipPath` - 裁剪路径

## SVG坐标系

SVG使用笛卡尔坐标系，原点(0,0)位于左上角，x轴向右，y轴向下。

## 基本属性

- `fill` - 填充颜色
- `stroke` - 描边颜色
- `stroke-width` - 描边宽度
- `opacity` - 透明度
- `transform` - 变换

## 示例：绘制一个简单的圆形

```html
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="50" fill="#FFD166" stroke="#FFB703" stroke-width="2" />
</svg>
```

## 示例：绘制一个路径

```html
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <path d="M 50 100 Q 100 50 150 100" fill="none" stroke="#4BC0F8" stroke-width="3" />
</svg>
```

## 示例：使用渐变

```html
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4BC0F8" />
            <stop offset="100%" stop-color="#84DCC6" />
        </linearGradient>
    </defs>
    <rect x="50" y="50" width="100" height="100" fill="url(#grad)" />
</svg>
```

## 最佳实践

1. **使用viewBox**：使用viewBox属性使SVG响应式
2. **分组元素**：使用g元素对相关元素进行分组，便于管理
3. **使用defs**：将渐变、滤镜等定义放在defs元素中
4. **优化路径**：简化路径命令，减少文件大小
5. **使用CSS**：将样式移至CSS，提高可维护性