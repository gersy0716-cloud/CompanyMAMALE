import { Slide, PresentationSettings } from "../types";

/**
 * Exports slides data to JSON file with all features (images, voice, etc.)
 * @param slides - Array of slides to export
 * @param settings - Presentation settings (optional)
 * @param filename - Output filename (default: "presentation.json")
 */
export const exportToJSON = (
  slides: Slide[],
  filename: string = "演示文稿.json",
  settings?: PresentationSettings
) => {
  // Create export data with metadata
  const exportData = {
    metadata: {
      title: "AI 备课工具 - 演示文稿",
      exportDate: new Date().toISOString(),
      version: "3.0", // 更新版本号，包含互动工具功能
      slideCount: slides.length,
      hasVoice: slides.some(s => s.voiceScript || s.voiceUrl),
      hasVideo: slides.some(s => s.videoUrl),
      hasInteractiveTools: slides.some(s => s.interactiveTools && s.interactiveTools.length > 0),
    },
    settings: settings ? {
      targetPageCount: settings.targetPageCount,
      style: settings.style,
      focus: settings.focus,
      customStyleName: settings.customStyleName,
      customStylePrompt: settings.customStylePrompt,
      enableVoice: settings.enableVoice,
    } : undefined,
    slides: slides.map(slide => ({
      id: slide.id,
      pageNumber: slide.pageNumber,
      title: slide.title,
      content: slide.content,
      visualPrompt: slide.visualPrompt,
      imageUrl: slide.imageUrl,
      status: slide.status,
      // 语音相关字段
      voiceScript: slide.voiceScript,
      voiceUrl: slide.voiceUrl,
      // 视频字段
      videoUrl: slide.videoUrl,
      // 互动工具字段
      interactiveTools: slide.interactiveTools?.map(tool => ({
        id: tool.id,
        label: tool.label,
        htmlContent: tool.htmlContent,
        x: tool.x,
        y: tool.y,
        width: tool.width,
        height: tool.height,
      })),
    })),
  };

  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(exportData, null, 2);

  // Create blob and download
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ 文件已导出:', filename);
  console.log('📊 包含信息:', {
    幻灯片数量: slides.length,
    包含语音: exportData.metadata.hasVoice,
    包含视频: exportData.metadata.hasVideo,
    包含互动工具: exportData.metadata.hasInteractiveTools,
    导出时间: exportData.metadata.exportDate,
  });
};

/**
 * Imports slides data from JSON file with all features support
 * @param file - JSON file to import
 * @returns Promise with parsed data including slides and settings
 */
export const importFromJSON = (file: File): Promise<{
  slides: Slide[];
  settings?: PresentationSettings;
  metadata?: any;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate and extract slides
        if (!data.slides || !Array.isArray(data.slides)) {
          reject(new Error("Invalid JSON format: missing slides array"));
          return;
        }

        // 确保所有幻灯片都有必要的字段
        const slides: Slide[] = data.slides.map((slide: any) => ({
          id: slide.id || `slide-${Date.now()}-${Math.random()}`,
          pageNumber: slide.pageNumber || 1,
          title: slide.title || '未命名页面',
          content: slide.content || '',
          visualPrompt: slide.visualPrompt || '',
          imageUrl: slide.imageUrl,
          status: slide.status || 'PENDING',
          // 语音相关字段（如果存在）
          voiceScript: slide.voiceScript,
          voiceUrl: slide.voiceUrl,
          // 视频字段（如果存在）
          videoUrl: slide.videoUrl,
          // 互动工具字段（如果存在）
          interactiveTools: slide.interactiveTools?.map((tool: any) => ({
            id: tool.id || `interactive-${Date.now()}-${Math.random()}`,
            label: tool.label || 1,
            htmlContent: tool.htmlContent || '',
            x: tool.x || 50,
            y: tool.y || 50,
            width: tool.width || 90,
            height: tool.height || 90,
          })),
        }));

        console.log('✅ 文件已加载:', file.name);
        console.log('📊 加载信息:', {
          版本: data.metadata?.version || '未知',
          幻灯片数量: slides.length,
          包含语音: slides.some((s: Slide) => s.voiceScript || s.voiceUrl),
          包含视频: slides.some((s: Slide) => s.videoUrl),
          包含互动工具: slides.some((s: Slide) => s.interactiveTools && s.interactiveTools.length > 0),
          导出时间: data.metadata?.exportDate,
        });

        resolve({
          slides,
          settings: data.settings,
          metadata: data.metadata,
        });
      } catch (error) {
        reject(new Error("Failed to parse JSON file: " + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};
