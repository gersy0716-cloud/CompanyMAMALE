/* 🔥 VERSION: v4_FINAL_BUILD_235100 - Holiday Fix - CACHE BUSTED */
// ========== 日历配置模块 ==========
// 专门处理年度日历视图的值日日期选择

// 全局日历状态
const calendarState = {
    selectedYear: new Date().getFullYear(),  // 学年选择：默认当前年份
    calendarDisplayYear: new Date().getFullYear(),  // 日历显示年份：默认当前年份
    currentMonth: 0,  // 0-11
    selectedDates: new Set(),  // 存储选中的日期 "2026-01-15"
    holidays: new Map(),  // 存储真假期数据（holiday=true） "01-01" => {name: "元旦", ...}
    compensatoryDays: new Map(),  // 存储调休工作日（holiday=false） "01-28" => {name: "春节前调休", ...}
    viewMode: 'all',  // 默认全年视图 'single' 或 'all'
    dateMode: 'schoolYear',  // 日期选择模式：'schoolYear' 或 'custom'
    startDate: null,
    endDate: null,
    isInitialized: false,
    holidayCache: {}  // 节假日缓存 {year: {holidays, compensatory, timestamp}}
};

// 动态填充年份选择器（前一年 + 当前年份 + 延后3年）
function populateYearSelector() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    const endYear = currentYear + 3;

    yearSelect.innerHTML = '';

    // 添加默认空选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-未选择-';
    defaultOption.selected = true;
    yearSelect.appendChild(defaultOption);

    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}-${year + 1}学年`;
        yearSelect.appendChild(option);
    }

    // 初始状态：未选择学年
    calendarState.selectedYear = null;
    console.log(`📅 学年选择器已生成: ${startYear}-${endYear}, 初始状态：未选择`);
}

// ========== 节假日API集成 ==========

// 获取节假日数据（每次都从API获取，不使用缓存）
async function fetchCalendarHolidays(year) {
    console.log(`🔍 [calendar.js] fetchCalendarHolidays 被调用，年份: ${year}`);

    // ✅ 移除缓存机制，每次都从API获取最新数据
    console.log(`📡 [calendar.js] 开始从API获取${year}年节假日数据...`);

    try {
        // 创建超时Promise（5秒超时）
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API请求超时(5秒)')), 5000);
        });

        // 使用HTTPS协议
        const apiUrl = `https://timor.tech/api/holiday/year/${year}`;
        console.log(`📡 [calendar.js] 请求URL: ${apiUrl}`);
        const fetchPromise = fetch(apiUrl);

        // 竞速：哪个先完成用哪个
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        console.log(`📥 [calendar.js] 收到响应，状态码: ${response.status}`);

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();

        console.log('[calendar.js] 📦 API返回的原始数据:', data);
        console.log(`[calendar.js] 📦 data.code = ${data.code}, data.holiday存在 = ${!!data.holiday}`);

        if (data.code === 0 && data.holiday) {
            console.log(`[calendar.js] ✅ API返回成功，开始解析数据...`);

            calendarState.holidays.clear();
            calendarState.compensatoryDays.clear();

            // 遍历节假日数据，区分真假期和调休工作日
            let holidayCount = 0;
            let compensatoryCount = 0;

            for (const [dateKey, info] of Object.entries(data.holiday)) {
                // 格式化日期键：确保月份和日期都是2位数（如 "1-1" -> "01-01"）
                const [month, day] = dateKey.split('-');
                const formattedKey = `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                // ✨ 正确区分节假日和调休工作日
                // holiday === true 表示放假（休息日）
                // holiday === false 表示调休需要上班（工作日）
                if (info.holiday === true) {
                    calendarState.holidays.set(formattedKey, info);
                    holidayCount++;
                    console.log(`  ✅ [calendar.js] ${formattedKey} 是节假日: ${info.name}`);
                } else if (info.holiday === false) {
                    calendarState.compensatoryDays.set(formattedKey, info);
                    compensatoryCount++;
                    console.log(`  ⚡ [calendar.js] ${formattedKey} 是调休工作日: ${info.name}`);
                }
            }

            console.log(`[calendar.js] 📊 解析完成: ${holidayCount} 个节假日, ${compensatoryCount} 个调休工作日`);
            console.log(`✅ [calendar.js] 获取到 ${calendarState.holidays.size} 个节假日，${calendarState.compensatoryDays.size} 个调休工作日`);

            // ✨ 详细输出调休日期列表
            if (calendarState.compensatoryDays.size > 0) {
                console.log('[calendar.js] 📋 调休工作日列表:');
                calendarState.compensatoryDays.forEach((info, date) => {
                    console.log(`  - ${date}: ${info.name} (需要上班)`);
                });
            }

            return true;
        } else if (data.code === 0 && !data.holiday) {
            console.warn(`⚠️ [calendar.js] ${year}年暂无节假日数据（该年份数据尚未发布，请等待API更新）`);
            calendarState.holidays.clear();
            calendarState.compensatoryDays.clear();

            // 添加UI提示
            showNoHolidayDataNotice(year);
            return false;
        } else {
            // 其他异常情况
            console.error(`❌ [calendar.js] API返回异常数据:`, {
                code: data.code,
                hasHoliday: !!data.holiday,
                data: data
            });
            calendarState.holidays.clear();
            calendarState.compensatoryDays.clear();
            return false;
        }
    } catch (error) {
        console.error(`❌ [calendar.js] 获取${year}年节假日失败:`, error);
        console.error(`❌ [calendar.js] 错误详情:`, {
            message: error.message,
            stack: error.stack
        });

        // 如果是网络错误，提示用户
        if (error.message.includes('超时') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            console.warn('[calendar.js] ⚠️ 节假日API响应缓慢或无法访问，将使用默认工作日配置');
        }

        calendarState.holidays.clear();
        calendarState.compensatoryDays.clear();
    }

    console.log(`[calendar.js] 🏁 fetchCalendarHolidays 执行完成，返回 false`);
    return false;
}

// 获取单个年份的节假日数据（追加模式，不清空现有数据）
async function fetchCalendarHolidaysForYear(year, clearExisting = false) {
    console.log(`🔍 [calendar.js] fetchCalendarHolidaysForYear 被调用，年份: ${year}`);

    // 首次调用时清空数据
    if (clearExisting) {
        calendarState.holidays.clear();
        calendarState.compensatoryDays.clear();
    }

    try {
        const response = await fetch(`https://timor.tech/api/holiday/year/${year}`);
        if (!response.ok) return false;

        const data = await response.json();

        if (data.code === 0 && data.holiday) {
            for (const [dateKey, info] of Object.entries(data.holiday)) {
                const [month, day] = dateKey.split('-');
                const formattedKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                if (info.holiday === true) {
                    calendarState.holidays.set(formattedKey, info);
                } else if (info.holiday === false) {
                    calendarState.compensatoryDays.set(formattedKey, info);
                }
            }
            console.log(`✅ [calendar.js] ${year}年: 已加载节假日和调休数据`);
            return true;
        }
    } catch (error) {
        console.error(`❌ [calendar.js] 获取${year}年节假日失败:`, error);
    }
    return false;
}

