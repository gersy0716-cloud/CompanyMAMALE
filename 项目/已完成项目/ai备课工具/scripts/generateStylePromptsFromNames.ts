import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = 'sk-bfsoBhqtsjZ1x5sqbKrA4mFg0DH7aUQMlToVykNJ5IGnww7r';
const API_URL = 'https://dalu.chatgptten.com/v1';
const MODEL = 'gemini-3-pro-preview';

const PNG_DIR = path.join(__dirname, '../png');
const OUTPUT_FILE = path.join(PNG_DIR, '提示词.md');

// 初始化 OpenAI 客户端
const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: API_URL,
});

// 分析单个风格名称并生成提示词
async function generatePromptForStyle(styleName: string): Promise<string> {
  console.log(`正在为 "${styleName}" 生成提示词...`);

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "你是一个专业的AI绘画提示词专家，擅长为不同风格生成精确的nanobanana模型提示词。"
        },
        {
          role: "user",
          content: `请为"${styleName}"这个艺术风格，生成一段详细的nanobanana绘画提示词。要求：
1. 描述该风格的核心特征（颜色、构图、质感、氛围等）
2. 适合用于AI生成该风格的PPT课件页面
3. 提示词要具体、专业、可执行
4. 长度在100-200字之间
5. 使用中文

只输出提示词内容，不要其他说明。`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const result = response.choices[0]?.message?.content || '无法生成提示词';
    console.log(`✓ "${styleName}" 提示词生成完成`);
    return result.trim();
  } catch (error) {
    console.error(`✗ "${styleName}" 生成失败:`, error);
    return `生成失败: ${(error as Error).message}`;
  }
}

// 主函数
async function main() {
  console.log('开始生成风格提示词...\n');

  // 读取 png 文件夹中的所有图片文件名
  const files = fs.readdirSync(PNG_DIR)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .sort();

  console.log(`找到 ${files.length} 个风格\n`);

  const results: { name: string; prompt: string }[] = [];

  // 逐个生成提示词
  for (const file of files) {
    const styleName = path.basename(file, path.extname(file));
    const prompt = await generatePromptForStyle(styleName);
    results.push({ name: styleName, prompt });

    // 延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 生成 Markdown 内容
  let markdown = '# 图片风格提示词\n\n';
  markdown += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  markdown += '本文档包含20种风格的 nanobanana 提示词，可用于AI生成对应风格的PPT课件页面。\n\n';
  markdown += '---\n\n';

  results.forEach((result, index) => {
    markdown += `## ${index + 1}. ${result.name}\n\n`;
    markdown += `${result.prompt}\n\n`;
    markdown += '---\n\n';
  });

  // 保存到文件
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
  console.log(`\n✓ 所有提示词生成完成！结果已保存到: ${OUTPUT_FILE}`);
  console.log(`共生成 ${results.length} 个风格的提示词`);
}

main().catch(console.error);
