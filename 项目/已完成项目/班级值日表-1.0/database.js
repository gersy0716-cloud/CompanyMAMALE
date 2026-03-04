// ========== 数据库配置 ==========
const DB_CONFIG = {
    apiUrl: 'https://data.520ai.cc/',
    apiKey: 'IbJFuCQ2Qg7xFfxbm27MXq8IPYAiBAmWwRBk0o3I',
    baseId: 'bse5uLNmDVUjg8NA6hk'
};

const TABLES = {
    duty_groups: 'cmF3tCIDNx',
    duty_schedule_config: 'ERACsEgYix',
    duty_assignments: 'lF1xhH3xii'
};

// ========== 数据库操作类 ==========
class Database {
    constructor() {
        this.baseUrl = `${DB_CONFIG.apiUrl}api/bases/${DB_CONFIG.baseId}`;
        this.headers = {
            'x-bm-token': DB_CONFIG.apiKey,
            'Content-Type': 'application/json'
        };
    }

    // 查询记录（单页）
    async getRecords(tableId, filter = null, page = 1, pageLimit = 100) {
        try {
            let url = `${this.baseUrl}/tables/${tableId}/records?page=${page}&pageLimit=${pageLimit}`;

            if (filter) {
                // 构建filter查询参数
                console.log('🔧 原始filter对象:', filter);
                const filterStr = btoa(JSON.stringify(filter));
                console.log('🔧 Base64编码后:', filterStr);
                url += `&filter=${encodeURIComponent(filterStr)}`;
                console.log('🔧 完整filter URL参数:', `&filter=${encodeURIComponent(filterStr)}`);
            }

            console.log('📤 查询记录URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            console.log('📥 查询响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 查询响应数据:', data);
            console.log('📥 当前页记录数:', data.data?.length || 0);
            console.log('📥 总记录数:', data.total || 0);
            console.log('📥 当前页码:', data.current_page);
            console.log('📥 总页数:', data.last_page);

            // BaseMulti API返回格式: {data: [...], total: x, current_page: x, last_page: x}
            return data;
        } catch (error) {
            console.error('❌ 查询记录失败:', error);
            throw error;
        }
    }

    // 查询所有记录（自动分页）
    async getAllRecords(tableId, filter = null) {
        try {
            let allRecords = [];
            let currentPage = 1;
            let lastPage = 1;

            console.log('📚 开始分页获取所有记录...');

            do {
                const data = await this.getRecords(tableId, filter, currentPage, 100);

                allRecords = allRecords.concat(data.data || []);
                lastPage = data.last_page || 1;

                console.log(`📄 第 ${currentPage}/${lastPage} 页: ${data.data?.length || 0} 条记录`);

                currentPage++;
            } while (currentPage <= lastPage);

            console.log(`✅ 共获取 ${allRecords.length} 条记录`);
            return allRecords;
        } catch (error) {
            console.error('❌ 获取所有记录失败:', error);
            throw error;
        }
    }

    // 创建记录
    async createRecord(tableId, fields) {
        try {
            // BaseMulti API不需要fields包裹，直接传递字段
            console.log('📤 创建记录请求:', {
                url: `${this.baseUrl}/tables/${tableId}/records`,
                body: fields
            });
            console.log('📤 请求体JSON:', JSON.stringify(fields, null, 2));

            const response = await fetch(`${this.baseUrl}/tables/${tableId}/records`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(fields)  // 直接传递fields
            });

            console.log('📥 创建记录响应状态:', response.status, response.statusText);

            // 先读取为文本（只能读取一次）
            const responseText = await response.text();
            console.log('📥 创建记录响应内容:', responseText);

            if (!response.ok) {
                // 尝试解析错误详情
                let errorDetail = responseText;
                try {
                    const errorData = JSON.parse(responseText);
                    errorDetail = JSON.stringify(errorData, null, 2);
                    console.error('❌ 服务器返回错误详情:', errorData);
                } catch (e) {
                    console.error('❌ 服务器返回错误文本:', responseText);
                }
                throw new Error(`HTTP Error: ${response.status} - ${errorDetail}`);
            }

            // 成功时解析JSON
            const result = JSON.parse(responseText);
            console.log('✅ 创建记录成功, 返回数据:', result);
            return result;
        } catch (error) {
            console.error('❌ 创建记录失败:', error);
            throw error;
        }
    }