// 检查是否是节假日 [VERSION_v4_FINAL] - 重命名避免冲突
function configIsHoliday(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    return calendarState.holidays.has(key);
}

// 🔥 导出到全局window对象，允许动态覆盖和调试
// ⚠️ 重命名为 configIsHoliday 避免与 duty-calendar.js 冲突
window.configIsHoliday = configIsHoliday;

// 检查是否是调休工作日 [配置模块专用]
function configIsCompensatoryWorkday(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const result = calendarState.compensatoryDays.has(key);
    // 调试：首次检测到调休日时输出
    if (result) {
        console.log(`🔥 [configIsCompensatoryWorkday] ${key} = TRUE`);
    }
    return result;
}

// 获取节假日名称
function getHolidayName(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const holiday = calendarState.holidays.get(key);
    return holiday ? holiday.name : '';
}

// 获取调休工作日名称 [配置模块专用]
function configGetCompensatoryName(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const compensatory = calendarState.compensatoryDays.get(key);
    return compensatory ? compensatory.name : '';
}

// ========== 初始化和渲染 ==========

// 初始化日历(默认选中工作日，排除节假日和周末)
async function initializeCalendar() {
    console.log('🔧 初始化日历...');

    // 填充学年选择器
    populateYearSelector();

    // 更新年份显示
    updateYearDisplay();

    // ❗ 关键修复：先获取节假日数据，再设置默认日期
    await fetchCalendarHolidays(calendarState.calendarDisplayYear);

    // ⚠️ 当用户未选择学年时（selectedYear为null），不设置默认日期
    // 等用户选择学年后再通过 handleYearChange 设置
    if (calendarState.selectedYear !== null) {
        const year = calendarState.selectedYear;
        // 只有在没有日期时才设置默认值（避免覆盖已加载的配置）
        if (!calendarState.startDate) {
            calendarState.startDate = new Date(year, 8, 1); // 9月1日
            console.log('📅 设置默认开始日期:', calendarState.startDate);
        }
        if (!calendarState.endDate) {
            calendarState.endDate = new Date(year + 1, 5, 30); // 次年6月30日
            console.log('📅 设置默认结束日期:', calendarState.endDate);
        }
    } else {
        console.log('📅 等待用户选择学年...');
    }

    // 更新日期输入框
    updateDateInputs();

    // ✨ 初始状态：禁用日历，显示提示，不预选任何日期
    disableCalendarSelection();

    // 清空之前的选择（如果有）
    calendarState.selectedDates.clear();
    console.log('📅 初始状态：未选择任何日期，等待用户点击"确定"按钮');

    renderCalendar();

    calendarState.isInitialized = true;
    console.log('✅ 日历初始化完成，当前选中', calendarState.selectedDates.size, '个日期');
}

