import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 所有风格及其中文名称（从 constants.ts 复制）
const STYLE_NAMES = {
  playful: "童趣卡通",
  chalkboard: "黑板教学",
  nature: "清新自然",
  notebook: "笔记本纸",
  cartoon3d: "3D立体卡通",
  oriental: "东方美学",
  pixelgame: "像素游戏",
  adventure: "冒险手绘",
  papercut: "剪纸艺术",
  vintage: "复古浪漫",
  comic: "漫画分镜",
  blueprint: "工程蓝图",
  journal: "手账日记",
  minimal: "极简设计",
  watercolor: "水彩绘本",
  cinematic: "电影叙事",
  academic: "简约学术",
  davinci: "达芬奇手稿",
  inkpen: "钢笔素描",
  pencil: "铅笔速写",
  blackboard: "传统黑板",
  lego: "乐高积木",
  ghibli: "吉卜力",
  doraemon: "哆啦A梦",
  vangogh: "梵高星空",
  inkwash: "水墨国风",
  onepiece: "海贼王",
  graffiti: "涂鸦街头",
  marvel: "漫威动画",
  naruto: "火影忍者",
  pixar: "皮克斯3D",
  mindmap: "思维导图",
  handdrawnmap: "手绘地图",
  japanesecomic: "日本漫画",
  cityposter: "城市海报风",
  "business-simple": "简约商务",
  "tech-modern": "现代科技",
  "academic-formal": "严谨学术",
  "creative-fun": "活泼创意",
  "minimalist-clean": "极简清爽",
  "luxury-premium": "高端奢华",
  "nature-fresh": "自然清新",
  "gradient-vibrant": "渐变活力",
  custom: "自定义风格"
};

// 风格的详细提示词（简化版，用于生成预览图）
const STYLE_IMAGE_PROMPTS = {
  playful: "儿童教育PPT风格预览图，色彩鲜艳明快（明黄、天蓝、草绿），包含可爱的卡通插画，圆润可爱的字体，版式活泼有趣",
  chalkboard: "黑板教学PPT风格预览图，深绿色黑板背景，白色粉笔手写文字，粉笔简笔画图标",
  nature: "清新自然PPT风格预览图，淡雅的绿色和浅蓝色，树叶和云朵元素，水彩质感",
  notebook: "笔记本纸PPT风格预览图，横线笔记本背景，手写风格文字，文具元素装饰",
  cartoon3d: "3D立体卡通PPT风格预览图，3D渲染卡通角色，色彩饱和，光影柔和，卡通材质",
  oriental: "东方美学PPT风格预览图，中国传统水墨画元素，留白构图，水墨黑、朱砂红、青绿色调",
  pixelgame: "像素游戏PPT风格预览图，8-bit复古像素风格，方格马赛克质感，饱和色彩",
  adventure: "冒险手绘PPT风格预览图，手绘素描风格，钢笔淡彩，棕褐色调，地图元素",
  papercut: "剪纸艺术PPT风格预览图，镂空剪影效果，大红金黄色，剪刀裁切锯齿感",
  vintage: "复古浪漫PPT风格预览图，20世纪中期���画风格，玫瑰粉、奶油黄、薄荷绿，油画质感",
  comic: "漫画分镜PPT风格预览图，漫画分格布局，黑白网点，对话气泡，速度线",
  blueprint: "工程蓝图PPT风格预览图，深蓝色背景，白色线条，精密网格，技术标注",
  journal: "手账日记PPT风格预览图，手绘水彩，胶带装饰，贴纸元素，手写字体",
  minimal: "极简设计PPT风格预览图，极度简洁，黑白灰配色，大量留白，几何形状",
  watercolor: "水彩绘本PPT风格预览图，水彩画技法，透明流动色彩，水渍晕染，梦幻温馨",
  cinematic: "电影叙事PPT风格预览图，电影级色彩分级，景深效果，电影化光影",
  academic: "简约学术PPT风格预览图，简洁专业排版，深蓝灰白色，图表可视化",
  davinci: "达芬奇手稿PPT风格预览图，褐色牛皮纸背景，深棕色线条，精密解剖图，镜像文字",
  inkpen: "钢笔素描PPT风格预览图，钢笔线条，交叉排线，黑白对比，版画质感",
  pencil: "铅笔速写PPT风格预览图，铅笔素描，颗粒感，灰度明暗，草图质感",
  blackboard: "传统黑板PPT风格预览图，深绿色黑板，彩色粉笔，粉笔画插图，板报风格",
  lego: "乐高积木PPT风格预览图，乐高积木拼搭，凸点纹理，鲜红亮黄天蓝，塑料光泽",
  ghibli: "吉卜力PPT风格预览图，宫崎骏动画风格，水彩手绘，柔和色彩，自然元素，治愈氛围",
  doraemon: "哆啦A梦PPT风格预览图，藤本弘漫画风格，圆润线条，蓝白红黄，Q版可爱",
  vangogh: "梵高星空PPT风格预览图，后印象派油画，厚重笔触，旋转流动线条，金黄深蓝",
  inkwash: "水墨国风PPT风格预览图，传统水墨画，浓淡干湿，黑白灰，大量留白，山水意境",
  onepiece: "海贼王PPT风格预览图，尾田荣一郎漫画风格，流畅夸张线条，鲜艳饱和，冒险元素",
  graffiti: "涂鸦街头PPT风格预览图，街头涂鸦艺术，喷漆质感，荧光色，粗犷自由线条",
  marvel: "漫威动画PPT风格预览图，美式超级英雄风格，鲜艳对比色，强壮线条，能量光效",
  naruto: "火影忍者PPT风格预览图，岸本齐史漫画风格，橙蓝黑配色，忍术特效，战斗张力",
  pixar: "皮克斯3DPPT风格预览图，高质量3D渲染，饱和色彩，真实光影，温暖治愈",
  mindmap: "思维导图PPT风格预览图，中心辐射树状结构，彩虹分支，节点连接，图标关键词",
  handdrawnmap: "手绘地图PPT风格预览图，俯视插画，手绘线条，米黄土橙，建筑简笔画，指南针",
  japanesecomic: "日本漫画PPT风格预览图，精致线条，黑白网点，大眼精致，速度线集中线",
  cityposter: "城市海报风PPT预览图，扁平化设计，霓虹撞色，建筑剪影，几何图形，现代字体",
  "business-simple": "简约商务PPT风格预览图，海军蓝背景，纯白点缀，扁平化，模块化网格，严谨专业",
  "tech-modern": "现代科技PPT风格预览图，午夜黑背景，电光蓝赛博紫渐变，悬浮3D几何，线框网格",
  "academic-formal": "严谨学术PPT风格预览图，米白纸质背景，纯黑文字，衬线字体，学术排版",
  "creative-fun": "活泼创意PPT风格预览图，暖黄背景，活力橙草绿天蓝撞色，手绘涂鸦，孟菲斯风格",
  "minimalist-clean": "极简清爽PPT风格预览图，雾霾灰背景，莫兰迪色系，大量留白，北欧设计",
  "luxury-premium": "高端奢华PPT风格预览图，曜石黑背景，香槟金装饰，天鹅绒质感，Art Deco纹样",
  "nature-fresh": "自然清新PPT风格预览图，米色背景，森林绿大地棕，绿植叶片，再生纸纹理",
  "gradient-vibrant": "渐变活力PPT风格预览图，全息渐变色，宝石蓝到紫罗兰到洋红，磨砂玻璃，流动波浪",
  custom: "自定义风格PPT预览图"
};

