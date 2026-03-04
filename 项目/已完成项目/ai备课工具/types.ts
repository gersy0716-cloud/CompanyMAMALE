export enum AppStage {
  COURSEWARE_CENTER = 'COURSEWARE_CENTER',
  INPUT = 'INPUT',
  OUTLINE = 'OUTLINE',
  WORKBENCH = 'WORKBENCH',
  EXPORT = 'EXPORT'
}

export enum SlideStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface InteractiveTool {
  id: string;
  label: number; // 标签编号 1, 2, 3, 4, 5...
  htmlContent: string; // HTML内容
  x: number; // 图标X位置百分比
  y: number; // 图标Y位置百分比
  width?: number; // 弹窗宽度百分比 (默认90)
  height?: number; // 弹窗高度百分比 (默认90)
}

export interface Slide {
  id: string;
  pageNumber: number;
  title: string;
  content: string; // The text content/bullet points
  visualPrompt: string; // The prompt sent to image generation model
  imageUrl?: string; // Base64 or URL
  status: SlideStatus;
  voiceScript?: string; // 语音播放文稿
  voiceUrl?: string; // 生成的语音URL
  videoUrl?: string; // 视频URL
  videoTriggerMode?: 'auto' | 'manual'; // 视频触发模式：auto=自动播放，manual=手动触发
  videoTriggerX?: number; // 视频触发按钮X位置百分比
  videoTriggerY?: number; // 视频触发按钮Y位置百分比
  interactiveTools?: InteractiveTool[]; // 互动工具列表
}

export interface PresentationSettings {
  targetPageCount: number;
  style: 'playful' | 'chalkboard' | 'nature' | 'notebook' | 'cartoon3d' | 'oriental' | 'pixelgame' | 'adventure' | 'papercut' | 'vintage' | 'comic' | 'blueprint' | 'journal' | 'minimal' | 'watercolor' | 'cinematic' | 'academic' | 'davinci' | 'inkpen' | 'pencil' | 'blackboard' | 'lego' | 'ghibli' | 'doraemon' | 'vangogh' | 'inkwash' | 'onepiece' | 'graffiti' | 'marvel' | 'naruto' | 'pixar' | 'mindmap' | 'handdrawnmap' | 'japanesecomic' | 'cityposter' | 'business-simple' | 'tech-modern' | 'academic-formal' | 'creative-fun' | 'minimalist-clean' | 'luxury-premium' | 'nature-fresh' | 'gradient-vibrant' | 'custom';
  focus: 'summary' | 'detailed' | 'visual';
  customStyleName?: string; // 自定义风格名称
  customStylePrompt?: string; // 自定义风格描述提示词
  enableVoice?: boolean; // 是否启用语音合成
  voiceType?: string; // 语音音色类型（如：BV123_streaming）
  narrationStyle?: string; // 讲解风格（如：engaging, lively等）
  copywritingStyles?: string[]; // 文案风格（可多选，如：deepThinking, wittyHumor等）
  aiMode?: 'free' | 'rayleigh'; // AI模式：free=自由输入，rayleigh=雷老师教学认知引擎
}

export interface ParsedDocument {
  text: string;
  fileName?: string;
}
