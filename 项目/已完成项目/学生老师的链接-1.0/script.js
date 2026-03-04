// 全局变量存储URL参数
const globalParams = {
    type: '',           // 租户英文名称
    tenant: '',         // 租户id
    author: '',         // 用户中文名
    userid: '',         // 用户在该租户下的id
    username: '',       // 用户的中文名字
    token: '',          // 学生token
    teachertoken: ''    // 教师token（不一定有）
};

// 学生、班级和教师数据
let allClasses = [];
let allStudents = [];
let filteredStudents = [];
let allTeachers = [];  // 教师数据
let filteredTeachers = [];  // 筛选后的教师数据
let currentClassId = null;
let currentDataType = 'student'; // 'student' 或 'teacher'

// API配置 - 使用函数动态生成URL，确保使用从URL参数获取的type值
const API_CONFIG = {
    // 动态生成API URL的函数
    getClassListURL: () => `https://${globalParams.type}.mamale.vip/api/app/class`,
    getStudentByClassURL: () => `https://${globalParams.type}.mamale.vip/api/app/student/byClssId`,
    getTeacherURL: () => `https://${globalParams.type}.mamale.vip/api/app/teacher`,
    headers: {
        'Content-Type': 'application/json'
    }
};

/**
 * 解析URL参数并存储到全局变量
 * 每次调用都强制重新从URL读取，不使用任何缓存
 */
function parseURLParams() {
    // 清空所有全局参数，确保不使用旧值
    globalParams.type = '';
    globalParams.tenant = '';
    globalParams.author = '';
    globalParams.userid = '';
    globalParams.username = '';
    globalParams.token = '';
    globalParams.teachertoken = '';

    // 强制从当前URL重新读取参数
    const urlParams = new URLSearchParams(window.location.search);

    globalParams.type = decodeURIComponent(urlParams.get('type') || '');
    globalParams.tenant = decodeURIComponent(urlParams.get('tenant') || '');
    globalParams.author = decodeURIComponent(urlParams.get('author') || '');
    globalParams.userid = decodeURIComponent(urlParams.get('userid') || '');
    globalParams.username = decodeURIComponent(urlParams.get('username') || '');
    globalParams.token = decodeURIComponent(urlParams.get('token') || '');
    globalParams.teachertoken = decodeURIComponent(urlParams.get('teachertoken') || '');

    console.log('=== URL参数解析结果 ===');
    console.log('当前URL:', window.location.href);
    console.log('解析的参数:', globalParams);
    console.log('type参数:', globalParams.type);
    console.log('=====================');

    // 在页面上也显示当前的type参数（用于调试）
    if (globalParams.type) {
        document.title = `学生信息管理系统 - ${globalParams.type}`;
    }
}

/**
 * 检查授权
 */