// 禁用日历选择
function disableCalendarSelection() {
    const container = document.getElementById('calendarContainer');
    const hint = document.getElementById('dateSelectionHint');
    if (container) container.classList.add('disabled');
    if (hint) hint.style.display = 'block';
}

// 启用日历选择
function enableCalendarSelection() {
    const container = document.getElementById('calendarContainer');
    const hint = document.getElementById('dateSelectionHint');
    if (container) container.classList.remove('disabled');
    if (hint) hint.style.display = 'none';
}

// 应用日期范围（选中范围内的工作日）
function applyDateRange() {
    calendarState.selectedDates.clear();

    const startDate = calendarState.startDate;
    const endDate = calendarState.endDate;

    if (!startDate || !endDate) {
        console.warn('⚠️ 未设置日期范围');
        return;
    }

    console.log('📅 应用日期范围:', {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        holidays: calendarState.holidays.size,
        compensatory: calendarState.compensatoryDays.size
    });

    // 遍历日期范围
    let currentDate = new Date(startDate);
    let selectedCount = 0;
    let compensatoryCount = 0;
    let debugLogged = false;  // 只输出一次调试信息

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = formatDate(currentDate);

        // 规则1：周一到周五的工作日（排除节假日）
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !configIsHoliday(currentDate)) {
            calendarState.selectedDates.add(dateStr);
            selectedCount++;
        }

        // 规则2：调休工作日（不论周末还是工作日都应该选中）
        if (configIsCompensatoryWorkday(currentDate)) {
            calendarState.selectedDates.add(dateStr);
            compensatoryCount++;
            console.log(`📌 自动选中调休工作日: ${dateStr} - ${configGetCompensatoryName(currentDate)}`);
        }

        // 调试：检查特定日期
        if (!debugLogged && dateStr === '2026-01-04') {
            const key = dateStr;
            const hasKey = calendarState.compensatoryDays.has(key);
            console.log(`🔍 调试 2026-01-04: dayOfWeek=${dayOfWeek}, key=${key}, has=${hasKey}`);
            console.log(`🔍 compensatoryDays.keys():`, Array.from(calendarState.compensatoryDays.keys()).slice(0, 5));
            debugLogged = true;
        }

        // 下一天
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`✅ 选中了 ${selectedCount} 个工作日 + ${compensatoryCount} 个调休工作日，共 ${calendarState.selectedDates.size} 个日期`);
    renderCalendar();
}

// 更新日期输入框
function updateDateInputs() {
    const startInput = document.getElementById('startDateInput');
    const endInput = document.getElementById('endDateInput');

    if (startInput && calendarState.startDate) {
        startInput.value = formatDate(calendarState.startDate);
    }
    if (endInput && calendarState.endDate) {
        endInput.value = formatDate(calendarState.endDate);
    }
}

// 渲染日历
function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    // 🔍 调试：输出当前状态
    console.log('[calendar.js] 🎨 开始渲染日历...');
    console.log(`  - 节假日数量: ${calendarState.holidays.size}`);
    console.log(`  - 调休工作日数量: ${calendarState.compensatoryDays.size}`);
    console.log(`  - 选中日期数量: ${calendarState.selectedDates.size}`);

    container.innerHTML = '';

    if (calendarState.viewMode === 'single') {
        // 单月视图
        renderMonth(calendarState.currentMonth);
    } else {
        // 全年视图
        for (let month = 0; month < 12; month++) {
            renderMonth(month);
        }
    }

    // 更新月份标题
    updateMonthTitle();

    // 最终确认
    console.log(`✅ 日历已渲染，共选中 ${calendarState.selectedDates.size} 个日期`);
}

