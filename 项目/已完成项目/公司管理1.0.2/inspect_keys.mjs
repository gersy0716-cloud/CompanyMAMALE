
// Inspect Keys Diagnostic
const Config = {
    DB_API_URL: 'https://data.520ai.cc',
    DB_TOKEN: 'LlrO0TdkBt6AMRiE2KN8FYVJ8Ma1z9jZ7svOpvln',
    DB_BASE_ID: 'bsep0t88MFghCm3xMUU'
};
const headers = { 'Content-Type': 'application/json', 'x-bm-token': Config.DB_TOKEN };

async function run() {
    const tableId = 'gpu3NbzIg9'; // discussions
    const url = `${Config.DB_API_URL}/api/bases/${Config.DB_BASE_ID}/tables/${tableId}/records?pageLimit=1`;
    const res = await fetch(url, { headers });
    const json = await res.json();
    console.log(`\nKeys for discussions (${tableId}):`);
    if (json.data && json.data.length > 0) {
        console.log(Object.keys(json.data[0]).join(', '));
        console.log('Sample:', JSON.stringify(json.data[0]));
    } else {
        console.log('No data.');
    }
}
run();
