import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const SOURCE_DIR = path.join(__dirname, '..', 'png');
const OUTPUT_DIR = path.join(__dirname, '..', 'png-compressed');
const TARGET_SIZE_KB = 200; // 目标文件大小（KB）
const TARGET_SIZE_BYTES = TARGET_SIZE_KB * 1024;

// 压缩单个图片
async function compressImage(inputPath, outputPath, fileName) {
  try {
    const stats = fs.statSync(inputPath);
    const originalSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`\n处理: ${fileName}`);
    console.log(`原始大小: ${originalSizeKB} KB`);

    // 如果已经小于目标大小，直接复制
    if (stats.size <= TARGET_SIZE_BYTES) {
      fs.copyFileSync(inputPath, outputPath);
      console.log(`✅ 无需压缩，直接复制`);
      return { original: stats.size, compressed: stats.size };
    }

    // 读取图片元数据
    const metadata = await sharp(inputPath).metadata();

    // 初始设置
    let compressed = null;
    let compressedSize = 0;

    // 更激进的压缩策略：直接从缩小尺寸开始
    let scale = 0.7;  // 从70%开始
    let quality = 75;

    while (scale >= 0.3) {  // 最小缩放到30%
      const newWidth = Math.round(metadata.width * scale);
      const newHeight = Math.round(metadata.height * scale);

      // 先尝试缩放
      compressed = await sharp(inputPath)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({
          quality: quality,
          compressionLevel: 9,
          effort: 10
        })
        .toBuffer();

      compressedSize = compressed.length;

      if (compressedSize <= TARGET_SIZE_BYTES) {
        console.log(`缩放到 ${(scale * 100).toFixed(0)}% (${newWidth}x${newHeight}), 质量: ${quality}%`);
        break;
      }

      // 如果当前尺寸下质量还可以降低
      if (quality > 50) {
        quality -= 10;
      } else {
        // 质量已经很低了，缩小尺寸
        scale -= 0.05;
        quality = 75;  // 重置质量
      }
    }

    // 保存压缩后的图片
    fs.writeFileSync(outputPath, compressed);

    const compressedSizeKB = (compressedSize / 1024).toFixed(2);
    const ratio = ((1 - compressedSize / stats.size) * 100).toFixed(1);

    console.log(`压缩后大小: ${compressedSizeKB} KB`);
    console.log(`压缩率: ${ratio}%`);
    console.log(`✅ 压缩完成`);

    return { original: stats.size, compressed: compressedSize };

  } catch (error) {
    console.error(`❌ 压缩失败: ${error.message}`);
    throw error;
  }
}

// 批量压缩所有图片
async function compressAllImages() {
  console.log('=== PNG 图片批量压缩工具 ===');
  console.log(`目标大小: ${TARGET_SIZE_KB} KB\n`);

  // 创建输出目录
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 读取所有PNG文件
  const files = fs.readdirSync(SOURCE_DIR).filter(file =>
    file.endsWith('.png') || file.endsWith('.jpg')
  );

  console.log(`找到 ${files.length} 个图片文件\n`);

  let totalOriginal = 0;
  let totalCompressed = 0;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(SOURCE_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    console.log(`[${i + 1}/${files.length}]`);

    try {
      const result = await compressImage(inputPath, outputPath, file);
      totalOriginal += result.original;
      totalCompressed += result.compressed;
      successCount++;
    } catch (error) {
      failCount++;
    }
  }

  // 统计信息
  const totalOriginalMB = (totalOriginal / 1024 / 1024).toFixed(2);
  const totalCompressedMB = (totalCompressed / 1024 / 1024).toFixed(2);
  const totalRatio = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 压缩统计:');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`\n原始总大小: ${totalOriginalMB} MB`);
  console.log(`压缩后总大小: ${totalCompressedMB} MB`);
  console.log(`总压缩率: ${totalRatio}%`);
  console.log(`\n压缩后文件保存在: ${OUTPUT_DIR}`);
  console.log('='.repeat(60));
}

// 执行压缩
compressAllImages()
  .then(() => {
    console.log('\n✅ 所有图片压缩完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 压缩过程出错:', error);
    process.exit(1);
  });