// 渲染单个月份
function renderMonth(month) {
    const year = calendarState.calendarDisplayYear;  // 使用日历显示年份
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'];

    const monthDiv = document.createElement('div');
    monthDiv.className = 'month-calendar';

    // 月份标题（带导航，仅在单月模式显示导航）
    const header = document.createElement('div');
    header.className = 'month-header';

    if (calendarState.viewMode === 'single') {
        // 单月模式：显示导航按钮
        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-btn';
        prevBtn.textContent = '← 上一月';
        prevBtn.onclick = prevMonth;

        const title = document.createElement('h4');
        title.textContent = `${monthNames[month]} ${year}`;
        title.className = 'month-title';
        title.style.margin = '0';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-btn';
        nextBtn.textContent = '下一月 →';
        nextBtn.onclick = nextMonth;

        header.appendChild(prevBtn);
        header.appendChild(title);
        header.appendChild(nextBtn);
    } else {
        // 全年模式：只显示标题
        const title = document.createElement('h4');
        title.textContent = `${monthNames[month]} ${year}`;
        title.className = 'month-title';
        title.style.margin = '0';
        header.appendChild(title);
    }

    monthDiv.appendChild(header);

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
        dayCell.dataset.date = dateStr;

        // 判断是否选中
        const isSelected = calendarState.selectedDates.has(dateStr);
        if (isSelected) {
            dayCell.classList.add('selected');
        }

        // 判断是否是今天
        if (isToday(date)) {
            dayCell.classList.add('today');
        }

        // ❗❗❗ 关键修复：先检查节假日和调休，再检查周末
        // 这样可以确保节假日/调休的颜色不会被weekend覆盖

        // 🔍 调试：看看这段代码是否被执行
        if (day === 1) { // 只对每月1号输出，避免刷屏
            console.log(`🔍 [renderMonth] 检查 ${dateStr} - month=${month + 1}, day=${day}`);
        }

        const isCompensatory = configIsCompensatoryWorkday(date);
        // 🔥 使用本模块的 configIsHoliday 函数
        const isHol = configIsHoliday(date);

        if (isCompensatory) {
            // 调休工作日：显示独特颜色并自动选中
            dayCell.classList.add('compensatory');
            dayCell.title = configGetCompensatoryName(date);
        } else if (isHol) {
            // 真假期：显示红色
            dayCell.classList.add('holiday');
            dayCell.title = getHolidayName(date);
        }

        // 判断是否是周末（放在节假日之后，这样不会覆盖节假日的样式）
        if (date.getDay() === 0 || date.getDay() === 6) {
            // 只在非节假日、非调休时才添加weekend类
            if (!isHol && !isCompensatory) {
                dayCell.classList.add('weekend');
            }
        }

        // 点击事件：切换选中状态
        dayCell.addEventListener('click', () => toggleDate(dateStr, dayCell));

        daysGrid.appendChild(dayCell);
    }

    monthDiv.appendChild(daysGrid);
    document.getElementById('calendarContainer').appendChild(monthDiv);
}

// 更新月份标题
function updateMonthTitle() {
    const titleEl = document.getElementById('currentMonthTitle');
    if (!titleEl) return;

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    titleEl.textContent = `${monthNames[calendarState.currentMonth]} ${calendarState.selectedYear}`;
}

// ========== 交互操作 ==========

// 切换日期选中状态
function toggleDate(dateStr, cellElement) {
    if (calendarState.selectedDates.has(dateStr)) {
        calendarState.selectedDates.delete(dateStr);
        cellElement.classList.remove('selected');
    } else {
        calendarState.selectedDates.add(dateStr);
        cellElement.classList.add('selected');
    }

    console.log(`📅 当前选中 ${calendarState.selectedDates.size} 个日期`);
}

// 清空所有选择
function clearAllDates() {
    calendarState.selectedDates.clear();
    console.log('🗑️ 已清空所有选择');
    renderCalendar();
}

// 上一月
function prevMonth() {
    calendarState.currentMonth--;
    if (calendarState.currentMonth < 0) {
        calendarState.currentMonth = 11;
        calendarState.selectedYear--;
        // 重新获取新年份的节假日
        fetchCalendarHolidays(calendarState.selectedYear).then(() => renderCalendar());
    } else {
        renderCalendar();
    }
}

// 下一月
function nextMonth() {
    calendarState.currentMonth++;
    if (calendarState.currentMonth > 11) {
        calendarState.currentMonth = 0;
        calendarState.selectedYear++;
        // 重新获取新年份的节假日
        fetchCalendarHolidays(calendarState.selectedYear).then(() => renderCalendar());
    } else {
        renderCalendar();
    }
}

// 上一年
function prevYear() {
    calendarState.calendarDisplayYear--;
    console.log(`📅 切换到 ${calendarState.calendarDisplayYear} 年`);
    updateYearDisplay();
    // 重新获取该年份的节假日
    fetchCalendarHolidays(calendarState.calendarDisplayYear).then(() => {
        renderCalendar();
    });
}

// 下一年
function nextYear() {
    calendarState.calendarDisplayYear++;
    console.log(`📅 切换到 ${calendarState.calendarDisplayYear} 年`);
    updateYearDisplay();
    // 重新获取该年份的节假日
    fetchCalendarHolidays(calendarState.calendarDisplayYear).then(() => {
        renderCalendar();
    });
}

// 更新年份显示
function updateYearDisplay() {
    const yearDisplay = document.getElementById('currentYearDisplay');
    if (yearDisplay) {
        yearDisplay.textContent = `${calendarState.calendarDisplayYear}年`;
    }
}

// 切换视图模式
function toggleViewMode() {
    const btn = document.getElementById('showAllMonthsBtn');
    if (calendarState.viewMode === 'single') {
        calendarState.viewMode = 'all';
        btn.textContent = '单月显示';
    } else {
        calendarState.viewMode = 'single';
        btn.textContent = '显示全年';
    }
    renderCalendar();
}

