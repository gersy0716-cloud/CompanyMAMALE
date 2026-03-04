const API_BASE_URL = 'https://3w-api.mamale.vip';
const API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NjU5NzQ1NDksImV4cCI6MTc5NzUxMDU0OSwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiMTM5ZGNhMzktNDcwYi0yYjAwLWZkMGEtM2ExNjg5NmUwYTE4IiwiYXV0aF90aW1lIjoxNzY1OTc0NTQ4LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6ImxpY2tpZXNAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJGYWxzZSIsIm5hbWUiOiJsaWNraWVzIiwiaWF0IjoxNzY1OTc0NTQ5LCJzY29wZSI6WyJhZGRyZXNzIiwiQ29kZUFCQyIsImVtYWlsIiwib3BlbmlkIiwicGhvbmUiLCJwcm9maWxlIiwicm9sZSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.EEg6zzeAE7LhTDhCizz-xi24MMakxoDAcT5pWAtiwnNPTlM7t_26-CJfbQdgULa6bHJwJXktd6n18UpJMgRLzn9uyuI-jPbYdIPeXjHi4LAR9WBuMuUicf7WyrV_HO-SxzYE18kUfdt6In3iJY2wCghZ2vmHVJfdyWqZQJZ7s35bG1ne6HwVB6PLNnjrKudh4FdhYh3B5W35vFbL63d-6i9Uq5ahOvwBIQKeDie6m9g1SWa9mYOAtkc6Z_RhXbII7DoMf4S4LXJDc4a0mJxz-EX2lsyO9PCKVm4eXfHfnkvrrBtp6MnkrpRi9_RZjxwfj4qyofXhI23eQs0lKTHoNQ';
const MODEL = 'gemini-3-pro-image-preview-async';

async function testAsyncImageAPI() {
  console.log('=== 测试异步图片生成API ===\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Token长度:', API_TOKEN.length);
  console.log('Model:', MODEL);
  console.log('\n');

  try {
    // Step 1: 创建任务
    console.log('步骤1: 创建异步任务...');
    const createUrl = `${API_BASE_URL}/api/app/tuZi/asyncImageCreateMy`;
    console.log('创建任务URL:', createUrl);

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: '生成一张简单的测试图片，内容是一个笑脸',
        size: '16:9'
      })
    });

    console.log('创建任务响应状态:', createResponse.status, createResponse.statusText);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('创建任务失败:', errorText);
      return;
    }

    const createResult = await createResponse.json();
    console.log('创建任务成功，返回数据:', JSON.stringify(createResult, null, 2));

    const taskId = createResult.taskId;
    if (!taskId) {
      console.error('未返回任务ID');
      return;
    }

    console.log('✅ 任务ID:', taskId);
    console.log('\n');

    // Step 2: 轮询任务状态
    console.log('步骤2: 轮询任务状态...');
    const queryUrl = `${API_BASE_URL}/api/app/tuZi/asyncImageQueryMy/${taskId}`;
    console.log('查询任务URL:', queryUrl);

    let pollCount = 0;
    const maxPolls = 30;
    const pollInterval = 2000;

    while (pollCount < maxPolls) {
      pollCount++;
      console.log(`\n轮询第 ${pollCount} 次...`);

      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const queryResponse = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });

      console.log('查询响应状态:', queryResponse.status, queryResponse.statusText);

      if (!queryResponse.ok) {
        const errorText = await queryResponse.text();
        console.error('查询任务失败:', errorText);
        return;
      }

      const queryResult = await queryResponse.json();
      console.log('查询结果:', JSON.stringify(queryResult, null, 2));

      const { status, progress, video_url, isSucess } = queryResult;

      console.log(`状态: ${status}, 进度: ${progress}%, 成功: ${isSucess}`);

      if (status === 'completed' && isSucess && video_url) {
        console.log('\n✅ 任务完成！');
        console.log('图片URL:', video_url);
        return;
      } else if (status === 'failed' || (status === 'completed' && !isSucess)) {
        console.error('\n❌ 任务失败');
        return;
      }
    }

    console.log('\n⏱️ 超过最大轮询次数');

  } catch (error) {
    console.error('\n=== 请求失败 ===');
    console.error(error);
  }
}

testAsyncImageAPI();