    // 更新记录
    async updateRecord(tableId, recordId, fields) {
        try {
            const response = await fetch(`${this.baseUrl}/tables/${tableId}/records/${recordId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(fields)  // 直接传递fields，不包裹
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('更新记录失败:', error);
            throw error;
        }
    }

    // 删除记录
    async deleteRecord(tableId, recordId) {
        try {
            const response = await fetch(`${this.baseUrl}/tables/${tableId}/records/${recordId}`, {
                method: 'DELETE',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('删除记录失败:', error);
            throw error;
        }
    }

    // ========== 小组相关 ==========
    async getDutyGroups(classId) {
        console.log('🔍 getDutyGroups 被调用, classId:', classId);

        // 使用 getAllRecords 获取所有小组数据（自动分页）
        console.log('📚 查询所有小组记录...');
        const allRecords = await this.getAllRecords(TABLES.duty_groups, null);
        console.log('📚 所有记录:', allRecords.length, '条');

        // BaseMulti API的filter不生效，在客户端进行过滤
        const filtered = allRecords.filter(record => record.class_id === classId);
        console.log('✅ 过滤后的小组数据:', filtered.length, '条');

        // 按小组名称排序
        return filtered.sort((a, b) => {
            const nameA = (a.name || '').toString();
            const nameB = (b.name || '').toString();
            return nameA.localeCompare(nameB, 'zh-CN');
        });
    }

    async createDutyGroup(groupData) {
        return await this.createRecord(TABLES.duty_groups, groupData);
    }

    async updateDutyGroup(recordId, groupData) {
        // 🔧 由于BaseMulti API的CORS不允许PATCH，使用DELETE+CREATE来实现更新
        try {
            console.log('🔧 使用DELETE+CREATE方式更新小组记录...');

            // 1. 先获取原记录，保留需要的字段
            const allGroups = await this.getAllRecords(TABLES.duty_groups, null);
            const originalGroup = allGroups.find(g => g.id == recordId);

            if (!originalGroup) {
                throw new Error(`找不到ID为${recordId}的小组记录`);
            }

            console.log('📖 原记录:', originalGroup);

            // 2. 删除原记录
            await this.deleteRecord(TABLES.duty_groups, recordId);
            console.log('✅ 已删除原记录');

            // 3. 创建新记录，只保留业务字段，排除系统字段
            const systemFields = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt', 'createTime', 'updateTime', 'createdTime', 'updatedTime'];

            const newGroupData = {
                name: groupData.name !== undefined ? groupData.name : originalGroup.name,
                class_id: groupData.class_id !== undefined ? groupData.class_id : originalGroup.class_id,
                student_ids: groupData.student_ids !== undefined ? groupData.student_ids : originalGroup.student_ids,
                order_index: groupData.order_index !== undefined ? groupData.order_index : originalGroup.order_index
            };

            console.log('📤 准备创建的新记录:', newGroupData);

            const newRecord = await this.createRecord(TABLES.duty_groups, newGroupData);
            console.log('✅ 已创建新记录:', newRecord);

            return newRecord;
        } catch (error) {
            console.error('❌ 更新小组失败:', error);
            throw error;
        }
    }

    async deleteDutyGroup(recordId) {
        return await this.deleteRecord(TABLES.duty_groups, recordId);
    }

    // ========== 配置相关 ==========
    async getScheduleConfig(classId) {
        // 使用 getAllRecords 获取所有配置（自动分页）
        const records = await this.getAllRecords(TABLES.duty_schedule_config, null);

        // 客户端过滤：确保class_id和is_active匹配
        console.log('🔍 [配置过滤] 总记录数:', records.length);
        const filtered = records.filter(record => {
            const classIdMatch = record.class_id === classId;
            // BaseMulti的switch字段返回数字1/0，需要宽松比较
            const isActiveMatch = record.is_active == true || record.is_active === 1;
            return classIdMatch && isActiveMatch;
        });

        console.log('🔍 [配置过滤] 过滤后记录数:', filtered.length);
        return filtered.length > 0 ? filtered[0] : null;
    }

    async createScheduleConfig(configData) {
        return await this.createRecord(TABLES.duty_schedule_config, configData);
    }

    async updateScheduleConfig(recordId, configData) {
        // 🔧 由于BaseMulti API的CORS不允许PATCH，使用DELETE+CREATE来实现更新
        try {
            console.log('🔧 使用DELETE+CREATE方式更新配置记录...');

            // 1. 先获取原记录
            const allConfigs = await this.getAllRecords(TABLES.duty_schedule_config, null);
            const originalConfig = allConfigs.find(c => c.id == recordId);

            if (!originalConfig) {
                throw new Error(`找不到ID为${recordId}的配置记录`);
            }

            console.log('📖 原配置记录:', originalConfig);

            // 2. 删除原记录
            await this.deleteRecord(TABLES.duty_schedule_config, recordId);
            console.log('✅ 已删除原配置记录');

            // 3. 创建新记录，只保留业务字段
            const newConfigData = {
                name: configData.name !== undefined ? configData.name : originalConfig.name,
                class_id: configData.class_id !== undefined ? configData.class_id : originalConfig.class_id,
                start_date: configData.start_date !== undefined ? configData.start_date : originalConfig.start_date,
                end_date: configData.end_date !== undefined ? configData.end_date : originalConfig.end_date,
                work_days: configData.work_days !== undefined ? configData.work_days : originalConfig.work_days,
                enabled_dates: configData.enabled_dates !== undefined ? configData.enabled_dates : originalConfig.enabled_dates,
                disabled_dates: configData.disabled_dates !== undefined ? configData.disabled_dates : originalConfig.disabled_dates,
                is_active: configData.is_active !== undefined ? configData.is_active : originalConfig.is_active
            };

            console.log('📤 准备创建的新配置记录:', newConfigData);

            const newRecord = await this.createRecord(TABLES.duty_schedule_config, newConfigData);
            console.log('✅ 已创建新配置记录:', newRecord);

            return newRecord;
        } catch (error) {
            console.error('❌ 更新配置失败:', error);
            throw error;
        }
    }

    // ========== 值日分配相关 ==========
    async getDutyAssignments(classId, startDate = null, endDate = null) {
        const filterSet = [{
            fieldId: 'class_id',
            operator: 'is',
            value: classId
        }];

        if (startDate) {
            filterSet.push({
                fieldId: 'duty_date',
                operator: 'isAfter',
                value: startDate
            });
        }

        if (endDate) {
            filterSet.push({
                fieldId: 'duty_date',
                operator: 'isBefore',
                value: endDate
            });
        }

        const filter = {
            conjunction: 'and',
            filterSet
        };

        const records = await this.getAllRecords(TABLES.duty_assignments, null);

        // 🔧 客户端过滤：确保class_id匹配
        console.log('🔍 [值日记录过滤] 总记录数:', records.length);
        console.log('🔍 [值日记录过滤] 要匹配的classId:', classId, '类型:', typeof classId);
        if (records.length > 0) {
            console.log('🔍 [值日记录过滤] 第一条记录的class_id:', records[0].class_id, '类型:', typeof records[0].class_id);
            console.log('🔍 [值日记录过滤] 所有记录的class_id:', records.map(r => r.class_id));
        }

        let filtered = records.filter(record => {
            const match = record.class_id === classId;
            if (!match && records.length <= 5) {
                console.log('🔍 [值日记录过滤] 不匹配:', record.class_id, '!==', classId);
            }
            return match;
        });

        console.log('🔍 [值日记录过滤] 过滤后记录数:', filtered.length);

        // 🔧 客户端过滤：日期范围（如果API filter不生效）
        console.log('🔍 [日期过滤] 开始日期:', startDate, '结束日期:', endDate);
        if (filtered.length > 0) {
            console.log('🔍 [日期过滤] 第一条记录的duty_date:', filtered[0].duty_date);
            console.log('🔍 [日期过滤] 所有记录的duty_date:', filtered.map(r => r.duty_date));
        }

        const beforeDateFilter = filtered.length;

        if (startDate) {
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.duty_date);
                const start = new Date(startDate);
                const match = recordDate >= start;
                if (!match && beforeDateFilter <= 5) {
                    console.log('🔍 [日期过滤-开始] 不匹配:', record.duty_date, '不 >= ', startDate);
                }
                return match;
            });
            console.log('🔍 [日期过滤] startDate过滤后:', filtered.length, '条');
        }
        if (endDate) {
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.duty_date);
                const end = new Date(endDate);
                const match = recordDate <= end;
                if (!match && beforeDateFilter <= 5) {
                    console.log('🔍 [日期过滤-结束] 不匹配:', record.duty_date, '不 <= ', endDate);
                }
                return match;
            });
            console.log('🔍 [日期过滤] endDate过滤后:', filtered.length, '条');
        }

        return filtered.sort((a, b) => new Date(a.duty_date) - new Date(b.duty_date));
    }

    async createDutyAssignment(assignmentData) {
        return await this.createRecord(TABLES.duty_assignments, assignmentData);
    }

    async updateDutyAssignment(recordId, assignmentData) {
        // 🔧 由于BaseMulti API的CORS不允许PATCH，使用DELETE+CREATE来实现更新
        try {
            console.log('🔧 使用DELETE+CREATE方式更新值日分配记录...');

            // 1. 先获取原记录
            const allAssignments = await this.getAllRecords(TABLES.duty_assignments, null);
            const originalAssignment = allAssignments.find(a => a.id == recordId);

            if (!originalAssignment) {
                throw new Error(`找不到ID为${recordId}的值日分配记录`);
            }

            console.log('📖 原值日分配记录:', originalAssignment);

            // 2. 删除原记录
            await this.deleteRecord(TABLES.duty_assignments, recordId);
            console.log('✅ 已删除原值日分配记录');

            // 3. 创建新记录，只保留业务字段
            const newAssignmentData = {
                name: assignmentData.name !== undefined ? assignmentData.name : originalAssignment.name,
                config_id: assignmentData.config_id !== undefined ? assignmentData.config_id : originalAssignment.config_id,
                class_id: assignmentData.class_id !== undefined ? assignmentData.class_id : originalAssignment.class_id,
                duty_date: assignmentData.duty_date !== undefined ? assignmentData.duty_date : originalAssignment.duty_date,
                group_id: assignmentData.group_id !== undefined ? assignmentData.group_id : originalAssignment.group_id,
                group_name: assignmentData.group_name !== undefined ? assignmentData.group_name : originalAssignment.group_name,
                student_ids: assignmentData.student_ids !== undefined ? assignmentData.student_ids : originalAssignment.student_ids
            };

            console.log('📤 准备创建的新值日分配记录:', newAssignmentData);

            const newRecord = await this.createRecord(TABLES.duty_assignments, newAssignmentData);
            console.log('✅ 已创建新值日分配记录:', newRecord);

            return newRecord;
        } catch (error) {
            console.error('❌ 更新值日分配失败:', error);
            throw error;
        }
    }

    async deleteDutyAssignments(classId) {
        // 先查询所有该班级的值日分配
        const assignments = await this.getDutyAssignments(classId);

        // 批量删除
        const deletePromises = assignments.map(record =>
            this.deleteRecord(TABLES.duty_assignments, record.id)
        );

        return await Promise.all(deletePromises);
    }
}

// ========== 导出数据库实例 ==========
const db = new Database();