// 年份改变
function handleYearChange(year) {
    // 如果选择了空选项，清空日历
    if (!year || year === '') {
        calendarState.selectedYear = null;
        calendarState.selectedDates.clear();
        calendarState.startDate = null;
        calendarState.endDate = null;
        document.getElementById('calendarContainer').innerHTML = '<p class="empty-text">请先选择学年</p>';
        console.log('📅 未选择学年');
        return;
    }

    calendarState.selectedYear = parseInt(year);
    calendarState.currentMonth = 0;

    // 重新设置默认日期范围
    calendarState.startDate = new Date(calendarState.selectedYear, 8, 1);
    calendarState.endDate = new Date(calendarState.selectedYear + 1, 5, 30);
    updateDateInputs();

    // 🔧 关键修复：学年跨越两个日历年，需要加载两年的节假日数据
    const startYear = calendarState.selectedYear;
    const endYear = calendarState.selectedYear + 1;
    console.log(`📅 学年切换到 ${startYear}-${endYear}，需要加载两年的节假日数据`);

    // 先清空现有数据
    calendarState.holidays.clear();
    calendarState.compensatoryDays.clear();

    // 并行加载两年的节假日数据
    Promise.all([
        fetchCalendarHolidaysForYear(startYear),
        fetchCalendarHolidaysForYear(endYear)
    ]).then(() => {
        console.log(`✅ 已加载 ${startYear} 和 ${endYear} 年的节假日数据`);
        console.log(`📊 节假日: ${calendarState.holidays.size}个, 调休: ${calendarState.compensatoryDays.size}个`);
        applyDateRange();
    });
}

// 日期范围改变
function handleDateRangeChange() {
    const startInput = document.getElementById('startDateInput');
    const endInput = document.getElementById('endDateInput');

    if (startInput.value) {
        calendarState.startDate = new Date(startInput.value);
    }
    if (endInput.value) {
        calendarState.endDate = new Date(endInput.value);
    }

    console.log('📅 日期范围已更新');
}

// ========== 数据保存 ==========

// 保存配置到数据库
async function saveCalendarConfig() {
    try {
        const selectedArray = Array.from(calendarState.selectedDates).sort();

        if (selectedArray.length === 0) {
            alert('请至少选择一个值日日期');
            return false;
        }

        // 🎨 显示加载遮罩
        showLoadingOverlay('正在保存配置...');

        console.log('💾 保存配置...');
        console.log(`选中日期: ${selectedArray.length} 个`);

        // 修复：直接从全局 APP_STATE 获取 currentClass
        const classId = (typeof APP_STATE !== 'undefined' && APP_STATE.currentClass)
            ? APP_STATE.currentClass.id
            : null;

        console.log('当前班级:', typeof APP_STATE !== 'undefined' ? APP_STATE.currentClass : 'APP_STATE未定义');

        if (!classId) {
            hideLoadingOverlay();
            alert('错误：未找到班级ID，请先选择班级');
            console.error('❌ currentClass:', typeof APP_STATE !== 'undefined' ? APP_STATE.currentClass : 'APP_STATE未定义');
            return false;
        }

        // 获取班级名称
        const className = (typeof APP_STATE !== 'undefined' && APP_STATE.currentClass)
            ? APP_STATE.currentClass.name
            : '未知班级';

        // 根据数据库表设计，只包含表中实际存在的字段
        // 将用户选择的日期存储在 enabled_dates 字段中
        const config = {
            name: `${className}-${calendarState.selectedYear}学年值日配置`,  // 必填：配置名称
            class_id: classId,  // 必填：班级ID
            start_date: formatDate(calendarState.startDate),  // 必填：开始日期
            end_date: formatDate(calendarState.endDate),  // 必填：结束日期
            work_days: JSON.stringify([1, 2, 3, 4, 5]),  // 必填：默认周一到周五（保持兼容性）
            enabled_dates: JSON.stringify(selectedArray),  // 用户实际选择的日期列表
            disabled_dates: JSON.stringify([]),  // 可选：禁用的日期
            is_active: 1  // 必填：Switch字段使用数字1
        };

        console.log('📤 准备保存的配置数据:', config);

        // 先删除该班级的旧配置
        await deleteOldConfigs(classId);

        // 保存新配置
        await db.createScheduleConfig(config);

        hideLoadingOverlay();
        console.log('✅ 配置保存成功');
        alert('✅ 配置保存成功！');
        return true;
    } catch (error) {
        hideLoadingOverlay();
        console.error('❌ 保存配置失败:', error);
        alert('保存失败: ' + error.message);
        return false;
    }
}

// 删除旧配置
async function deleteOldConfigs(classId) {
    try {
        console.log('🗑️ 删除旧配置记录...');

        // 获取该班级的所有配置
        const filter = {
            conjunction: 'and',
            filterSet: [{
                fieldId: 'class_id',
                operator: 'is',
                value: classId
            }]
        };

        const oldConfigs = await db.getAllRecords(db.TABLES?.duty_schedule_config || 'ERACsEgYix', filter);
        const filtered = oldConfigs.filter(r => r.class_id === classId);

        // 删除所有旧配置
        for (const config of filtered) {
            await db.deleteRecord(db.TABLES?.duty_schedule_config || 'ERACsEgYix', config.id);
        }

        console.log(`✅ 已删除 ${filtered.length} 条旧配置`);
    } catch (error) {
        console.error('❌ 删除旧配置失败:', error);
    }
}

