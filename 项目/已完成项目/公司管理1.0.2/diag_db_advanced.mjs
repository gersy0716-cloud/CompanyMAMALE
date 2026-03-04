
// Advanced Diagnostic Script for Database 500 Errors
// Run with: node diag_db_advanced.mjs

const Config = {
    DB_API_URL: 'https://data.520ai.cc',
    DB_TOKEN: 'LlrO0TdkBt6AMRiE2KN8FYVJ8Ma1z9jZ7svOpvln',
    DB_BASE_ID: 'bsep0t88MFghCm3xMUU',
    VERSIONS_TABLE: '3QBYQzM3Hs'
};

const headers = {
    'Content-Type': 'application/json',
    'x-bm-token': Config.DB_TOKEN
};

async function testCreate(data, label) {
    const url = `${Config.DB_API_URL}/api/bases/${Config.DB_BASE_ID}/tables/${Config.VERSIONS_TABLE}/records`;
    console.log(`\n--- Test: ${label} ---`);
    console.log(`Payload: ${JSON.stringify(data)}`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        const body = await res.text();
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            console.log(`Success! ID: ${JSON.parse(body).id}`);
        } else {
            console.log(`Failed: ${body}`);
        }
        return res.ok;
    } catch (err) {
        console.error(`Fetch Error: ${err.message}`);
        return false;
    }
}

async function run() {
    console.log('--- Database Field Isolation Test ---');

    // Test 1: Baseline
    await testCreate({ name: 'Isolation Test 1' }, 'Baseline (Name only)');

    // Test 2: 'version' field
    await testCreate({ name: 'Isolation Test 2', version: 'v1.0.0' }, "Field: 'version'");

    // Test 3: 'download_url' field
    await testCreate({ name: 'Isolation Test 3', download_url: 'https://test.com' }, "Field: 'download_url'");

    // Test 4: 'user_id' field
    await testCreate({ name: 'Isolation Test 4', user_id: 'admin' }, "Field: 'user_id'");

    // Test 5: 'changelog' field
    await testCreate({ name: 'Isolation Test 5', changelog: 'test log' }, "Field: 'changelog'");

    // Test 6: Check for field naming variations (camelCase vs snake_case)
    await testCreate({ name: 'Isolation Test 6', downloadUrl: 'https://test.com' }, "Field: 'downloadUrl' (camelCase)");
}

run();
