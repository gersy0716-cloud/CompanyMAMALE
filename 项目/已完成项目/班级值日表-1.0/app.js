// ========== 父页面 postMessage 参数接收 ==========
let postMessageParams = null;

window.addEventListener('message', function (event) {
    console.log('📨 收到 postMessage:', event.data);

    // 检查是否包含必要的参数字段
    if (event.data && (event.data.token || event.data.teachertoken || event.data.id)) {
        postMessageParams = {
            type: event.data.type || '',
            tenant: event.data.tenant || event.data.tenantid || '',
            userid: event.data.id || event.data.userid || '',
            username: event.data.name || event.data.username || '',
            token: event.data.token || '',
            teachertoken: event.data.teachertoken || ''
        };

        console.log('✅ postMessage 参数解析成功:', postMessageParams);

        // 收到参数后，重新初始化应用
        initializeApp();
    }
});

// ========== 全局状态 ==========
const APP_STATE = {
    isTeacher: false,
    currentUser: null,
    currentClass: null,
    selectedStudents: [],
    editingGroup: null,
    // 🚀 性能优化：缓存学生列表，避免重复API调用
    cachedStudents: null,
    cachedGroups: null,
    lastCacheTime: null
};

// 暴露到全局作用域，供其他模块使用
window.APP_STATE = APP_STATE;

// ========== URL参数解析 ==========
function parseURLParams() {
    // 优先使用 postMessage 接收的参数
    if (postMessageParams && postMessageParams.token) {
        console.log('📨 使用 postMessage 参数');
        return postMessageParams;
    }

    // 尝试从父页面 URL 读取参数（当应用在 iframe 中运行时）
    let urlParams;
    let urlSource = 'self';

    try {
        // 检查是否在 iframe 中
        if (window !== window.parent && window.parent.location) {
            // 尝试读取父页面的 URL 参数
            urlParams = new URLSearchParams(window.parent.location.search);
            urlSource = 'parent';
            console.log('🔍 从父页面 URL 读取参数');
        }
    } catch (e) {
        // 跨域时无法访问父页面 location，忽略错误
        console.log('⚠️ 无法访问父页面 URL（可能跨域）');
    }

    // 如果没有从父页面获取到，或者父页面没有参数，使用自己的 URL
    if (!urlParams || !urlParams.get('token')) {
        urlParams = new URLSearchParams(window.location.search);
        urlSource = 'self';
    }

    console.log(`📍 URL 参数来源: ${urlSource}`);

    const params = {
        type: urlParams.get('type') || '',
        tenant: urlParams.get('tenant') || '',
        userid: urlParams.get('userid') || '',
        username: decodeURIComponent(urlParams.get('username') || ''),
        token: urlParams.get('token') || '',
        teachertoken: urlParams.get('teachertoken') || ''
    };

    console.log('📋 解析到的参数:', params);

    return params;
}

// ========== 初始化应用 ==========
async function initializeApp() {
    const params = parseURLParams();

    // 判断用户模式
    APP_STATE.isTeacher = !!params.teachertoken;
    APP_STATE.currentUser = {
        id: params.userid,
        name: params.username,
        token: params.token,
        teachertoken: params.teachertoken
    };

    console.log('用户模式:', APP_STATE.isTeacher ? '教师' : '学生');
    console.log('用户信息:', APP_STATE.currentUser);

    // 显示对应视图
    if (APP_STATE.isTeacher) {
        await initTeacherView();
    } else {
        await initStudentView();
    }

    // 隐藏加载遮罩
    hideLoading();
}

// ========== 学生端初始化 ==========
async function initStudentView() {
    document.getElementById('studentView').style.display = 'block';

    try {
        // 获取当前周的值日安排
        await loadWeeklyDuty();
    } catch (error) {
        console.error('加载学生端数据失败:', error);
        showError('加载失败，请刷新页面重试');
    }
}

// ========== 获取本周日期范围 ==========
function getWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 计算本周一
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    // 计算本周日
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // 🔧 使用本地日期格式，避免时区问题
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const result = {
        start: formatDate(monday),
        end: formatDate(sunday),
        today: formatDate(now)
    };

    console.log('📅 本周范围计算:', result);
    return result;
}

// ========== 通用函数：过滤已删除的学生 ==========
function filterValidStudents(studentNames) {
    // 如果缓存的学生列表存在，过滤掉已删除的学生
    if (APP_STATE.cachedStudents && APP_STATE.cachedStudents.length > 0) {
        const validNames = new Set(APP_STATE.cachedStudents.map(s => s.name));
        return studentNames.filter(name => validNames.has(name));
    }
    // 如果没有学生列表缓存，返回原数组
    return studentNames;
}

