/**
 * 教师中心智能体工具数据
 * 
 * 说明：
 * - SVG 图标替代表情符号
 * - 每个板块包含多个智能体工具
 */

// SVG 图标库 - 统一风格的线性图标
const Icons = {
    // 板块图标
    aiTeaching: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    officeWriting: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
    classManagement: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    lessonPrep: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    gradeManagement: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    classroomTools: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,

    // 工具图标
    presentation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    lightbulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    document: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    clipboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    megaphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    messageCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
    brush: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>`,
    fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="2" x2="22" y2="6"/><path d="M7.5 20.5L19 9l-4-4L3.5 16.5 2 22z"/></svg>`,
    brain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54"/></svg>`,
    trendingUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    keyboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></svg>`,
    pieChart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
    fileCheck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>`,
    checkSquare: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    fileAnalytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="8" y2="17"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/></svg>`,
    dice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    vote: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 22H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6"/><path d="M14 13l3 3 7-7"/><line x1="6" y1="8" x2="12" y2="8"/><line x1="6" y1="12" x2="10" y2="12"/></svg>`,
    penTool: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
    gamepad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`,
    smartphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    broom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20l4-4"/><path d="M14 10l-6 6"/><path d="M11 7l6 6"/><path d="M8 4l8-1-1 8"/></svg>`
};

// 板块数据
const blocksData = [
    {
        id: 'ai-teaching',
        name: 'AI教学',
        icon: Icons.aiTeaching,
        tools: [
            {
                id: 'tool-1',
                name: 'AI课件生成',
                icon: Icons.presentation,
                description: '智能生成精美课件，支持多种模板',
                usageCount: 1234,
                featured: true,  // 重点智能体
                coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
            },
            {
                id: 'tool-2',
                name: '智能备课助手',
                icon: Icons.book,
                description: '辅助教师快速备课',
                usageCount: 856,
                featured: true,
                coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop'
            },
            { id: 'tool-3', name: '教学视频制作', icon: Icons.video, description: '一键生成教学视频', usageCount: 642 },
            { id: 'tool-4', name: '互动课堂', icon: Icons.target, description: '创建互动式课堂活动', usageCount: 923 },
            { id: 'tool-5', name: '知识点讲解', icon: Icons.lightbulb, description: 'AI辅助讲解复杂知识点', usageCount: 567 },
            { id: 'tool-6', name: '教学评估', icon: Icons.chart, description: '智能评估教学效果', usageCount: 445 }
        ]
    },
    {
        id: 'office-writing',
        name: '办公写作',
        icon: Icons.officeWriting,
        tools: [
            { id: 'tool-7', name: '教案生成器', icon: Icons.document, description: '快速生成标准化教案', usageCount: 1567 },
            { id: 'tool-8', name: '工作总结', icon: Icons.clipboard, description: 'AI辅助撰写工作总结', usageCount: 789 },
            { id: 'tool-9', name: '通知公告', icon: Icons.megaphone, description: '快速生成各类通知公告', usageCount: 1023 },
            { id: 'tool-10', name: '会议记录', icon: Icons.edit, description: '智能整理会议记录', usageCount: 456 }
        ]
    },
    {
        id: 'class-management',
        name: '班级管理',
        icon: Icons.classManagement,
        tools: [
            { id: 'tool-11', name: '学生档案', icon: Icons.folder, description: '管理学生基本信息和成长记录', usageCount: 2345 },
            { id: 'tool-12', name: '考勤统计', icon: Icons.calendar, description: '智能考勤和统计分析', usageCount: 1876 },
            { id: 'tool-13', name: '家校沟通', icon: Icons.messageCircle, description: '便捷的家校沟通平台', usageCount: 1654 },
            { id: 'tool-14', name: '班级活动', icon: Icons.gift, description: '组织和记录班级活动', usageCount: 987 },
            { id: 'tool-15', name: '值日安排', icon: Icons.broom, description: '智能排班和提醒', usageCount: 765 }
        ]
    },
    {
        id: 'lesson-prep',
        name: '备课教案',
        icon: Icons.lessonPrep,
        tools: [
            { id: 'tool-16', name: '教学设计', icon: Icons.brush, description: 'AI辅助教学设计', usageCount: 1432 },
            { id: 'tool-17', name: '课程大纲', icon: Icons.fileText, description: '快速生成课程大纲', usageCount: 876 },
            { id: 'tool-18', name: '教学资源库', icon: Icons.database, description: '海量教学资源随时调用', usageCount: 2134 },
            { id: 'tool-19', name: '习题生成', icon: Icons.pencil, description: '智能生成各类习题', usageCount: 1567 },
            { id: 'tool-20', name: '教学反思', icon: Icons.brain, description: 'AI辅助教学反思', usageCount: 543 },
            { id: 'tool-21', name: '教学进度', icon: Icons.trendingUp, description: '跟踪和管理教学进度', usageCount: 789 }
        ]
    },
    {
        id: 'grade-management',
        name: '成绩管理',
        icon: Icons.gradeManagement,
        tools: [
            { id: 'tool-22', name: '成绩录入', icon: Icons.keyboard, description: '快速录入和管理成绩', usageCount: 2876 },
            { id: 'tool-23', name: '成绩分析', icon: Icons.pieChart, description: '智能分析学生成绩趋势', usageCount: 1987 },
            { id: 'tool-24', name: '学情报告', icon: Icons.fileCheck, description: '生成详细的学情分析报告', usageCount: 1543 },
            { id: 'tool-25', name: '作业批改', icon: Icons.checkSquare, description: 'AI辅助批改作业', usageCount: 3456 },
            { id: 'tool-26', name: '试卷分析', icon: Icons.fileAnalytics, description: '智能分析试卷难度和区分度', usageCount: 1234 }
        ]
    },
    {
        id: 'classroom-tools',
        name: '课堂工具',
        icon: Icons.classroomTools,
        tools: [
            { id: 'tool-27', name: '随机点名', icon: Icons.dice, description: '公平的随机点名工具', usageCount: 2345 },
            { id: 'tool-28', name: '计时器', icon: Icons.clock, description: '课堂活动计时工具', usageCount: 1876 },
            { id: 'tool-29', name: '分组工具', icon: Icons.users, description: '智能分组，支持多种策略', usageCount: 1432 },
            { id: 'tool-30', name: '课堂投票', icon: Icons.vote, description: '实时课堂投票和统计', usageCount: 987 },
            { id: 'tool-31', name: '白板工具', icon: Icons.penTool, description: '多功能电子白板', usageCount: 2134 },
            { id: 'tool-32', name: '课堂游戏', icon: Icons.gamepad, description: '寓教于乐的课堂游戏', usageCount: 1654 },
            { id: 'tool-33', name: '答题器', icon: Icons.smartphone, description: '实时答题和反馈', usageCount: 1876 }
        ]
    }
];

// 导出数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { blocksData, Icons };
}