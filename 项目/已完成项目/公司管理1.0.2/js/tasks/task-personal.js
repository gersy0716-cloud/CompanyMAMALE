/**
 * 个人任务面板
 * 接管 TaskGlobal 的过滤逻辑，实现一致性的视觉体验
 */
const TaskPersonal = {
    /**
     * 加载我的任务
     */
    async load() {
        if (!Auth.currentUser) return;
        // 复用 TaskGlobal 的加载与过滤逻辑
        if (TaskGlobal.tasks.length === 0) {
            await TaskGlobal.load();
        }
        this.render();
    },

    /**
     * 渲染个人任务表格 — 统一调用 TaskGlobal 的核心渲染引擎
     */
    render() {
        TaskGlobal.render('personal');
    }
};
