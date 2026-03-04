# SVG动画交互控制

## 基本交互类型

### 滑块控制

使用HTML5 range输入控件实现参数调节。

```html
<input type="range" id="monthSlider" min="1" max="12" step="0.1" value="6">
```

```javascript
const slider = document.getElementById('monthSlider');
slider.addEventListener('input', throttledUpdate);
```

### 按钮控制

使用按钮实现开始/停止等操作。

```html
<button id="playBtn" class="play-btn">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>
    通电开始实验
</button>
```

```javascript
playBtn.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
        // 开始动画
    } else {
        // 停止动画
    }
});
```

## 事件处理

### 输入事件

```javascript
voltageSlider.addEventListener('input', throttle((e) => {
    state.voltage = parseInt(e.target.value);
    if (state.isPlaying) {
        // 调整动画参数
    }
}, 100));
```

### 点击事件

```javascript
resetBtn.addEventListener('click', () => {
    if (state.isPlaying) {
        playBtn.click(); // 若正在通电，则先断电
    }
    // 重置状态
});
```

## 状态管理

### 状态对象

使用状态对象管理动画状态。

```javascript
const state = {
    isPlaying: false,
    voltage: 5,
    h2Volume: 0,
    o2Volume: 0,
    liquidStartY: 180,
    maxVolume: 40,
    microAnimationInterval: null,
    bubbleInterval: null
};
```

### 状态更新

```javascript
function updatePhysics() {
    if (!state.isPlaying) return;

    // 根据电压计算速率
    const rate = (state.voltage * 0.005);
    
    if (state.h2Volume < state.maxVolume) {
        state.h2Volume += rate * 2;
        state.o2Volume += rate * 1;
        
        // 限制最大值
        state.h2Volume = Math.min(state.h2Volume, state.maxVolume);
        state.o2Volume = Math.min(state.o2Volume, state.maxVolume);
        
        // 更新UI
        h2VolDisplay.textContent = formatVol(state.h2Volume);
        o2VolDisplay.textContent = formatVol(state.o2Volume);
        
        // 更新液面高度
        const h2Drop = state.h2Volume * 4;
        const o2Drop = state.o2Volume * 4;
        
        liquidLeft.setAttribute('y', state.liquidStartY + h2Drop);
        liquidRight.setAttribute('y', state.liquidStartY + o2Drop);
    }

    reqAnimFrame = requestAnimationFrame(updatePhysics);
}
```

## 性能优化

### 节流函数

使用节流函数减少频繁更新。

```javascript
function throttle(func, delay) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, delay);
        }
    };
}

const throttledUpdate = throttle(updateEarthPhysics, 100);
```

### 防抖函数

对于某些操作，使用防抖函数。

```javascript
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
```

## 动态元素创建

### 创建SVG元素

```javascript
function createBubble(side) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const isLeft = side === 'left';
    const startX = isLeft ? (240 + Math.random() * 20) : (440 + Math.random() * 20);
    const startY = 480;
    const radius = 2 + Math.random() * 3;
    
    circle.setAttribute('cx', startX);
    circle.setAttribute('cy', startY);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'url(#bubble-grad)');
    circle.classList.add('bubble');
    
    // 随机动画时长
    const duration = 2 / (state.voltage * 0.2 + 0.5) + Math.random();
    circle.style.animationDuration = `${duration}s`;

    bubbleContainer.appendChild(circle);

    // 动画结束后移除
    setTimeout(() => {
        if(bubbleContainer.contains(circle)) bubbleContainer.removeChild(circle);
    }, duration * 1000);
}
```

### 创建水分子

```javascript
function runMicroAnimation() {
    particleArena.innerHTML = ''; // 清空
    demoH2o.style.display = 'none'; // 隐藏静态演示的水分子

    // 创建一个水分子组
    const h2o = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    h2o.setAttribute('transform', 'translate(0, 80)'); // 从下方游入
    h2o.style.transition = 'transform 0.5s ease-out';

    // 氧原子
    const o = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    o.innerHTML = `<circle cx="0" cy="0" r="24" fill="var(--oxygen-color)" filter="url(#atom-shadow)"/><text x="0" y="5" font-size="16" fill="white" text-anchor="middle" font-weight="bold">O</text>`;
    
    // 氢原子1
    const h1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    h1.innerHTML = `<circle cx="-20" cy="20" r="14" fill="var(--hydrogen-color)" stroke="#D1D5DB" filter="url(#atom-shadow)"/><text x="-20" y="25" font-size="12" fill="#374151" text-anchor="middle" font-weight="bold">H</text>`;
    
    // 氢原子2
    const h2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    h2.innerHTML = `<circle cx="20" cy="20" r="14" fill="var(--hydrogen-color)" stroke="#D1D5DB" filter="url(#atom-shadow)"/><text x="20" y="25" font-size="12" fill="#374151" text-anchor="middle" font-weight="bold">H</text>`;

    h2o.appendChild(o);
    h2o.appendChild(h1);
    h2o.appendChild(h2);
    particleArena.appendChild(h2o);

    // 动画序列
    // ...
}
```

