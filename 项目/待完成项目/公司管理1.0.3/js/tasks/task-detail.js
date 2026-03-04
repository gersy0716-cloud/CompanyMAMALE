/**
 * 任务详情中心
 * 功能：展示详情、集成编辑、多执行人协作、子任务管理
 */
const TaskDetail = {
    currentTaskId: null,
    currentContext: 'global', // 'global' or 'personal'

    /**
     * 获取任务类型（主线/支线）
     */
    _getTaskType(task) {
        return task.task_type || '支线';
    },

    /**
     * 显示任务详情
     */
    show(taskId, context = 'global') {
        this.currentTaskId = taskId;
        this.currentContext = context;
        const task = TaskGlobal.tasks.find(t => t.id === taskId);
        if (!task) return Toast.show('任务不存在', 'error');

        const assignees = TaskGlobal._getAssignees(task);
        const subtasks = TaskGlobal.tasks.filter(t => t.parent_task_id === taskId);

        const priorityClass = TaskGlobal._getPriorityClass(task.priority);
        const statusClass = TaskGlobal._getStatusClass(task.status);

        this._renderModal(task, assignees, subtasks, priorityClass, statusClass);
    },

    /**
     * 渲染模态框内容
     */
    _renderModal(task, assignees, subtasks, priorityClass, statusClass) {
        const isAssignee = assignees.some(a => String(a.user_id) === String(Auth.currentUser?.id));
        const parentTask = task.parent_task_id ? TaskGlobal.tasks.find(t => t.id === task.parent_task_id) : null;
        const userTaskType = this._getTaskType(task);
        const isPersonalContext = this.currentContext === 'personal';

        // 解析附件
        let files = [];
        try {
            files = typeof task.files === 'string' ? JSON.parse(task.files) : (task.files || []);
        } catch (e) {
            console.error('解析附件失败:', e);
        }


        const bodyHtml = `
            <div class="task-detail-grid">
                <!-- 自定义关闭按钮 -->
                <div class="task-detail-close" onclick="Modal.close()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </div>

                <!-- 左侧：主内容区域 -->
                <div class="task-detail-main">
                    <h1 class="task-detail-title">${Utils.escapeHTML(task.name)}</h1>

                    <!-- 1. 任务类型切换 (如果是个人上下文) - 根据用户反馈移除切换逻辑，仅保留展示或完全移除 -->
                    ${isPersonalContext && isAssignee ? `
                        <div class="task-detail-section">
                            <div class="task-detail-label">我的职责类型</div>
                            <div style="display:flex; gap:12px;">
                                <div class="badge ${userTaskType === '支线' ? 'badge-secondary' : 'badge-danger'}" style="padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                                    ${userTaskType}任务
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- 2. 所属父任务 -->
                    ${parentTask ? `
                        <div class="task-detail-section">
                            <div class="task-detail-label">所属父任务</div>
                            <div class="assignee-info-card" style="cursor:pointer;" onclick="TaskDetail.show(${parentTask.id}, '${this.currentContext}')">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                <span style="font-size:13px; font-weight:600;">${Utils.escapeHTML(parentTask.name)}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:auto;"><polyline points="10 7 15 12 10 17"/></svg>
                            </div>
                        </div>
                    ` : ''}

                    <!-- 3. 任务描述 -->
                    <div class="task-detail-section">
                        <div class="task-detail-label">任务详细需求</div>
                        <div class="task-description-box ${task.description ? '' : 'empty'}" style="${!task.description ? 'color: #94a3b8 !important;' : ''}">
                            ${task.description ? Utils.escapeHTML(task.description) : '暂无详细描述'}
                        </div>
                    </div>


                    <!-- 5. 附件预览 (相关附件) -->
                    <div class="task-detail-section">
                        <div class="task-detail-label">相关附件 ${files.length > 0 ? `(${files.length})` : ''}</div>
                        <div id="task-detail-attachments-container">
                            ${FileUploadHelper.renderAttachments(task.files)}
                        </div>
                    </div>

                    <!-- 6. 最新报告 -->
                    ${task.remarks ? `
                        <div class="task-detail-section">
                            <div class="task-detail-label">最新进展进展</div>
                            <div style="background:#fff1f2; color:#be123c; border:1px solid #fecaca; border-radius:10px; padding:12px; font-size:13px; line-height:1.6;">
                                ${Utils.escapeHTML(task.remarks)}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- 右侧：侧边栏元数据 -->
                <div class="task-detail-sidebar">
                    <div style="font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 24px; letter-spacing: 0.1em;">任务属性</div>

                    <div class="sidebar-attr-item">
                        <div class="sidebar-attr-label">执行人</div>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${assignees.length > 0 ? assignees.map(a => `
                                <div class="assignee-info-card" style="margin-bottom:0px; padding: 6px 10px;">
                                    <div class="assignee-avatar" style="width:24px; height:24px; min-width:24px; font-size:10px; margin:0; background:${a.avatar_color}; border:none; box-shadow:none; cursor:default;">
                                        ${a.user_name.charAt(0)}
                                    </div>
                                    <span style="font-size:13px; font-weight:600; color: #334155;">${Utils.escapeHTML(a.user_name)}</span>
                                </div>
                            `).join('') : '<div style="font-size:12px; color:#94a3b8; font-style:italic; padding-left:4px;">待接取</div>'}
                        </div>
                    </div>

                    <div class="sidebar-attr-row">
                        <div class="sidebar-attr-item">
                            <div class="sidebar-attr-label">优先级</div>
                            <div class="priority-dot ${priorityClass}" style="width:100%; justify-content:center; padding:6px; font-size:12px; border-radius:8px;">
                                ${task.priority || '低'}
                            </div>
                        </div>

                        <div class="sidebar-attr-item">
                            <div class="sidebar-attr-label">当前进度</div>
                            <span class="progress-tag ${statusClass}" style="width:100%; justify-content:center; padding:6px; font-size:12px; border-radius:8px;">${task.status}</span>
                        </div>
                    </div>

                    ${task.deadline ? `
                        <div class="sidebar-attr-item">
                            <div class="sidebar-attr-label">截止日期</div>
                            <div class="assignee-info-card" style="color:#64748b; font-weight:700; font-size:13px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                ${Utils.formatDate(task.deadline)}
                            </div>
                        </div>
                    ` : ''}

                    <div style="position: absolute; bottom: 24px; right: 24px; display:flex; gap:16px; z-index: 10;">
                        <button class="btn btn-icon-only" style="background:none; color:#165dff; border:none; width:auto; height:auto; padding:0;" onclick="TaskGlobal.showEditModal(${task.id})" title="更新信息">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn-icon-only" style="background:none; color:#ef4444; border:none; width:auto; height:auto; padding:0;" onclick="TaskDetail.confirmDelete(${task.id})" title="删除此任务">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const footerHtml = '';

        Modal.open('', bodyHtml, footerHtml);
    },

    async toggleSubtask(id, checked) {
        const status = checked ? '已完成' : '进行中';
        try {
            // 使用数据库模式
            await DB.update(Config.TABLES.TASKS, id, { status });
            this.show(this.currentTaskId);
        } catch (err) { Toast.show('操作失败', 'error'); }
    },

    confirmDelete(id) {
        TaskGlobal.deleteTask(id).then(() => Modal.close());
    },



    showSubtaskAdder(taskId) {
        const targetId = taskId || this.currentTaskId;
        Modal.close();
        const task = TaskGlobal.tasks.find(t => t.id === targetId);
        if (!task) return;

        TaskGlobal.showAddModal();

        const originalAddTask = TaskGlobal.addTask.bind(TaskGlobal);
        TaskGlobal.addTask = async () => {
            const title = document.getElementById('task-title').value.trim();
            if (!title) return Toast.show('内容必填', 'warning');

            const data = {
                name: title,
                parent_task_id: String(task.id),
                task_type: '支线',
                priority: document.getElementById('task-priority').value,
                deadline: document.getElementById('task-deadline').value || null,
                description: document.getElementById('task-description').value.trim() || null,
                remarks: null,
                status: '待接取',
                assignees: '[]',
                creator_id: String(Auth.currentUser?.id || '')
            };
            try {
                // 使用数据库模式
                await DB.create(Config.TABLES.TASKS, data);
                await TaskGlobal.load(); // 刷新全局数据
                Modal.close();
                // 延时刷新详情，等数据同步
                setTimeout(() => {
                    if (document.getElementById('tasks-personal-list')) {
                        TaskGlobal.render('personal');
                    } else {
                        TaskGlobal.render('global');
                    }
                    if (this.currentTaskId === task.id) {
                        this.show(task.id);
                    }
                }, 300);
                Toast.show('已添加执行分项', 'success');
            } catch (err) {
                console.error('[Detail] 子任务添加失败:', err);
                Toast.show('添加失败', 'error');
            } finally {
                TaskGlobal.addTask = originalAddTask;
            }
        };
    }
};
