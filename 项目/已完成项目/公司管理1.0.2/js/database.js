/**
 * BaseMulti 数据库操作封装
 * 提供统一的 CRUD 接口，对接 data.520ai.cc
 */
const DB = {
    /**
     * 构建完整 API URL
     * @param {string} table - 表名
     * @param {string} [recordId] - 记录ID（可选）
     * @returns {string} 完整 URL
     */
    _buildUrl(table, recordId) {
        let url = `${Config.DB_API_URL}/api/bases/${Config.DB_BASE_ID}/tables/${table}/records`;
        if (recordId) url += `/${recordId}`;
        return url;
    },

    /**
     * 编码 filters（中文转 Unicode 转义序列后再 base64）
     * BaseMulti API 强制要求
     */
    _encodeFilters(filters) {
        let jsonStr = JSON.stringify(filters);
        // 中文字符转 Unicode 转义序列
        jsonStr = jsonStr.replace(/[\u0080-\uFFFF]/g, function (match) {
            return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
        });
        return btoa(jsonStr);
    },

    /**
     * 通用请求头
     */
    _headers() {
        return {
            'Content-Type': 'application/json',
            'x-bm-token': Config.DB_TOKEN
        };
    },

    /**
     * 查询记录
     * @param {string} table - 表名
     * @param {Object} options - 查询选项
     * @param {Array} [options.filters] - 筛选条件数组
     * @param {number} [options.page] - 页码
     * @param {number} [options.pageLimit] - 每页数量
     * @returns {Promise<{data: Array, total: number}>}
     */
    async query(table, options = {}) {
        let url = this._buildUrl(table);
        const params = new URLSearchParams();

        if (options.page) params.set('page', options.page);
        if (options.pageLimit) params.set('pageLimit', options.pageLimit);

        // Filters: Unicode + base64 编码
        if (options.filters && options.filters.length > 0) {
            const encoded = this._encodeFilters(options.filters);
            params.set('filters', encoded);
        }

        const queryStr = params.toString();
        if (queryStr) url += `?${queryStr}`;

        try {
            const res = await fetch(url, { headers: this._headers() });
            if (!res.ok) throw new Error(`查询失败: ${res.status}`);
            const json = await res.json();
            return {
                data: json.data || [],
                total: json.total || 0,
                current_page: json.current_page || 1
            };
        } catch (err) {
            console.error(`[DB] 查询 ${table} 失败:`, err);
            throw err;
        }
    },

    /**
     * 获取单条记录
     * @param {string} table - 表名
     * @param {number|string} id - 记录ID
     * @returns {Promise<Object>}
     */
    async getById(table, id) {
        const url = this._buildUrl(table, id);
        try {
            const res = await fetch(url, { headers: this._headers() });
            if (!res.ok) throw new Error(`获取失败: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error(`[DB] 获取 ${table}/${id} 失败:`, err);
            throw err;
        }
    },

    /**
     * 创建记录
     * @param {string} table - 表名
     * @param {Object} data - 记录数据（直接传字段值）
     * @returns {Promise<Object>} 创建的记录
     */
    async create(table, data) {
        const url = this._buildUrl(table);
        try {
            console.log('[DB] 创建请求:', url, JSON.stringify(data));
            const res = await fetch(url, {
                method: 'POST',
                headers: this._headers(),
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const errBody = await res.text();
                console.error('[DB] 服务端返回:', res.status, errBody);
                console.error('[DB] 完整错误信息:', errBody);
                // 尝试解析错误信息
                let errorMsg = `操作失败: ${res.status}`;
                try {
                    const errJson = JSON.parse(errBody);
                    if (errJson.message) errorMsg += ` - ${errJson.message}`;
                    if (errJson.error) errorMsg += ` - ${errJson.error}`;
                    if (errJson.details) errorMsg += ` - ${JSON.stringify(errJson.details)}`;
                } catch (e) {
                    errorMsg += ` - ${errBody}`;
                }
                throw new Error(errorMsg);
            }
            return await res.json();
        } catch (err) {
            console.error(`[DB] 创建 ${table} 失败:`, err);
            throw err;
        }
    },

    /**
     * 更新记录
     * @param {string} table - 表名
     * @param {number|string} id - 记录ID
     * @param {Object} data - 更新字段
     * @returns {Promise<Object>} 更新后的记录
     */
    async update(table, id, data) {
        const url = this._buildUrl(table, id);
        // 自动移除系统字段，防止 500 错误
        const systemFields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'creator', 'modifier'];
        const cleanData = {};
        for (const [k, v] of Object.entries(data)) {
            if (systemFields.includes(k)) continue;
            // 保留 null 值，以便后端能够正确处理可选字段（如日期）的置空
            cleanData[k] = (v === undefined) ? null : v;
        }
        try {
            console.log('[DB] 更新请求:', url, JSON.stringify(cleanData));
            const res = await fetch(url, {
                method: 'PATCH',
                headers: this._headers(),
                body: JSON.stringify(cleanData)
            });
            if (!res.ok) {
                const errBody = await res.text();
                console.error('[DB] 更新失败，服务端返回:', res.status, errBody);
                throw new Error(`更新失败: ${res.status} - ${errBody}`);
            }
            return await res.json();
        } catch (err) {
            console.error(`[DB] 更新 ${table}/${id} 失败:`, err);
            throw err;
        }
    },

    /**
     * 删除记录
     * @param {string} table - 表名
     * @param {number|string} id - 记录ID
     * @returns {Promise<void>}
     */
    async remove(table, id) {
        const url = this._buildUrl(table, id);
        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: this._headers()
            });
            if (!res.ok) throw new Error(`删除失败: ${res.status}`);
        } catch (err) {
            console.error(`[DB] 删除 ${table}/${id} 失败:`, err);
            throw err;
        }
    },

    /**
     * 查询所有记录（自动分页）
     * @param {string} table - 表名
     * @param {Array} [filters] - 筛选条件
     * @returns {Promise<Array>} 所有记录
     */
    async queryAll(table, filters = []) {
        const allData = [];
        let page = 1;
        const pageLimit = 100;

        while (true) {
            const result = await this.query(table, { filters, page, pageLimit });
            allData.push(...result.data);
            if (allData.length >= result.total || result.data.length < pageLimit) break;
            page++;
        }

        return allData;
    },

    /**
     * 文件上传 — 严格遵循 file-upload.md 技能文档
     *
     * 规范要点：
     * 1. BaseURL = https://${type}.520ai.cc/
     * 2. Authorization = Bearer {token}
     * 3. FormData 只包含 formFile 字段
     * 4. 不手动设置 Content-Type（浏览器自动添加 multipart boundary）
     *
     * @param {File} file - 用户选择的文件对象
     * @returns {Promise<Object>} 上传结果，主要使用 result.url 获取文件访问地址
     */
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('formFile', file); // ⚠️ 字段名必须是 formFile

        // 从 Config 获取动态参数（支持 URL 参数注入覆盖）
        const type = Config.DB_TYPE || '3w-api';
        const token = Config.AUTH_TOKEN; // OAuth Bearer token（与 DB_TOKEN 不同）
        const baseURL = `https://${type}.520ai.cc/`;

        if (!token) {
            throw new Error('缺少上传授权 token（AUTH_TOKEN），请确保 URL 含 token 参数');
        }

        console.log(`[DB] 开始上传文件:`, {
            url: `${baseURL}api/fileResouceItem/uploadUnified`,
            fileName: file.name,
            fileSize: file.size
        });

        try {
            const res = await fetch(`${baseURL}api/fileResouceItem/uploadUnified`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token  // ⚠️ Bearer 后有一个空格
                },
                body: formData
                // ⚠️ 不要手动设置 Content-Type，浏览器会自动添加 multipart boundary
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('[DB] 上传响应错误:', res.status, errText);
                throw new Error(`上传失败 (${res.status}): ${errText}`);
            }

            const result = await res.json();
            console.log('[DB] 上传成功:', result);
            return result;
        } catch (err) {
            console.error('[DB] 文件上传异常:', err);
            throw err;
        }
    }
};