function checkAuthorization() {
    // 在页面上显示当前参数（用于调试）
    const paramDisplayEl = document.getElementById('paramDisplay');
    if (paramDisplayEl) {
        paramDisplayEl.textContent = `当前租户: ${globalParams.type || '未设置'} | Token: ${globalParams.token ? '已提供' : '未提供'}`;
    }

    // 如果没有token，说明未授权
    if (!globalParams.token || globalParams.token === 'null') {
        document.getElementById('unauthorizedContainer').style.display = 'flex';
        document.getElementById('mainContainer').style.display = 'none';
        return false;
    }

    document.getElementById('unauthorizedContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';

    return true;
}

/**
 * 加载班级列表
 */
async function loadClassList() {
    const loadingContainer = document.getElementById('loadingContainer');
    const errorContainer = document.getElementById('errorContainer');
    const classSelection = document.getElementById('classSelection');

    loadingContainer.style.display = 'flex';
    document.getElementById('loadingText').textContent = '正在加载班级列表...';
    errorContainer.style.display = 'none';
    classSelection.style.display = 'none';

    try {
        const url = API_CONFIG.getClassListURL();
        console.log('加载班级列表，URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...API_CONFIG.headers,
                'Authorization': `Bearer ${globalParams.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        const data = await response.json();
        console.log('班级列表API返回数据:', data);

        // 根据实际API返回的数据结构调整
        // 假设返回格式为 { items: [...], totalCount: 100 } 或直接 [...]
        allClasses = Array.isArray(data) ? data : (data.items || data.data || []);

        loadingContainer.style.display = 'none';
        classSelection.style.display = 'block';

        renderClassGrid();

    } catch (error) {
        console.error('加载班级列表失败:', error);
        loadingContainer.style.display = 'none';
        errorContainer.style.display = 'flex';
        document.getElementById('errorMessage').textContent = `错误: ${error.message}`;
    }
}

/**
 * 渲染班级卡片
 */
function renderClassGrid() {
    const classGrid = document.getElementById('classGrid');
    classGrid.innerHTML = '';

    if (allClasses.length === 0) {
        classGrid.innerHTML = '<p class="no-data">暂无班级数据</p>';
        return;
    }

    allClasses.forEach(classInfo => {
        const card = document.createElement('div');
        card.className = 'class-card';

        // 只在有grade字段且不为空时显示年级标签
        const gradeTag = (classInfo.grade && classInfo.grade.trim())
            ? `<span class="class-grade">${classInfo.grade}</span>`
            : '';

        card.innerHTML = `
            <div class="class-card-header">
                <h3>${classInfo.name || '未命名班级'}</h3>
                ${gradeTag}
            </div>
            <div class="class-card-body">
                <p class="class-student-count">
                    <span class="icon">👥</span>
                    <span>${classInfo.studentCount || 0} 名学生</span>
                </p>
            </div>
        `;
        card.onclick = () => selectClass(classInfo.id, classInfo.name);
        classGrid.appendChild(card);
    });
}

/**
 * 选择班级
 */
async function selectClass(classId, className) {
    currentClassId = classId;
    document.getElementById('currentClassName').textContent = className;

    if (currentDataType === 'student') {
        await loadStudentData(classId);
    } else {
        await loadTeacherData(classId);
    }
}

/**
 * 根据班级ID加载学生数据
 * 使用大PageSize方案，一次性获取所有数据
 */
async function loadStudentData(classId) {
    const loadingContainer = document.getElementById('loadingContainer');
    const errorContainer = document.getElementById('errorContainer');
    const studentContent = document.getElementById('studentContent');
    const classSelection = document.getElementById('classSelection');

    classSelection.style.display = 'none';
    loadingContainer.style.display = 'flex';
    document.getElementById('loadingText').textContent = '正在加载学生信息...';
    errorContainer.style.display = 'none';
    studentContent.style.display = 'none';

    try {
        // 使用主学生API，设置大PageSize一次性获取所有数据
        const baseUrl = `https://${globalParams.type}.mamale.vip/api/app/student`;
        const url = `${baseUrl}?PageSize=9999&PageIndex=1&ClassId=${classId}`;
        console.log('加载学生数据，URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...API_CONFIG.headers,
                'Authorization': `Bearer ${globalParams.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        const data = await response.json();
        console.log('学生列表API返回数据:', data);

        // 提取数据
        allStudents = data.items || data.data || [];
        filteredStudents = [...allStudents];

        // 更新班级卡片的实际学生数量
        updateClassStudentCount(classId, allStudents.length);

        loadingContainer.style.display = 'none';
        studentContent.style.display = 'block';

        updateStats();
        renderStudentTable();

    } catch (error) {
        console.error('加载学生数据失败:', error);
        loadingContainer.style.display = 'none';
        errorContainer.style.display = 'flex';
        document.getElementById('errorMessage').textContent = `错误: ${error.message}`;
    }
}

/**
 * 加载教师数据
 * 使用大PageSize方案，一次性获取所有数据
 */
async function loadTeacherData() {
    const loadingContainer = document.getElementById('loadingContainer');
    const errorContainer = document.getElementById('errorContainer');
    const teacherContent = document.getElementById('teacherContent');
    const classSelection = document.getElementById('classSelection');

    classSelection.style.display = 'none';
    loadingContainer.style.display = 'flex';
    document.getElementById('loadingText').textContent = '正在加载教师信息...';
    errorContainer.style.display = 'none';
    teacherContent.style.display = 'none';

    try {
        // 使用大PageSize一次性获取所有教师数据
        const url = `${API_CONFIG.getTeacherURL()}?PageSize=9999&PageIndex=1`;
        console.log('加载教师数据，URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...API_CONFIG.headers,
                'Authorization': `Bearer ${globalParams.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        const data = await response.json();
        console.log('教师列表API返回数据:', data);

        // 根据实际API返回的数据结构调整
        allTeachers = data.items || data.data || (Array.isArray(data) ? data : []);
        filteredTeachers = [...allTeachers];

        loadingContainer.style.display = 'none';
        teacherContent.style.display = 'block';

        updateTeacherStats();
        renderTeacherTable();

    } catch (error) {
        console.error('加载教师数据失败:', error);
        loadingContainer.style.display = 'none';
        errorContainer.style.display = 'flex';
        document.getElementById('errorMessage').textContent = `错误: ${error.message}`;
    }
}

/**
 * 更新统计数据
 */
function updateStats() {
    const totalCount = allStudents.length;
    document.getElementById('totalStudents').textContent = totalCount;
}

/**
 * 更新班级卡片的学生数量显示
 */
function updateClassStudentCount(classId, actualCount) {
    // 查找对应的班级
    const classIndex = allClasses.findIndex(c => c.id === classId);
    if (classIndex !== -1) {
        // 更新班级数据
        allClasses[classIndex].studentCount = actualCount;

        // 重新渲染班级列表
        renderClassGrid();

        console.log(`班级ID ${classId} 的学生数量已更新为: ${actualCount}`);
    }
}

/**
 * 渲染学生表格
 */
function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';

    if (filteredStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">暂无学生数据</td>
            </tr>
        `;
        return;
    }

    filteredStudents.forEach(student => {
        const row = document.createElement('tr');
        row.className = 'student-row';
        row.innerHTML = `
            <td>${student.studentId || student.id || 'N/A'}</td>
            <td>${student.name || student.studentName || 'N/A'}</td>
            <td>${student.class || student.className || 'N/A'}</td>
            <td>${student.grade || student.gradeName || 'N/A'}</td>
            <td>
                <span class="status-badge ${(student.status === 'active' || student.isActive) ? 'status-active' : 'status-inactive'}">
                    ${(student.status === 'active' || student.isActive) ? '活跃' : '非活跃'}
                </span>
            </td>
            <td>${student.phone || student.contact || 'N/A'}</td>
            <td>
                <button class="action-button" onclick="viewStudentDetails('${student.id || student.studentId}')">
                    查看详情
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * 搜索学生
 */
function filterStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let students = [...allStudents];

    // 根据搜索词过滤
    if (searchTerm) {
        students = students.filter(s => {
            const name = (s.name || s.studentName || '').toLowerCase();
            const id = (s.studentId || s.id || '').toString().toLowerCase();
            return name.includes(searchTerm) || id.includes(searchTerm);
        });
    }

    filteredStudents = students;
    renderStudentTable();
}

/**
 * 查看学生详情
 */
function viewStudentDetails(studentId) {
    const student = allStudents.find(s =>
        (s.id && s.id.toString() === studentId) ||
        (s.studentId && s.studentId.toString() === studentId)
    );

    if (!student) {
        alert('未找到学生信息');
        return;
    }

    const detailsDiv = document.getElementById('studentDetails');
    detailsDiv.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">学号:</span>
                <span class="detail-value">${student.studentId || student.id || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">姓名:</span>
                <span class="detail-value">${student.name || student.studentName || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">班级:</span>
                <span class="detail-value">${student.class || student.className || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">年级:</span>
                <span class="detail-value">${student.grade || student.gradeName || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">状态:</span>
                <span class="detail-value">${(student.status === 'active' || student.isActive) ? '活跃' : '非活跃'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">联系方式:</span>
                <span class="detail-value">${student.phone || student.contact || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">邮箱:</span>
                <span class="detail-value">${student.email || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">入学日期:</span>
                <span class="detail-value">${student.enrollmentDate || 'N/A'}</span>
            </div>
        </div>
    `;

    document.getElementById('studentModal').style.display = 'flex';
}

/**
 * 关闭模态框
 */
function closeModal() {
    document.getElementById('studentModal').style.display = 'none';
}

/**
 * 返回班级选择/列表首页
 */
function backToClassSelection() {
    document.getElementById('studentContent').style.display = 'none';
    document.getElementById('classSelection').style.display = 'block';
    currentClassId = null;
    allStudents = [];
    filteredStudents = [];
}

/**
 * 返回教师列表（首页）
 */
function backToTeacherList() {
    document.getElementById('classSelection').style.display = 'none';
    document.getElementById('studentContent').style.display = 'none';
    document.getElementById('teacherContent').style.display = 'block';

    // 更新导航按钮状态
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-button:first-child').classList.add('active');
}

/**
 * 显示教师列表
 */
function showTeacherList() {
    document.getElementById('classSelection').style.display = 'none';
    document.getElementById('studentContent').style.display = 'none';
    document.getElementById('teacherContent').style.display = 'block';

    // 更新导航按钮状态
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

/**
 * 显示班级选择（学生模块）
 */
function showClassSelection() {
    document.getElementById('teacherContent').style.display = 'none';
    document.getElementById('studentContent').style.display = 'none';
    document.getElementById('classSelection').style.display = 'block';

    // 更新导航按钮状态
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 加载班级列表（如果还没加载）
    if (allClasses.length === 0) {
        loadClassList();
    }
}

/**
 * 页面加载初始化
 */
window.addEventListener('DOMContentLoaded', () => {
    // 1. 解析URL参数
    parseURLParams();

    // 2. 检查授权
    const isAuthorized = checkAuthorization();

    // 3. 如果授权通过，默认加载班级列表（学生首页）
    if (isAuthorized) {
        document.getElementById('navBar').style.display = 'flex';
        // 默认显示学生界面（班级选择）
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.nav-button')[0].classList.add('active');  // 学生按钮（第1个）
        loadClassList();
    }
});

// 点击模态框外部关闭
window.addEventListener('click', (event) => {
    const modal = document.getElementById('studentModal');
    if (event.target === modal) {
        closeModal();
    }
    const teacherModal = document.getElementById('teacherModal');
    if (event.target === teacherModal) {
        closeTeacherModal();
    }
});

/**
 * 更新教师统计数据
 */
function updateTeacherStats() {
    const totalCount = allTeachers.length;
    document.getElementById('totalTeachers').textContent = totalCount;
}

/**
 * 渲染教师表格
 */
function renderTeacherTable() {
    const tbody = document.getElementById('teacherTableBody');
    tbody.innerHTML = '';

    if (filteredTeachers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">暂无教师数据</td>
            </tr>
        `;
        return;
    }

    filteredTeachers.forEach(teacher => {
        const row = document.createElement('tr');
        row.className = 'student-row';

        // 处理班级列表
        let classNames = 'N/A';
        if (teacher.classDtos && Array.isArray(teacher.classDtos) && teacher.classDtos.length > 0) {
            classNames = teacher.classDtos.map(c => c.name || c.className || '').filter(n => n).join(', ');
        }

        row.innerHTML = `
            <td>${teacher.name || 'N/A'}</td>
            <td>${teacher.schoolSubjectNames || 'N/A'}</td>
            <td>${classNames}</td>
            <td>${teacher.tel || 'N/A'}</td>
            <td>
                <span class="status-badge ${teacher.status === 1 ? 'status-active' : 'status-inactive'}">
                    ${teacher.status === 1 ? '在职' : '离职'}
                </span>
            </td>
            <td>
                <button class="action-button" onclick="viewTeacherDetails('${teacher.id}')">
                    查看详情
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * 搜索教师
 */
function filterTeachers() {
    const searchTerm = document.getElementById('teacherSearchInput').value.toLowerCase();

    let teachers = [...allTeachers];

    // 根据搜索词过滤
    if (searchTerm) {
        teachers = teachers.filter(t => {
            const name = (t.name || '').toLowerCase();
            const subject = (t.schoolSubjectNames || '').toLowerCase();
            return name.includes(searchTerm) || subject.includes(searchTerm);
        });
    }

    filteredTeachers = teachers;
    renderTeacherTable();
}

/**
 * 查看教师详情
 */
function viewTeacherDetails(teacherId) {
    const teacher = allTeachers.find(t => t.id && t.id.toString() === teacherId);

    if (!teacher) {
        alert('未找到教师信息');
        return;
    }

    // 处理班级列表
    let classNames = 'N/A';
    if (teacher.classDtos && Array.isArray(teacher.classDtos) && teacher.classDtos.length > 0) {
        classNames = teacher.classDtos.map(c => c.name || c.className || '').filter(n => n).join(', ');
    }

    const detailsDiv = document.getElementById('teacherDetails');
    detailsDiv.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">姓名:</span>
                <span class="detail-value">${teacher.name || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">任教科目:</span>
                <span class="detail-value">${teacher.schoolSubjectNames || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">任教班级:</span>
                <span class="detail-value">${classNames}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">联系电话:</span>
                <span class="detail-value">${teacher.tel || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">状态:</span>
                <span class="detail-value">${teacher.status === 1 ? '在职' : '离职'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">是否评审:</span>
                <span class="detail-value">${teacher.isJury ? '是' : '否'}</span>
            </div>
        </div>
    `;

    document.getElementById('teacherModal').style.display = 'flex';
}

/**
 * 关闭教师模态框
 */
function closeTeacherModal() {
    document.getElementById('teacherModal').style.display = 'none';
}

