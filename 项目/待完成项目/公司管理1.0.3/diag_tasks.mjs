
const Config = {
    DB_API_URL: 'https://data.520ai.cc',
    DB_TOKEN: 'LlrO0TdkBt6AMRiE2KN8FYVJ8Ma1z9jZ7svOpvln',
    DB_BASE_ID: 'bsep0t88MFghCm3xMUU',
    TABLES: {
        TASKS: 'SxqN1eraUE'
    }
};

async function checkTasks() {
    const headers = {
        'Content-Type': 'application/json',
        'x-bm-token': Config.DB_TOKEN
    };

    try {
        const url = `${Config.DB_API_URL}/api/bases/${Config.DB_BASE_ID}/tables/${Config.TABLES.TASKS}/records`;
        const res = await fetch(url, { headers });
        const data = await res.json();
        console.log(`--- Checking Tasks ---`);
        if (!data || !data.data) {
            console.log('No data found or unexpected response format:', JSON.stringify(data));
            return;
        }
        console.log(`Found ${data.data.length} tasks.`);
        data.data.forEach(t => console.log(`- [${t.created_at}] "${t.name}" (by: ${t.user_id}, type: ${t.task_type})`));
    } catch (err) {
        console.error('Error:', err);
    }
}
checkTasks();