// 加载已保存的配置
async function loadSavedConfig(classId) {
    try {
        console.log('📂 加载已保存的配置...');

        const config = await db.getScheduleConfig(classId);

        if (config && config.enabled_dates) {
            // 从 enabled_dates 字段加载用户选择的日期
            const dates = JSON.parse(config.enabled_dates);
            calendarState.selectedDates = new Set(dates);

            if (config.start_date) {
                calendarState.startDate = new Date(config.start_date);
            }
            if (config.end_date) {
                calendarState.endDate = new Date(config.end_date);
            }

            updateDateInputs();

            // 🔧 关键修复：确保节假日数据已加载再渲染（确保颜色正确显示）
            if (calendarState.holidays.size === 0 && calendarState.compensatoryDays.size === 0) {
                console.log('🔄 加载配置时重新获取节假日数据...');
                await fetchCalendarHolidays(calendarState.calendarDisplayYear);
            }

            renderCalendar();

            console.log(`✅ 加载了 ${dates.length} 个已选择日期`);
        }
    } catch (error) {
        console.error('❌ 加载配置失败:', error);
    }
}

// ========== 工具函数 ==========

function formatDate(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

// 显示无节假日数据提示
function showNoHolidayDataNotice(year) {
    // 移除旧的提示（如果有）
    const existingNotice = document.querySelector('.no-holiday-notice');
    if (existingNotice) {
        existingNotice.remove();
    }

    // 创建新提示
    const notice = document.createElement('div');
    notice.className = 'no-holiday-notice';
    notice.innerHTML = `
        <div class="notice-icon">⚠️</div>
        <div class="notice-content">
            <strong>${year}年节假日数据尚未发布</strong>
            <p>该年份的官方节假日安排还未公布，系统将使用默认工作日配置（周一至周五）。待官方发布后，系统会自动获取最新数据。</p>
        </div>
        <button class="notice-close" onclick="this.parentElement.remove()">×</button>
    `;

    // 插入到日历之前
    const calendarContainer = document.getElementById('calendarContainer');
    if (calendarContainer && calendarContainer.parentNode) {
        calendarContainer.parentNode.insertBefore(notice, calendarContainer);
    }
}

// 🔄 刷新节假日缓存
async function refreshHolidayCache() {
    const year = calendarState.calendarDisplayYear;

    // 显示加载提示
    const btn = document.getElementById('refreshHolidayBtn');
    if (!btn) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = '刷新中...';
    btn.disabled = true;

    try {
        console.log(`🔄 [calendar.js] 刷新 ${year} 年节假日数据`);

        // ✅ 无需清除缓存（因为已移除缓存机制），直接重新获取
        console.log(`📡 [calendar.js] 从API重新获取 ${year} 年数据...`);

        // 清空当前内存中的数据
        calendarState.holidays.clear();
        calendarState.compensatoryDays.clear();

        // 重新从API获取
        const success = await fetchCalendarHolidays(year);

        // 🔍 诊断：显示获取后的状态
        console.log(`🔍 [获取后] holidays: ${calendarState.holidays.size}, compensatory: ${calendarState.compensatoryDays.size}`);

        // 🔍 诊断：详细输出节假日内容
        if (calendarState.holidays.size > 0) {
            console.log('🔍 [holidays内容]:');
            calendarState.holidays.forEach((info, key) => {
                console.log(`  🔴 ${key} => ${info.name}`);
            });
        } else {
            console.warn('⚠️ [calendar.js] holidays 为空！可能该年份节假日数据尚未发布');
        }

        // 🔍 诊断：详细输出调休工作日内容
        if (calendarState.compensatoryDays.size > 0) {
            console.log('🔍 [compensatoryDays内容]:');
            calendarState.compensatoryDays.forEach((info, key) => {
                console.log(`  🟠 ${key} => ${info.name}`);
            });
        } else {
            console.warn('⚠️ [calendar.js] compensatoryDays 为空！');
        }

        // 重新渲染日历
        console.log('🎨 重新渲染日历...');
        renderCalendar();

        // 显示成功提示
        btn.innerHTML = '✓ 已刷新';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);

        console.log(`✅ [calendar.js] ${year}年节假日数据已刷新`);
        console.log(`📊 最终统计: ${calendarState.holidays.size} 个节假日，${calendarState.compensatoryDays.size} 个调休工作日`);

        if (!success) {
            console.warn(`⚠️ 注意：${year}年数据可能尚未发布，将使用默认工作日配置`);
        }
    } catch (error) {
        console.error('❌ [calendar.js] 刷新失败:', error);
        btn.innerHTML = '✗ 刷新失败';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
    }
}

