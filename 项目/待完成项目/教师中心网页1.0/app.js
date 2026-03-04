/**
 * 教师中心网页 - 主应用逻辑
 * 
 * 功能模块：
 * 1. 板块与工具渲染
 * 2. Bento 布局算法 (Unit-Sum Packing)
 * 3. 最近使用管理
 * 4. 搜索与筛选
 * 5. AI 助手交互
 * 6. 工具预览卡片
 */

// ========================================
// 全局状态
// ========================================
const AppState = {
    recentTools: JSON.parse(localStorage.getItem('recentTools') || '[]'),
    currentFilter: 'all',
    searchQuery: '',
    expandedBlocks: new Set(),
    maxVisibleTools: 12
};

// ========================================
// 板块主题色配置
// ========================================
const BlockThemes = {
    'ai-teaching': {
        bg: 'linear-gradient(135deg, #E8E5FF 0%, #F0EDFF 100%)',
        accent: '#9281FF',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
        </svg>`
    },
    'office-writing': {
        bg: 'linear-gradient(135deg, #FFF0F5 0%, #FFF5F8 100%)',
        accent: '#f093fb',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
        </svg>`
    },
    'class-management': {
        bg: 'linear-gradient(135deg, #E5F9FF 0%, #F0FCFF 100%)',
        accent: '#4facfe',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>`
    },
    'lesson-prep': {
        bg: 'linear-gradient(135deg, #E5FFF0 0%, #F0FFF5 100%)',
        accent: '#43e97b',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>`
    },
    'grade-management': {
        bg: 'linear-gradient(135deg, #FFF5E5 0%, #FFFAF0 100%)',
        accent: '#feca57',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>`
    },
    'classroom-tools': {
        bg: 'linear-gradient(135deg, #FFE5F0 0%, #FFF0F5 100%)',
        accent: '#fa709a',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
        </svg>`
    }
};

// ========================================
// 工具类：Bento 尺寸计算 (完美填充算法)
// ========================================
class BentoLayoutManager {
    /**
     * 智能填充算法
     * 目标：使用 span1-span6 尺寸确保每行精确填满
     */
    static assignSizes(tools, columns = 6) {
        const n = tools.length;
        if (n === 0) return [];

        const sizes = [];
        let currentRowUsed = 0;

        for (let i = 0; i < n; i++) {
            const remaining = columns - currentRowUsed;
            const toolsLeft = n - i;

            // 判断是否是这行最后能放的卡片
            const isLastInRow = remaining <= toolsLeft ? false : true;

            let size = 'small'; // 默认
            let span = 1;

            // 重点工具优先使用 large (2x2 带封面图)
            if (tools[i].featured && remaining >= 2) {
                size = 'large';
                span = 2;
            } else if (isLastInRow || remaining === toolsLeft) {
                // 如果剩余工具刚好填满或这是行末
                span = Math.floor(remaining / toolsLeft);
                if (span > 6) span = 6;
                if (span < 1) span = 1;

                // 尺寸名映射
                const sizeMap = {
                    1: 'small',
                    2: 'medium',
                    3: 'span3',
                    4: 'span4',
                    5: 'span5',
                    6: 'span6'
                };
                size = sizeMap[span] || 'small';
            }

            sizes.push(size);
            currentRowUsed += span;

            // 换行检测
            if (currentRowUsed >= columns) {
                currentRowUsed = 0;
            }
        }

        // 最后一行填满处理
        // 计算最后一行已用空间
        let lastRowStart = 0;
        let tempUsed = 0;
        for (let i = 0; i < sizes.length; i++) {
            const span = this.getColSpan(sizes[i]);
            if (tempUsed + span > columns) {
                lastRowStart = i;
                tempUsed = span;
            } else {
                tempUsed += span;
            }
            if (tempUsed === columns) {
                lastRowStart = i + 1;
                tempUsed = 0;
            }
        }

        // 如果最后一行没填满，重新分配最后一行的尺寸
        if (tempUsed > 0 && tempUsed < columns) {
            const lastRowTools = sizes.length - lastRowStart;
            if (lastRowTools > 0) {
                const avgSpan = Math.floor(columns / lastRowTools);
                const extra = columns % lastRowTools;

                for (let i = lastRowStart; i < sizes.length; i++) {
                    const idx = i - lastRowStart;
                    const span = avgSpan + (idx < extra ? 1 : 0);
                    const sizeMap = { 1: 'small', 2: 'medium', 3: 'span3', 4: 'span4', 5: 'span5', 6: 'span6' };
                    sizes[i] = sizeMap[span] || 'small';
                }
            }
        }

        return sizes;
    }

