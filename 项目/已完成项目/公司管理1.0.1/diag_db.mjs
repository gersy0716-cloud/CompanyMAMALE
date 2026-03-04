
// Diagnostic Script for Database Records
// Run with: node diag_db.mjs

const Config = {
    DB_API_URL: 'https://data.520ai.cc',
    DB_TOKEN: 'LlrO0TdkBt6AMRiE2KN8FYVJ8Ma1z9jZ7svOpvln',
    DB_BASE_ID: 'bsep0t88MFghCm3xMUU',
    TABLES: {
        USERS: 'injhuCnRig',
        ANNOUNCEMENTS: 'jYb1wcKsHy'
    }
};

async function checkAll() {
    const headers = {
        'Content-Type': 'application/json',
        'x-bm-token': Config.DB_TOKEN
    };

    try {
        console.log('--- Checking All Bases for this Token ---');
        const basesRes = await fetch(`${Config.DB_API_URL}/api/bases`, { headers });
        const bases = await basesRes.json();
        console.log(`Available bases:`, JSON.stringify(bases, null, 2));

        const query = async (table) => {
            const url = `${Config.DB_API_URL}/api/bases/${Config.DB_BASE_ID}/tables/${table}/records`;
            const res = await fetch(url, { headers });
            return await res.json();
        };

        const tables = [
            { id: Config.TABLES.USERS, name: 'users' },
            { id: Config.TABLES.ANNOUNCEMENTS, name: 'announcements' },
            { id: 'gpu3NbzIg9', name: 'discussions' },
            { id: 'SxqN1eraUE', name: 'tasks' }
        ];

        for (const t of tables) {
            const res = await query(t.id);
            if (!res.data) {
                console.log(`\n--- Table ${t.name} (${t.id}) ---`);
                console.log('No records or unexpected format');
                continue;
            }

            console.log(`\n--- Table ${t.name} (${t.id}) ---`);
            console.log(`Total: ${res.data.length} records`);

            if (t.name === 'users') {
                res.data.forEach(u => console.log(`- name: "${u.name}", real_name: "${u.real_name}", role: "${u.role}", id: ${u.id}`));
            } else {
                const myRecords = res.data.filter(r =>
                    String(r.user_id || '').includes('luowenbin') ||
                    String(r.created_by || '').includes('luowenbin') ||
                    String(r.name || '').includes('测试')
                );
                console.log(`Matching 'luowenbin' or '测试': ${myRecords.length}`);
                myRecords.forEach(r => console.log(`- [${r.created_at}] "${r.name || r.content || 'Untitled'}"`));
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

checkAll();