// ========== 事件绑定 ==========

// 初始化事件监听器
function initCalendarEvents() {
    // 日期模式切换（学年/自定义）
    const dateModeRadios = document.querySelectorAll('input[name="dateMode"]');
    dateModeRadios.forEach(radio => {
        radio.addEventListener('change', handleDateModeChange);
    });

    // 学年选择
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.addEventListener('change', (e) => handleYearChange(e.target.value));
    }

    // 日历显示年份切换按钮
    const prevYearBtn = document.getElementById('prevYearBtn');
    const nextYearBtn = document.getElementById('nextYearBtn');
    if (prevYearBtn) prevYearBtn.addEventListener('click', prevYear);
    if (nextYearBtn) nextYearBtn.addEventListener('click', nextYear);

    // 🔄 刷新节假日按钮
    const refreshBtn = document.getElementById('refreshHolidayBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshHolidayCache);
    }

    // 日期范围输入
    const startInput = document.getElementById('startDateInput');
    const endInput = document.getElementById('endDateInput');
    if (startInput) {
        startInput.addEventListener('change', handleDateRangeChange);
    }
    if (endInput) {
        endInput.addEventListener('change', handleDateRangeChange);
    }

    // 应用日期范围按钮
    const applyBtn = document.getElementById('applyRangeBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            // 🔧 关键修复：确保节假日数据已加载（避免节假日被错误选中）
            console.log('📅 点击确定按钮，检查节假日数据...');
            console.log(`  - 当前节假日数量: ${calendarState.holidays.size}`);
            console.log(`  - 当前调休数量: ${calendarState.compensatoryDays.size}`);

            // 如果节假日数据为空，先获取
            if (calendarState.holidays.size === 0 && calendarState.compensatoryDays.size === 0) {
                console.log('⚠️ 节假日数据未加载，正在获取...');
                await fetchCalendarHolidays(calendarState.calendarDisplayYear);
                console.log(`✅ 节假日数据已加载: ${calendarState.holidays.size} 个节假日，${calendarState.compensatoryDays.size} 个调休`);
            }

            applyDateRange();
            enableCalendarSelection(); // ✨ 点击确定后启用日历选择
        });
    }

    // 清空所有选择按钮
    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllDates);
    }

    // 月份导航
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    const toggleBtn = document.getElementById('showAllMonthsBtn');

    if (prevBtn) prevBtn.addEventListener('click', prevMonth);
    if (nextBtn) nextBtn.addEventListener('click', nextMonth);
    if (toggleBtn) toggleBtn.addEventListener('click', toggleViewMode);

    // 保存配置按钮（这个在app.js中已有绑定，这里不重复）
    console.log('✅ 日历事件监听器已初始化');
}

// 处理日期模式切换
function handleDateModeChange(e) {
    const mode = e.target.value;
    calendarState.dateMode = mode;

    const schoolYearMode = document.getElementById('schoolYearMode');
    const customDateMode = document.getElementById('customDateMode');

    if (mode === 'schoolYear') {
        // 显示学年选择，隐藏自定义日期
        schoolYearMode.style.display = 'flex';
        customDateMode.style.display = 'none';
        console.log('📅 切换到学年模式');
    } else if (mode === 'custom') {
        // 隐藏学年选择，显示自定义日期
        schoolYearMode.style.display = 'none';
        customDateMode.style.display = 'flex';
        console.log('📅 切换到自定义模式');
    }
}