    /**
     * 获取尺寸对应的列数
     */
    static getColSpan(size) {
        const spanMap = {
            'small': 1,
            'medium': 2,
            'span3': 3,
            'span4': 4,
            'span5': 5,
            'span6': 6,
            'large': 2,
            'tall': 1
        };
        return spanMap[size] || 1;
    }

    /**
     * 获取当前屏幕的列数
     */
    static getCurrentColumns() {
        const width = window.innerWidth;
        if (width > 1200) return 6;  // PC 6列
        if (width > 850) return 3;   // 平板 3列
        if (width > 500) return 2;   // 小屏 2列
        return 1;                    // 手机 1列
    }
}

// ========================================
// 渲染器：板块与工具
// ========================================
class TeacherCenterRenderer {
    constructor() {
        this.blocksContainer = document.getElementById('blocksContainer');
        this.recentSection = document.getElementById('recentSection');
        this.recentToolsContainer = document.getElementById('recentTools');
        this.previewCard = document.getElementById('toolPreviewCard');
        this.previewTimeout = null;
    }

    /**
     * 渲染所有板块
     */
    renderBlocks(blocks) {
        this.blocksContainer.innerHTML = '';

        blocks.forEach((block, index) => {
            const blockElement = this.createBlockElement(block, index);
            this.blocksContainer.appendChild(blockElement);
        });

        // 绑定事件
        this.bindToolEvents();
    }