// ========== 加载本周值日 ==========
async function loadWeeklyDuty() {
    const weekRange = getWeekRange();

    try {
        // 🔧 通过token获取学生信息，从中提取班级ID
        const params = parseURLParams();
        const studentInfoUrl = `https://${params.type}.mamale.vip/api/app/student/studentInfo?type=${params.type}&tenant=${params.tenant}`;
        const headers = { 'Authorization': `Bearer ${params.token}` };

        console.log('🔍 获取学生信息...');
        const studentResponse = await fetch(studentInfoUrl, { headers });

        if (!studentResponse.ok) {
            throw new Error(`获取学生信息失败: ${studentResponse.status}`);
        }

        const studentInfo = await studentResponse.json();
        console.log('📖 学生信息:', studentInfo);

        // 从学生信息中提取班级ID
        // 学生信息中的classs字段是一个数组，包含学生所属的所有班级
        let classId = null;

        if (studentInfo.classs && studentInfo.classs.length > 0) {
            // 取第一个班级
            classId = studentInfo.classs[0].id;
            console.log('📚 学生的班级列表:', studentInfo.classs);
            console.log('🎯 选择的班级:', studentInfo.classs[0]);
        }

        console.log('🎯 学生所属班级ID:', classId);

        if (!classId) {
            throw new Error('无法获取班级信息，学生可能未分配班级');
        }

        // 获取班级学生列表用于过滤
        try {
            const studentBaseUrl = `https://${params.type}.mamale.vip/api/app/student/byClssId?ClassId=${classId}&type=${params.type}&tenant=${params.tenant}`;
            const students = await fetchAllPages(studentBaseUrl, headers);
            APP_STATE.cachedStudents = students;
            console.log('📚 学生列表已缓存:', students.map(s => s.name));
        } catch (err) {
            console.warn('⚠️ 无法获取学生列表:', err);
        }

        const assignments = await db.getDutyAssignments(classId, weekRange.start, weekRange.end);
        console.log('📅 本周值日记录:', assignments);

        // 获取当前用户姓名（studentInfo.name 或 URL 参数中的 username）
        const currentStudentName = studentInfo.name || params.username;
        console.log('👤 当前学生姓名:', currentStudentName);

        // 显示今日值日
        displayTodayDuty(assignments, weekRange.today);

        // 显示本周值日（传递当前学生姓名用于高亮自己的值日日）
        displayWeeklyDuty(assignments, weekRange, currentStudentName);
    } catch (error) {
        console.error('加载值日数据失败:', error);
        document.getElementById('todayContent').innerHTML = `<p style="color: #C09880;">加载失败：${error.message}</p>`;
        document.getElementById('weeklyDuty').innerHTML = `<p class="empty-text">加载失败：${error.message}</p>`;
    }
}

// ========== 显示今日值日 ==========
function displayTodayDuty(assignments, today) {
    const todayAssignment = assignments.find(a => a.duty_date === today);
    const container = document.getElementById('todayContent');

    if (todayAssignment) {
        const studentIds = JSON.parse(todayAssignment.student_ids || '[]');
        const validStudents = filterValidStudents(studentIds);
        container.innerHTML = `
            <h3 style="color: #C09880; font-size: 20px; margin-bottom: 15px;">
                ${todayAssignment.group_name}
            </h3>
            <p style="font-size: 16px; margin-bottom: 10px;">
                <strong>组员：</strong>${validStudents.join('、')}
            </p>
            <p style="color: #C09880; margin-top: 15px;">
                📌 请按时完成值日任务
            </p>
        `;
    } else {
        container.innerHTML = '<p style="color: #9A8F7D;">今天不需要值日 🎉</p>';
    }
}

