const API_URL = 'https://3w-api.mamale.vip/api/app/zjAi/myUnifiedOpenAiStream';
const API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkI3RDU5REJCNDFGMjZDNTBENkEyRDE5RDQ3RjI0OThFIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NjU5NzQ1NDksImV4cCI6MTc5NzUxMDU0OSwiaXNzIjoiaHR0cHM6Ly9vYXV0aC5tYW1hbGUudmlwIiwiYXVkIjoiQ29kZUFCQyIsImNsaWVudF9pZCI6IkNvZGVBQkNfQXBwIiwic3ViIjoiMTM5ZGNhMzktNDcwYi0yYjAwLWZkMGEtM2ExNjg5NmUwYTE4IiwiYXV0aF90aW1lIjoxNzY1OTc0NTQ4LCJpZHAiOiJsb2NhbCIsInRlbmFudGlkIjoiYzE4NjMyODUtMjVkMS00NGZlLTgwNWMtNWRkZjYxMWY4M2QzIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbCI6ImxpY2tpZXNAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJGYWxzZSIsIm5hbWUiOiJsaWNraWVzIiwiaWF0IjoxNzY1OTc0NTQ5LCJzY29wZSI6WyJhZGRyZXNzIiwiQ29kZUFCQyIsImVtYWlsIiwib3BlbmlkIiwicGhvbmUiLCJwcm9maWxlIiwicm9sZSIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.EEg6zzeAE7LhTDhCizz-xi24MMakxoDAcT5pWAtiwnNPTlM7t_26-CJfbQdgULa6bHJwJXktd6n18UpJMgRLzn9uyuI-jPbYdIPeXjHi4LAR9WBuMuUicf7WyrV_HO-SxzYE18kUfdt6In3iJY2wCghZ2vmHVJfdyWqZQJZ7s35bG1ne6HwVB6PLNnjrKudh4FdhYh3B5W35vFbL63d-6i9Uq5ahOvwBIQKeDie6m9g1SWa9mYOAtkc6Z_RhXbII7DoMf4S4LXJDc4a0mJxz-EX2lsyO9PCKVm4eXfHfnkvrrBtp6MnkrpRi9_RZjxwfj4qyofXhI23eQs0lKTHoNQ';
const PROVIDER = 'TuZi'; // 兔子通道
const MODEL = 'gemini-3-pro-image-preview-2k'; // 测试默认的 Gemini 模型

async function testImageAPI() {
  console.log('=== 测试图片生成API ===\n');
  console.log('API URL:', API_URL);
  console.log('Token长度:', API_TOKEN.length);
  console.log('Provider:', PROVIDER);
  console.log('Model:', MODEL);
  console.log('\n开始请求...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        provideName: PROVIDER,
        model: MODEL,
        messages: [
          {
            role: "user",
            content: "生成一张简单的测试图片，内容是一个笑脸"
          }
        ]
      })
    });

    console.log('响应状态:', response.status, response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('\n--- 响应头 ---');
    response.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n=== 错误响应 ===');
      console.error(errorText);
      return;
    }

    // 读取SSE流
    const reader = response.body?.getReader();
    if (!reader) {
      console.error('无法读取响应流');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    console.log('\n=== SSE流数据 ===\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        console.log('原始行:', line);

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('>>> 收到结束标记');
            break;
          }

          try {
            const parsed = JSON.parse(data);
            console.log('解析后JSON:', JSON.stringify(parsed, null, 2));

            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              console.log('>>> 提取到内容片段:', content);
            }
          } catch (e) {
            console.warn('>>> 跳过无效JSON:', data);
          }
        }
      }
    }

    console.log('\n=== 完整累积内容 ===');
    console.log(fullContent);

    // 提取图片URL
    const match = fullContent.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
    if (match && match[1]) {
      console.log('\n=== 成功提取图片URL ===');
      console.log(match[1]);
    } else {
      console.log('\n=== 未找到图片URL ===');
    }

  } catch (error) {
    console.error('\n=== 请求失败 ===');
    console.error(error);
  }
}

testImageAPI();