// 导出给外部使用
window.CalendarModule = {
    initialize: initializeCalendar,
    initEvents: initCalendarEvents,
    save: saveCalendarConfig,
    load: loadSavedConfig,
    getSelectedDates: () => Array.from(calendarState.selectedDates),
    state: calendarState,
    // 🔍 诊断函数：检查节假日和调休数据
    diagnose: () => {
        console.log('🔍 ========== 日历状态诊断 ==========');
        console.log(`📅 当前显示年份: ${calendarState.calendarDisplayYear}`);
        console.log(`📅 学年选择: ${calendarState.selectedYear}`);
        console.log(`📊 节假日数量: ${calendarState.holidays.size}`);
        console.log(`📊 调休工作日数量: ${calendarState.compensatoryDays.size}`);
        console.log(`📊 选中日期数量: ${calendarState.selectedDates.size}`);

        if (calendarState.holidays.size > 0) {
            console.log('\n📋 节假日列表:');
            calendarState.holidays.forEach((info, key) => {
                console.log(`  ${key}: ${info.name}`);
            });
        }

        if (calendarState.compensatoryDays.size > 0) {
            console.log('\n📋 调休工作日列表:');
            calendarState.compensatoryDays.forEach((info, key) => {
                console.log(`  ${key}: ${info.name}`);
            });
        } else {
            console.warn('\n⚠️ 没有调休工作日数据！');
            console.log('💡 请尝试：');
            console.log('  1. 点击页面上的"刷新"按钮');
            console.log('  2. 或在控制台执行: localStorage.clear()');
            console.log('  3. 然后刷新页面');
        }

        // 检查缓存
        const cacheKey = `holiday_${calendarState.calendarDisplayYear}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const cacheData = JSON.parse(cached);
                console.log('\n💾 缓存信息:');
                console.log(`  节假日: ${cacheData.holidays?.length || 0} 条`);
                console.log(`  调休: ${cacheData.compensatory?.length || 0} 条`);
                const age = Date.now() - cacheData.timestamp;
                console.log(`  缓存时长: ${Math.floor(age / 1000 / 60)} 分钟前`);
            } catch (e) {
                console.error('缓存解析失败:', e);
            }
        } else {
            console.log('\n💾 无缓存数据');
        }

        console.log('\n🔍 ========== 诊断完成 ==========');
    },

    // 检查DOM元素状态
    checkDOM() {
        console.log('🔍 ========== DOM元素检查 ==========\n');

        const container = document.getElementById('calendarContainer');
        if (!container) {
            console.error('❌ 找不到日历容器！');
            return;
        }

        const allCells = container.querySelectorAll('.day-cell:not(.empty)');
        console.log(`📊 总共 ${allCells.length} 个日期单元格`);

        // 统计各类单元格
        const stats = {
            holiday: 0,
            compensatory: 0,
            weekend: 0,
            selected: 0,
            today: 0,
            normal: 0
        };

        const examples = {
            holiday: [],
            compensatory: [],
            weekend: [],
            selected: []
        };

        allCells.forEach(cell => {
            const classes = cell.className;
            const date = cell.dataset.date;
            const text = cell.textContent;

            if (classes.includes('holiday')) {
                stats.holiday++;
                if (examples.holiday.length < 3) {
                    examples.holiday.push(`${date} (${text}日) - ${cell.title}`);
                }
            }
            if (classes.includes('compensatory')) {
                stats.compensatory++;
                if (examples.compensatory.length < 3) {
                    examples.compensatory.push(`${date} (${text}日) - ${cell.title}`);
                }
            }
            if (classes.includes('weekend')) {
                stats.weekend++;
            }
            if (classes.includes('selected')) {
                stats.selected++;
                if (examples.selected.length < 5) {
                    examples.selected.push(`${date} (${text}日)`);
                }
            }
            if (classes.includes('today')) {
                stats.today++;
            }
            if (!classes.includes('holiday') && !classes.includes('compensatory') && !classes.includes('weekend')) {
                stats.normal++;
            }
        });

        console.log('\n📋 单元格统计:');
        console.log(`  🔴 节假日单元格: ${stats.holiday} 个`);
        console.log(`  🟠 调休工作日单元格: ${stats.compensatory} 个`);
        console.log(`  ⚪ 周末单元格: ${stats.weekend} 个`);
        console.log(`  ✅ 已选中单元格: ${stats.selected} 个`);
        console.log(`  📅 今日单元格: ${stats.today} 个`);
        console.log(`  ⚫ 普通单元格: ${stats.normal} 个`);

        if (examples.holiday.length > 0) {
            console.log('\n🔴 节假日示例:');
            examples.holiday.forEach(ex => console.log(`  ${ex}`));
        } else {
            console.warn('\n⚠️ 警告：没有找到任何带 .holiday 类的单元格！');
        }

        if (examples.compensatory.length > 0) {
            console.log('\n🟠 调休工作日示例:');
            examples.compensatory.forEach(ex => console.log(`  ${ex}`));
        } else {
            console.warn('\n⚠️ 警告：没有找到任何带 .compensatory 类的单元格！');
        }

        if (examples.selected.length > 0) {
            console.log('\n✅ 已选中日期示例:');
            examples.selected.forEach(ex => console.log(`  ${ex}`));
        }

        // 测试特定日期
        console.log('\n🔬 测试特定日期:');
        const testDates = [
            '2026-01-01',  // 元旦
            '2026-01-04',  // 元旦后补班
            '2026-02-16',  // 除夕
            '2026-10-01'   // 国庆
        ];

        testDates.forEach(dateStr => {
            const cell = container.querySelector(`.day-cell[data-date="${dateStr}"]`);
            if (cell) {
                console.log(`  ${dateStr}: ${cell.className}`);
            } else {
                console.log(`  ${dateStr}: 未找到`);
            }
        });

        console.log('\n🔍 ========== 检查完成 ==========');
    }
};

console.log('📅 日历模块已加载');
console.log('💡 提示：在控制台执行 CalendarModule.diagnose() 可查看当前状态');
console.log('💡 提示：在控制台执行 CalendarModule.checkDOM() 可检查DOM元素状态');

// ========== Loading 遮罩函数 ==========

function showLoadingOverlay(message = '加载中...') {
    hideLoadingOverlay(); // 移除旧的遮罩

    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
    `;

    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}
