import OpenAI from "openai";

const API_KEY = 'sk-bfsoBhqtsjZ1x5sqbKrA4mFg0DH7aUQMlToVykNJ5IGnww7r';
const API_URL = 'https://dalu.chatgptten.com/v1';
const MODEL = 'gemini-3-pro-preview';

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: API_URL,
});

async function testAPI() {
  console.log('测试API...\n');

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: "你好，请简单介绍一下你自己。"
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: false,
    });

    console.log('完整响应:', JSON.stringify(response, null, 2));
    console.log('\n提取的内容:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('API调用失败:', error);
  }
}

testAPI();
