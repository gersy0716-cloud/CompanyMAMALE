
// Diagnostic Script to List Tables
// Run with: node list_tables.mjs

const Config = {
    DB_API_URL: 'https://data.520ai.cc',
    DB_TOKEN: 'LlrO0TdkBt6AMRiE2KN8FYVJ8Ma1z9jZ7svOpvln',
    DB_BASE_ID: 'bsep0t88MFghCm3xMUU'
};

async function listTables() {
    const headers = {
        'Content-Type': 'application/json',
        'x-bm-token': Config.DB_TOKEN
    };

    try {
        const url = `${Config.DB_API_URL}/api/bases/${Config.DB_BASE_ID}/tables`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Query failed: ${res.status}`);
        const data = await res.json();
        console.log('--- Tables in Base ---');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error listing tables:', err);
    }
}

listTables();
