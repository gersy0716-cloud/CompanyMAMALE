/**
 * BaseMulti 数据库操作封装类
 *
 * 功能：
 * - 增删改查操作
 * - 自动处理系统字段（id, created_at等）
 * - 统一错误处理
 * - 兼容BaseMulti响应格式
 *
 * 使用方法：
 * const db = new Database(CONFIG.DATABASE.BASE_URL, CONFIG.DATABASE.BASE_ID, CONFIG.DATABASE.API_KEY);
 * const records = await db.getRecords(tableId);
 */
class Database {
    /**
     * 构造函数
     *
     * @param {string} baseUrl - BaseMulti基础URL
     * @param {string} baseId - 数据库ID
     * @param {string} apiKey - API Key
     */
    constructor(baseUrl, baseId, apiKey) {
        this.baseUrl = baseUrl;
        this.baseId = baseId;
        this.apiKey = apiKey;
        console.log('✅ Database 初始化完成:', { baseUrl, baseId });
    }

    /**
     * 获取通用请求Headers
     *
     * @returns {object} Headers对象
     */
    getHeaders() {
        return {
            'x-bm-token': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    /**
     * 查询记录
     *
     * 业务逻辑：
     * 1. 发送GET请求到 BaseMulti
     * 2. 解析响应（格式：{data: [...], total: x}）
     * 3. 返回 data 数组
     *
     * 注意事项：
     * - BaseMulti 返回格式是 {data: [...]}，不是 {records: [...]}
     * - 直接访问 record.field，不用 record.fields.field
     * - ⚠️ sort 参数不生效，需要在客户端排序
     * - ⚠️ filter 参数可能不生效，需要在客户端过滤
     *
     * @param {string} tableId - 表ID
     * @param {object} options - 查询选项（目前不使用，保留接口兼容性）
     * @returns {Promise<Array>} 记录列表
     * @throws {Error} 查询失败时抛出错误
     */
    async getRecords(tableId, options = {}) {
        try {
            console.log(`🔍 [Database] 查询记录 - 表ID: ${tableId}`);

            // 构建查询URL（不添加任何参数，因为 sort/filter 都不生效）
            const url = `${this.baseUrl}api/bases/${this.baseId}/tables/${tableId}/records`;

            // 发送请求
            let response;
            try {
                response = await fetch(url, {
                    method: 'GET',
                    headers: this.getHeaders()
                });
            } catch (networkError) {
                console.error('❌ [Database] 网络请求失败 (可能原因: CORS跨域/证书问题/网络断开):', networkError);
                throw new Error('网络连接失败，请检查网络或HTTPS证书是否已信任');
            }

            // 检查HTTP状态
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // 解析响应
            const result = await response.json();

            // BaseMulti 返回格式：{data: [...], total: x}
            const records = result.data || [];

            console.log(`✅ [Database] 查询成功 - 共 ${records.length} 条记录`);

            return records;

        } catch (error) {
            console.error('❌ [Database] 查询失败:', error);
            throw new Error(`查询记录失败: ${error.message}`);
        }
    }

    /**
     * 创建记录
     *
     * 业务逻辑：
     * 1. 过滤系统字段（id, created_at等不要传递）
     * 2. 发送POST请求到 BaseMulti
     * 3. 返回创建的记录
     *
     * 注意事项：
     * - 系统字段由 BaseMulti 自动管理，不要传递
     * - 日期字段使用 ISO 8601 格式（YYYY-MM-DDTHH:mm:ssZ）
     *
     * @param {string} tableId - 表ID
     * @param {object} data - 记录数据
     * @returns {Promise<object>} 创建的记录
     * @throws {Error} 创建失败时抛出错误
     */
    async createRecord(tableId, data) {
        try {
            console.log(`➕ [Database] 创建记录 - 表ID: ${tableId}`, data);

            // 过滤系统字段
            const filteredData = this.filterSystemFields(data);

            // BaseMulti 可能需要将数据包装在 fields 对象中
            // 尝试两种格式：直接发送 或 包装在 fields 中
            const requestBody = filteredData;

            console.log('📤 [Database] 请求体:', requestBody);

            // 发送请求
            let response;
            try {
                response = await fetch(`${this.baseUrl}api/bases/${this.baseId}/tables/${tableId}/records`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(requestBody)
                });
            } catch (networkError) {
                console.error('❌ [Database] 网络请求失败 (可能原因: CORS跨域/证书问题/网络断开):', networkError);
                throw new Error('网络连接失败，请检查网络或HTTPS证书是否已信任');
            }

            // 检查HTTP状态
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [Database] 服务器响应:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // 解析响应
            const record = await response.json();

            console.log('✅ [Database] 创建成功 - 记录ID:', record.id);

            return record;

        } catch (error) {
            console.error('❌ [Database] 创建失败:', error);
            throw new Error(`创建记录失败: ${error.message}`);
        }
    }

    async updateRecord(tableId, recordId, data) {
        try {
            console.log(`✏️ [Database] 更新记录 - 表ID: ${tableId}, 记录ID: ${recordId}`, data);

            // 1. 尝试使用 PATCH 方法（标准方式）
            const url = `${this.baseUrl}api/bases/${this.baseId}/tables/${tableId}/records/${recordId}`;
            console.log('📤 [Database] 步骤1: 尝试 PATCH 请求...', url);

            try {
                let patchResponse;
                try {
                    patchResponse = await fetch(url, {
                        method: 'PATCH',
                        headers: this.getHeaders(),
                        body: JSON.stringify(data)
                    });
                } catch (networkError) {
                    console.warn(`⚠️ [Database] PATCH 网络请求失败，尝试变通方案:`, networkError);
                    throw networkError; // 抛出异常以触发变通方案
                }

                if (patchResponse.ok) {
                    const result = await patchResponse.json();
                    console.log('✅ [Database] PATCH 更新成功');
                    return result;
                } else if (patchResponse.status === 405 || patchResponse.status === 403) {
                    console.warn(`⚠️ [Database] PATCH 被拒绝 (HTTP ${patchResponse.status})，可能存在 CORS 或方法限制。`);
                } else {
                    const errorText = await patchResponse.text();
                    console.warn(`⚠️ [Database] PATCH 失败 (HTTP ${patchResponse.status}): ${errorText}`);
                }
            } catch (patchError) {
                console.warn('⚠️ [Database] PATCH 请求发生错误:', patchError.message);
            }

            // 2. 如果 PATCH 失败，使用变通方案：查询 -> 删除 -> 创建
            console.log('🔄 [Database] 步骤2: 启用变通方案 (查询-删除-创建)...');

            // 2.1 查询现有记录
            const records = await this.getRecords(tableId);
            const existingRecord = records.find(r => String(r.id) === String(recordId));

            if (!existingRecord) {
                throw new Error(`记录不存在，无法更新: ${recordId}`);
            }

            // 2.2 合并属性
            // 过滤掉系统属性，保留业务属性
            const businessData = this.filterSystemFields(existingRecord);
            // 合并新数据
            const mergedData = { ...businessData, ...data };

            console.log('📤 [Database] 准备重新创建的数据:', mergedData);

            // 2.3 创建新记录
            const newRecord = await this.createRecord(tableId, mergedData);

            if (newRecord && newRecord.id) {
                // 2.4 只有新记录创建成功后，才尝试删除旧记录
                try {
                    await this.deleteRecord(tableId, recordId);
                    console.log(`🗑️ [Database] 旧记录 ${recordId} 已删除`);
                } catch (deleteError) {
                    console.error('⚠️ [Database] 新记录已创建，但旧记录删除失败:', deleteError);
                }

                console.log('✅ [Database] 变通更新成功，新ID:', newRecord.id);
                return newRecord;
            } else {
                throw new Error('新记录创建失败，更新流程中断');
            }

        } catch (error) {
            console.error('❌ [Database] 更新失败:', error);
            throw new Error(`更新记录失败: ${error.message}`);
        }
    }

    async getRecordById(tableId, recordId) {
        const url = `${this.baseUrl}api/bases/${this.baseId}/tables/${tableId}/records/${recordId}`;

        let response;
        try {
            response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
        } catch (networkError) {
            console.error('❌ [Database] 网络请求失败 (可能原因: CORS跨域/证书问题/网络断开):', networkError);
            throw new Error('网络连接失败，请检查网络或HTTPS证书是否已信任');
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    }

    async deleteRecord(tableId, recordId) {
        try {
            console.log(`🗑️ [Database] 删除记录 - 表ID: ${tableId}, 记录ID: ${recordId}`);

            // 发送请求
            let response;
            try {
                response = await fetch(`${this.baseUrl}api/bases/${this.baseId}/tables/${tableId}/records/${recordId}`, {
                    method: 'DELETE',
                    headers: this.getHeaders()
                });
            } catch (networkError) {
                console.error('❌ [Database] 网络请求失败 (可能原因: CORS跨域/证书问题/网络断开):', networkError);
                throw new Error('网络连接失败，请检查网络或HTTPS证书是否已信任');
            }

            // 检查HTTP状态
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            console.log('✅ [Database] 删除成功');

            return true;

        } catch (error) {
            console.error('❌ [Database] 删除失败:', error);
            throw new Error(`删除记录失败: ${error.message}`);
        }
    }

    /**
     * 过滤系统字段和空值
     *
     * 业务逻辑：
     * 1. 移除系统字段（id, created_at, updated_at, created_by, updated_by）
     * 2. 移除 BaseMulti 内部字段（name, creator, modifier）
     * 3. 移除 null 值（避免服务器 500 错误）
     *
     * @param {object} data - 原始数据
     * @returns {object} 过滤后的数据
     */
    filterSystemFields(data) {
        // 需要过滤的字段
        const fieldsToRemove = [
            // 系统字段
            'id', 'created_at', 'updated_at', 'created_by', 'updated_by',
            // BaseMulti 内部字段
            'name', 'creator', 'modifier',
            // 可能为 null 的业务字段
            'upload_time'
        ];

        const filtered = { ...data };

        // 过滤指定字段
        fieldsToRemove.forEach(field => {
            if (field in filtered) {
                console.log(`⚠️ [Database] 过滤字段: ${field}`);
                delete filtered[field];
            }
        });

        // 过滤 null 值
        Object.keys(filtered).forEach(key => {
            if (filtered[key] === null) {
                console.log(`⚠️ [Database] 过滤空值: ${key}`);
                delete filtered[key];
            }
        });

        return filtered;
    }

    /**
     * 格式化日期为 BaseMulti 兼容格式
     *
     * 业务逻辑：
     * BaseMulti 要求日期格式为 "YYYY-MM-DDTHH:mm:ssZ"（不带毫秒）
     * 使用本地时间格式化，避免 toISOString() 导致时区问题
     *
     * @param {Date} date - 日期对象
     * @returns {string} BaseMulti 兼容的日期字符串
     */
    formatDate(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    }

    /**
     * 客户端过滤记录
     *
     * 业务逻辑：
     * 由于 BaseMulti 的 filter 参数可能不生效，
     * 需要在客户端手动过滤记录
     *
     * @param {Array} records - 记录列表
     * @param {function} filterFn - 过滤函数
     * @returns {Array} 过滤后的记录列表
     */
    clientFilter(records, filterFn) {
        console.log(`🔍 [Database] 客户端过滤 - 原始数量: ${records.length}`);

        const filtered = records.filter(filterFn);

        console.log(`✅ [Database] 过滤完成 - 结果数量: ${filtered.length}`);

        return filtered;
    }
}

console.log('✅ Database 类加载完成');
