/**
 * 全局任务面板
 * 所有人的任务统一展示，表格视图
 */
const TaskGlobal = {
    tasks: [],
    currentFilter: 'all',
    personalFilter: 'all',
    userFilter: 'all',
    _collapsedTasks: new Set(),

    /**
     * 加载全部任务
     */
    async load() {
        try {
            const tasks = await DB.queryAll(Config.TABLES.TASKS);
            this.tasks = tasks;
            this._populateUserFilter();
            this.render();
        } catch (err) {
            console.error('加载任务失败:', err);
            Toast.show('加载任务失败', 'error');
        }
    },

    /**
     * 填充用户筛选下拉框
     */
    _populateUserFilter() {
        const select = document.getElementById('global-user-filter');
        if (!select) return;
        const current = this.userFilter;
        const users = Auth.allUsers || [];
        select.innerHTML = '<option value="all">全部成员</option>' +
            users.map(u => {
                const name = u.real_name || u.name;
                const selected = String(u.id) === current ? ' selected' : '';
                return `<option value="${u.id}"${selected}>${Utils.escapeHTML(name)}</option>`;
            }).join('');
    },

    /**
     * 按状态筛选
     */
    filterByStatus(status) {
        this.currentFilter = status;
        document.querySelectorAll('#page-tasks-global .filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.status === status);
        });
        this.render();
    },

    /**
     * 个人任务按类型筛选（全部/主线/支线）
     */
    filterPersonalByType(type) {
        this.personalFilter = type;
        document.querySelectorAll('#page-tasks-personal .filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });
        this.render('personal');
    },

    /**
     * 全局任务按执行人筛选
     */
    filterByUser(userId) {
        this.userFilter = userId;
        this.render();
    },

    /**
     * 渲染任务列表
     */
    render(pageContext = 'global') {
        const containerId = pageContext === 'global' ? 'tasks-global-list' : 'tasks-personal-list';
        const container = document.getElementById(containerId);
        if (!container) return;

        let filtered = this.tasks;
        if (pageContext === 'global') {
            if (this.currentFilter !== 'all') {
                filtered = filtered.filter(t => t.status === this.currentFilter);
            }
            if (this.userFilter !== 'all') {
                filtered = filtered.filter(t => {
                    const assignees = this._getAssignees(t);
                    return assignees.some(a => String(a.user_id) === String(this.userFilter));
                });
            }
        } else if (pageContext === 'personal') {
            // 个人任务：仅展示我认领的任务，排除已完成的任务
            filtered = this.tasks.filter(t => {
                const assignees = this._getAssignees(t);
                const isMyTask = assignees.some(a => String(a.user_id) === String(Auth.currentUser?.id));
                const isCompleted = t.status === '已完成';
                return isMyTask && !isCompleted;
            });

            // 按主线/支线筛选
            if (this.personalFilter !== 'all') {
                filtered = filtered.filter(t => {
                    const taskType = t.task_type || '支线';
                    return taskType === this.personalFilter;
                });
            }

            // 个人任务：主线任务置顶排序
            filtered.sort((a, b) => {
                const typeA = this._getTaskType(a);
                const typeB = this._getTaskType(b);
                if (typeA === '主线' && typeB !== '主线') return -1;
                if (typeA !== '主线' && typeB === '主线') return 1;
                return 0;
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 60px 0; text-align: center; color: #94a3b8;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="margin-bottom: 16px; opacity: 0.5;">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                    <p style="font-size: 16px; font-weight: 600; color: #64748b; margin-bottom: 4px;">暂无相关任务</p>
                    <span style="font-size: 13px; opacity: 0.8;">${pageContext === 'global' ? '点击右上角「新建任务」开启协作' : '您当前还没有接取任何任务或所有任务已完成'}</span>
                </div>
            `;
            return;
        }

        this._renderTable(container, filtered, pageContext);
    },

    /**
     * 切换子任务折叠/展开
     */
    toggleSubtasks(taskId) {
        const id = String(taskId);
        if (this._collapsedTasks.has(id)) {
            this._collapsedTasks.delete(id);
        } else {
            this._collapsedTasks.add(id);
        }
        // 根据当前活动页面刷新对应视图
        if (App.currentPage === 'tasks-personal') {
            this.render('personal');
        } else {
            this.render('global');
        }
    },

    /**
     * 渲染表格视图
     */
    _renderTable(container, tasks, pageContext) {
        // 识别渲染根节点：1. 没有父任务的任务；2. 其父任务不在当前"待渲染"列表中的子任务 (孤儿节点)
        const renderRoots = tasks.filter(t => {
            if (!t.parent_task_id) return true;
            return !tasks.some(p => String(p.id) === String(t.parent_task_id));
        });

        const rows = renderRoots.map((task) => {
            return this._renderRecursiveTask(task, tasks, pageContext, '');
        }).join('');

        const headers = pageContext === 'personal' ? `
            <th style="font-weight: 700;">任务标题</th>
            <th style="font-weight: 700;">紧急程度</th>
            <th style="font-weight: 700;">进展</th>
            <th style="font-weight: 700;">截止日期</th>
            <th style="text-align: center; font-weight: 700;">交互操作</th>
        ` : `
            <th style="font-weight: 700;">任务标题</th>
            <th style="font-weight: 700;">紧急程度</th>
            <th style="font-weight: 700;">当前阶段</th>
            <th style="font-weight: 700;">执行人</th>
            <th style="text-align: center; font-weight: 700;">交互操作</th>
        `;

        container.innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    },

    /**
     * 递归渲染任务行（支持无限层级嵌套）
     */
    _renderRecursiveTask(task, allTasks, pageContext, prefix = '', isLast = true) {
        const subtasks = allTasks.filter(t => String(t.parent_task_id) === String(task.id));
        const progressClass = this._getStatusClass(task.status);
        const priorityClass = this._getPriorityClass(task.priority);
        const assignees = this._getAssignees(task);
        const statusAction = this._getStatusAction(task, pageContext);

        // 检查备注是否有"问题"关键词
        const hasProblem = task.remarks && (task.remarks.includes('问题') || task.remarks.includes('出错') || task.remarks.includes('反馈') || task.remarks.includes('失败'));
        const isSubtask = !!task.parent_task_id;
        const isParentTask = subtasks.length > 0;
        const isCollapsed = this._collapsedTasks.has(String(task.id));

        // 折叠/展开箭头（仅有子任务的父任务显示）
        const toggleIcon = isParentTask ? `<span class="task-toggle-icon" onclick="event.stopPropagation(); TaskGlobal.toggleSubtasks(${task.id})" style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; margin-right:4px; cursor:pointer; border-radius:4px; transition:all 0.2s; flex-shrink:0;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.2s; transform:rotate(${isCollapsed ? '0' : '90'}deg);"><polyline points="9 18 15 12 9 6"/></svg></span>` : '';

        // 在"我的任务"中，如果是子任务但父任务不在列表中，则按父任务样式显示
        let treatAsParent = false;
        if (pageContext === 'personal' && isSubtask) {
            const parentInList = allTasks.some(t => String(t.id) === String(task.parent_task_id));
            treatAsParent = !parentInList;
        }

        // 动态行样式
        let rowClass = '';
        if (hasProblem) {
            rowClass = 'task-row-error';
        } else if (isSubtask && !treatAsParent) {
            rowClass = 'task-subtask-row';
        } else if (isParentTask) {
            rowClass = 'task-parent-row';
        }

        // 渲染当前任务行
        const subtaskStyle = (isSubtask && !treatAsParent) ? 'style="font-size:14px; font-weight:500;"' : 'style="font-weight:600;"';

        let html = `
            <tr class="${rowClass}">
                <td class="task-title-cell" onclick="TaskDetail.show(${task.id}, '${pageContext}')">
                    <div class="task-title-link" ${subtaskStyle}>
                        ${toggleIcon}
                        ${pageContext === 'personal' && this._getTaskType(task) === '主线' ? '<span class="task-type-badge main">主线</span>' : ''}
                        ${(() => {
                if (pageContext === 'personal' && task.parent_task_id) {
                    const parent = this.tasks.find(p => String(p.id) === String(task.parent_task_id));
                    if (parent) {
                        return `<span style="font-size: 11px; color: #94a3b8; font-weight: 400; margin-right: 4px;">${Utils.escapeHTML(parent.name)} /</span>`;
                    }
                }
                return '';
            })()}
                        ${Utils.escapeHTML(task.name)}
                        ${pageContext === 'global' && task.task_type === '主线' ? '<span style="display:inline-block; font-size:11px; font-weight:700; color:#fff; background:linear-gradient(135deg,#4080FF,#6C5CE7); padding:1px 6px; border-radius:4px; margin-left:6px; vertical-align:middle;">主</span>' : ''}
                        ${pageContext === 'global' && !task.parent_task_id ? `<button class="btn-status-action btn-action-decompose task-decompose-btn" onclick="event.stopPropagation(); TaskDetail.showSubtaskAdder(${task.id})">建子任务</button>` : ''}
                    </div>
                </td>
                <td>
                    <span class="priority-dot ${priorityClass}">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                        ${Utils.escapeHTML(task.priority || '低')}
                    </span>
                </td>
                <td>
                    <span class="progress-tag ${progressClass}">${task.status || '待接取'}</span>
                    ${task.status === '进行中' ? this._renderProgressBar(task) : ''}
                </td>
                ${pageContext === 'personal' ? `<td><span class="task-date">${task.deadline ? Utils.formatDate(task.deadline) : '-'}</span></td>` : `
                <td>
                    <div class="assignee-group" style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                        ${assignees.length > 0 ? assignees.map(a => {
                const user = Auth.getUser(a.user_id || a);
                return `
                            <div class="assignee-avatar"
                                 style="background:${user.avatar_color}"
                                 title="${Utils.escapeHTML(user.display_name)}">
                                ${user.avatar_initial}
                            </div>
                        `;
            }).join('') : '<span style="color:#94a3b8; font-size:12px; font-weight:500;">待接取</span>'}
                        ${(Auth.currentUser?.name === 'leijun' || Auth.currentUser?.role === 'admin') ? `<button class="btn-status-action" onclick="event.stopPropagation(); TaskGlobal.showAssignModal(${task.id})" style="font-size:11px; padding:2px 8px; background:#f0f9ff; color:#0284c7; border:1px solid #bae6fd; border-radius:6px; cursor:pointer; white-space:nowrap;">安排</button>` : ''}
                    </div>
                </td>`}
                <td>
                    <div class="task-ops-group">
                        ${statusAction}
                    </div>
                </td>
            </tr>
        `;

        // 递归渲染子任务（折叠时跳过）
        if (subtasks.length > 0 && !isCollapsed) {
            subtasks.forEach((st, index) => {
                html += this._renderRecursiveTask(st, allTasks, pageContext, '', index === subtasks.length - 1);
            });
        }

        return html;
    },

    /**
     * 获取任务类型（主线/支线）
     */
    _getTaskType(task) {
        return task.task_type || '支线';
    },

    /**
     * 解析执行人列表
     */
    _getAssignees(task) {
        if (task.assignees) return Array.isArray(task.assignees) ? task.assignees : JSON.parse(task.assignees);
        if (task.assignee) {
            return [{
                user_id: task.assignee_id,
                user_name: task.assignee,
                avatar_color: 'var(--primary)'
            }];
        }
        return [];
    },

    /**
     * 渲染进度条（仅进行中的任务显示）
     */
    _renderProgressBar(task) {
        const progress = parseInt(task.progress) || 0;
        const color = progress >= 80 ? '#16a34a' : progress >= 50 ? '#f59e0b' : '#4080FF';
        return `
            <div class="task-progress-wrap" onclick="event.stopPropagation(); TaskGlobal.incrementProgress(${task.id})" title="点击增加10%进度 (当前${progress}%)">
                <div class="task-progress-bar">
                    <div class="task-progress-fill" style="width:${progress}%; background:${color};"></div>
                </div>
                <span class="task-progress-text" style="color:${color};">${progress}%</span>
            </div>
        `;
    },

    /**
     * 点击增加10%进度
     */
    async incrementProgress(taskId) {
        const task = this.tasks.find(t => String(t.id) === String(taskId));
        if (!task) return;

        let progress = parseInt(task.progress) || 0;
        progress = Math.min(progress + 10, 100);

        try {
            await DB.update(Config.TABLES.TASKS, taskId, { progress: String(progress) });
            task.progress = String(progress);
            // 刷新当前视图
            if (App.currentPage === 'tasks-personal') {
                this.render('personal');
            } else {
                this.render('global');
            }
            Toast.show(`进度已更新: ${progress}%`, 'success');
        } catch (err) {
            console.error('更新进度失败:', err);
            Toast.show('更新进度失败', 'error');
        }
    },

    /**
     * 获取状态操作按钮
     */
    _getStatusAction(task, context) {
        const assignees = this._getAssignees(task);
        const isMyTask = assignees.some(a => String(a.user_id) === String(Auth.currentUser?.id));
        const isCompleted = task.status === '已完成';

        if (isCompleted) return '<span class="action-info-tag" style="background:#f1f5f9; color:#64748b;">任务已归档</span>';

        let html = '';

        if (context === 'global') {
            if (!isMyTask) {
                html += `<button class="btn-status-action btn-action-pickup" onclick="event.stopPropagation(); TaskGlobal.pickUpTask(${task.id})">接取</button>`;
            } else {
                html += `<button class="btn-status-action btn-action-already-taken" onclick="event.stopPropagation(); App.navigate('tasks-personal')">已接取</button>`;
            }
        } else {
            // 个人任务中：完成按钮 + 情况汇报 + 放弃
            html += `<button class="btn-status-action btn-action-complete" onclick="event.stopPropagation(); TaskGlobal.completeTask(${task.id})" style="background:#dcfce7; color:#16a34a; border:1px solid #bbf7d0;">完成</button>`;
            html += `<button class="btn-status-action btn-action-remark" onclick="event.stopPropagation(); TaskGlobal.showRemarkModal(${task.id})" style="background:#f0f9ff; color:#0284c7; border:1px solid #bae6fd;">情况汇报</button>`;
            html += `<button class="btn-status-action btn-action-abandon" onclick="event.stopPropagation(); TaskGlobal.abandonTask(${task.id})">放弃</button>`;
        }

        return html;
    },

    /**
     * 获取任务类型（主线/支线）
     */
    _getTaskType(task) {
        return task.task_type || '支线';
    },

    /**
     * 接取任务
     * 逻辑：接取父任务会自动接取所有子任务，接取子任务不影响父任务
     */
    async pickUpTask(taskId) {
        if (!Auth.currentUser) return Toast.show('请先登录', 'warning');

        const currentUser = {
            user_id: Auth.currentUser.id,
            user_name: Auth.currentUser.real_name || Auth.currentUser.name,
            avatar_color: Auth.currentUser.avatar_color || 'var(--primary)'
        };

        const targetTask = this.tasks.find(t => String(t.id) === String(taskId));
        if (!targetTask) return Toast.show('任务不存在', 'error');

        // 核心更新处理函数
        const propagatePickup = (id) => {
            const task = this.tasks.find(t => String(t.id) === String(id));
            if (!task) return;

            let assignees = this._getAssignees(task);
            const alreadyIn = assignees.some(a => String(a.user_id) === String(currentUser.user_id));

            if (!alreadyIn) {
                assignees.push(currentUser);
                task.assignees = JSON.stringify(assignees);
                task.status = '进行中';
                task.assignee = assignees[0].user_name;
                task.assignee_id = assignees[0].user_id;
            }
        };

        // 递归查找所有后代任务
        const getAllDescendants = (parentId) => {
            let descendants = [];
            const children = this.tasks.filter(t => String(t.parent_task_id) === String(parentId));
            for (const child of children) {
                descendants.push(child);
                descendants = descendants.concat(getAllDescendants(child.id));
            }
            return descendants;
        };

        try {
            // 接取当前任务
            propagatePickup(taskId);

            // 自动接取所有子孙任务
            const descendants = getAllDescendants(taskId);
            if (descendants.length > 0) {
                console.log('[接取任务] 找到后代任务:', descendants.map(st => st.id));
                descendants.forEach(st => propagatePickup(st.id));
            }

            // 使用数据库模式
            console.log('[接取任务] 当前用户ID:', currentUser.user_id);
            const affected = this.tasks.filter(t => {
                const ans = this._getAssignees(t);
                console.log(`[接取任务] 任务 ${t.id} 的 assignees:`, ans);
                const hasUser = ans.some(a => String(a.user_id) === String(currentUser.user_id));
                console.log(`[接取任务] 任务 ${t.id} 是否包含当前用户:`, hasUser);
                return hasUser;
            });
            console.log('[接取任务] 需要更新的任务:', affected.map(t => ({ id: t.id, name: t.name })));
            for (const t of affected) {
                try {
                    const result = await DB.update(Config.TABLES.TASKS, t.id, {
                        assignees: t.assignees,
                        status: t.status,
                        assignee: t.assignee,
                        assignee_id: t.assignee_id
                    });
                    console.log('[接取任务] 任务更新成功:', t.id, result);
                } catch (updateErr) {
                    console.error('[接取任务] 任务更新失败:', t.id, updateErr);
                    throw updateErr;
                }
            }
            // 重新加载任务数据，确保与数据库同步
            await this.load();

            const message = isParentTask ? '已接取任务及其所有子任务' : '已接取任务';
            Toast.show(message, 'success');

            // 智能刷新：根据当前页面渲染对应视图
            if (document.getElementById('tasks-personal-list')) {
                this.render('personal');
            } else if (document.getElementById('tasks-global-list')) {
                this.render('global');
            }
        } catch (err) {
            console.error('[接取任务] 错误:', err);
            Toast.show('接取失败', 'error');
        }
    },

    async changeStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        try {
            const updateData = { status: newStatus };
            // 使用数据库模式
            await DB.update(Config.TABLES.TASKS, taskId, updateData);
            task.status = newStatus;
            Toast.show(`已成功标记为: ${newStatus}`, 'success');

            // 智能刷新：根据当前页面渲染对应视图
            if (document.getElementById('tasks-personal-list')) {
                this.render('personal');
            } else if (document.getElementById('tasks-global-list')) {
                this.render('global');
            }
        } catch (err) {
            Toast.show('操作失败', 'error');
        }
    },

    async completeTask(taskId) {
        await this.changeStatus(taskId, '已完成');
    },

    async abandonTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // 检查是否是父任务
        const isParentTask = this.tasks.some(t => String(t.parent_task_id) === String(taskId));
        const tasksToAbandon = [task];

        // 如果是父任务，收集所有子任务
        if (isParentTask) {
            const subtasks = this.tasks.filter(t => String(t.parent_task_id) === String(taskId));
            tasksToAbandon.push(...subtasks);
        }

        try {
            // 处理每个需要放弃的任务
            for (const t of tasksToAbandon) {
                let assignees = this._getAssignees(t);
                assignees = assignees.filter(a => String(a.user_id) !== String(Auth.currentUser.id));

                const updateData = {
                    assignees: JSON.stringify(assignees),
                    status: assignees.length === 0 ? '待接取' : t.status,
                    assignee: assignees.length > 0 ? assignees[0].user_name : null,
                    assignee_id: assignees.length > 0 ? assignees[0].user_id : null
                };

                // 使用数据库模式
                await DB.update(Config.TABLES.TASKS, t.id, updateData);
                Object.assign(t, updateData);
            }

            const message = isParentTask ? '已放弃任务及其所有子任务' : '已放弃任务';
            Toast.show(message, 'info');

            // 重新加载数据以确保同步
            await this.load();

            // 智能刷新：根据当前页面渲染对应视图
            if (document.getElementById('tasks-personal-list')) {
                this.render('personal');
            } else if (document.getElementById('tasks-global-list')) {
                this.render('global');
            }
        } catch (err) {
            console.error('[放弃任务] 错误:', err);
            Toast.show('操作失败', 'error');
        }
    },

    showRemarkModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        Modal.open('任务情况汇报', `
            <div class="form-group">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">历史汇报记录</label>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; font-size:13px; color:#64748b; min-height:60px; margin-bottom:16px; max-height:200px; overflow-y:auto;">
                    ${task.remarks ? Utils.escapeHTML(task.remarks) : '<span style="font-style:italic; opacity:0.6;">暂无汇报记录</span>'}
                </div>
            </div>
            <div class="form-group">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">提交新的情况汇报</label>
                <textarea id="new-remark" rows="4" placeholder="汇报项目进度、遇到的问题、需要的帮助等..." style="border-radius:10px; padding:12px; font-size:14px;"></textarea>
                <div style="margin-top:8px; font-size:12px; color:#94a3b8;">
                    💡 提示：汇报将追加到历史记录中，并显示时间戳和汇报人
                </div>
            </div>
        `, `
            <button class="btn btn-primary" style="height:40px; border-radius:10px; padding:0 24px; font-weight:700;" onclick="TaskGlobal.addRemark(${taskId})">提交汇报</button>
        `);
    },

    async addRemark(taskId) {
        const newRemark = document.getElementById('new-remark').value.trim();
        if (!newRemark) return Toast.show('请输入汇报内容', 'warning');

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const timestamp = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const userName = Auth.currentUser?.real_name || Auth.currentUser?.name || '未知用户';
        const remarkEntry = `[${timestamp} ${userName}]\n${newRemark}`;

        const updatedRemarks = task.remarks
            ? `${task.remarks}\n\n${remarkEntry}`
            : remarkEntry;

        try {
            const updateData = { remarks: updatedRemarks };
            // 使用数据库模式
            await DB.update(Config.TABLES.TASKS, taskId, updateData);
            task.remarks = updatedRemarks;
            Modal.close();
            Toast.show('情况汇报已提交', 'success');
            this.render('personal');
        } catch (err) {
            Toast.show('提交失败', 'error');
        }
    },

    async deleteTask(taskId) {
        try {
            console.log('开始删除任务:', taskId);
            // 使用数据库模式
            console.log('调用数据库删除:', Config.TABLES.TASKS, taskId);
            await DB.remove(Config.TABLES.TASKS, taskId);
            console.log('数据库删除成功，重新加载任务列表');
            await this.load(); // 重新加载任务列表以确保同步

            // 智能刷新：根据当前页面渲染对应视图
            if (document.getElementById('tasks-personal-list')) {
                this.render('personal');
            } else if (document.getElementById('tasks-global-list')) {
                this.render('global');
            }

            Toast.show('任务已删除', 'info');
        } catch (err) {
            console.error('删除任务失败:', err);
            Toast.show('删除失败: ' + (err.message || '未知错误'), 'error');
        }
    },

    /**
     * 安排工作 — 弹出人员选择（仅 leijun 可用）
     */
    showAssignModal(taskId) {
        const task = this.tasks.find(t => String(t.id) === String(taskId));
        if (!task) return;

        const currentAssignees = this._getAssignees(task);
        const currentIds = currentAssignees.map(a => String(a.user_id));
        const users = Auth.allUsers || [];

        const userCheckboxes = users.map(u => {
            const checked = currentIds.includes(String(u.id)) ? 'checked' : '';
            const color = u.avatar_color || '#9281FF';
            const displayName = u.real_name || u.name;
            return `
                <label style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <input type="checkbox" name="assign-user" value="${u.id}" ${checked} style="width:16px; height:16px; accent-color:#4080FF;">
                    <div style="width:28px; height:28px; border-radius:50%; background:${color}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:700; flex-shrink:0;">${displayName.charAt(0)}</div>
                    <span style="font-size:14px; font-weight:500; color:#334155;">${Utils.escapeHTML(displayName)}</span>
                </label>
            `;
        }).join('');

        Modal.open('安排工作 — ' + Utils.escapeHTML(task.name), `
            <div style="max-height:400px; overflow-y:auto;">
                ${userCheckboxes}
            </div>
        `, `
            <button class="btn btn-primary" style="height:40px; border-radius:10px; padding:0 24px; font-weight:700;" onclick="TaskGlobal.assignTask(${taskId})">确认安排</button>
        `);
    },

    /**
     * 提交安排工作
     */
    async assignTask(taskId) {
        const task = this.tasks.find(t => String(t.id) === String(taskId));
        if (!task) return;

        // 记录旧的执行人列表，用于对比新增
        const oldAssignees = this._getAssignees(task);

        const checkboxes = document.querySelectorAll('input[name="assign-user"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);

        // 构建新的 assignees 列表
        const allUsers = Auth.allUsers || [];
        const newAssignees = selectedIds.map(uid => {
            const user = allUsers.find(u => String(u.id) === String(uid));
            return {
                user_id: uid,
                user_name: user?.real_name || user?.name || '未知',
                avatar_color: user?.avatar_color || 'var(--primary)'
            };
        });

        try {
            const updateData = {
                assignees: JSON.stringify(newAssignees),
                status: newAssignees.length > 0 ? '进行中' : '待接取',
                assignee: newAssignees.length > 0 ? newAssignees[0].user_name : null,
                assignee_id: newAssignees.length > 0 ? newAssignees[0].user_id : null
            };

            await DB.update(Config.TABLES.TASKS, taskId, updateData);
            Object.assign(task, updateData);

            // 发送消息通知给新增的执行人
            if (typeof Messages !== 'undefined') {
                const oldIds = oldAssignees.map(a => String(a.user_id));
                const sender = Auth.currentUser;
                for (const a of newAssignees) {
                    if (!oldIds.includes(String(a.user_id))) {
                        console.log('[安排任务] 发送消息给:', a.user_name, a.user_id);
                        await Messages.send({
                            type: 'task_assigned',
                            content: `你有一个新任务: ${task.name}`,
                            recipientId: a.user_id,
                            senderId: sender?.id,
                            senderName: sender?.real_name || sender?.name,
                            refType: 'task',
                            refId: taskId
                        });
                    }
                }
            }

            Modal.close();
            Toast.show('工作安排成功', 'success');
            await this.load();
        } catch (err) {
            console.error('安排工作失败:', err);
            Toast.show('安排失败: ' + err.message, 'error');
        }
    },

    _getStatusClass(s) {
        const m = { '待接取': 'prog-pending', '进行中': 'prog-doing', '已完成': 'prog-done', '待验收': 'prog-waiting' };
        return m[s] || 'prog-pending';
    },

    _getPriorityClass(p) {
        const m = { '高': 'p-high', '中': 'p-medium', '低': 'p-low' };
        return m[p] || 'p-medium';
    },



    showAddModal() {
        Modal.open('创建新任务', `
            <div class="form-group">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">任务标题</label>
                <input type="text" id="task-title" placeholder="简述任务内容..." style="height:44px; font-size:15px; border-radius:10px;">
            </div>
            <div class="form-row" style="margin-top:20px;">
                <div class="form-group" style="flex:1">
                    <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">紧急程度</label>
                    <select id="task-priority" style="height:44px; border-radius:10px;">
                        <option value="高">高</option>
                        <option value="中" selected>中</option>
                        <option value="低">低</option>
                    </select>
                </div>
                <div class="form-group" style="flex:1">
                    <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">截止日期 (选填)</label>
                    <input type="date" id="task-deadline" style="height:44px; border-radius:10px;">
                </div>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; user-select:none;">
                    <input type="checkbox" id="task-is-main" style="width:18px; height:18px; accent-color:#4080FF; cursor:pointer;">
                    <span style="font-weight:700; color:#475569;">主线任务</span>
                    <span style="font-size:12px; color:#94a3b8; font-weight:400;">主线任务为公司交办的事情</span>
                </label>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">详细需求</label>
                <textarea id="task-description" rows="4" placeholder="补充任务细节..." style="border-radius:10px; padding:12px; font-size:14px;"></textarea>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">附件上传</label>
                <div class="file-upload-zone" id="task-file-zone" onclick="document.getElementById('task-file-input').click()">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <p style="margin-top:12px; font-size:14px; font-weight:600; color:#64748b;">点击或拖拽文件到此处上传</p>
                    <span style="margin-top:4px; font-size:12px; color:#94a3b8;">支持图片、文档等文件格式，单个文件不超过20MB</span>
                    <input type="file" id="task-file-input" multiple style="display:none;" onchange="TaskGlobal.handleFileUpload(event)">
                </div>
                <div id="task-file-list" class="file-list" style="margin-top:12px;"></div>
            </div>
        `, `
            <button class="btn btn-primary" style="height:40px; border-radius:10px; padding:0 24px; font-weight:700;" onclick="TaskGlobal.addTask()">立即发布</button>
        `);
        this._initFileDropZone();
    },

    /**
     * 初始化文件拖拽区域
     */
    _initFileDropZone(zoneId = 'task-file-zone') {
        const zone = document.getElementById(zoneId);
        if (!zone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
            zone.addEventListener(name, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        zone.addEventListener('dragover', () => zone.classList.add('active'));
        zone.addEventListener('dragleave', () => zone.classList.remove('active'));
        zone.addEventListener('drop', (e) => {
            zone.classList.remove('active');
            this.handleFileUpload(e, zoneId);
        });
    },

    /**
     * 处理文件上传
     */
    handleFileUpload(event, zoneId = 'task-file-zone') {
        const files = event.target.files || event.dataTransfer.files;
        if (!files || files.length === 0) return;

        const fileListId = zoneId === 'edit-task-file-zone' ? 'edit-task-file-list' : 'task-file-list';
        const fileList = document.getElementById(fileListId);
        if (!fileList) return;

        Array.from(files).forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                Toast.show(`${file.name} 文件大小超过20MB，无法上传`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = e.target.result;

                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.dataset.fileData = fileData;
                fileItem.dataset.fileName = file.name;
                fileItem.dataset.fileSize = this._formatFileSize(file.size);
                fileItem.dataset.fileType = file.type;
                fileItem.fileObject = file; // 核心：保存原始 File 对象用于上传
                fileItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    transition: all 0.2s;
                `;

                console.log(`[文件解析] 准备处理文件: ${file.name} (${file.size} bytes)`);
                const fileIcon = document.createElement('div');
                fileIcon.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    background: #eff6ff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                `;

                const isImage = file.type.startsWith('image/');
                if (isImage) {
                    const img = document.createElement('img');
                    img.src = fileData;
                    img.style.cssText = `
                        width: 24px;
                        height: 24px;
                        border-radius: 4px;
                        object-fit: cover;
                    `;
                    fileIcon.appendChild(img);
                } else {
                    fileIcon.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                    `;
                }

                const fileInfo = document.createElement('div');
                fileInfo.style.cssText = `
                    flex: 1;
                    min-width: 0;
                `;

                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.textContent = file.name;
                fileName.style.cssText = `
                    font-size: 14px;
                    font-weight: 500;
                    color: #334155;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                `;

                const fileSize = document.createElement('div');
                fileSize.className = 'file-size';
                fileSize.textContent = this._formatFileSize(file.size);
                fileSize.style.cssText = `
                    font-size: 12px;
                    color: #94a3b8;
                    margin-top: 2px;
                `;

                fileInfo.appendChild(fileName);
                fileInfo.appendChild(fileSize);

                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                `;
                removeBtn.style.cssText = `
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                `;
                removeBtn.onmouseover = function () {
                    this.style.background = '#fee2e2';
                    this.querySelector('svg').style.stroke = '#ef4444';
                };
                removeBtn.onmouseout = function () {
                    this.style.background = 'none';
                    this.querySelector('svg').style.stroke = '#94a3b8';
                };
                removeBtn.onclick = function () {
                    fileItem.remove();
                };

                fileItem.appendChild(fileIcon);
                fileItem.appendChild(fileInfo);
                fileItem.appendChild(removeBtn);
                fileList.appendChild(fileItem);
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * 格式化文件大小
     */
    _formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    showEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // 检查当前用户是否是任务的执行人
        const assignees = this._getAssignees(task);
        const isAssignee = assignees.some(a => String(a.user_id) === String(Auth.currentUser?.id));
        const taskTypeDisabled = !isAssignee ? 'disabled' : '';

        // 生成当前文件列表HTML
        let currentFilesHTML = '';
        if (task.files) {
            try {
                const files = typeof task.files === 'string' ? JSON.parse(task.files) : task.files;
                if (Array.isArray(files) && files.length > 0) {
                    currentFilesHTML = `
                        <div class="form-group" style="margin-top:12px;">
                            <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">当前附件</label>
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px;">
                                ${files.map((file, index) => `
                                    <div id="current-file-${index}" 
                                         data-file-name="${Utils.escapeHTML(file.name)}" 
                                         data-file-size="${file.size}" 
                                         data-file-url="${file.url || ''}" 
                                         data-file-data="${file.data || ''}" 
                                         data-file-type="${file.type || ''}" 
                                         style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                                        <div style="width:24px; height:24px; border-radius:4px; background:#eff6ff; display:flex; align-items:center; justify-content:center;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                <polyline points="14 2 14 8 20 8"/>
                                            </svg>
                                        </div>
                                        <div style="flex:1;">
                                            <div style="font-size:13px; font-weight:500; color:#334155;">${Utils.escapeHTML(file.name)}</div>
                                            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${file.size}</div>
                                        </div>
                                        <button style="background:#fef2f2; color:#dc2626; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;" onclick="event.stopPropagation(); this.closest('div[id^=current-file-]').remove();">
                                            删除
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            } catch (e) {
                console.error('解析文件信息失败:', e);
            }
        }

        Modal.open('更新信息', `
            <div class="form-group">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">任务标题</label>
                <input type="text" id="edit-task-title" value="${Utils.escapeHTML(task.name || '')}" style="height:44px; font-size:15px; border-radius:10px;">
            </div>
            <div class="form-row" style="margin-top:20px;">
                <div class="form-group" style="flex:1">
                    <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">紧急程度</label>
                    <select id="edit-task-priority" style="height:44px; border-radius:10px;">
                        <option value="高" ${task.priority === '高' ? 'selected' : ''}>高</option>
                        <option value="中" ${task.priority === '中' ? 'selected' : ''}>中</option>
                        <option value="低" ${task.priority === '低' ? 'selected' : ''}>低</option>
                    </select>
                </div>
                <div class="form-group" style="flex:1">
                    <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">截止日期 (选填)</label>
                    <input type="date" id="edit-task-deadline" value="${task.deadline || ''}" style="height:44px; border-radius:10px;">
                </div>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; user-select:none;">
                    <input type="checkbox" id="edit-task-is-main" ${task.task_type === '主线' ? 'checked' : ''} style="width:18px; height:18px; accent-color:#4080FF; cursor:pointer;">
                    <span style="font-weight:700; color:#475569;">主线任务</span>
                    <span style="font-size:12px; color:#94a3b8; font-weight:400;">主线任务为公司交办的事情</span>
                </label>
            </div>
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">详细需求</label>
                <textarea id="edit-task-description" rows="4" style="border-radius:10px; padding:12px; font-size:14px;">${Utils.escapeHTML(task.description || '')}</textarea>
            </div>
            ${currentFilesHTML}
            <div class="form-group" style="margin-top:20px;">
                <label style="font-weight:700; color:#475569; margin-bottom:8px; display:block;">附件管理</label>
                <div class="file-upload-zone" id="edit-task-file-zone" onclick="document.getElementById('edit-task-file-input').click()">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <p style="margin-top:12px; font-size:14px; font-weight:600; color:#64748b;">点击或拖拽文件到此处上传</p>
                    <span style="margin-top:4px; font-size:12px; color:#94a3b8;">支持图片、文档等文件格式，单个文件不超过20MB</span>
                    <input type="file" id="edit-task-file-input" multiple style="display:none;" onchange="TaskGlobal.handleFileUpload(event, 'edit-task-file-zone')">
                </div>
                <div id="edit-task-file-list" class="file-list" style="margin-top:12px;"></div>
            </div>
        `, `
            <button class="btn btn-primary" style="height:40px; border-radius:10px; padding:0 24px; font-weight:700;" onclick="TaskGlobal.updateTask(${taskId})">提交更新</button>
        `);
        this._initFileDropZone('edit-task-file-zone');
    },

    async updateTask(taskId) {
        const title = document.getElementById('edit-task-title').value.trim();
        if (!title) return Toast.show('标题不能为空', 'warning');

        try {
            // 收集当前已有的附件
            const files = [];
            const currentFileItems = document.querySelectorAll('#modal-body div[id^=current-file-]');
            currentFileItems.forEach((item) => {
                const fileName = item.dataset.fileName || '未知文件';
                const fileSize = item.dataset.fileSize || '未知大小';
                const fileUrl = item.dataset.fileUrl || item.dataset.fileData || null;
                if (fileUrl) {
                    files.push({
                        name: fileName,
                        size: fileSize,
                        url: (fileUrl.startsWith('http') || fileUrl.startsWith('//')) ? fileUrl : null,
                        data: fileUrl.startsWith('data:') ? fileUrl : null
                    });
                }
            });

            // 收集并处理新选择的待上传文件
            const newFileItems = document.getElementById('edit-task-file-list')?.querySelectorAll('.file-item') || [];
            if (newFileItems.length > 0) {
                const processedFiles = await this._processFilesBeforeStorage(newFileItems);
                files.push(...processedFiles);
            }

            const updateData = {
                name: title,
                task_type: document.getElementById('edit-task-is-main')?.checked ? '主线' : '支线',
                priority: document.getElementById('edit-task-priority').value,
                deadline: document.getElementById('edit-task-deadline').value || null,
                description: document.getElementById('edit-task-description').value.trim() || null,
                files: JSON.stringify(files)
            };

            // 使用数据库模式
            await DB.update(Config.TABLES.TASKS, taskId, updateData);
            await this.load();

            Modal.close();
            this.render('global');
            Toast.show('任务更新成功', 'success');

            if (typeof TaskDetail !== 'undefined' && TaskDetail.currentTaskId === taskId) {
                TaskDetail.show(taskId, TaskDetail.currentContext);
            }
        } catch (err) {
            console.error('[修改任务失败] 详细错误:', err);
            Toast.show('保存失败: ' + err.message, 'error');
        }
    },

    /**
     * 添加任务
     */
    async addTask() {
        const title = document.getElementById('task-title').value.trim();
        if (!title) return Toast.show('标题必填', 'warning');
        if (!Auth.currentUser) return Toast.show('请先登录', 'error');

        const fileItems = document.getElementById('task-file-list')?.querySelectorAll('.file-item') || [];

        const data = {
            name: title,
            task_type: document.getElementById('task-is-main')?.checked ? '主线' : '支线',
            priority: document.getElementById('task-priority').value,
            deadline: document.getElementById('task-deadline').value || null,
            description: document.getElementById('task-description').value.trim() || null,
            remarks: null,
            status: '待接取',
            assignees: '[]'
        };

        try {
            if (fileItems.length > 0) {
                const processedFiles = await this._processFilesBeforeStorage(fileItems);
                data.files = JSON.stringify(processedFiles);
            }

            // 使用数据库模式
            const nt = await DB.create(Config.TABLES.TASKS, data);
            this.tasks.push(nt);

            Modal.close();
            this.render('global');
            Toast.show('任务发布成功', 'success');

            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.sendTeamNotification('task', { name: data.name });
            }
        } catch (err) {
            console.error('发布任务失败:', err);
            Toast.show('发布失败: ' + err.message, 'error');
        }
    },

    /**
     * 强制云端处理文件（上传至阿里云）
     * 支持最高 20MB，不再支持 Base64 降级以防止 500 错误
     */
    async _processFilesBeforeStorage(fileItems) {
        const results = [];
        // 强制认为是云端模式 (3w-api 默认不需要 token)
        const isCloud = true;

        // if (!isCloud) { ... }  <-- 移除此拦截

        Toast.show('正在上传到云端...', 'info');

        for (const item of Array.from(fileItems)) {
            const file = item.fileObject;
            if (!file) continue;

            let fileData = item.dataset.fileData;
            let fileName = file.name;
            let fileSize = file.size;

            // 1. 如果是图片且非常大，进行适度压缩 (针对 20MB 以上图片提示体验)
            if (file.type.startsWith('image/') && fileSize > 20 * 1024 * 1024) {
                console.log(`[智能压缩] 检测到图片较大 (${(fileSize / 1024 / 1024).toFixed(2)}MB)，进行优化压缩...`);
                try {
                    const compressed = await this._compressImage(fileData, 0.8);
                    fileData = compressed.data;
                    fileSize = compressed.size;
                } catch (err) {
                    console.error('[智能压缩] 失败:', err);
                }
            }

            // 2. 检查 20MB 硬限制
            if (fileSize > 20 * 1024 * 1024) {
                throw new Error(`文件 ${fileName} 超过 20MB 限制，无法上传`);
            }

            // 3. 执行云端上传
            try {
                let uploadFile = file;
                if (fileSize !== file.size) {
                    const blob = this._dataURLtoBlob(fileData);
                    uploadFile = new File([blob], fileName, { type: file.type });
                }

                const res = await DB.uploadFile(uploadFile);
                results.push({
                    name: fileName,
                    size: this._formatFileSize(fileSize),
                    url: res.url
                });
            } catch (err) {
                console.error(`[云端上传失败] ${fileName}:`, err);
                throw new Error(`文件 ${fileName} 上传云端失败，请确保 tenant 参数正确且网络可用`);
            }
        }
        return results;
    },

    /**
     * 图片压缩核心逻辑 (Canvas)
     */
    _compressImage(dataUrl, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 如果像素过大，进行等比缩放
                const maxDim = 1920;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedData = canvas.toDataURL('image/jpeg', quality);
                const size = Math.round((compressedData.length * 3) / 4);

                resolve({
                    data: compressedData,
                    size: size,
                    sizeText: this._formatFileSize(size)
                });
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    },

    _dataURLtoBlob(dataurl) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
};
