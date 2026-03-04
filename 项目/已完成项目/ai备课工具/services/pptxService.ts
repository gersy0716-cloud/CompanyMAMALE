import PptxGenJS from "pptxgenjs";
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
    return url; // 返回原始URL，让PptxGenJS尝试处理
  }
};

/**
 * Generates a PPTX file from slides
 * @param slides - Array of slides to export
 * @param filename - Output filename (default: "presentation.pptx")
 */
export const generatePPTX = async (slides: Slide[], filename: string = "演示文稿.pptx") => {
  console.log('=== 开始生成PPTX ===');
  console.log('幻灯片总数:', slides.length);
  console.log('包含图片的页数:', slides.filter(s => s.imageUrl).length);

  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.author = "AI 备课工具";
  pptx.title = "演示文稿";
  pptx.subject = "AI生成的教学课件";

  // 16:9 layout
  pptx.layout = "LAYOUT_16x9";

  let processedCount = 0;
  let errorCount = 0;

  for (const slide of slides) {
    const pptxSlide = pptx.addSlide();

    console.log(`处理第 ${slide.pageNumber} 页...`);

    if (slide.imageUrl) {
      try {
        // 转换图片为base64（如果需要）
        const imageData = await convertImageToBase64(slide.imageUrl);

        // Add the generated image as background
        pptxSlide.addImage({
          data: imageData,
          x: 0,
          y: 0,
          w: "100%",
          h: "100%",
        });

        processedCount++;
        console.log(`✅ 第 ${slide.pageNumber} 页图片已添加`);
      } catch (error) {
        console.error(`❌ 第 ${slide.pageNumber} 页图片添加失败:`, error);
        errorCount++;

        // Fallback: add text if image fails
        addFallbackContent(pptxSlide, slide, true);
      }
    } else {
      // Add text content if no image
      console.log(`⚠️ 第 ${slide.pageNumber} 页没有图片`);
      addFallbackContent(pptxSlide, slide, false);
    }
  }

  // Save the presentation
  try {
    await pptx.writeFile({ fileName: filename });

    console.log('=== PPTX生成完成 ===');
    console.log('成功: ', processedCount, '页');
    console.log('失败: ', errorCount, '页');
    console.log('文件名:', filename);

    // 显示结果提示
    if (errorCount > 0) {
      alert(`PPTX导出完成！\n成功: ${processedCount} 页\n失败: ${errorCount} 页\n请检查失败的页面是否已生成图片。`);
    } else {
      alert(`PPTX导出成功！\n已导出 ${processedCount} 页`);
    }
  } catch (error) {
    console.error('PPTX保存失败:', error);
    alert('PPTX保存失败: ' + (error as Error).message);
    throw error;
  }
};

/**
 * Adds fallback text content when image is not available
 */
function addFallbackContent(pptxSlide: any, slide: Slide, isError: boolean = false) {
  // Add background
  pptxSlide.background = { color: isError ? "FFE5E5" : "F5F5F5" };

  // Add error indicator if image failed to load
  if (isError) {
    pptxSlide.addText("⚠️ Image Load Failed", {
      x: 0.5,
      y: 0.3,
      w: "90%",
      h: 0.5,
      fontSize: 16,
      color: "CC0000",
      align: "center",
    });
  }

  // Add title
  pptxSlide.addText(slide.title, {
    x: 0.5,
    y: isError ? 1.2 : 0.5,
    w: "90%",
    h: 1,
    fontSize: 32,
    bold: true,
    color: "363636",
    align: "center",
  });

  // Add content
  pptxSlide.addText(slide.content, {
    x: 0.5,
    y: isError ? 2.2 : 2,
    w: "90%",
    h: 3,
    fontSize: 18,
    color: "363636",
    valign: "top",
  });

  // Add page number
  pptxSlide.addText(`第 ${slide.pageNumber} 页`, {
    x: 0.5,
    y: 5,
    w: "90%",
    h: 0.5,
    fontSize: 12,
    color: "999999",
    align: "right",
  });
}
