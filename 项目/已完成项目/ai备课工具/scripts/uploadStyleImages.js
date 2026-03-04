import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// API 配置
const API_BASE_URL = 'https://3w-api.mamale.vip/api';
const UPLOAD_ENDPOINT = '/fileResouceItem/uploadUnified';
const API_TOKEN = process.env.IMAGE_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ 错误: 未找到 IMAGE_API_TOKEN，请检查 .env.local 文件');
  process.exit(1);
}

// 上传单个图片文件
async function uploadImage(filePath, fileName) {
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('formfile', fileStream, fileName);

    const response = await axios.post(
      `${API_BASE_URL}${UPLOAD_ENDPOINT}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${API_TOKEN}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // 提取图片URL
    const imageUrl = response.data?.url ||
                     response.data?.imageUrl ||
                     response.data?.data?.url ||
                     response.data?.path ||
                     response.data?.data;

    if (!imageUrl) {
      throw new Error('上传成功但未返回图片URL');
    }

    return imageUrl;
  } catch (error) {
    console.error(`上传 ${fileName} 失败:`, error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    throw error;
  }
}

// 批量上传所有风格预览图
async function uploadAllStyleImages() {
  const pngDir = path.join(__dirname, '..', 'png-compressed');  // 使用压缩后的目录
  const publicPngDir = path.join(__dirname, '..', 'public', 'png');

  console.log('📁 读取压缩后的风格预览图目录...');
  console.log('源目录:', pngDir);

  if (!fs.existsSync(pngDir)) {
    console.error('❌ png-compressed 目录不存在');
    return;
  }

  const files = fs.readdirSync(pngDir).filter(file =>
    file.endsWith('.png') || file.endsWith('.jpg')
  );

  console.log(`\n找到 ${files.length} 个图片文件\n`);

  const styleImageUrls = {};
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const styleName = file.replace(/\.(png|jpg)$/, ''); // 去除扩展名
    const filePath = path.join(pngDir, file);

    console.log(`[${i + 1}/${files.length}] 上传: ${styleName}`);

    try {
      const imageUrl = await uploadImage(filePath, file);
      styleImageUrls[styleName] = imageUrl;
      successCount++;
      console.log(`✅ 成功: ${imageUrl}\n`);

      // 避免请求过快，延迟500ms
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      failCount++;
      console.log(`❌ 失败\n`);
    }
  }

  // 保存URL映射到配置文件
  const configPath = path.join(__dirname, '..', 'src', 'config', 'styleImageUrls.json');
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(
    configPath,
    JSON.stringify(styleImageUrls, null, 2),
    'utf-8'
  );

  console.log('\n' + '='.repeat(60));
  console.log('📊 上传统计:');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`📝 配置文件已保存: ${configPath}`);
  console.log('='.repeat(60) + '\n');

  // 显示配置文件内容摘要
  console.log('配置文件示例（前3个）:');
  const entries = Object.entries(styleImageUrls).slice(0, 3);
  entries.forEach(([name, url]) => {
    console.log(`  ${name}: ${url}`);
  });
  if (Object.keys(styleImageUrls).length > 3) {
    console.log(`  ... 还有 ${Object.keys(styleImageUrls).length - 3} 个`);
  }

  return styleImageUrls;
}

// 执行上传
console.log('=== 批量上传风格预览图到云存储 ===\n');
uploadAllStyleImages()
  .then(() => {
    console.log('\n✅ 所有任务完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 上传过程出错:', error);
    process.exit(1);
  });
