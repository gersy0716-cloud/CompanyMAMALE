/**
 * UI/UX 设计展示
 * 文档风格交互逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
    initCodeToggle();
    initCopyCode();
    initNavHighlight();
    initParallaxCard();
});

// 代码展开/收起
function initCodeToggle() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const codeBlock = document.getElementById(targetId);
            if (!codeBlock) return;

            const isShown = codeBlock.classList.toggle('show');
            btn.textContent = isShown ? '收起代码 ▲' : '展开代码 ▼';
        });
    });
}

// 复制代码
function initCopyCode() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const codeBlock = document.getElementById(targetId);
            if (!codeBlock) return;

            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                const original = btn.textContent;
                btn.textContent = '✓ 已复制';
                setTimeout(() => btn.textContent = original, 2000);
            }).catch(() => {
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = codeBlock.textContent;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);

                const original = btn.textContent;
                btn.textContent = '✓ 已复制';
                setTimeout(() => btn.textContent = original, 2000);
            });
        });
    });
}

// 目录滚动高亮
function initNavHighlight() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.demo-card[id]');

    function updateActiveNav() {
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.id;

            if (scrollPos >= top && scrollPos < top + height) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);

    // 平滑滚动
    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const targetId = item.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// 3D视差卡片
function initParallaxCard() {
    const card = document.getElementById('parallaxCard');
    if (!card) return;

    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
}
