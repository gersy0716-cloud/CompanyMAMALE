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

// 将图片转换为 base64
function imageToBase64(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

// 分析单张图片
async function analyzeImage(imageName: string, imagePath: string): Promise<string> {
  console.log(`正在分析: ${imageName}...`);

  try {
    const base64Image = imageToBase64(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请分析这张图片的的风格，并给我nanobanana的提示词"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });

    console.log(`API Response for ${imageName}:`, JSON.stringify(response, null, 2));
    const result = response.choices[0]?.message?.content || '无法生成提示词';
    console.log(`✓ ${imageName} 分析完成`);
    return result;
  } catch (error) {
    console.error(`✗ ${imageName} 分析失败:`, error);
    return `分析失败: ${(error as Error).message}`;
  }
}

// 主函数
async function main() {
  console.log('开始分析图片风格...\n');

  // 读取 png 文件夹中的所有图片
  const files = fs.readdirSync(PNG_DIR)
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .sort();

  console.log(`找到 ${files.length} 张图片\n`);

  const results: { name: string; prompt: string }[] = [];

  // 逐个分析图片
  for (const file of files) {
    const imagePath = path.join(PNG_DIR, file);
    const imageName = path.basename(file, path.extname(file));

    const prompt = await analyzeImage(imageName, imagePath);
    results.push({ name: imageName, prompt });

    // 延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 生成 Markdown 内容
  let markdown = '# 图片风格提示词\n\n';
  markdown += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  markdown += '---\n\n';

  results.forEach((result, index) => {
    markdown += `## ${index + 1}. ${result.name}\n\n`;
    markdown += `${result.prompt}\n\n`;
    markdown += '---\n\n';
  });

  // 保存到文件
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
  console.log(`\n✓ 所有分析完成！结果已保存到: ${OUTPUT_FILE}`);
  console.log(`共分析 ${results.length} 张图片`);
}

main().catch(console.error);
