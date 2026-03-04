import { jsPDF } from "jspdf";
import { Slide } from "../types";

/**
 * 将图片URL转换为Base64（如果需要）
 */
const convertImageToBase64 = async (url: string): Promise<string> => {
  // 如果已经是base64，直接返回
  if (url.startsWith('data:')) {
    return url;
  }

  // 尝试通过fetch获取并转换为base64
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('转换图片失败:', error);
    return url; // 返回原始URL，让jsPDF尝试处理
  }
};

export const generatePDF = async (slides: Slide[], filename: string = "presentation.pdf") => {
  console.log('=== 开始生成PDF ===');
  console.log('幻灯片总数:', slides.length);
  console.log('包含图片的页数:', slides.filter(s => s.imageUrl).length);

  // 16:9 ratio in mm. A4 landscape is roughly 297x210.
  // Let's use a custom size that matches 16:9 strictly, e.g., 297mm width -> ~167mm height
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [297, 167]
  });

  let processedCount = 0;
  let errorCount = 0;

  for (let index = 0; index < slides.length; index++) {
    const slide = slides[index];

    if (index > 0) {
      doc.addPage();
    }

    console.log(`处理第 ${slide.pageNumber} 页...`);

    if (slide.imageUrl) {
      try {
        // 转换图片为base64（如果需要）
        const imageData = await convertImageToBase64(slide.imageUrl);

        // 添加图片到PDF
        doc.addImage(imageData, "PNG", 0, 0, 297, 167);
        processedCount++;
        console.log(`✅ 第 ${slide.pageNumber} 页图片已添加`);
      } catch (error) {
        console.error(`❌ 第 ${slide.pageNumber} 页图片添加失败:`, error);
        errorCount++;

        // 添加错误提示页面
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 0, 297, 167, "F");
        doc.setFontSize(20);
        doc.setTextColor(200, 0, 0);
        doc.text(`Page ${slide.pageNumber}: Image Load Failed`, 148.5, 80, { align: "center" });
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(slide.title, 148.5, 95, { align: "center" });
      }
    } else {
      // Fallback if image missing
      console.log(`⚠️ 第 ${slide.pageNumber} 页没有图片`);
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, 297, 167, "F");
      doc.setFontSize(20);
      doc.setTextColor(100, 100, 100);
      doc.text("Image not generated", 148.5, 80, { align: "center" });
      doc.setFontSize(14);
      doc.text(slide.title, 148.5, 95, { align: "center" });
    }
  }

  doc.save(filename);

  console.log('=== PDF生成完成 ===');
  console.log('成功: ', processedCount, '页');
  console.log('失败: ', errorCount, '页');
  console.log('文件名:', filename);

  // 显示结果提示
  if (errorCount > 0) {
    alert(`PDF导出完成！\n成功: ${processedCount} 页\n失败: ${errorCount} 页\n请检查失败的页面是否已生成图片。`);
  } else {
    alert(`PDF导出成功！\n已导出 ${processedCount} 页`);
  }
};