// ========== 显示本周值日 ==========
function displayWeeklyDuty(assignments, weekRange, currentStudentName = '') {
    const container = document.getElementById('weeklyDuty');

    if (assignments.length === 0) {
        container.innerHTML = '<p class="empty-text">本周暂无值日安排</p>';
        return;
    }

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    let html = '';

    assignments.forEach(assignment => {
        const date = new Date(assignment.duty_date);
        const dayName = weekDays[date.getDay()];
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const isToday = assignment.duty_date === weekRange.today;

        const studentIds = JSON.parse(assignment.student_ids || '[]');
        const validStudents = filterValidStudents(studentIds);

        // 判断当前用户是否在该天的值日名单中
        const isMyDutyDay = currentStudentName && validStudents.includes(currentStudentName);

        // 样式区分：使用统一的设计语言
        let cardClasses = 'duty-week-card';
        if (isMyDutyDay) cardClasses += ' duty-card-mine';
        if (isToday) cardClasses += ' duty-card-today';

        // 组员显示：高亮当前用户的名字
        const studentsHtml = validStudents.map(name => {
            if (name === currentStudentName) {
                return `<span class="student-name-highlight">${name}</span>`;
            }
            return `<span class="student-name">${name}</span>`;
        }).join('、');

        html += `
            <div class="${cardClasses}">
                <div class="duty-card-header">
                    <span class="duty-date">${dayName} ${dateStr}</span>
                    ${isToday ? '<span class="today-badge">今日</span>' : ''}
                </div>
                <div class="duty-card-body">
                    <div class="duty-group-name">${assignment.group_name}</div>
                    <div class="duty-members">组员：${studentsHtml}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ========== 教师端初始化 ==========
async function initTeacherView() {
    document.getElementById('teacherView').style.display = 'block';
    document.getElementById('classSelectPage').style.display = 'block';

    // 加载班级列表
    await loadClassList();

    // 绑定事件
    bindTeacherEvents();
}

// ========== 分页获取数据的通用函数 ==========
// 方案1：使用大PageSize（简单但可能有限制）
async function fetchAllByLargePageSize(baseUrl, headers) {
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}PageSize=100&PageIndex=1`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('方案1 - PageSize=100:', {
        '本次获取': data.items?.length || 0,
        '总数': data.totalCount || 0
    });

    return data.items || [];
}

// 方案2：使用PageIndex翻页（推荐，更精确）
async function fetchAllByPageIndex(baseUrl, headers) {
    let allItems = [];
    let pageIndex = 1;
    let totalCount = 0;

    while (true) {
        const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}PageSize=100&PageIndex=${pageIndex}`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`分页请求失败: ${response.status}`);
        }

        const data = await response.json();
        const items = data.items || [];
        totalCount = data.totalCount || 0;

        allItems = allItems.concat(items);

        console.log(`方案2 - Page ${pageIndex}:`, {
            '本页数量': items.length,
            '已获取': allItems.length,
            '总数': totalCount
        });

        // 判断是否已获取所有数据
        if (allItems.length >= totalCount || items.length === 0) {
            break;
        }

        pageIndex++;
    }

    return allItems;
}

// 当前使用的方法（可在两种方案之间切换测试）
const fetchAllPages = fetchAllByPageIndex;  // 默认使用方案2

// ========== 加载班级列表 ==========
async function loadClassList() {
    const container = document.getElementById('classList');

    try {
        showLoading();
        const params = parseURLParams();

        // 使用教师token获取班级（后端自动过滤）
        const baseUrl = `https://${params.type}.mamale.vip/api/app/class?type=${params.type}&tenant=${params.tenant}`;
        const headers = { 'Authorization': `Bearer ${params.teachertoken}` };

        // 使用分页获取所有班级
        const classes = await fetchAllPages(baseUrl, headers);

        console.log('📋 班级列表');
        console.log(`✅ 获取到 ${classes.length} 个班级`);

        // 🚀 性能优化：先显示班级列表，异步加载学生人数
        hideLoading();

        // 渲染班级卡片（无需显示人数）
        let html = '';
        classes.forEach(cls => {
            html += `
                <div class="class-card" onclick="selectClass('${cls.id}', '${cls.name}')">
                    <h3>${cls.name}</h3>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('加载班级列表失败:', error);

        // 网络超时时显示提示
        container.innerHTML = `
            <p class="empty-text">⚠️ 网络连接超时，无法加载班级列表</p>
            <p style="margin-top: 10px; color: #9A8F7D; font-size: 14px;">请检查网络连接或稍后重试</p>
        `;
    }
}

// ========== 选择班级 ==========
async function selectClass(classId, className) {
    APP_STATE.currentClass = { id: classId, name: className };

    // 🚀 性能优化：预加载学生和小组数据到缓存
    const params = parseURLParams();
    const studentBaseUrl = `https://${params.type}.mamale.vip/api/app/student/byClssId?ClassId=${classId}&type=${params.type}&tenant=${params.tenant}`;
    const headers = { 'Authorization': `Bearer ${params.teachertoken}` };

    // 并行预加载学生和小组数据
    Promise.all([
        fetchAllPages(studentBaseUrl, headers).then(students => {
            APP_STATE.cachedStudents = students;
            APP_STATE.lastCacheTime = Date.now();
            console.log('🚀 已预加载学生数据:', students.length, '人');
        }),
        db.getDutyGroups(classId).then(groups => {
            APP_STATE.cachedGroups = groups;
            console.log('🚀 已预加载小组数据:', groups.length, '个');
        })
    ]).catch(err => {
        console.warn('⚠️ 预加载数据失败:', err);
    });

    // 显示顶部标题栏
    document.getElementById('teacherHeader').style.display = 'flex';
    document.getElementById('headerTitle').textContent = className;

    // 切换页面
    document.getElementById('classSelectPage').style.display = 'none';
    document.getElementById('managePage').style.display = 'block';

    // 默认切换到小组管理标签页
    switchTab('group');

    // 加载小组数据
    await loadGroups();
}

// ========== 返回班级选择 ==========
function backToClassSelect() {
    APP_STATE.currentClass = null;

    // 隐藏顶部标题栏 - 修复选择器
    const header = document.querySelector('#managePage .teacher-header');
    if (header) {
        header.style.display = 'none';
    }

    // 切换页面
    document.getElementById('classSelectPage').style.display = 'block';
    document.getElementById('managePage').style.display = 'none';
}

// ========== 加载小组列表 ==========
async function loadGroups() {
    const container = document.getElementById('groupList');
    console.log('🎯 loadGroups 被调用, 当前班级:', APP_STATE.currentClass);
    console.log('🔍 查询class_id:', APP_STATE.currentClass.id, '类型:', typeof APP_STATE.currentClass.id);

    try {
        showLoading();
        const groups = await db.getDutyGroups(APP_STATE.currentClass.id);
        console.log('📖 获取到的小组数据:', groups);
        console.log('📖 小组的class_id值:', groups.map(g => ({ id: g.id, class_id: g.class_id })));

        if (groups.length === 0) {
            hideLoading();
            console.log('⚠️ 没有小组数据');
            container.innerHTML = '<p class="empty-text">暂无小组，点击上方按钮创建</p>';
            return;
        }

        // 🔧 获取当前班级的所有学生，用于过滤已删除的学生
        const params = parseURLParams();
        const studentBaseUrl = `https://${params.type}.mamale.vip/api/app/student/byClssId?ClassId=${APP_STATE.currentClass.id}&type=${params.type}&tenant=${params.tenant}`;
        const headers = { 'Authorization': `Bearer ${params.teachertoken}` };

        let currentStudents = [];

        try {
            const students = await fetchAllPages(studentBaseUrl, headers);
            currentStudents = students.map(s => s.name); // 提取学生姓名列表
            APP_STATE.cachedStudents = students; // 缓存学生列表
            console.log('📚 当前班级学生列表:', currentStudents);
        } catch (err) {
            console.warn('⚠️ 无法获取学生列表，跳过过滤:', err);
        }

        hideLoading();

        let html = '';
        groups.forEach(group => {
            const studentIds = JSON.parse(group.student_ids || '[]');

            // 🔧 显示有效的学生（只在显示层过滤）
            const validStudents = currentStudents.length > 0
                ? studentIds.filter(name => currentStudents.includes(name))
                : studentIds;

            html += `
                <div class="group-card">
                    <h4>${group.name}</h4>
                    <div class="member-tags">
                        ${validStudents.map(id => `<span class="member-tag">${id}</span>`).join('')}
                    </div>
                    <div class="group-actions">
                        <button class="btn-neomorph btn-small" onclick="editGroup('${group.id}')">编辑</button>
                        <button class="btn-neomorph btn-small" onclick="deleteGroup('${group.id}')">删除</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        hideLoading();
        console.error('加载小组失败:', error);
        container.innerHTML = '<p class="empty-text">加载失败</p>';
    }
}

// ========== 小组管理 ==========
async function showGroupModal(groupId = null) {
    APP_STATE.editingGroup = groupId;
    const modal = document.getElementById('groupModal');
    const title = document.getElementById('modalTitle');

    if (groupId) {
        title.textContent = '编辑小组';
        // ⚠️ 必须等待小组数据加载完成，才能正确显示学生列表
        await loadGroupData(groupId);
    } else {
        title.textContent = '创建小组';
        document.getElementById('groupName').value = '';
        APP_STATE.selectedStudents = [];
    }

    // 加载学生列表（此时 APP_STATE.selectedStudents 已正确设置）
    await loadStudentList();

    modal.classList.add('active');
}

function hideGroupModal() {
    document.getElementById('groupModal').classList.remove('active');
    APP_STATE.editingGroup = null;
    APP_STATE.selectedStudents = [];
}

async function loadGroupData(groupId) {
    try {
        console.log('🔧 loadGroupData 被调用, groupId:', groupId, '类型:', typeof groupId);
        const groups = await db.getDutyGroups(APP_STATE.currentClass.id);
        console.log('🔧 查询到的所有小组:', groups);
        console.log('🔧 所有小组的ID:', groups.map(g => ({ id: g.id, type: typeof g.id })));

        // ⚠️ 使用宽松比较 == 而非严格比较 ===，因为ID可能是字符串或数字
        const group = groups.find(g => g.id == groupId);
        console.log('🔧 找到的小组:', group);

        if (group) {
            document.getElementById('groupName').value = group.name;
            console.log('🔧 小组的student_ids字段:', group.student_ids, '类型:', typeof group.student_ids);

            // student_ids可能是数组或JSON字符串，需要兼容处理
            if (Array.isArray(group.student_ids)) {
                APP_STATE.selectedStudents = group.student_ids;
            } else if (typeof group.student_ids === 'string') {
                APP_STATE.selectedStudents = JSON.parse(group.student_ids || '[]');
            } else {
                APP_STATE.selectedStudents = [];
            }

            console.log('🔧 解析后的selectedStudents:', APP_STATE.selectedStudents);
        } else {
            console.warn('⚠️ 未找到指定的小组！groupId:', groupId);
        }
    } catch (error) {
        console.error('加载小组数据失败:', error);
    }
}


async function loadStudentList() {
    const container = document.getElementById('studentList');
    container.innerHTML = '<p class="loading-text">加载中...</p>';

    try {
        const params = parseURLParams();
        const baseUrl = `https://${params.type}.mamale.vip/api/app/student/byClssId?ClassId=${APP_STATE.currentClass.id}&type=${params.type}&tenant=${params.tenant}`;
        const headers = { 'Authorization': `Bearer ${params.teachertoken}` };

        // 🚀 性能优化：优先使用缓存（10分钟有效期）
        const cacheValid = APP_STATE.lastCacheTime &&
            (Date.now() - APP_STATE.lastCacheTime) < 10 * 60 * 1000;

        let allGroups, students;

        // 1️⃣ 优先从缓存获取小组数据
        if (cacheValid && APP_STATE.cachedGroups) {
            console.log('🚀 使用缓存的小组数据');
            allGroups = APP_STATE.cachedGroups;
        } else {
            console.log('📡 从数据库获取小组数据');
            allGroups = await db.getDutyGroups(APP_STATE.currentClass.id);
            APP_STATE.cachedGroups = allGroups;
        }

        // 2️⃣ 优先从缓存获取学生列表
        if (cacheValid && APP_STATE.cachedStudents) {
            console.log('🚀 使用缓存的学生列表');
            students = APP_STATE.cachedStudents;
        } else {
            console.log('📡 从API获取学生列表');
            students = await fetchAllPages(baseUrl, headers);
            APP_STATE.cachedStudents = students;
            APP_STATE.lastCacheTime = Date.now();
        }

        const assignedStudents = new Set();

        allGroups.forEach(group => {
            // 编辑小组时，跳过本小组（允许重新选择本小组的学生）
            if (group.id == APP_STATE.editingGroup) return;

            const groupStudents = Array.isArray(group.student_ids)
                ? group.student_ids
                : JSON.parse(group.student_ids || '[]');
            groupStudents.forEach(studentName => assignedStudents.add(studentName));
        });

        console.log('🔍 已分配学生:', Array.from(assignedStudents));

        if (students.length === 0) {
            container.innerHTML = '<p class="empty-text">暂无学生</p>';
            return;
        }

        // 3️⃣ 过滤学生列表
        let availableStudents;

        if (APP_STATE.editingGroup) {
            // 编辑模式：只显示本组的学生（用于删减）
            console.log('🔍 学生对象示例:', students[0]);
            console.log('🔍 学生对象的keys:', students[0] ? Object.keys(students[0]) : 'no students');
            console.log('🔍 API返回的所有学生名字:', students.map(s => s.name));
            console.log('🔍 需要匹配的学生名字:', APP_STATE.selectedStudents);

            // 检查每个学生是否匹配
            students.forEach(s => {
                const matched = APP_STATE.selectedStudents.includes(s.name);
                if (matched) {
                    console.log('✅ 匹配成功:', s.name);
                }
            });

            availableStudents = students.filter(s =>
                APP_STATE.selectedStudents.includes(s.name)
            );
            console.log('✏️ 编辑模式 - 本组学生:', APP_STATE.selectedStudents);
        } else {
            // 创建模式：只显示未分配学生
            availableStudents = students.filter(s => !assignedStudents.has(s.name));
        }

        console.log('🎯 可选学生:', availableStudents.map(s => s.name));
        console.log('📊 总学生数:', students.length, '已分配:', assignedStudents.size, '可选:', availableStudents.length);

        if (availableStudents.length === 0) {
            if (APP_STATE.editingGroup) {
                container.innerHTML = '<p class="empty-text">该小组暂无成员</p>';
            } else {
                container.innerHTML = '<p class="empty-text">所有学生都已分配到小组</p>';
            }
            return;
        }

        // 4️⃣ 渲染学生列表
        let html = '';
        availableStudents.forEach(student => {
            const isSelected = APP_STATE.selectedStudents.includes(student.name);
            html += `
                <div class="student-item ${isSelected ? 'selected' : ''}"
                     onclick="toggleStudent('${student.name}')">
                    ${student.name}
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('加载学生列表失败:', error);
        container.innerHTML = '<p class="empty-text">加载失败</p>';
    }
}



function toggleStudent(studentName) {
    const index = APP_STATE.selectedStudents.indexOf(studentName);

    if (index > -1) {
        APP_STATE.selectedStudents.splice(index, 1);
    } else {
        APP_STATE.selectedStudents.push(studentName);
    }

    // 仅更新当前点击的学生的选中状态，不重新加载整个列表
    const studentItems = document.querySelectorAll('.student-item');
    studentItems.forEach(item => {
        if (item.textContent.trim() === studentName) {
            if (index > -1) {
                item.classList.remove('selected');
            } else {
                item.classList.add('selected');
            }
        }
    });
}

async function saveGroup() {
    const name = document.getElementById('groupName').value.trim();

    if (!name) {
        showError('请输入小组名称');
        return;
    }

    if (APP_STATE.selectedStudents.length === 0) {
        showError('请至少选择一名学生');
        return;
    }

    try {
        showLoading();

        // 🔧 过滤掉已删除的学生
        let validStudents = APP_STATE.selectedStudents;
        if (APP_STATE.cachedStudents && APP_STATE.cachedStudents.length > 0) {
            const validStudentNames = new Set(APP_STATE.cachedStudents.map(s => s.name));
            const originalCount = validStudents.length;
            validStudents = validStudents.filter(name => validStudentNames.has(name));

            if (validStudents.length < originalCount) {
                const removedCount = originalCount - validStudents.length;
                console.log(`🔧 自动移除了 ${removedCount} 个已删除的学生`);
            }
        }

        if (validStudents.length === 0) {
            hideLoading();
            showError('小组中的学生都已被删除，请重新选择学生');
            return;
        }

        // 先测试表是否存在
        console.log('1. 测试duty_groups表是否存在...');
        try {
            const existingGroups = await db.getDutyGroups(APP_STATE.currentClass.id);
            console.log('✅ 表存在，当前有', existingGroups.length, '个小组');
        } catch (tableError) {
            hideLoading();
            console.error('❌ 表不存在或无法访问:', tableError);
            showError('数据库表可能还未创建，请先在BaseMulti中创建duty_groups表。详见：数据库表设计-优化版.md');
            return;
        }

        const groupData = {
            name,
            class_id: APP_STATE.currentClass.id,
            student_ids: JSON.stringify(validStudents),  // 使用过滤后的学生列表
            order_index: 0
        };

        console.log('2. 保存小组数据:', groupData);

        if (APP_STATE.editingGroup) {
            // 更新
            await db.updateDutyGroup(APP_STATE.editingGroup, groupData);
        } else {
            // 创建
            await db.createDutyGroup(groupData);
        }

        hideLoading();
        hideGroupModal();

        // 显示成功提示
        alert(APP_STATE.editingGroup ? '小组更新成功！' : '小组创建成功！');

        // 🚀 清除缓存，确保加载最新数据
        APP_STATE.cachedGroups = null;

        await loadGroups();
    } catch (error) {
        hideLoading();
        console.error('保存小组失败:', error);
        console.error('错误详情:', error.message);

        // 提供更详细的错误信息
        if (error.message.includes('500')) {
            showError('保存失败：数据库服务器错误。可能原因：\n1. 表字段配置不正确\n2. 必填字段缺失\n3. 数据类型不匹配\n\n请检查数据库表设计是否正确创建。');
        } else {
            showError(`保存失败：${error.message || '请重试'}`);
        }
    }
}

async function editGroup(groupId) {
    showGroupModal(groupId);
}

async function deleteGroup(groupId) {
    if (!confirm('确定要删除这个小组吗？')) {
        return;
    }

    try {
        showLoading();
        await db.deleteDutyGroup(groupId);
        hideLoading();

        // 🚀 清除缓存，确保加载最新数据
        APP_STATE.cachedGroups = null;

        await loadGroups();
    } catch (error) {
        hideLoading();
        console.error('删除小组失败:', error);
        showError('删除失败，请重试');
    }
}

// ========== 值日配置 ==========
async function saveConfig() {
    // 🔧 使用日历模块保存（新版）
    if (window.CalendarModule) {
        const success = await window.CalendarModule.save();
        if (success) {
            console.log('✅ 配置已保存');
        }
        return;
    }

    // ⚠️ 降级：如果日历模块未加载，使用旧逻辑
    console.warn('⚠️ CalendarModule未加载，使用旧版保存逻辑');
    const startDate = document.getElementById('startDateInput')?.value;
    const endDate = document.getElementById('endDateInput')?.value;

    if (!startDate || !endDate) {
        showError('请选择开始和结束日期');
        return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
        showError('结束日期必须晚于开始日期');
        return;
    }

    // 获取工作日设置
    const workDaysCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
    const workDays = Array.from(workDaysCheckboxes).map(cb => parseInt(cb.value));

    if (workDays.length === 0) {
        showError('请至少选择一个工作日');
        return;
    }

    try {
        showLoading();

        const configData = {
            name: `${APP_STATE.currentClass.name}-值日配置`,
            class_id: APP_STATE.currentClass.id,
            start_date: startDate,
            end_date: endDate,
            work_days: JSON.stringify(workDays),
            enabled_dates: JSON.stringify([]),
            disabled_dates: JSON.stringify([]),
            is_active: true
        };

        // 检查是否已有配置
        const existingConfig = await db.getScheduleConfig(APP_STATE.currentClass.id);

        if (existingConfig) {
            await db.updateScheduleConfig(existingConfig.id, configData);
        } else {
            await db.createScheduleConfig(configData);
        }

        hideLoading();
        alert('配置保存成功！');
    } catch (error) {
        hideLoading();
        console.error('保存配置失败:', error);
        showError('保存失败，请重试');
    }
}

// ========== 自动排班算法 ==========
async function generateSchedule() {
    if (!confirm('生成新的值日表将覆盖现有数据，确定继续吗？')) {
        return;
    }

    try {
        showLoading('正在生成值日表...', '数据较多，请耐心等待');

        // 0. 检查是否有学生未分配到小组
        const allStudents = APP_STATE.cachedStudents || [];
        const groups = await db.getDutyGroups(APP_STATE.currentClass.id);

        // 收集所有已分配到小组的学生姓名(注意:student_ids存储的是姓名而不是ID)
        const assignedStudentNames = new Set();
        groups.forEach(group => {
            const studentIds = typeof group.student_ids === 'string'
                ? JSON.parse(group.student_ids)
                : group.student_ids;
            studentIds.forEach(name => assignedStudentNames.add(name));
        });

        // 找出未分配的学生(比较姓名)
        const unassignedStudents = allStudents.filter(student =>
            !assignedStudentNames.has(student.name)
        );

        if (unassignedStudents.length > 0) {
            hideLoading();
            const studentNames = unassignedStudents.map(s => s.name).join('、');
            const message = `以下学生还未分配到小组：\n\n${studentNames}\n\n是否继续生成值日表？`;

            if (!confirm(message)) {
                return;
            }
            showLoading('正在生成值日表...', '数据较多，请耐心等待');
        }

        // 1. 获取配置
        const config = await db.getScheduleConfig(APP_STATE.currentClass.id);
        if (!config) {
            throw new Error('请先保存值日配置');
        }

        // 2. 小组已在上面获取过了
        if (groups.length === 0) {
            throw new Error('请先创建小组');
        }

        // 3. 删除旧的值日表
        await db.deleteDutyAssignments(APP_STATE.currentClass.id);

        // 4. 生成值日日期列表
        // 优先使用 enabled_dates（用户选择的日期），如果没有则使用规则生成
        let dates = [];
        if (config.enabled_dates) {
            const enabledDates = JSON.parse(config.enabled_dates);
            if (enabledDates && enabledDates.length > 0) {
                dates = enabledDates.sort();  // 使用用户选择的日期
                console.log('📅 使用用户选择的日期:', dates.length, '个');
            }
        }

        // 如果没有用户选择的日期，使用旧的规则生成
        if (dates.length === 0) {
            dates = generateDutyDates(config);
            console.log('📅 使用规则生成的日期:', dates.length, '个');
        }

        // 5. 循环分配小组
        const assignments = [];

        // 🔧 获取当前有效的学生列表，用于过滤
        const validStudentNames = new Set(allStudents.map(s => s.name));
        console.log('📚 有效学生列表:', Array.from(validStudentNames));

        for (let i = 0; i < dates.length; i++) {
            const group = groups[i % groups.length]; // 循环分配

            // 🔧 解析并过滤student_ids，确保只包含有效的学生
            let studentIds;
            if (Array.isArray(group.student_ids)) {
                studentIds = group.student_ids;
            } else if (typeof group.student_ids === 'string') {
                studentIds = JSON.parse(group.student_ids || '[]');
            } else {
                studentIds = [];
            }

            // 🔧 过滤掉已删除的学生
            const validStudentIds = studentIds.filter(name => validStudentNames.has(name));

            if (validStudentIds.length === 0) {
                console.warn(`⚠️ 小组"${group.name}"没有有效成员，跳过该天的值日安排`);
                continue; // 跳过没有有效成员的小组
            }

            const assignment = {
                name: `${dates[i]} ${group.name}值日`,
                config_id: config.id.toString(),
                class_id: APP_STATE.currentClass.id,
                duty_date: dates[i],
                group_id: group.id.toString(),
                group_name: group.name,
                student_ids: JSON.stringify(validStudentIds)
                // 🧪 临时注释status字段测试500错误
                // status: 'planned'
            };

            console.log('🧪 准备创建的assignment对象:', assignment);
            assignments.push(assignment);
        }

        // 6. 批量创建值日分配
        for (const assignment of assignments) {
            await db.createDutyAssignment(assignment);
        }

        hideLoading();
        alert(`值日表生成成功！共生成 ${assignments.length} 天的值日安排。`);

        // 切换到值日表页面
        switchTab('schedule');
    } catch (error) {
        hideLoading();
        console.error('生成值日表失败:', error);
        showError(error.message || '生成失败，请重试');
    }
}

// 生成值日日期列表
function generateDutyDates(config) {
    const dates = [];
    const workDays = JSON.parse(config.work_days || '[]');
    const startDate = new Date(config.start_date);
    const endDate = new Date(config.end_date);

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0=周日, 1=周一, ...

        // 检查是否是工作日
        if (workDays.includes(dayOfWeek)) {
            dates.push(currentDate.toISOString().split('T')[0]);
        }

        // 下一天
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

// ========== 加载值日表 ==========
async function loadSchedule() {
    const container = document.getElementById('scheduleList');

    try {
        showLoading();

        // 🔧 获取当前班级的学生列表，用于过滤已删除的学生
        const params = parseURLParams();
        const studentBaseUrl = `https://${params.type}.mamale.vip/api/app/student/byClssId?ClassId=${APP_STATE.currentClass.id}&type=${params.type}&tenant=${params.tenant}`;
        const headers = { 'Authorization': `Bearer ${params.teachertoken}` };

        try {
            const students = await fetchAllPages(studentBaseUrl, headers);
            APP_STATE.cachedStudents = students;
            console.log('📚 教师端-学生列表已缓存:', students.map(s => s.name));
        } catch (err) {
            console.warn('⚠️ 无法获取学生列表:', err);
        }

        const assignments = await db.getDutyAssignments(APP_STATE.currentClass.id);
        hideLoading();

        if (assignments.length === 0) {
            container.innerHTML = '<p class="empty-text">暂无值日表，请先配置并生成</p>';
            return;
        }

        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        let html = '';

        assignments.forEach(assignment => {
            const date = new Date(assignment.duty_date);
            const dayName = weekDays[date.getDay()];
            const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            const studentIds = JSON.parse(assignment.student_ids || '[]');
            const validStudents = filterValidStudents(studentIds);

            html += `
                <div class="gradient-card">
                    <h4>${dayName} ${dateStr}</h4>
                    <p><strong>${assignment.group_name}</strong></p>
                    <p style="margin-top: 8px;">组员：${validStudents.join('、')}</p>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        hideLoading();
        console.error('加载值日表失败:', error);
        container.innerHTML = '<p class="empty-text">加载失败</p>';
    }
}

// ========== 标签页切换 ==========
function switchTab(tabName) {
    // 更新导航active状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === tabName) {
            item.classList.add('active');
        }
    });

    // 切换页面显示
    document.querySelectorAll('.tab-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    const pageMap = {
        'group': 'groupManagePage',
        'config': 'configPage',
        'schedule': 'schedulePage'
    };

    const targetPage = document.getElementById(pageMap[tabName]);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
    }

    // 加载对应页面数据
    if (tabName === 'schedule') {
        // 🔧 使用日历模块渲染值日表
        if (window.DutyCalendarModule) {
            // 初始化事件监听（只需要初始化一次）
            if (!window.dutyCalendarEventsInitialized) {
                window.DutyCalendarModule.initEvents();
                window.dutyCalendarEventsInitialized = true;
            }
            // 渲染日历
            window.DutyCalendarModule.render();
        } else {
            console.error('❌ DutyCalendarModule未加载');
        }
    }

    // 🔧 初始化日历（当切换到配置页时）
    if (tabName === 'config') {
        console.log('📅 切换到配置页，初始化日历...');
        if (window.CalendarModule) {
            // ✨ 关键修复：去除setTimeout延迟，立即初始化
            // ✨ 添加标记避免重复初始化
            if (!window.calendarInitialized) {
                (async () => {
                    try {
                        await window.CalendarModule.initialize();
                        window.CalendarModule.initEvents();
                        window.calendarInitialized = true;
                        console.log('✅ 日历首次初始化完成');
                    } catch (error) {
                        console.error('❌ 日历初始化失败:', error);
                    }
                })();
            } else {
                // 已初始化，只加载配置
                console.log('📅 日历已初始化，加载配置...');
                if (APP_STATE.currentClass?.id) {
                    window.CalendarModule.load(APP_STATE.currentClass.id).catch(error => {
                        console.error('❌ 加载配置失败:', error);
                    });
                }
            }
        } else {
            console.error('❌ CalendarModule未加载');
        }
    }
}

// ========== 事件绑定 ==========
function bindTeacherEvents() {
    // 创建小组
    document.getElementById('addGroupBtn').addEventListener('click', () => showGroupModal());

    // 模态框按钮
    document.getElementById('saveGroupBtn').addEventListener('click', saveGroup);
    document.getElementById('cancelGroupBtn').addEventListener('click', hideGroupModal);

    // 保存配置
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);

    // 生成值日表
    document.getElementById('generateBtn').addEventListener('click', generateSchedule);

    // 底部导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.page);
        });
    });

    // 点击模态框背景关闭
    document.getElementById('groupModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideGroupModal();
        }
    });
}

// 续写在下一个文件...
// ========== 工具函数 ==========
function showLoading(text = '加载中...', hint = '') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const loadingHint = document.getElementById('loadingHint');
    if (overlay) {
        overlay.style.display = 'flex';
    }
    if (loadingText) {
        loadingText.textContent = text;
    }
    if (loadingHint) {
        if (hint) {
            loadingHint.textContent = hint;
            loadingHint.style.display = 'block';
        } else {
            loadingHint.style.display = 'none';
        }
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    const loadingHint = document.getElementById('loadingHint');
    if (overlay) {
        overlay.style.display = 'none';
    }
    if (loadingHint) {
        loadingHint.style.display = 'none';
    }
}

function showError(message) {
    alert(message);
}

// ========== 页面加载完成后初始化 ==========
document.addEventListener('DOMContentLoaded', initializeApp);
