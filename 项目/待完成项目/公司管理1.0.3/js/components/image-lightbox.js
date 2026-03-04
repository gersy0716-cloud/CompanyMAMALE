/**
 * 图片大图预览 Lightbox 组件
 * 功能：点击附件图片弹出全屏预览，支持 ESC / 点击背景关闭
 */
const ImageLightbox = {
    _overlay: null,

    /**
     * 初始化 Lightbox DOM（首次调用时自动创建）
     */
    _init() {
        if (this._overlay) return;

        const overlay = document.createElement('div');
        overlay.className = 'image-lightbox';
        overlay.innerHTML = `
            <div class="lightbox-close" title="关闭预览">✕</div>
            <img src="" alt="预览图片">
            <div class="lightbox-filename"></div>
        `;

        // 点击背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        // 关闭按钮
        overlay.querySelector('.lightbox-close').addEventListener('click', () => this.close());

        // 阻止图片点击冒泡
        overlay.querySelector('img').addEventListener('click', (e) => e.stopPropagation());

        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._overlay?.classList.contains('active')) {
                this.close();
            }
        });

        document.body.appendChild(overlay);
        this._overlay = overlay;
    },

    /**
     * 打开大图预览
     * @param {string} imageUrl - 图片 URL
     * @param {string} [filename] - 文件名（显示在底部）
     */
    open(imageUrl, filename) {
        this._init();

        const img = this._overlay.querySelector('img');
        const nameEl = this._overlay.querySelector('.lightbox-filename');

        img.src = imageUrl;
        nameEl.textContent = filename || '';

        // 触发动画
        requestAnimationFrame(() => {
            this._overlay.classList.add('active');
        });

        // 禁止背景滚动
        document.body.style.overflow = 'hidden';
    },

    /**
     * 关闭预览
     */
    close() {
        if (!this._overlay) return;

        this._overlay.classList.remove('active');
        document.body.style.overflow = '';

        // 动画结束后清除 src 释放内存
        setTimeout(() => {
            if (this._overlay) {
                this._overlay.querySelector('img').src = '';
            }
        }, 300);
    }
};
