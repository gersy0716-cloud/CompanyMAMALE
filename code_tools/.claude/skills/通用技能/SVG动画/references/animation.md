# SVG动画效果实现

## 基本动画类型

### CSS动画

CSS动画通过`@keyframes`定义动画关键帧，然后应用到元素上。

```css
@keyframes spin {
    0% { transform: translateX(0); }
    100% { transform: translateX(-180px); }
}
.land-group {
    animation: spin 8s linear infinite;
    transform: translateZ(0); /* 硬件加速 */
}
```

### CSS过渡

CSS过渡用于实现元素属性的平滑变化。

```css
#tilted-earth {
    transition: transform 0.5s ease-out;
}
```

### JavaScript动画

JavaScript动画通过`requestAnimationFrame`或定时器实现更复杂的动画逻辑。

```javascript
function updatePhysics() {
    if (!state.isPlaying) return;
    
    // 动画逻辑
    
    reqAnimFrame = requestAnimationFrame(updatePhysics);
}
```

## 常用动画效果

### 旋转动画

```css
@keyframes sunRayRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.sun-rays {
    animation: sunRayRotate 20s linear infinite;
    transform-origin: -50px 0px;
}
```

### 浮动动画

```css
@keyframes floatBunny {
    0%, 100% { transform: translateY(0) rotate(5deg); }
    50% { transform: translateY(-15px) rotate(-5deg); }
}
.bunny-astro {
    animation: floatBunny 4s ease-in-out infinite;
}
```

### 气泡上升动画

```css
@keyframes rise {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    20% { opacity: 0.8; }
    100% { transform: translateY(-150px) scale(1.2); opacity: 0; }
}
.bubble {
    animation: rise linear forwards;
}
```

### 分裂动画

```css
@keyframes split-o {
    0% { transform: translate(0, 0); }
    50% { transform: translate(30px, 0); }
    100% { transform: translate(80px, 0); }
}
.animating-o { animation: split-o 2s ease-in-out forwards; }
```

## 动画序列控制

### 递归动画

使用递归函数实现连续动画序列。

```javascript
function runMicroAnimation() {
    // 创建动画元素
    
    // 动画序列
    setTimeout(() => {
        // 1. 移动到中心
        h2o.setAttribute('transform', 'translate(0, 0)');
        
        setTimeout(() => {
            // 2. 分裂动画
            o.style.animation = 'split-o 1.5s ease-in-out forwards';
            h1.style.animation = 'split-h1 1.5s ease-in-out forwards';
            h2.style.animation = 'split-h2 1.5s ease-in-out forwards';
            
            // 3. 动画结束后开始下一个
            setTimeout(() => {
                runMicroAnimation(); // 递归调用
            }, 2000);
        }, 500);
    }, 50);
}
```

### 动画延迟控制

使用setTimeout控制动画序列的时间间隔。

```javascript
setTimeout(() => {
    // 执行下一步动画
}, 500); // 500ms延迟
```

## 性能优化

### 硬件加速

使用`transform: translateZ(0)`启用硬件加速。

```css
.animated-element {
    transform: translateZ(0); /* 硬件加速 */
}
```

### 减少重绘

避免频繁修改会导致重绘的属性。

### 使用requestAnimationFrame

对于复杂动画，使用`requestAnimationFrame`代替定时器。

```javascript
function animate() {
    // 动画逻辑
    requestAnimationFrame(animate);
}
animate();
```

## 示例：四季变化动画

```javascript
function updateEarthPhysics() {
    const month = parseFloat(slider.value);
    
    // 计算地轴倾角
    const angle = -23.5 * Math.cos((month - 6) * (Math.PI / 6));
    tiltedEarth.setAttribute('transform', `rotate(${angle})`);
    
    // 更新教学信息
    // ...
}
```

## 示例：电解水动画

```javascript
function spawnBubbles() {
    const createBubble = (side) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        // 设置气泡属性
        // ...
        bubbleContainer.appendChild(circle);
        
        // 动画结束后移除
        setTimeout(() => {
            if(bubbleContainer.contains(circle)) bubbleContainer.removeChild(circle);
        }, duration * 1000);
    };
    
    // 生成气泡
    createBubble('left');
    createBubble('right');
}
```