    /**
     * 创建单个板块元素
     */
    createBlockElement(block, index) {
        const theme = BlockThemes[block.id] || BlockThemes['ai-teaching'];
        const isExpanded = AppState.expandedBlocks.has(block.id);
        const visibleTools = isExpanded ? block.tools : block.tools.slice(0, AppState.maxVisibleTools);
        const hiddenCount = block.tools.length - AppState.maxVisibleTools;

        // 计算 Bento 尺寸
        const columns = BentoLayoutManager.getCurrentColumns();
        const sizes = BentoLayoutManager.assignSizes(visibleTools, columns);

        const blockHTML = `
            <section class="block-card" id="${block.id}" data-block-id="${block.id}" style="animation-delay: ${index * 0.05}s">
                <div class="block-header">
                    <div class="block-title">
                        <div class="block-icon" style="background: ${theme.bg}; color: ${theme.accent}">
                            ${block.icon}
                        </div>
                        <div>
                            <h2 class="block-name">${block.name}</h2>
                            <span class="block-count">${block.tools.length} 个工具</span>
                        </div>
                    </div>
                    ${hiddenCount > 0 ? `
                        <button class="block-expand-btn ${isExpanded ? 'expanded' : ''}" data-block-id="${block.id}">
                            ${isExpanded ? '收起' : `展开 ${hiddenCount} 个`}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="tools-grid">
                    ${visibleTools.map((tool, i) => this.createToolCard(tool, sizes[i], theme, i === visibleTools.length - 1)).join('')}
                </div>
            </section>
        `;

        const template = document.createElement('template');
        template.innerHTML = blockHTML.trim();
        return template.content.firstChild;
    }

    /**
     * 创建工具卡片
     */
    createToolCard(tool, size, theme, isLast = false) {
        const showDesc = ['medium', 'large', 'tall'].includes(size);
        const isFeatured = tool.featured && size === 'large';
        const fillClass = isLast ? ' fill-remaining' : '';

        // 重点卡片：显示宽版背景
        if (isFeatured) {
            return `
                <div class="tool-card size-${size} featured${fillClass}" 
                     data-tool-id="${tool.id}"
                     data-tool-name="${tool.name}"
                     data-tool-desc="${tool.description}">
                    <div class="tool-cover placeholder-bg">
                        <div class="tool-cover-overlay"></div>
                    </div>
                    <div class="tool-featured-info">
                        <div class="tool-icon" style="background: ${theme.bg}; color: ${theme.accent};">
                            ${tool.icon}
                        </div>
                        <div class="tool-info">
                            <span class="tool-name">${tool.name}</span>
                            <span class="tool-desc">${tool.description}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // 普通卡片
        return `
            <div class="tool-card size-${size}${fillClass}" 
                 data-tool-id="${tool.id}"
                 data-tool-name="${tool.name}"
                 data-tool-desc="${tool.description}">
                <div class="tool-icon" style="background: ${theme.bg}; color: ${theme.accent};">
                    ${tool.icon}
                </div>
                <div class="tool-info">
                    <span class="tool-name">${tool.name}</span>
                    ${showDesc ? `<span class="tool-desc">${tool.description}</span>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 格式化使用次数
     */
    formatUsage(count) {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count;
    }

    /**
     * 渲染最近使用 (最小化 Bento 板块)
     */
    renderRecentTools() {
        if (AppState.recentTools.length === 0) {
            this.recentSection.style.display = 'none';
            return;
        }

        // 获取完整的工具信息
        const recentToolsFull = AppState.recentTools
            .map(recent => {
                // 在所有板块中查找工具
                for (const block of blocksData) {
                    const tool = block.tools.find(t => t.id === recent.id);
                    if (tool) return { ...tool, blockId: block.id };
                }
                return null;
            })
            .filter(Boolean) // 过滤掉找不到的工具
            .slice(0, 4); // 最多显示 4 个

        if (recentToolsFull.length === 0) {
            this.recentSection.style.display = 'none';
            return;
        }

        this.recentSection.style.display = 'block';
        this.recentSection.className = 'block-card recent-block';

        // 使用一个特殊的主色调主题
        const theme = {
            bg: 'linear-gradient(135deg, #F0EDFF 0%, #E8E5FF 100%)',
            accent: 'var(--primary)',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>`
        };

        // 强制所有卡片使用 small 尺寸 (1x1)
        const sizes = recentToolsFull.map(() => 'small');

        this.recentSection.innerHTML = `
            <div class="block-header">
                <div class="block-title">
                    <div class="block-icon" style="background: ${theme.bg}; color: ${theme.accent};">
                        ${theme.icon}
                    </div>
                    <div class="block-info">
                        <h2 class="block-name">最近使用</h2>
                    </div>
                </div>
                <button class="clear-history-btn" id="clearHistoryBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    清除
                </button>
            </div>
            <div class="tools-grid">
                ${recentToolsFull.map((tool, i) => this.createToolCard(tool, sizes[i], this.getToolTheme(tool.blockId))).join('')}
            </div>
        `;

        // 绑定清除历史事件
        const clearBtn = this.recentSection.querySelector('#clearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('确定要清除最近使用记录吗？')) {
                    AppState.recentTools = [];
                    localStorage.removeItem('teacher_center_recent');
                    this.renderRecentTools();
                }
            });
        }
    }

    /**
     * 获取工具对应的主题
     */
    getToolTheme(blockId) {
        return BlockThemes[blockId] || BlockThemes['ai-teaching'];
    }

    /**
     * 绑定工具卡片事件
     */
    bindToolEvents() {
        // 工具卡片点击
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => this.handleToolClick(e, card));
            card.addEventListener('mouseenter', (e) => this.handleToolHover(e, card));
            card.addEventListener('mouseleave', () => this.hidePreview());
        });

        // 最近使用工具点击
        document.querySelectorAll('.recent-tool-item').forEach(item => {
            item.addEventListener('click', () => this.handleRecentToolClick(item));
        });

        // 展开/收起按钮
        document.querySelectorAll('.block-expand-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleExpandClick(btn));
        });
    }

    /**
     * 处理工具点击
     */
    handleToolClick(e, card) {
        const toolId = card.dataset.toolId;
        const toolName = card.dataset.toolName;
        const toolIcon = card.dataset.toolIcon;
        const blockCard = card.closest('.block-card');
        const blockId = blockCard ? blockCard.dataset.blockId : null;

        // 添加到最近使用
        this.addToRecentTools({
            id: toolId,
            name: toolName,
            icon: toolIcon,
            blockId: blockId
        });

        // 可视化反馈
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        console.log('打开工具:', toolName);
        // TODO: 实际跳转到工具页面
    }

    /**
     * 处理工具悬停
     */
    handleToolHover(e, card) {
        clearTimeout(this.previewTimeout);

        this.previewTimeout = setTimeout(() => {
            const rect = card.getBoundingClientRect();
            const preview = this.previewCard;

            // 填充预览内容
            document.getElementById('previewTitle').textContent = card.dataset.toolName;
            document.getElementById('previewDesc').textContent = card.dataset.toolDesc;
            // 移除使用次数显示
            document.getElementById('previewUsage').style.display = 'none';

            // 处理图片
            const img = document.getElementById('previewImage');
            const placeholder = document.getElementById('previewPlaceholder');

            img.src = card.dataset.toolCover;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            placeholder.querySelector('.placeholder-icon').textContent = card.dataset.toolIcon;

            img.onerror = () => {
                img.style.display = 'none';
                placeholder.style.display = 'flex';
            };

            // 定位预览卡片
            let left = rect.right + 16;
            let top = rect.top;

            // 边界检测
            if (left + 280 > window.innerWidth) {
                left = rect.left - 280 - 16;
            }
            if (top + 240 > window.innerHeight) {
                top = window.innerHeight - 260;
            }

            preview.style.left = `${left}px`;
            preview.style.top = `${top}px`;
            preview.classList.add('active');
        }, 300);
    }

    /**
     * 隐藏预览卡片
     */
    hidePreview() {
        clearTimeout(this.previewTimeout);
        this.previewCard.classList.remove('active');
    }

    /**
     * 添加到最近使用
     */
    addToRecentTools(tool) {
        // 移除已存在的
        AppState.recentTools = AppState.recentTools.filter(t => t.id !== tool.id);
        // 添加到开头
        AppState.recentTools.unshift(tool);
        // 最多保留 20 个
        AppState.recentTools = AppState.recentTools.slice(0, 20);
        // 保存到 localStorage
        localStorage.setItem('recentTools', JSON.stringify(AppState.recentTools));
        // 重新渲染
        this.renderRecentTools();
    }

    /**
     * 处理最近使用工具点击
     */
    handleRecentToolClick(item) {
        const toolId = item.dataset.toolId;
        console.log('从最近使用打开工具:', toolId);
        // TODO: 实际跳转
    }

    /**
     * 处理展开/收起
     */
    handleExpandClick(btn) {
        const blockId = btn.dataset.blockId;

        if (AppState.expandedBlocks.has(blockId)) {
            AppState.expandedBlocks.delete(blockId);
        } else {
            AppState.expandedBlocks.add(blockId);
        }

        // 重新渲染
        this.renderBlocks(blocksData);
    }
}

// ========================================
// AI 助手控制器
// ========================================
class AIAssistantController {
    constructor() {
        this.fab = document.getElementById('aiAssistantFab');
        this.overlay = document.getElementById('aiDialogOverlay');
        this.dialog = document.getElementById('aiDialog');
        this.closeBtn = document.getElementById('aiDialogClose');
        this.input = document.getElementById('aiInput');
        this.sendBtn = document.getElementById('aiSendBtn');
        this.messagesContainer = document.getElementById('aiMessages');

        this.bindEvents();
    }

    bindEvents() {
        // 打开对话框
        this.fab.addEventListener('click', () => this.openDialog());

        // 关闭对话框
        this.closeBtn.addEventListener('click', () => this.closeDialog());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.closeDialog();
        });

        // 发送消息
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    openDialog() {
        this.overlay.classList.add('active');
        this.input.focus();
    }

    closeDialog() {
        this.overlay.classList.remove('active');
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // 添加用户消息
        this.addMessage(message, 'user');
        this.input.value = '';

        // 显示打字指示器
        this.showTypingIndicator();

        // 模拟 AI 响应
        await this.simulateAIResponse(message);
    }

    addMessage(content, type) {
        const messageHTML = `
            <div class="ai-message ai-message-${type}">
                <div class="message-avatar">
                    ${type === 'bot' ? `
                        <svg viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="url(#msgGradient)"/>
                            <circle cx="9" cy="10" r="1" fill="#fff"/>
                            <circle cx="15" cy="10" r="1" fill="#fff"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    ` : '我'}
                </div>
                <div class="message-content">
                    <p>${content}</p>
                </div>
            </div>
        `;

        // 移除打字指示器
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator-container');
        if (typingIndicator) typingIndicator.remove();

        this.messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const indicatorHTML = `
            <div class="ai-message ai-message-bot typing-indicator-container">
                <div class="message-avatar">
                    <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="url(#msgGradient)"/>
                        <circle cx="9" cy="10" r="1" fill="#fff"/>
                        <circle cx="15" cy="10" r="1" fill="#fff"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                </div>
            </div>
        `;
        this.messagesContainer.insertAdjacentHTML('beforeend', indicatorHTML);
        this.scrollToBottom();
    }

    async simulateAIResponse(userMessage) {
        // 模拟思考延迟
        await this.delay(1000 + Math.random() * 1000);

        // 根据用户输入生成响应
        const response = this.generateResponse(userMessage);

        // 打字机效果显示响应
        await this.typewriterEffect(response.text, response.suggestions);
    }

    generateResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();

        // 简单的关键词匹配
        if (lowerMessage.includes('课件') || lowerMessage.includes('ppt')) {
            return {
                text: '我推荐您使用「AI课件生成」工具，它可以帮助您快速生成精美的课件，支持多种模板和风格！',
                suggestions: [{ name: 'AI课件生成', id: 'tool-1' }]
            };
        } else if (lowerMessage.includes('成绩') || lowerMessage.includes('分数')) {
            return {
                text: '关于成绩管理，我们有多个实用工具：',
                suggestions: [
                    { name: '成绩录入', id: 'tool-22' },
                    { name: '成绩分析', id: 'tool-23' }
                ]
            };
        } else if (lowerMessage.includes('作业') || lowerMessage.includes('批改')) {
            return {
                text: '「作业批改」工具可以帮助您用 AI 辅助批改作业，大大提高效率！',
                suggestions: [{ name: '作业批改', id: 'tool-25' }]
            };
        } else if (lowerMessage.includes('点名') || lowerMessage.includes('考勤')) {
            return {
                text: '推荐您使用以下工具进行班级管理：',
                suggestions: [
                    { name: '随机点名', id: 'tool-27' },
                    { name: '考勤统计', id: 'tool-12' }
                ]
            };
        } else {
            return {
                text: '您好！请告诉我您想要完成什么教学任务，我可以帮您推荐最合适的工具。比如：制作课件、批改作业、成绩分析等。',
                suggestions: []
            };
        }
    }

    async typewriterEffect(text, suggestions) {
        // 移除打字指示器
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator-container');
        if (typingIndicator) typingIndicator.remove();

        // 创建消息容器
        const messageHTML = `
            <div class="ai-message ai-message-bot">
                <div class="message-avatar">
                    <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="url(#msgGradient)"/>
                        <circle cx="9" cy="10" r="1" fill="#fff"/>
                        <circle cx="15" cy="10" r="1" fill="#fff"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="message-content">
                    <p class="typewriter-text"></p>
                    <div class="suggestions-container"></div>
                </div>
            </div>
        `;

        this.messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        const textElement = this.messagesContainer.querySelector('.ai-message:last-child .typewriter-text');
        const suggestionsContainer = this.messagesContainer.querySelector('.ai-message:last-child .suggestions-container');

        // 打字机效果
        for (let i = 0; i < text.length; i++) {
            textElement.textContent += text[i];
            this.scrollToBottom();
            await this.delay(20 + Math.random() * 30);
        }

        // 添加工具推荐按钮
        if (suggestions && suggestions.length > 0) {
            suggestions.forEach(tool => {
                const btnHTML = `
                    <button class="ai-tool-suggestion" data-tool-id="${tool.id}">
                        ✨ ${tool.name}
                    </button>
                `;
                suggestionsContainer.insertAdjacentHTML('beforeend', btnHTML);
            });

            // 绑定推荐按钮事件
            suggestionsContainer.querySelectorAll('.ai-tool-suggestion').forEach(btn => {
                btn.addEventListener('click', () => {
                    const toolId = btn.dataset.toolId;
                    console.log('打开推荐工具:', toolId);
                    this.closeDialog();
                    // TODO: 滚动到对应工具并高亮
                });
            });
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// ========================================
// 搜索控制器
// ========================================
class SearchController {
    constructor(renderer) {
        this.renderer = renderer;
        this.searchInput = document.getElementById('globalSearch');
        this.tagButtons = document.querySelectorAll('.tag-btn');

        this.bindEvents();
    }

    bindEvents() {
        // 搜索输入
        this.searchInput.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value.trim().toLowerCase();
            this.filterAndRender();
        });

        // 快捷键
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }
            if (e.key === 'Escape') {
                this.searchInput.blur();
                AppState.searchQuery = '';
                this.searchInput.value = '';
                this.filterAndRender();
            }
        });

        // 标签筛选
        this.tagButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tagButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.currentFilter = btn.dataset.filter;
                this.filterAndRender();
            });
        });
    }

    filterAndRender() {
        let filteredBlocks = JSON.parse(JSON.stringify(blocksData));

        // 应用搜索
        if (AppState.searchQuery) {
            filteredBlocks = filteredBlocks.map(block => {
                block.tools = block.tools.filter(tool =>
                    tool.name.toLowerCase().includes(AppState.searchQuery) ||
                    tool.description.toLowerCase().includes(AppState.searchQuery)
                );
                return block;
            }).filter(block => block.tools.length > 0);
        }

        // 应用筛选
        if (AppState.currentFilter === 'hot') {
            filteredBlocks = filteredBlocks.map(block => {
                block.tools = block.tools.filter(tool => tool.usageCount > 1000);
                return block;
            }).filter(block => block.tools.length > 0);
        } else if (AppState.currentFilter === 'ai') {
            filteredBlocks = filteredBlocks.filter(block =>
                block.id === 'ai-teaching' || block.name.includes('AI')
            );
        }

        this.renderer.renderBlocks(filteredBlocks);
    }
}

// ========================================
// 清除历史控制器
// ========================================
class ClearHistoryController {
    constructor(renderer) {
        this.renderer = renderer;
        this.clearBtn = document.getElementById('clearHistoryBtn');

        this.bindEvents();
    }

    bindEvents() {
        this.clearBtn.addEventListener('click', () => {
            AppState.recentTools = [];
            localStorage.removeItem('recentTools');
            this.renderer.renderRecentTools();
        });
    }
}

// ========================================
// 初始化应用
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 检查数据是否存在
    if (typeof blocksData === 'undefined') {
        console.error('数据文件 data.js 未加载');
        return;
    }

    // 初始化渲染器
    const renderer = new TeacherCenterRenderer();

    // 渲染板块
    renderer.renderBlocks(blocksData);

    // 渲染最近使用
    renderer.renderRecentTools();

    // 初始化 AI 助手
    new AIAssistantController();

    // 初始化搜索
    new SearchController(renderer);

    // 初始化清除历史
    new ClearHistoryController(renderer);

    // 响应式重新计算布局
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderer.renderBlocks(blocksData);
        }, 250);
    });

    console.log('✨ 教师中心已初始化');
});
