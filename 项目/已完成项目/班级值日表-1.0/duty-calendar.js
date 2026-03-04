// ========== 值日表日历视图模块 ==========

// 值日表日历状态
const dutyCalendarState = {
    currentYear: new Date().getFullYear(),
    assignments: [],
    dutyMap: new Map(),
    holidays: new Map(),       // 存储节假日数据 "01-01" => {name: "元旦", ...}
    compensatoryDays: new Map() // 存储调休工作日 "01-28" => {name: "春节前调休", ...}
};

// 渲染值日表日历
async function renderDutyCalendar() {
    const container = document.getElementById('scheduleCalendarContainer');
    if (!container) return;

    container.innerHTML = '<p class="loading-text">加载值日表...</p>';

    // 更新年份显示
    updateScheduleYearDisplay();

    try {
        const classId = APP_STATE.currentClass?.id;
        if (!classId) {
            container.innerHTML = '<p class="empty-text">请先选择班级</p>';
            return;
        }

        // 使用当前选择的年份构建日期范围
        const startDate = new Date(dutyCalendarState.currentYear, 0, 1);  // 1月1日
        const endDate = new Date(dutyCalendarState.currentYear, 11, 31);  // 12月31日

        // 获取值日安排
        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);
        const assignments = await db.getDutyAssignments(classId, startStr, endStr);

        // 保存到状态
        dutyCalendarState.assignments = assignments;

        // 即使有配置也要检查是否有实际的值日安排
        if (assignments.length === 0) {
            // 检查是否有配置
            const config = await db.getScheduleConfig(classId);
            if (!config || config.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <p class="empty-text">📋 尚未配置值日表</p>
                        <p style="color: #9A8F7D; margin-top: 15px; font-size: 14px;">
                            请先前往 "值日配置" 页面创建值日配置
                        </p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <p class="empty-text">📅 ${dutyCalendarState.currentYear}年暂无值日安排</p>
                        <p style="color: #9A8F7D; margin-top: 15px; font-size: 14px;">
                            请前往 "值日配置" 页面点击"生成值日表"按钮
                        </p>
                    </div>
                `;
            }
            return;
        }

        // 获取当前班级的学生列表，用于过滤已删除的学生
        let validStudentNames = new Set();
        if (window.APP_STATE && window.APP_STATE.cachedStudents) {
            window.APP_STATE.cachedStudents.forEach(s => validStudentNames.add(s.name));
        }

        // 创建日期到值日的映射
        const dutyMap = new Map();
        assignments.forEach(assignment => {
            const allMembers = JSON.parse(assignment.student_ids || '[]');
            // 过滤掉已删除的学生
            const validMembers = validStudentNames.size > 0
                ? allMembers.filter(name => validStudentNames.has(name))
                : allMembers;

            dutyMap.set(assignment.duty_date, {
                groupName: assignment.group_name,
                members: validMembers
            });
        });

        dutyCalendarState.dutyMap = dutyMap;

        // 获取节假日数据（包括调休日）
        await fetchHolidays(dutyCalendarState.currentYear);

        // 使用DocumentFragment减少DOM操作
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        // 渲染12个月
        for (let month = 0; month < 12; month++) {
            const monthElement = renderDutyMonth(month, dutyCalendarState.currentYear, dutyMap);
            fragment.appendChild(monthElement);
        }

        // 一次性添加所有月份
        container.appendChild(fragment);

    } catch (error) {
        console.error('❌ 加载值日表失败:', error);
        container.innerHTML = '<p class="empty-text">加载失败，请重试</p>';
    }
}

// 渲染单个月的值日日历（返回元素而不是直接添加）
function renderDutyMonth(month, year, dutyMap) {
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'];

    const monthDiv = document.createElement('div');
    monthDiv.className = 'month-calendar';

    // 月份标题
    const title = document.createElement('h4');
    title.textContent = `${monthNames[month]} ${year}`;
    title.className = 'month-title';
    monthDiv.appendChild(title);

    // 星期标题
    const weekHeader = document.createElement('div');
    weekHeader.className = 'week-header';
    ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.textContent = day;
        dayEl.className = 'week-day-label';
        weekHeader.appendChild(dayEl);
    });
    monthDiv.appendChild(weekHeader);

    // 日期网格
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 填充前置空白
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        daysGrid.appendChild(emptyCell);
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        const dayCell = document.createElement('div');

        dayCell.className = 'day-cell';
        dayCell.textContent = day;

        // 判断是否是今天
        if (isToday(date)) {
            dayCell.classList.add('today');
        }

        // 检查是否是调休工作日
        const isCompensatory = isCompensatoryWorkday(date);

        // 判断是否是节假日
        const isHol = isHoliday(date);

        if (isCompensatory) {
            // 调休工作日：橙色
            dayCell.classList.add('compensatory');
            dayCell.title = getCompensatoryName(date);
        } else if (isHol) {
            // 节假日：红色
            dayCell.classList.add('holiday');
            dayCell.title = getHolidayName(date);
        } else if (date.getDay() === 0 || date.getDay() === 6) {
            // 普通周末：只在非节假日、非调休时标记
            dayCell.classList.add('weekend');
        }

        // 检查是否有值日安排
        const duty = dutyMap.get(dateStr);
        if (duty) {
            dayCell.classList.add('has-duty');
            dayCell.classList.add('selected'); // 使用选中样式

            // 创建悬浮提示
            const tooltip = document.createElement('div');
            tooltip.className = 'duty-tooltip';

            const tooltipTitle = document.createElement('div');
            tooltipTitle.className = 'duty-tooltip-title';
            tooltipTitle.textContent = duty.groupName;
            tooltip.appendChild(tooltipTitle);

            const tooltipMembers = document.createElement('div');
            tooltipMembers.className = 'duty-tooltip-members';
            tooltipMembers.innerHTML = `<strong>成员：</strong>${duty.members.join('、')}`;
            tooltip.appendChild(tooltipMembers);

            dayCell.appendChild(tooltip);
        }

        daysGrid.appendChild(dayCell);
    }

    monthDiv.appendChild(daysGrid);
    return monthDiv; // 返回元素而不是添加到container
}

// 工具函数
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

// 获取节假日数据
async function fetchHolidays(year) {
    try {
        const response = await fetch(`https://timor.tech/api/holiday/year/${year}`);
        const data = await response.json();

        if (data.code === 0 && data.holiday) {
            dutyCalendarState.holidays.clear();
            dutyCalendarState.compensatoryDays.clear();

            Object.entries(data.holiday).forEach(([date, info]) => {
                const [month, day] = date.split('-');
                const key = `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                if (info.holiday === true) {
                    dutyCalendarState.holidays.set(key, info);
                } else if (info.holiday === false) {
                    dutyCalendarState.compensatoryDays.set(key, info);
                }
            });
        }
    } catch (error) {
        console.error('❌ 获取节假日失败:', error);
    }
}

// 检查是否是节假日
function isHoliday(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${month}-${day}`;
    return dutyCalendarState.holidays.has(key);
}

// 检查是否是调休工作日
function isCompensatoryWorkday(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${month}-${day}`;
    return dutyCalendarState.compensatoryDays.has(key);
}

// 获取节假日名称
function getHolidayName(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${month}-${day}`;
    const holiday = dutyCalendarState.holidays.get(key);
    return holiday ? holiday.name : '';
}

// 获取调休工作日名称
function getCompensatoryName(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${month}-${day}`;
    const compensatory = dutyCalendarState.compensatoryDays.get(key);
    return compensatory ? compensatory.name : '';
}

// 更新年份显示
function updateScheduleYearDisplay() {
    const yearDisplay = document.getElementById('scheduleYearDisplay');
    if (yearDisplay) {
        yearDisplay.textContent = `${dutyCalendarState.currentYear}年`;
    }
}

// 上一年
function schedulePrevYear() {
    dutyCalendarState.currentYear--;
    console.log(`📅 切换到 ${dutyCalendarState.currentYear} 年`);
    renderDutyCalendar();
}

// 下一年
function scheduleNextYear() {
    dutyCalendarState.currentYear++;
    console.log(`📅 切换到 ${dutyCalendarState.currentYear} 年`);
    renderDutyCalendar();
}

// 初始化事件监听
function initDutyCalendarEvents() {
    const prevYearBtn = document.getElementById('schedulePrevYearBtn');
    const nextYearBtn = document.getElementById('scheduleNextYearBtn');

    if (prevYearBtn) {
        prevYearBtn.addEventListener('click', schedulePrevYear);
    }
    if (nextYearBtn) {
        nextYearBtn.addEventListener('click', scheduleNextYear);
    }

    console.log('✅ 值日表日历事件监听器已初始化');
}

// 导出
window.DutyCalendarModule = {
    render: renderDutyCalendar,
    initEvents: initDutyCalendarEvents,
    state: dutyCalendarState
};

console.log('📅 值日表日历模块已加载');