const pngDir = path.join(__dirname, '..', 'png');

// 检查现有图片
function checkExistingImages() {
  const existingFiles = fs.readdirSync(pngDir);
  const existingImages = new Map();

  existingFiles.forEach(file => {
    if (file.endsWith('.png') || file.endsWith('.jpg')) {
      const nameWithoutExt = file.replace(/\.(png|jpg)$/, '');
      existingImages.set(nameWithoutExt, file);
    }
  });

  return existingImages;
}

// 删除不再使用的图片
function cleanupOldImages(existingImages) {
  const currentStyleNames = new Set(Object.values(STYLE_NAMES));
  const filesToDelete = [];

  existingImages.forEach((filename, styleName) => {
    if (!currentStyleNames.has(styleName) && styleName !== '提示词') {
      filesToDelete.push(filename);
    }
  });

  filesToDelete.forEach(file => {
    const filePath = path.join(pngDir, file);
    fs.unlinkSync(filePath);
    console.log(`✅ 已删除不再使用的图片: ${file}`);
  });

  return filesToDelete.length;
}

// 生成缺失的图片
async function generateMissingImages(existingImages) {
  const missingStyles = [];

  Object.entries(STYLE_NAMES).forEach(([styleKey, styleName]) => {
    // 跳过自定义风格
    if (styleKey === 'custom') return;

    // 检查是否已有图片
    if (!existingImages.has(styleName)) {
      missingStyles.push({ key: styleKey, name: styleName });
    }
  });

  console.log(`\n需要生成 ${missingStyles.length} 个风格的预览图\n`);

  for (const style of missingStyles) {
    console.log(`正在生成: ${style.name} (${style.key})`);
    console.log(`提示词: ${STYLE_IMAGE_PROMPTS[style.key]}\n`);

    // 这里需要调用图片生成 API
    // 由于我无法直接调用，请用户手���调用或使用 skill
    console.log(`请为 "${style.name}" 生成图片，保存为: png/${style.name}.png\n`);
  }

  return missingStyles;
}

// 主函数
async function main() {
  console.log('=== PPT 风格预览图生成器 ===\n');

  // 1. 检查现有图片
  console.log('📁 检查现有图片...');
  const existingImages = checkExistingImages();
  console.log(`找到 ${existingImages.size} 个现有图片文件\n`);

  // 2. 清理旧图片
  console.log('🧹 清理不再使用的图片...');
  const deletedCount = cleanupOldImages(existingImages);
  if (deletedCount === 0) {
    console.log('✅ 没有需要清理的图片\n');
  } else {
    console.log(`✅ 已清理 ${deletedCount} 个旧图片\n`);
  }

  // 3. 生成缺失的图片
  console.log('🎨 检查缺失的预览图...');
  const missingStyles = await generateMissingImages(existingImages);

  if (missingStyles.length === 0) {
    console.log('✅ 所有风格都已有预览图！');
  } else {
    console.log(`\n需要生成以下 ${missingStyles.length} 个风格的图片：`);
    missingStyles.forEach(s => {
      console.log(`  - ${s.name} (${s.key})`);
    });
  }
}

main().catch(console.error);
