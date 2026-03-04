import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 所有需要生成的风格
const stylesToGenerate = [
  { key: 'playful', name: '童趣卡通', prompt: '儿童教育PPT风格预览图，色彩鲜艳明快（明黄、天蓝、草绿），包含可爱的卡通插画，圆润可爱的字体，版式活泼有趣，展示一个完整的PPT页面样式' },
  { key: 'chalkboard', name: '黑板教学', prompt: '黑板教学PPT风格预览图，深绿色黑板背景，白色粉笔手写文字，粉笔简笔画图标，展示一个完整的PPT页面样式' },
  { key: 'nature', name: '清新自然', prompt: '清新自然PPT风格预览图，淡雅的绿色和浅蓝色，树叶和云朵元素，水彩质感，展示一个完整的PPT页面样式' },
  { key: 'notebook', name: '笔记本纸', prompt: '笔记本纸PPT风格预览图，横线笔记本背景，手写风格文字，文具元素装饰，展示一个完整的PPT页面样式' },
  { key: 'cartoon3d', name: '3D立体卡通', prompt: '3D立体卡通PPT风格预览图，3D渲染卡通角色，色彩饱和，光影柔和，卡通材质，展示一个完整的PPT页面样式' },
  { key: 'oriental', name: '东方美学', prompt: '东方美学PPT风格预览图，中国传统水墨画元素，留白构图，水墨黑、朱砂红、青绿色调，展示一个完整的PPT页面样式' },
  { key: 'pixelgame', name: '像素游戏', prompt: '像素游戏PPT风格预览图，8-bit复古像素风格，方格马赛克质感，饱和色彩，展示一个完整的PPT页面样式' },
  { key: 'adventure', name: '冒险手绘', prompt: '冒险手绘PPT风格预览图，手绘素描风格，钢笔淡彩，棕褐色��，地图元素，展示一个完整的PPT页面样式' },
  { key: 'papercut', name: '剪纸艺术', prompt: '剪纸艺术PPT风格预览图，镂空剪影效果，大红金黄色，剪刀裁切锯齿感，展示一个完整的PPT页面样式' },
  { key: 'vintage', name: '复古浪漫', prompt: '复古浪漫PPT风格预览图，20世纪中期插画风格，玫瑰粉、奶油黄、薄荷绿，油画质感，展示一个完整的PPT页面样式' },
  { key: 'comic', name: '漫画分镜', prompt: '漫画分镜PPT风格预览图，漫画分格布局，黑白网点，对话气泡，速度线，展示一个完整的PPT页面样式' },
  { key: 'blueprint', name: '工程蓝图', prompt: '工程蓝图PPT风格预览图，深蓝色背景，白色线条，精密网格，技术标注，展示一个完整的PPT页面样式' },
  { key: 'journal', name: '手账日记', prompt: '手账日记PPT风格预览图，手绘水彩，胶带装饰，贴纸元素，手写字体，展示一个完整的PPT页面样式' },
  { key: 'minimal', name: '极简设计', prompt: '极简设计PPT风格预览图，极度简洁，黑白灰配色，大量留白，几何形状，展示一个完整的PPT页面样式' },
  { key: 'watercolor', name: '水彩绘本', prompt: '水彩绘本PPT风格预览图，水彩画技法，透明流动色彩，水渍晕染，梦幻温馨，展示一个完整的PPT页面样式' },
  { key: 'cinematic', name: '电影叙事', prompt: '电影叙事PPT风格预览图，电影级色彩分级，景深效果，电影化光影，展示一个完整的PPT页面样式' },
  { key: 'academic', name: '简约学术', prompt: '简约学术PPT风格预览图，简洁专业排版，深蓝灰白色，图表可视化，展示一个完整的PPT页面样式' },
  { key: 'davinci', name: '达芬奇手稿', prompt: '达芬奇手稿PPT风格预览图，褐色牛皮纸背景，深棕色线条，精密解剖图，镜像文字，展示一个完整的PPT页面样式' },
  { key: 'inkpen', name: '钢笔素描', prompt: '钢笔素描PPT风格预览图，钢笔线条，交叉排线，黑白对比，版画质感，展示一个完整的PPT页面样式' },
  { key: 'pencil', name: '铅笔速写', prompt: '铅笔速写PPT风格预览图，铅笔素描，颗粒感，灰度明暗，草图质感，展示一个完整的PPT页面样式' },
  { key: 'blackboard', name: '传统黑板', prompt: '传统黑板PPT风格预览图，深绿色黑板，彩色粉笔，粉笔画插图，板报风格，展示一个完整的PPT页面样式' },
  { key: 'lego', name: '乐高积木', prompt: '乐高积木PPT风格预览图，乐高积木拼搭，凸点纹理，鲜红亮黄天蓝，塑料光泽，展示一个完整的PPT页面样式' },
  { key: 'ghibli', name: '吉卜力', prompt: '吉卜力PPT风格预览图，宫崎骏动画风格，水彩手绘，柔和色彩，自然元素，治愈氛围，展示一个完整的PPT页面样式' },
  { key: 'doraemon', name: '哆啦A梦', prompt: '哆啦A梦PPT风格预览图，藤本弘漫画风格，圆润线条，蓝白红黄，Q版可爱，展示一个完整的PPT页面样式' },
  { key: 'vangogh', name: '梵高星空', prompt: '梵高星空PPT风格预览图，后印象派油画，厚重笔触，旋转流动线条，金黄深蓝，展示一个完整的PPT页面样式' },
  { key: 'inkwash', name: '水墨国风', prompt: '水墨国风PPT风格预览图，传统水墨画，浓淡干湿，黑白灰，大量留白，山水意境，展示一个完整的PPT页面样式' },
  { key: 'onepiece', name: '海贼王', prompt: '海贼王PPT风格预览图，尾田荣一郎漫画风格，流畅夸张线条，鲜艳饱和，冒险元素，展示一个完整的PPT页面样式' },
  { key: 'graffiti', name: '涂鸦街头', prompt: '涂鸦街头PPT风格预览图，街头涂鸦艺术，喷漆质感，荧光色，粗犷自由线条，展示一个完整的PPT页面样式' },
  { key: 'marvel', name: '漫威动画', prompt: '漫威动画PPT风格预览图，美式超级英雄风格，鲜艳对比色，强壮线条，能量光效，展示一个完整的PPT页面样式' },
  { key: 'naruto', name: '火影忍者', prompt: '火影忍者PPT风格预览图，岸本齐史漫画风格，橙蓝黑配色，忍术特效，战斗张力，展示一个完整的PPT页面样式' },
  { key: 'pixar', name: '皮克斯3D', prompt: '皮克斯3DPPT风格预览图，高质量3D渲染，饱和色彩，真实光影，温暖治愈，展示一个完整的PPT页面样式' },
  { key: 'mindmap', name: '思维导图', prompt: '思维导图PPT风格预览图，中心辐射树状结构，彩虹分支，节点连接，图标关键词，展示一个完整的PPT页面样式' },
  { key: 'handdrawnmap', name: '手绘地图', prompt: '手绘地图PPT风格预览图，俯视插画，手绘线条，米黄土橙，建筑简笔画，指南针，展示一个完整的PPT页面样式' },
  { key: 'japanesecomic', name: '日本漫画', prompt: '日本漫画PPT风格预览图，精致线条，黑白网点，大眼精致，速度线集中线，展示一个完整的PPT页面样式' },
  { key: 'cityposter', name: '城市海报风', prompt: '城市海报风PPT预览图，扁平化设计，霓虹撞色，建筑剪影，几何图形，现代字体，展示一个完整的PPT页面样式' },
  { key: 'business-simple', name: '简约商务', prompt: '简约商务PPT风格预览图，海军蓝背景，纯白点缀，扁平化，模块化网格，严谨专业，展示一个完整的PPT页面样式' },
  { key: 'tech-modern', name: '现代科技', prompt: '现代科技PPT风格预览图，午夜黑背景，电光蓝赛博紫渐变，悬浮3D几何，线框网格，展示一个完整的PPT页面样式' },
  { key: 'academic-formal', name: '严谨学术', prompt: '严谨学术PPT风格���览图，米白纸质背景，纯黑文字，衬线字体，学术排版，展示一个完整的PPT页面样式' },
  { key: 'creative-fun', name: '活泼创意', prompt: '活泼创意PPT风格预览图，暖黄背景，活力橙草绿天蓝撞色，手绘涂鸦，孟菲斯风格，展示一个完整的PPT页面样式' },
  { key: 'minimalist-clean', name: '极简清爽', prompt: '极简清爽PPT风格预览图，雾霾灰背景，莫兰迪色系，大量留白，北欧设计，展示一个完整的PPT页面样式' },
  { key: 'luxury-premium', name: '高端奢华', prompt: '高端奢华PPT风格预览图，曜石黑背景，香槟金装饰，天鹅绒质感，Art Deco纹样，展示一个完整的PPT页面样式' },
  { key: 'nature-fresh', name: '自然清新', prompt: '自然清新PPT风格预览图，米色背景，森林绿大地棕，绿植叶片，再生纸纹理，展示一个完整的PPT页面样式' },
  { key: 'gradient-vibrant', name: '渐变活力', prompt: '渐变活力PPT风格预览图，全息渐变色，宝石蓝到紫罗兰到洋红，磨砂玻璃，流动波浪，展示一个完整的PPT页面样式' }
];

console.log(`准备生成 ${stylesToGenerate.length} 个风格的预览图`);
console.log('提示词列表已准备完成！');
console.log('\n由于需要使用 gemini-image skill 生成图片，请手动执行以下操作：\n');

stylesToGenerate.forEach((style, index) => {
  console.log(`${index + 1}. ${style.name}`);
  console.log(`   提示词: ${style.prompt}`);
  console.log(`   保存为: png/${style.name}.png\n`);
});