## 响应式设计

### 媒体查询

```css
/* 响应式设计 */
@media (max-width: 900px) {
    .controls-wrapper {
        width: 90vw;
        padding: 20px 25px;
    }
    
    svg {
        width: 90vw;
        height: auto;
        max-width: 840px;
        max-height: 420px;
    }
}

@media (max-width: 600px) {
    .controls-wrapper {
        padding: 15px 20px;
    }
    
    .month-labels {
        font-size: 12px;
        padding: 0 8px;
    }
    
    .info-value {
        font-size: 16px;
        height: 45px;
    }
    
    .info-label {
        font-size: 12px;
    }
}
```

### 动态调整

根据屏幕尺寸动态调整SVG大小和位置。

```css
@media (max-width: 768px) {
    #app-container {
        width: 95vw;
        height: 95vh;
    }
    
    .dashboard {
        flex-direction: column;
        gap: 12px;
        padding: 15px;
    }
    
    #micro-view {
        transform: translate(600, 260) scale(0.8);
    }
}
```

## 示例：四季变化交互

```javascript
function updateEarthPhysics() {
    const month = parseFloat(slider.value);
    
    // 计算地轴倾角
    const angle = -23.5 * Math.cos((month - 6) * (Math.PI / 6));
    tiltedEarth.setAttribute('transform', `rotate(${angle})`);

    // 更新教学信息
    let seasonText = "地球旅行中 🚀";
    let subsolarText = "";
    let polarText = "极区昼夜交替中 🌙";
    let polarColor = "#4BC0F8";

    if (month >= 5.5 && month <= 6.5) {
        seasonText = "夏至 (Summer)";
        subsolarText = "北回归线 (23.5°N)";
        polarText = "🌞 北极圈极昼\n💤 南极圈极夜";
        polarColor = "#FF5A5F";
    } else if (month >= 11.5 || month <= 1.5) {
        seasonText = "冬至 (Winter)";
        subsolarText = "南回归线 (23.5°S)";
        polarText = "💤 北极圈极夜\n🌞 南极圈极昼";
        polarColor = "#4BC0F8";
    } else if (month >= 2.5 && month <= 3.5) {
        seasonText = "春分 (Spring)";
        subsolarText = "赤道 (0°)";
        polarText = "⚖️ 全球昼夜平分\n无极昼极夜啦";
        polarColor = "#10B981";
    } else if (month >= 8.5 && month <= 9.5) {
        seasonText = "秋分 (Autumn)";
        subsolarText = "赤道 (0°)";
        polarText = "⚖️ 全球昼夜平分\n无极昼极夜啦";
        polarColor = "#10B981";
    } else {
        let lat = (angle * -1).toFixed(1);
        let ns = lat > 0 ? "N" : "S";
        subsolarText = `约 ${Math.abs(lat)}° ${ns}`;
        
        // 非节气时的极区状态
        if (lat > 66.5) {
            polarText = "🌞 北极圈极昼\n南极圈部分极夜";
            polarColor = "#FF5A5F";
        } else if (lat < -66.5) {
            polarText = "北极圈部分极夜\n🌞 南极圈极昼";
            polarColor = "#4BC0F8";
        } else {
            polarText = "极区昼夜交替中 🌙";
            polarColor = "#64748B";
        }
    }

    // 平滑更新文本内容
    updateText(valSeason, seasonText);
    updateText(valSubsolar, subsolarText);
    updateHtml(valPolar, polarText.replace(/\n/g, '<br>'), polarColor);
}
```

## 示例：电解水交互

```javascript
function startSimulation() {
    updatePhysics();
    // 气泡生成频率反比于电压
    const bubbleDelay = Math.max(50, 300 - (state.voltage * 20)); // 最小延迟50ms
    state.bubbleInterval = setInterval(spawnBubbles, bubbleDelay);

    // 微观动画：直接调用一次，通过递归实现连续动画
    runMicroAnimation(); // 立即执行一次
}

function stopSimulation() {
    cancelAnimationFrame(reqAnimFrame);
    clearInterval(state.bubbleInterval);
    particleArena.innerHTML = ''; // 清空运动中的微观粒子
    demoH2o.style.display = 'block'; // 恢复静态演示的水分子
}
```