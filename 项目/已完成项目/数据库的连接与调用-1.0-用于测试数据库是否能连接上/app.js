// Database Configuration
const config = {
    apiUrl: 'https://data.520ai.cc/',
    apiKey: 'IbJFuCQ2Qg7xFfxbm27MXq8IPYAiBAmWwRBk0o3I',
    databaseId: 'bse2oDvQd5aD5EIq4MS',
    tableId: 'tGQBiIQtxC'
};

// DOM Elements
const elements = {
    apiUrl: document.getElementById('apiUrl'),
    apiKey: document.getElementById('apiKey'),
    databaseId: document.getElementById('databaseId'),
    tableId: document.getElementById('tableId'),
    testConnection: document.getElementById('testConnection'),
    refreshData: document.getElementById('refreshData'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    dataTableContainer: document.getElementById('dataTableContainer'),
    tableHeader: document.getElementById('tableHeader'),
    tableBody: document.getElementById('tableBody'),
    addDataForm: document.getElementById('addDataForm'),
    recordName: document.getElementById('recordName'),
    connectionStatus: document.getElementById('connectionStatus'),
    toast: document.getElementById('toast')
};

// State
let currentData = [];
let isConnected = false;

// Toast Notification
function showToast(message, type = 'info') {
    const toast = elements.toast;
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');

    // Update content
    messageEl.textContent = message;

    // Update style
    toast.className = `toast show ${type}`;

    // Update icon based on type
    if (type === 'success') {
        icon.innerHTML = `
            <circle cx="12" cy="12" r="10"/>
            <path d="M9 12l2 2 4-4"/>
        `;
    } else if (type === 'error') {
        icon.innerHTML = `
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        `;
    } else {
        icon.innerHTML = `
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4m0-4h.01"/>
        `;
    }

    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update connection status
function updateConnectionStatus(connected) {
    isConnected = connected;
    const statusDot = elements.connectionStatus.querySelector('.status-dot');
    const statusText = elements.connectionStatus.querySelector('.status-text');

    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = '已连接';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = '未连接';
    }
}

// Get configuration from inputs
function getConfig() {
    return {
        apiUrl: elements.apiUrl.value.trim(),
        apiKey: elements.apiKey.value.trim(),
        databaseId: elements.databaseId.value.trim(),
        tableId: elements.tableId.value.trim()
    };
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const cfg = getConfig();

    const url = `${cfg.apiUrl}${endpoint}`;
    const headers = {
        'x-bm-token': cfg.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Test database connection
async function testConnection() {
    const cfg = getConfig();

    if (!cfg.apiKey || !cfg.databaseId || !cfg.tableId) {
        showToast('请填写完整的配置信息', 'error');
        return;
    }

    try {
        showToast('正在测试连接...', 'info');

        // Try to fetch records from the table
        const endpoint = `api/bases/${cfg.databaseId}/tables/${cfg.tableId}/records`;
        await apiRequest(endpoint, { method: 'GET' });

        updateConnectionStatus(true);
        showToast('连接成功！', 'success');

        // Automatically load data after successful connection
        setTimeout(() => loadData(), 500);
    } catch (error) {
        updateConnectionStatus(false);
        showToast(`连接失败: ${error.message}`, 'error');
    }
}

// Load data from database
async function loadData() {
    const cfg = getConfig();

    if (!cfg.apiKey || !cfg.databaseId || !cfg.tableId) {
        showToast('请先配置数据库信息', 'error');
        return;
    }

    // Show loading state
    elements.loadingState.style.display = 'block';
    elements.emptyState.style.display = 'none';
    elements.dataTableContainer.style.display = 'none';

    try {
        const endpoint = `api/bases/${cfg.databaseId}/tables/${cfg.tableId}/records`;
        const response = await apiRequest(endpoint, { method: 'GET' });

        // Handle paginated response structure
        let records = [];
        if (response.data && Array.isArray(response.data)) {
            records = response.data;
        } else if (Array.isArray(response)) {
            records = response;
        } else if (response.records && Array.isArray(response.records)) {
            records = response.records;
        }

        currentData = records;

        // Hide loading
        elements.loadingState.style.display = 'none';

        if (records.length === 0) {
            elements.emptyState.style.display = 'block';
        } else {
            renderTable(records);
            elements.dataTableContainer.style.display = 'block';
        }

        updateConnectionStatus(true);
        showToast(`成功加载 ${records.length} 条记录`, 'success');
    } catch (error) {
        elements.loadingState.style.display = 'none';
        elements.emptyState.style.display = 'block';
        showToast(`加载数据失败: ${error.message}`, 'error');
    }
}

// Render data table
function renderTable(records) {
    if (records.length === 0) return;

    // Get all unique keys from all records
    const allKeys = new Set();
    records.forEach(record => {
        Object.keys(record).forEach(key => allKeys.add(key));
    });

    const keys = Array.from(allKeys);

    // Render header
    elements.tableHeader.innerHTML = keys.map(key =>
        `<th>${key}</th>`
    ).join('');

    // Render body
    elements.tableBody.innerHTML = records.map(record => {
        const cells = keys.map(key => {
            let value = record[key];

            // Format different types of values
            if (value === null || value === undefined) {
                value = '<span style="color: var(--text-muted);">-</span>';
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            } else if (typeof value === 'boolean') {
                value = value ? '✓' : '✗';
            } else {
                value = String(value);
            }

            return `<td>${value}</td>`;
        }).join('');

        return `<tr>${cells}</tr>`;
    }).join('');
}

// Add new record
async function addRecord(data) {
    const cfg = getConfig();

    if (!cfg.apiKey || !cfg.databaseId || !cfg.tableId) {
        showToast('请先配置数据库信息', 'error');
        return false;
    }

    try {
        showToast('正在添加记录...', 'info');

        const endpoint = `api/bases/${cfg.databaseId}/tables/${cfg.tableId}/records`;
        const response = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        showToast('记录添加成功！', 'success');

        // Reload data after adding
        setTimeout(() => loadData(), 500);

        return true;
    } catch (error) {
        showToast(`添加记录失败: ${error.message}`, 'error');
        return false;
    }
}

// Event Listeners
elements.testConnection.addEventListener('click', testConnection);

elements.refreshData.addEventListener('click', loadData);

elements.addDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = elements.recordName.value.trim();

    if (!name) {
        showToast('请输入名称', 'error');
        return;
    }

    const recordData = {
        name: name
    };

    const success = await addRecord(recordData);

    if (success) {
        // Clear form
        elements.addDataForm.reset();
    }
});

// Update config when inputs change
[elements.apiKey, elements.databaseId, elements.tableId].forEach(input => {
    input.addEventListener('input', () => {
        updateConnectionStatus(false);
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Database Manager Initialized');
    console.log('Config:', getConfig());

    // Show welcome message
    setTimeout(() => {
        showToast('欢迎使用数据库管理系统！请点击"测试连接"开始', 'info');
    }, 500);
});
