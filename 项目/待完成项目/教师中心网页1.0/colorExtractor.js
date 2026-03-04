/**
 * 图片主色调提取工具
 *
 * 功能说明：从图片中提取主色调，并转换为浅色版本用作卡片背景
 *
 * 业务逻辑：
 * 1. 使用 Canvas API 读取图片像素数据
 * 2. 统计颜色出现频率，找出主色调
 * 3. 将主色调转换为浅色版本（提高亮度）
 * 4. 缓存提取结果，避免重复计算
 *
 * 异常处理：
 * - 图片加载失败时返回默认颜色
 * - CORS 跨域问题时返回默认颜色
 */

class ColorExtractor {
    constructor() {
        // 缓存已提取的颜色
        this.colorCache = new Map();
        // 默认颜色（当提取失败时使用）
        this.defaultColors = [
            '#E8E5FF', // 浅紫色
            '#FFE5F0', // 浅粉色
            '#E5F5FF', // 浅蓝色
            '#E5FFF0', // 浅绿色
            '#FFF5E5', // 浅橙色
            '#F0E5FF'  // 浅薰衣草色
        ];
    }

    /**
     * 从图片 URL 提取主色调
     * @param {string} imageUrl - 图片 URL
     * @returns {Promise<string>} 浅色版主色调（hex 格式）
     */
    async extractColor(imageUrl) {
        try {
            // 检查缓存
            if (this.colorCache.has(imageUrl)) {
                return this.colorCache.get(imageUrl);
            }

            // 加载图片
            const img = await this.loadImage(imageUrl);

            // 提取主色调
            const mainColor = this.getMainColorFromImage(img);

            // 转换为浅色版本
            const lightColor = this.lightenColor(mainColor, 0.85);

            // 缓存结果
            this.colorCache.set(imageUrl, lightColor);

            return lightColor;

        } catch (error) {
            console.warn('提取颜色失败，使用默认颜色:', error);
            // 返回随机默认颜色
            return this.getRandomDefaultColor();
        }
    }

    /**
     * 加载图片
     * @param {string} url - 图片 URL
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // 处理跨域

            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('图片加载失败'));

            // 设置超时
            setTimeout(() => reject(new Error('图片加载超时')), 5000);

            img.src = url;
        });
    }

    /**
     * 从图片中提取主色调
     * @param {HTMLImageElement} img - 图片元素
     * @returns {Object} RGB 颜色对象 {r, g, b}
     */
    getMainColorFromImage(img) {
        // 创建 canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 缩小图片以提高性能（采样）
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        // 绘制图片
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // 统计颜色
        const colorMap = new Map();

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // 跳过透明像素
            if (a < 128) continue;

            // 跳过过于接近白色或黑色的像素
            const brightness = (r + g + b) / 3;
            if (brightness > 240 || brightness < 15) continue;

            // 量化颜色（减少颜色数量）
            const quantizedR = Math.round(r / 32) * 32;
            const quantizedG = Math.round(g / 32) * 32;
            const quantizedB = Math.round(b / 32) * 32;

            const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }

        // 找出出现次数最多的颜色
        let maxCount = 0;
        let mainColor = { r: 146, g: 129, b: 255 }; // 默认主色

        for (const [colorKey, count] of colorMap.entries()) {
            if (count > maxCount) {
                maxCount = count;
                const [r, g, b] = colorKey.split(',').map(Number);
                mainColor = { r, g, b };
            }
        }

        return mainColor;
    }

    /**
     * 将颜色转换为浅色版本
     * @param {Object} color - RGB 颜色对象 {r, g, b}
     * @param {number} lightness - 亮度系数 (0-1)，越大越浅
     * @returns {string} hex 格式颜色
     */
    lightenColor(color, lightness = 0.85) {
        // 转换为 HSL
        const hsl = this.rgbToHsl(color.r, color.g, color.b);

        // 提高亮度和降低饱和度
        hsl.l = Math.min(lightness, 0.95);
        hsl.s = Math.min(hsl.s * 0.5, 0.3);

        // 转换回 RGB
        const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);

        // 转换为 hex
        return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    /**
     * RGB 转 HSL
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h, s, l };
    }

    /**
     * HSL 转 RGB
     */
    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * RGB 转 Hex
     */
    rgbToHex(r, g, b) {
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * 获取随机默认颜色
     */
    getRandomDefaultColor() {
        const index = Math.floor(Math.random() * this.defaultColors.length);
        return this.defaultColors[index];
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.colorCache.clear();
    }
}

// 创建全局实例
const colorExtractor = new ColorExtractor();