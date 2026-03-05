import React, { useState, useEffect, useRef } from 'react';
import { Slide, SlideStatus, PresentationSettings, InteractiveTool } from '../types';
import { generateSlideImage, regenerateSlideImageWithEdit } from '../services/geminiService';
import { generatePDF } from '../services/pdfService';
import { generatePPTX } from '../services/pptxService';
import { exportToJSON, importFromJSON } from '../services/jsonService';
import { generateVoice } from '../services/ttsService';
import { uploadVideo, uploadImage } from '../services/uploadService';
import { uploadJSONFile, saveToCloud } from '../services/cloudSaveService';
import { updateCourseware } from '../services/coursewareService';
import { requestDisplayStream } from '../services/screenRecordingService';
import { DropdownMenu } from './DropdownMenu';
import { ImageEditor } from './ImageEditor';
import { FullscreenPresentation } from './FullscreenPresentation';
import { VoiceSettings } from './VoiceSettings';
import { VideoSettings } from './VideoSettings';
import CategorySelectModal from './CategorySelectModal';
import globalConfig from '../utils/globalConfig';
import {
  Download,
  Wand2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Maximize2,
  Layout,
  FileText,
  Presentation,
  FileJson,
  Upload,
  Play,
  Monitor,
  Sparkles,
  Pen,
  ArrowUpRight,
  Square,
  Eraser,
  Target,
  MapPin,
  Star,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
  Volume2,
  Video,
  X,
  Plus,
  Cloud,
  Home,
  Code,
  Edit3,
  Trash2,
  StopCircle,
  GripVertical
} from 'lucide-react';

interface Props {
  slides: Slide[];
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;
  settings: PresentationSettings;
  editMode?: 'new' | 'edit' | 'view'; // 编辑模式
  currentCoursewareId?: string | null; // 当前课件ID（编辑模式下）
  currentCoursewareData?: any; // 当前课件数据（编辑模式下）
  onBack: () => void;
  onBackToCoursewareCenter?: () => void; // 返回课件中心
}

// 绘图相关类型定义
interface Annotation {
  type: 'pen' | 'arrow' | 'rect' | 'hotspot';
  color?: string;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  // Hotspot 特有属性
  x?: number;
  y?: number;
  text?: string;
  style?: 'dot' | 'pin' | 'star' | 'thumbsUp' | 'thumbsDown';
  fontSize?: string;
  textColor?: string;
  iconSize?: number;
  iconColor?: string;
}

const WorkbenchStage: React.FC<Props> = ({
  slides,
  setSlides,
  settings,
  editMode = 'new',
  currentCoursewareId = null,
  currentCoursewareData = null,
  onBack,
  onBackToCoursewareCenter
}) => {
  // 根据 editMode 初始化 viewMode
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(editMode === 'view' ? 'preview' : 'edit');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingVoices, setIsGeneratingVoices] = useState(false);
  const [provider, setProvider] = useState('TuZiAsync'); // 通道选择，默认为兔子异步
  const [model, setModel] = useState('gemini-3-pro-image-preview-async'); // 模型选择，默认为异步模型
  const [abortControllers, setAbortControllers] = useState<Map<number, AbortController>>(new Map()); // 图片生成中止控制器
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null); // 正在编辑的幻灯片索引
  const [isFullscreen, setIsFullscreen] = useState(false); // 全屏播放状态
  const [autoPlayVoice, setAutoPlayVoice] = useState(false); // 自动语音播放状态
  const [enableScreenRecording, setEnableScreenRecording] = useState(false); // 录屏模式状态
  const displayStreamRef = useRef<MediaStream | null>(null); // 预授权的屏幕共享流
  const [showModelSelector, setShowModelSelector] = useState(false); // 模型选择器显示状态
  const [transitionEffect, setTransitionEffect] = useState<'fade' | 'slideUp' | 'slideLeft' | 'flip'>('fade'); // 翻页效果
  const [activeTab, setActiveTab] = useState<'image' | 'voice' | 'video' | 'interactive'>('image'); // TAB切换状态

  // 绘图工具状态
  const [activeTool, setActiveTool] = useState<'none' | 'pen' | 'arrow' | 'rect' | 'hotspot'>('none');
  const [brushColor, setBrushColor] = useState('#EF4444');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [annotations, setAnnotations] = useState<Record<string, Annotation[]>>({});
  const [currentDrawing, setCurrentDrawing] = useState<Annotation | null>(null);

  // 交互点配置状态
  const [hotspotConfig, setHotspotConfig] = useState({
    text: "请点击此处查看详情",
    style: "dot" as 'dot' | 'pin' | 'star' | 'thumbsUp' | 'thumbsDown',
    fontSize: "14px",
    textColor: "#FFFFFF",
    iconSize: 1,
    iconColor: "#EF4444"
  });
  const [showHotspotConfig, setShowHotspotConfig] = useState(false);

  // 保存到云端相关状态
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);

  // 互动工具相关状态
  const [showInteractiveModal, setShowInteractiveModal] = useState(false);
  const [interactiveHtmlInput, setInteractiveHtmlInput] = useState('');
  const [editingInteractiveId, setEditingInteractiveId] = useState<string | null>(null);
  const [showInteractivePreview, setShowInteractivePreview] = useState(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState('');
  const [previewWidth, setPreviewWidth] = useState(90); // 预览宽度
  const [previewHeight, setPreviewHeight] = useState(90); // 预览高度
  const [interactiveWidth, setInteractiveWidth] = useState(90); // 编辑中的宽度
  const [interactiveHeight, setInteractiveHeight] = useState(90); // 编辑中的高度
  const [currentPreviewToolId, setCurrentPreviewToolId] = useState<string | null>(null); // 当前预览的工具ID
  const [isResizing, setIsResizing] = useState(false); // 是否正在调整大小
  const [resizeCorner, setResizeCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null); // 拖动的角
  const resizeStateRef = React.useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    containerRect: DOMRect | null;
  }>({ startX: 0, startY: 0, startWidth: 0, startHeight: 0, containerRect: null });

  // AI生成HTML相关状态
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateBgColor, setGenerateBgColor] = useState('#FFFFFF');
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);

  const activeSlide = slides[activeSlideIndex];

  // 互动工具拖拽状态
  const [draggingToolId, setDraggingToolId] = useState<string | null>(null);
  const dragStateRef = React.useRef<{
    containerRect: DOMRect | null;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
  }>({ containerRect: null, offsetX: 0, offsetY: 0, startX: 0, startY: 0, hasMoved: false });

  // 幻灯片拖拽排序状态
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [dragOverSlideIndex, setDragOverSlideIndex] = useState<number | null>(null);

  // 全局拖拽事件监听
  useEffect(() => {
    if (!draggingToolId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.containerRect) return;

      e.preventDefault();

      const dx = Math.abs(e.clientX - dragStateRef.current.startX);
      const dy = Math.abs(e.clientY - dragStateRef.current.startY);

      // 移动超过5px才认为是拖拽
      if (dx > 5 || dy > 5) {
        dragStateRef.current.hasMoved = true;
      }

      const rect = dragStateRef.current.containerRect;
      const newX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100 - dragStateRef.current.offsetX));
      const newY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100 - dragStateRef.current.offsetY));

      if (draggingToolId === 'video-trigger') {
        // 更新视频触发按钮位置
        handleSlideUpdate({
          videoTriggerX: newX,
          videoTriggerY: newY
        });
      } else {
        // 更新互动工具位置
        handleUpdateInteractivePosition(draggingToolId, newX, newY);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();

      // 如果没有移动，则在页面中显示HTML内容（仅针对互动工具）
      if (!dragStateRef.current.hasMoved && draggingToolId !== 'video-trigger') {
        const tool = activeSlide.interactiveTools?.find(t => t.id === draggingToolId);
        if (tool) {
          setPreviewHtmlContent(tool.htmlContent);
          setPreviewWidth(tool.width || 90);
          setPreviewHeight(tool.height || 90);
          setCurrentPreviewToolId(tool.id);
          setShowInteractivePreview(true);
        }
      }

      setDraggingToolId(null);
      dragStateRef.current = { containerRect: null, offsetX: 0, offsetY: 0, startX: 0, startY: 0, hasMoved: false };
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingToolId, activeSlide?.interactiveTools]);

  // 调整预览弹窗大小的事件监听
  useEffect(() => {
    if (!isResizing || !resizeCorner) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      if (!resizeStateRef.current.containerRect) return;

      const rect = resizeStateRef.current.containerRect;
      const deltaX = e.clientX - resizeStateRef.current.startX;
      const deltaY = e.clientY - resizeStateRef.current.startY;

      // 计算新的宽度和高度百分比
      let newWidth = resizeStateRef.current.startWidth;
      let newHeight = resizeStateRef.current.startHeight;

      if (resizeCorner === 'br') {
        // 右下角：增加宽度和高度
        newWidth = resizeStateRef.current.startWidth + (deltaX / rect.width) * 200;
        newHeight = resizeStateRef.current.startHeight + (deltaY / rect.height) * 200;
      } else if (resizeCorner === 'bl') {
        // 左下角：减少宽度，增加高度
        newWidth = resizeStateRef.current.startWidth - (deltaX / rect.width) * 200;
        newHeight = resizeStateRef.current.startHeight + (deltaY / rect.height) * 200;
      } else if (resizeCorner === 'tr') {
        // 右上角：增加宽度，减少高度
        newWidth = resizeStateRef.current.startWidth + (deltaX / rect.width) * 200;
        newHeight = resizeStateRef.current.startHeight - (deltaY / rect.height) * 200;
      } else if (resizeCorner === 'tl') {
        // 左上角：减少宽度和高度
        newWidth = resizeStateRef.current.startWidth - (deltaX / rect.width) * 200;
        newHeight = resizeStateRef.current.startHeight - (deltaY / rect.height) * 200;
      }

      // 限制范围
      newWidth = Math.max(30, Math.min(100, newWidth));
      newHeight = Math.max(30, Math.min(100, newHeight));

      setPreviewWidth(newWidth);
      setPreviewHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeCorner(null);

      // 保存调整后的尺寸到工具配置
      if (currentPreviewToolId) {
        setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
          ...s,
          interactiveTools: (s.interactiveTools || []).map(tool =>
            tool.id === currentPreviewToolId
              ? { ...tool, width: previewWidth, height: previewHeight }
              : tool
          )
        } : s));
      }

      resizeStateRef.current = { startX: 0, startY: 0, startWidth: 0, startHeight: 0, containerRect: null };
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeCorner, previewWidth, previewHeight, currentPreviewToolId, activeSlideIndex]);

  // 互动工具图标组件
  const InteractiveToolIcon: React.FC<{
    tool: InteractiveTool;
  }> = ({ tool }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 找到容器元素
      let container = e.currentTarget.parentElement;
      while (container && !container.classList.contains('aspect-video')) {
        container = container.parentElement;
      }

      if (container) {
        const rect = container.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;

        dragStateRef.current = {
          containerRect: rect,
          offsetX: clickX - tool.x,
          offsetY: clickY - tool.y,
          startX: e.clientX,
          startY: e.clientY,
          hasMoved: false
        };

        setDraggingToolId(tool.id);
      }
    };

    const isDragging = draggingToolId === tool.id;

    return (
      <div
        className="absolute cursor-move select-none"
        style={{
          left: `${tool.x}%`,
          top: `${tool.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          zIndex: 40
        }}
        onMouseDown={handleMouseDown}
        title={`拖拽调整位置 | 点击预览互动工具 ${tool.label}`}
      >
        <div className={`w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white transition-all ${isDragging ? 'scale-125 shadow-xl' : 'hover:scale-110'
          }`}>
          {tool.label}
        </div>
      </div>
    );
  };

  // 视频触发按钮图标组件
  const VideoTriggerButtonIcon: React.FC<{
    slide: Slide;
  }> = ({ slide }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 找到容器元素
      let container = e.currentTarget.parentElement;
      while (container && !container.classList.contains('aspect-video')) {
        container = container.parentElement;
      }

      if (container) {
        const rect = container.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;

        const x = slide.videoTriggerX ?? 50;
        const y = slide.videoTriggerY ?? 50;

        dragStateRef.current = {
          containerRect: rect,
          offsetX: clickX - x,
          offsetY: clickY - y,
          startX: e.clientX,
          startY: e.clientY,
          hasMoved: false
        };

        setDraggingToolId('video-trigger');
      }
    };

    const isDragging = draggingToolId === 'video-trigger';
    const x = slide.videoTriggerX ?? 50;
    const y = slide.videoTriggerY ?? 50;

    return (
      <div
        className="absolute cursor-move select-none"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          zIndex: 40
        }}
        onMouseDown={handleMouseDown}
        title="拖拽调整位置 | 视频触发按钮"
      >
        <div className={`w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all ${isDragging ? 'scale-125 shadow-xl' : 'hover:scale-110'
          }`}>
          <Video className="w-8 h-8" />
        </div>
      </div>
    );
  };

  // 交互点组件
  const HotspotItem: React.FC<{
    hotspot: Annotation;
    index: number;
  }> = ({ hotspot, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    const IconComponent = {
      dot: Target,
      pin: MapPin,
      star: Star,
      thumbsUp: ThumbsUp,
      thumbsDown: ThumbsDown
    }[hotspot.style || 'dot'] || Target;

    const sizeScale = hotspot.iconSize || 1;

    return (
      <div
        key={index}
        className="hotspot-item group"
        style={{
          left: `${hotspot.x}%`,
          top: `${hotspot.y}%`,
          cursor: 'pointer'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* 图标主体 */}
        <div
          className={`relative ${hotspot.style === 'dot' ? 'dot-ripple' : 'animate-breathe'
            }`}
          style={{ transform: `scale(${sizeScale})` }}
        >
          <div
            className={`relative z-10 p-1 rounded-full shadow-lg transition-transform duration-300 ${isOpen ? 'scale-125' : ''
              }`}
            style={{
              color: hotspot.iconColor || hotspot.color,
              backgroundColor:
                hotspot.style === 'dot' ? 'transparent' : 'white'
            }}
          >
            {hotspot.style === 'dot' ? (
              <div className="w-4 h-4 rounded-full bg-current shadow-sm"></div>
            ) : (
              <IconComponent className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* 弹出气泡 */}
        <div
          className={`absolute left-full top-1/2 w-max max-w-xs bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-xl z-50 tooltip-content ${isOpen ? 'tooltip-visible' : 'tooltip-hidden'
            }`}
          style={{ marginLeft: `${12 * sizeScale}px` }}
        >
          <p
            style={{
              color: hotspot.textColor,
              fontSize: hotspot.fontSize
            }}
          >
            {hotspot.text}
          </p>
          {/* 左侧小三角 */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-black/80"></div>
        </div>
      </div>
    );
  };

  // 可用的通道列表
  const providers = [
    { value: 'TuZiAsync', label: '兔子异步' },
    { value: 'TuZi', label: '兔子' },
    { value: 'Chatgptten', label: '格谷' }
  ];

  // 兔子通道的模型列表
  const tuziModels = [
    // GPT系列
    // { value: 'gpt-image-1.5', label: 'GPT Image 1.5' },
    // { value: 'gpt-4o-image', label: 'GPT-4o Image' },
    // { value: 'gpt-4o-image-async', label: 'GPT-4o Image Async' },
    // { value: 'gpt-4o-image-vip', label: 'GPT-4o Image VIP' },
    // { value: 'gpt-4o-image-vip-async', label: 'GPT-4o Image VIP Async' },
    // Gemini 3 Pro系列
    // { value: 'gemini-3-pro-image-preview-2k-vip', label: 'Gemini 3 Pro 2K VIP' },
    // { value: 'gemini-3-pro-image-preview-4k-vip', label: 'Gemini 3 Pro 4K VIP' },
    // { value: 'gemini-3-pro-image-preview-vip', label: 'Gemini 3 Pro VIP' },
    // { value: 'gemini-3-pro-image-preview-hd', label: 'Gemini 3 Pro HD' },
    // { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },

    // Nano Banana系列
    { value: 'nano-banana-2-vip', label: 'Nano Banana 2 VIP ' },
    { value: 'nano-banana-2-2k', label: 'Nano Banana 2 2K' },
    { value: 'nano-banana-2-4k', label: 'Nano Banana 2 4K' },
    { value: 'nano-banana-2-hd', label: 'Nano Banana 2 HD' },
    { value: 'nano-banana-2', label: 'Nano Banana 2普通(默认)' },
    { value: 'gemini-3-pro-image-preview-2k', label: 'Gemini 3 Pro 2K' },
    { value: 'gemini-3.1-flash-image-preview', label: '新的banana 2' },
  ];

  // 兔子异步通道的模型列表
  const tuziAsyncModels = [
    { value: 'gemini-3-pro-image-preview-async', label: 'Gemini 3 Pro Async (默认)' },
    { value: 'gemini-3-pro-image-preview-2k-async', label: 'Gemini 3 Pro 2K Async' },
    { value: 'gemini-3-pro-image-preview-4k-async', label: 'Gemini 3 Pro 4K Async' }
  ];

  // 格谷通道的模型列表
  const geguModels = [
    // Nano Banana系列
    { value: 'nano-banana-2-2k-vip', label: 'Nano Banana 2 2K VIP' },
    { value: 'nano-banana-2-4k-vip', label: 'Nano Banana 2 4K VIP' },
    { value: 'nano-banana-2-hd', label: 'Nano Banana 2 HD' },
    { value: 'nano-banana-2-vip', label: 'Nano Banana 2 VIP' },
    // { value: 'nano-banana-pro_2k', label: 'Nano Banana Pro 2K' },
    // { value: 'nano-banana-pro_4k', label: 'Nano Banana Pro 4K' },

    // // Gemini 3 Pro系列
    // { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },
    // { value: 'gemini-3-pro-image-preview-2k', label: 'Gemini 3 Pro 2K' },
    // { value: 'gemini-3-pro-image-preview-2k-vip', label: 'Gemini 3 Pro 2K VIP' },
    // { value: 'gemini-3-pro-image-preview-4k', label: 'Gemini 3 Pro 4K' },
    // { value: 'gemini-3-pro-image-preview-4k-vip', label: 'Gemini 3 Pro 4K VIP' },
    // { value: 'gemini-3-pro-image-preview-hd', label: 'Gemini 3 Pro HD' },
    // { value: 'gemini-3-pro-image-preview-vip', label: 'Gemini 3 Pro VIP' }
  ];

  // 根据通道获取模型列表
  const getModelsForProvider = (providerValue: string) => {
    switch (providerValue) {
      case 'Chatgptten':
        return geguModels;
      case 'TuZiAsync':
        return tuziAsyncModels;
      case 'TuZi':
      default:
        return tuziModels;
    }
  };

  // 当前通道的模型列表
  const currentModels = getModelsForProvider(provider);

  // 当通道切换时，检查当前模型是否在新通道的模型列表中
  useEffect(() => {
    const models = getModelsForProvider(provider);
    const isModelAvailable = models.some(m => m.value === model);

    if (!isModelAvailable && models.length > 0) {
      // 如果当前模型不在新通道的列表中，选择第一个模型
      setModel(models[0].value);
    }
  }, [provider]);

  // Auto-scroll logic for the thumbnail list would go here in a full app

  const handleGenerateSingle = async (index: number, fromBatch: boolean = false) => {
    const slideToGen = slides[index];

    // Create AbortController for this generation
    const controller = new AbortController();
    setAbortControllers(prev => new Map(prev).set(index, controller));

    // Update status to generating
    updateSlideStatus(index, SlideStatus.GENERATING);
    if (!fromBatch) {
      setIsGeneratingImages(true);
    }

    try {
      const imageUrl = await generateSlideImage(slideToGen, settings.style, provider, model, 150000, controller);
      setSlides(prev => prev.map((s, i) => i === index ? {
        ...s,
        imageUrl,
        status: SlideStatus.COMPLETED
      } : s));
    } catch (e) {
      const error = e as Error;
      if (error.name === 'AbortError') {
        console.log(`图片生成已中止: 第${index + 1}页`);
        updateSlideStatus(index, SlideStatus.PENDING);
      } else {
        updateSlideStatus(index, SlideStatus.ERROR);
      }
    } finally {
      if (!fromBatch) {
        setIsGeneratingImages(false);
      }
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(index);
        return newMap;
      });
    }
  };

  // 中止图片生成
  const handleAbortGeneration = (index: number) => {
    const controller = abortControllers.get(index);
    if (controller) {
      controller.abort();
      console.log(`中止图片生成: 第${index + 1}页`);
    }
  };

  const handleGenerateAll = async () => {
    setIsGeneratingImages(true);

    // 收集需要生成的幻灯片索引
    const slidesToGenerate = slides
      .map((slide, index) => ({ slide, index }))
      .filter(({ slide }) => slide.status !== SlideStatus.COMPLETED)
      .map(({ index }) => index);

    if (slidesToGenerate.length === 0) {
      alert('所有图片已生成完成！');
      setIsGeneratingImages(false);
      return;
    }

    console.log(`📊 开始批量生成 ${slidesToGenerate.length} 张图片`);

    // 并发生成，每次最多5张
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(slidesToGenerate.length / BATCH_SIZE);
    let currentBatch = 1;

    for (let i = 0; i < slidesToGenerate.length; i += BATCH_SIZE) {
      const batch = slidesToGenerate.slice(i, i + BATCH_SIZE);

      console.log(`🚀 批次 ${currentBatch}/${totalBatches}: 并发生成第 ${batch.map(idx => idx + 1).join(', ')} 页 (共 ${batch.length} 张)`);

      // 并发生成当前批次
      const startTime = Date.now();
      await Promise.all(batch.map(index => handleGenerateSingle(index, true)));
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`✅ 批次 ${currentBatch}/${totalBatches} 完成，耗时 ${elapsed} 秒`);
      currentBatch++;
    }

    console.log(`🎉 全部生成完成！共生成 ${slidesToGenerate.length} 张图片`);
    setIsGeneratingImages(false);

    // 自动保存：如果是编辑模式且是自己的课件，自动保存
    const currentUserId = globalConfig.get('userid');
    const isMyCourseware = currentCoursewareData && currentCoursewareData.creatorId === currentUserId;

    if (editMode === 'edit' && currentCoursewareId && isMyCourseware) {
      console.log('📝 自动保存课件...');
      try {
        await handleUpdateCourseware();
        console.log('✅ 自动保存成功');
      } catch (error) {
        console.error('❌ 自动保存失败:', error);
        // 不阻断用户操作，只记录错误
      }
    } else {
      console.log('📝 新建课件，弹出分类选择弹窗进行保存...');
      setShowCategoryModal(true);
    }
  };

  // 保存图片到阿里云
  const handleSaveToAliyun = async (index: number) => {
    const slide = slides[index];

    if (!slide.imageUrl) {
      alert('该幻灯片没有图片');
      return;
    }

    // 如果已经是阿里云地址，不需要重复上传
    if (slide.imageUrl.startsWith('https://s.mamale.vip')) {
      alert('该图片已经保存在阿里云');
      return;
    }

    try {
      console.log(`📤 开始上传第 ${index + 1} 页图片到阿里云...`);

      // 1. 从URL获取图片数据
      const response = await fetch(slide.imageUrl);
      if (!response.ok) {
        throw new Error('获取图片失败');
      }

      const blob = await response.blob();
      console.log('图片大小:', (blob.size / 1024).toFixed(2), 'KB');

      // 2. 上传到阿里云
      const newImageUrl = await uploadImage(blob);
      console.log('✅ 上传成功，新地址:', newImageUrl);

      // 3. 更新幻灯片的图片地址
      const updatedSlides = slides.map((s, i) =>
        i === index ? { ...s, imageUrl: newImageUrl } : s
      );
      setSlides(updatedSlides);

      alert(`第 ${index + 1} 页图片已保存到阿里云`);

      // 4. 自动保存课件到云端（如果是编辑模式且是自己的课件）
      const currentUserId = globalConfig.get('userid');
      const isMyCourseware = currentCoursewareData && currentCoursewareData.creatorId === currentUserId;

      if (editMode === 'edit' && currentCoursewareId && isMyCourseware) {
        console.log('📝 自动保存课件到云端...');
        try {
          // 使用更新后的 slides 数据进行保存
          await saveUpdatedCourseware(updatedSlides);
          console.log('✅ 课件自动保存成功');
        } catch (saveError) {
          console.error('❌ 课件自动保存失败:', saveError);
          // 不阻断用户操作，只记录错误
        }
      } else {
        console.log('ℹ️ 非编辑模式或非本人课件，跳过自动保存');
      }

    } catch (error) {
      console.error('上传到阿里云失败:', error);
      alert('保存到阿里云失败: ' + (error as Error).message);
    }
  };

  // 使用指定的 slides 数据保存课件
  const saveUpdatedCourseware = async (updatedSlides: Slide[]) => {
    try {
      // 1. 检查是否有第一张图片
      const firstSlideWithImage = updatedSlides.find(s => s.imageUrl);
      if (!firstSlideWithImage || !firstSlideWithImage.imageUrl) {
        throw new Error("没有找到图片，无法保存");
      }

      // 2. 创建导出数据
      const exportData = {
        metadata: {
          title: settings.title,
          author: settings.author,
          createdAt: new Date().toISOString(),
          version: '1.0'
        },
        settings: {
          aspectRatio: settings.aspectRatio,
          theme: settings.theme,
          enableVoice: settings.enableVoice,
          voiceSettings: settings.voiceSettings,
          enableVideo: settings.enableVideo,
          videoSettings: settings.videoSettings
        },
        slides: updatedSlides.map(slide => ({
          id: slide.id,
          pageNumber: slide.pageNumber,
          title: slide.title,
          content: slide.content,
          imageUrl: slide.imageUrl,
          imagePrompt: slide.imagePrompt,
          voiceScript: slide.voiceScript,
          voiceUrl: slide.voiceUrl,
          status: slide.status,
          annotations: slide.annotations || [],
          interactiveTools: slide.interactiveTools || []
        }))
      };

      // 3. 上传JSON文件
      const pptDataUrl = await uploadJSONFile(exportData, "演示文稿.json");

      // 4. 调用更新课件API
      await updateCourseware(currentCoursewareId!, {
        title: settings.title,
        coverImage: firstSlideWithImage.imageUrl,
        pptDataUrl: pptDataUrl,
        slideCount: updatedSlides.length
      });

    } catch (error) {
      console.error('保存课件失败:', error);
      throw error;
    }
  };

  const updateSlideStatus = (index: number, status: SlideStatus) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
  };

  // 绘图工具相关函数 - 使用百分比坐标
  const getCoordinates = (e: React.MouseEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    // 计算相对位置的百分比
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handleDrawingMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'none' || !activeSlide) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const slideId = activeSlide.id;

    // 交互点：直接添加到annotations，不走绘制流程
    if (activeTool === 'hotspot') {
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      const newHotspot: Annotation = {
        type: 'hotspot',
        x: xPercent,
        y: yPercent,
        color: brushColor,
        ...hotspotConfig
      };
      setAnnotations(prev => ({
        ...prev,
        [slideId]: [...(prev[slideId] || []), newHotspot]
      }));
      return;
    }

    // 绘图工具
    const { x, y } = getCoordinates(e, e.currentTarget);

    if (activeTool === 'pen') {
      setCurrentDrawing({ type: 'pen', color: brushColor, points: [{ x, y }] });
    } else if (activeTool === 'arrow') {
      setCurrentDrawing({ type: 'arrow', color: brushColor, start: { x, y }, end: { x, y } });
    } else if (activeTool === 'rect') {
      setCurrentDrawing({ type: 'rect', color: brushColor, start: { x, y }, end: { x, y } });
    }
  };

  const handleDrawingMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!currentDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e, e.currentTarget);

    if (currentDrawing.type === 'pen') {
      setCurrentDrawing(prev => ({
        ...prev!,
        points: [...(prev!.points || []), { x, y }]
      }));
    } else {
      setCurrentDrawing(prev => ({
        ...prev!,
        end: { x, y }
      }));
    }
  };

  const handleDrawingMouseUp = () => {
    if (!currentDrawing || !activeSlide) return;

    const slideId = activeSlide.id;
    setAnnotations(prev => ({
      ...prev,
      [slideId]: [...(prev[slideId] || []), currentDrawing]
    }));
    setCurrentDrawing(null);
  };

  const undoAnnotation = () => {
    if (!activeSlide) return;
    const slideId = activeSlide.id;
    setAnnotations(prev => {
      const currentList = prev[slideId] || [];
      if (currentList.length === 0) return prev;
      return {
        ...prev,
        [slideId]: currentList.slice(0, -1)
      };
    });
  };

  const clearAnnotations = () => {
    if (!activeSlide) return;
    const slideId = activeSlide.id;
    setAnnotations(prev => ({
      ...prev,
      [slideId]: []
    }));
    setActiveTool('none');
  };

  // 颜色选择
  const colors = [
    { name: '白', value: '#FFFFFF' },
    { name: '黄', value: '#FACC15' },
    { name: '红', value: '#EF4444' },
    { name: '蓝', value: '#3B82F6' },
    { name: '绿', value: '#22C55E' },
    { name: '黑', value: '#000000' }
  ];

  // 交互点样式列表
  const hotspotStyles = [
    { id: 'dot' as const, name: '呼吸圆点', icon: Target },
    { id: 'pin' as const, name: '定位图标', icon: MapPin },
    { id: 'star' as const, name: '五角星', icon: Star },
    { id: 'thumbsUp' as const, name: '点赞', icon: ThumbsUp },
    { id: 'thumbsDown' as const, name: '踩', icon: ThumbsDown }
  ];

  const updateActiveSlideContent = (field: keyof Slide, value: string) => {
    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? { ...s, [field]: value } : s));
  };

  // 处理语音文稿变化
  const handleVoiceScriptChange = (newScript: string) => {
    setSlides(prev => prev.map((s, i) =>
      i === activeSlideIndex ? { ...s, voiceScript: newScript } : s
    ));
  };

  // 处理语音生成完成
  const handleVoiceGenerated = (voiceUrl: string) => {
    setSlides(prev => prev.map((s, i) =>
      i === activeSlideIndex ? { ...s, voiceUrl } : s
    ));
  };

  // 处理编辑后重新生成
  const handleRegenerateWithEdit = async (uploadedImageUrl: string, prompt: string) => {
    if (editingSlideIndex === null) return;

    const slideToRegenerate = slides[editingSlideIndex];
    updateSlideStatus(editingSlideIndex, SlideStatus.GENERATING);
    setIsGeneratingImages(true);

    try {
      const newImageUrl = await regenerateSlideImageWithEdit(
        slideToRegenerate,
        settings.style,
        provider,
        model,
        uploadedImageUrl,
        prompt,
        150000  // 150秒超时
      );
      setSlides(prev => prev.map((s, i) => i === editingSlideIndex ? {
        ...s,
        imageUrl: newImageUrl,
        status: SlideStatus.COMPLETED
      } : s));
    } catch (e) {
      updateSlideStatus(editingSlideIndex, SlideStatus.ERROR);
      throw e;
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generatePDF(slides, "演示文稿.pdf");
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("导出PDF失败，请重试");
    }
  };

  const handleDownloadPPTX = async () => {
    try {
      await generatePPTX(slides, "演示文稿.pptx");
    } catch (error) {
      console.error("PPTX export failed:", error);
      alert("导出PPTX失败，请重试");
    }
  };

  const handleDownloadJSON = () => {
    exportToJSON(slides, "演示文稿.json", settings);
  };

  // 打开保存到云端的分类选择弹窗
  const handleSaveToCloud = async () => {
    // 判断是否是自己的课件
    const currentUserId = globalConfig.get('userid');
    const isMyCourseware = currentCoursewareData && currentCoursewareData.creatorId === currentUserId;

    // 如果是编辑模式且是自己的课件，直接更新
    if (editMode === 'edit' && currentCoursewareId && isMyCourseware) {
      await handleUpdateCourseware();
    } else {
      // 否则另存为新课件（包括：新建模式、查看模式、或编辑别人的课件）
      setShowCategoryModal(true);
    }
  };

  // 更新课件（编辑模式）
  const handleUpdateCourseware = async () => {
    setIsSavingToCloud(true);

    try {
      // 1. 检查是否有第一张图片
      const firstSlideWithImage = slides.find(s => s.imageUrl);
      if (!firstSlideWithImage || !firstSlideWithImage.imageUrl) {
        alert("错误：没有找到图片，无法保存。请至少为一张幻灯片生成图片。");
        setIsSavingToCloud(false);
        return;
      }

      // 2. 创建导出数据
      const exportData = {
        metadata: {
          title: currentCoursewareData.name || slides[0]?.title || "演示文稿",
          exportDate: new Date().toISOString(),
          version: "3.0", // 更新版本号，包含互动工具功能
          slideCount: slides.length,
          hasVoice: slides.some(s => s.voiceScript || s.voiceUrl),
          hasVideo: slides.some(s => s.videoUrl),
          hasInteractiveTools: slides.some(s => s.interactiveTools && s.interactiveTools.length > 0),
        },
        settings: {
          targetPageCount: settings.targetPageCount,
          style: settings.style,
          focus: settings.focus,
          customStyleName: settings.customStyleName,
          customStylePrompt: settings.customStylePrompt,
          enableVoice: settings.enableVoice,
        },
        slides: slides.map(slide => ({
          id: slide.id,
          pageNumber: slide.pageNumber,
          title: slide.title,
          content: slide.content,
          visualPrompt: slide.visualPrompt,
          imageUrl: slide.imageUrl,
          status: slide.status,
          voiceScript: slide.voiceScript,
          voiceUrl: slide.voiceUrl,
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

      // 3. 上传JSON文件
      console.log('正在上传JSON文件...');
      const pptDataUrl = await uploadJSONFile(exportData, "演示文稿.json");
      console.log('JSON文件上传成功:', pptDataUrl);

      // 4. 调用更新课件API
      console.log('正在更新课件...');
      await updateCourseware(currentCoursewareId!, {
        id: currentCoursewareId!,
        aiApplicationCategoryId: currentCoursewareData.aiApplicationCategoryId,
        name: currentCoursewareData.name,
        converImg: firstSlideWithImage.imageUrl,
        pptData: pptDataUrl,
        isShare: true
      });

      alert(`成功更新课件！`);

    } catch (error) {
      console.error('更新课件失败:', error);
      alert('更新课件失败: ' + (error as Error).message);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // 确认保存到云端（新建或查看模式）
  const handleConfirmSaveToCloud = async (categoryId: string, categoryName: string) => {
    setIsSavingToCloud(true);

    try {
      // 1. 检查是否有第一张图片
      const firstSlideWithImage = slides.find(s => s.imageUrl);
      if (!firstSlideWithImage || !firstSlideWithImage.imageUrl) {
        alert("错误：没有找到图片，无法保存到云端。请至少为一张幻灯片生成图片。");
        setIsSavingToCloud(false);
        return;
      }

      // 2. 创建导出数据（与本地导出格式一致）
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
        settings: {
          targetPageCount: settings.targetPageCount,
          style: settings.style,
          focus: settings.focus,
          customStyleName: settings.customStyleName,
          customStylePrompt: settings.customStylePrompt,
          enableVoice: settings.enableVoice,
        },
        slides: slides.map(slide => ({
          id: slide.id,
          pageNumber: slide.pageNumber,
          title: slide.title,
          content: slide.content,
          visualPrompt: slide.visualPrompt,
          imageUrl: slide.imageUrl,
          status: slide.status,
          voiceScript: slide.voiceScript,
          voiceUrl: slide.voiceUrl,
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

      // 3. 上传JSON文件
      console.log('正在上传JSON文件...');
      const pptDataUrl = await uploadJSONFile(exportData, "演示文稿.json");
      console.log('JSON文件上传成功:', pptDataUrl);

      // 4. 获取标题（从第一张幻灯片或metadata）
      const presentationTitle = slides[0]?.title || exportData.metadata.title;

      // 5. 调用保存到云端API
      console.log('正在保存到云端...');
      await saveToCloud({
        aiApplicationCategoryId: categoryId,
        name: presentationTitle,
        converImg: firstSlideWithImage.imageUrl,
        pptData: pptDataUrl,
        isShare: true
      });

      alert(`成功保存到云端！\n分类: ${categoryName}\n标题: ${presentationTitle}`);
      setShowCategoryModal(false);

    } catch (error) {
      console.error('保存到云端失败:', error);
      alert('保存到云端失败: ' + (error as Error).message);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleLoadJSON = () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const importedData = await importFromJSON(file);
        setSlides(importedData.slides);
        setActiveSlideIndex(0);

        // 显示详细的加载信息
        const voiceCount = importedData.slides.filter(s => s.voiceScript || s.voiceUrl).length;
        const imageCount = importedData.slides.filter(s => s.imageUrl).length;
        const videoCount = importedData.slides.filter(s => s.videoUrl).length;

        alert(
          `成功加载 ${importedData.slides.length} 页幻灯片\n` +
          `包含图片: ${imageCount} 页\n` +
          `包含视频: ${videoCount} 页\n` +
          `包含语音: ${voiceCount} 页\n` +
          `文件版本: ${importedData.metadata?.version || '未知'}`
        );
      } catch (error) {
        console.error("Import failed:", error);
        alert("加载文件失败: " + (error as Error).message);
      }
    };

    input.click();
  };

  // 语音生成函数
  const handleGenerateVoice = async (slideId: string, script: string): Promise<string> => {
    try {
      // 调用火山引擎TTS API，传递音色类型
      const audioUrl = await generateVoice(script, 'mp3', settings.voiceType);
      return audioUrl;
    } catch (error) {
      console.error('语音生成失败:', error);
      throw error;
    }
  };

  // 全部生成语音函数
  const handleGenerateAllVoices = async () => {
    setIsGeneratingVoices(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // 顺序处理每个有语音文稿的幻灯片
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];

        // 只处理有语音文稿且未生成语音的幻灯片
        if (slide.voiceScript && slide.voiceScript.trim() && !slide.voiceUrl) {
          try {
            const voiceUrl = await handleGenerateVoice(slide.id, slide.voiceScript);
            setSlides(prev => prev.map(s =>
              s.id === slide.id ? { ...s, voiceUrl } : s
            ));
            successCount++;
          } catch (error) {
            console.error(`幻灯片 ${slide.pageNumber} 语音生成失败:`, error);
            failCount++;
          }
        }
      }

      // 显示结果
      if (successCount > 0 || failCount > 0) {
        alert(`语音生成完成！\n成功: ${successCount} 页\n失败: ${failCount} 页`);
      } else {
        alert('没有需要生成语音的幻灯片（请确保已填写语音文稿）');
      }
    } catch (error) {
      console.error('批量生成语音失败:', error);
      alert('批量生成语音失败，请重试');
    } finally {
      setIsGeneratingVoices(false);
    }
  };

  // 删除幻灯片
  const handleDeleteSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发选中事件

    if (slides.length <= 1) {
      alert('至少需要保留一页幻灯片');
      return;
    }

    if (confirm(`确定要删除第 ${slides[index].pageNumber} 页吗？`)) {
      // 删除幻灯片
      const newSlides = slides.filter((_, i) => i !== index);

      // 重新计算页码
      const updatedSlides = newSlides.map((slide, i) => ({
        ...slide,
        pageNumber: i + 1
      }));

      setSlides(updatedSlides);

      // 调整当前选中的索引
      if (activeSlideIndex >= updatedSlides.length) {
        setActiveSlideIndex(updatedSlides.length - 1);
      } else if (activeSlideIndex >= index) {
        setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
      }
    }
  };

  // 添加新幻灯片
  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}-${Math.random()}`,
      pageNumber: slides.length + 1,
      title: '新页面',
      content: '在此输入页面内容...',
      visualPrompt: '一个简洁的PPT页面设计',
      status: SlideStatus.PENDING,
      voiceScript: settings.enableVoice ? '' : undefined
    };

    setSlides(prev => [...prev, newSlide]);
    setActiveSlideIndex(slides.length); // 跳转到新添加的页面
  };

  // 幻灯片拖拽排序处理函数
  const handleSlideDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSlideIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // 设置拖拽时的视觉效果
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleSlideDragEnd = (e: React.DragEvent) => {
    // 恢复透明度
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedSlideIndex(null);
    setDragOverSlideIndex(null);
  };

  const handleSlideDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedSlideIndex === null || draggedSlideIndex === index) {
      return;
    }

    setDragOverSlideIndex(index);
  };

  const handleSlideDragLeave = () => {
    setDragOverSlideIndex(null);
  };

  const handleSlideDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedSlideIndex === null || draggedSlideIndex === dropIndex) {
      return;
    }

    // 重新排序幻灯片
    const newSlides = [...slides];
    const [draggedSlide] = newSlides.splice(draggedSlideIndex, 1);
    newSlides.splice(dropIndex, 0, draggedSlide);

    // 更新页码
    const updatedSlides = newSlides.map((slide, index) => ({
      ...slide,
      pageNumber: index + 1
    }));

    setSlides(updatedSlides);

    // 更新当前选中的索引
    if (activeSlideIndex === draggedSlideIndex) {
      setActiveSlideIndex(dropIndex);
    } else if (activeSlideIndex > draggedSlideIndex && activeSlideIndex <= dropIndex) {
      setActiveSlideIndex(activeSlideIndex - 1);
    } else if (activeSlideIndex < draggedSlideIndex && activeSlideIndex >= dropIndex) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }

    setDraggedSlideIndex(null);
    setDragOverSlideIndex(null);
  };

  // 上传图片
  const handleUploadImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      // 验证文件大小（限制10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('图片文件不能超过10MB');
        return;
      }

      try {
        // 导入uploadImage服务
        const { uploadImage } = await import('../services/uploadService');

        console.log('开始上传图片...');
        updateSlideStatus(activeSlideIndex, SlideStatus.GENERATING);

        // 上传图片到服务器
        const imageUrl = await uploadImage(file);

        console.log('图片上传成功:', imageUrl);

        // 更新当前幻灯片的图片URL
        setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
          ...s,
          imageUrl,
          status: SlideStatus.COMPLETED
        } : s));

        alert('图片上传成功！');
      } catch (error) {
        console.error('图片上传失败:', error);
        alert('图片上传失败: ' + (error as Error).message);
        updateSlideStatus(activeSlideIndex, SlideStatus.ERROR);
      }
    };

    input.click();
  };

  // 上传视频（用于空白页面）
  const handleUploadVideo = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 验证文件类型
      if (!file.type.startsWith('video/')) {
        alert('请选择视频文件');
        return;
      }

      // 验证文件大小（限制10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('视频文件不能超过 10MB，如需插入大视频请导出为 PPTX 后在本地编辑');
        return;
      }

      try {
        console.log('开始上传视频...');
        updateSlideStatus(activeSlideIndex, SlideStatus.GENERATING);

        // 上传视频到服务器
        const videoUrl = await uploadVideo(file);

        console.log('视频上传成功:', videoUrl);

        // 更新当前幻灯片的视频URL
        setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
          ...s,
          videoUrl,
          status: SlideStatus.COMPLETED
        } : s));

        alert('视频上传成功！');
      } catch (error) {
        console.error('视频上传失败:', error);
        alert('视频上传失败: ' + (error as Error).message);
        updateSlideStatus(activeSlideIndex, SlideStatus.ERROR);
      }
    };

    input.click();
  };

  // 上传视频（用于VideoSettings组件）
  const handleVideoUploadFromSettings = async (file: File) => {
    console.log('开始上传视频...');
    updateSlideStatus(activeSlideIndex, SlideStatus.GENERATING);

    // 上传视频到服务器
    const videoUrl = await uploadVideo(file);

    console.log('视频上传成功:', videoUrl);

    // 更新当前幻灯片的视频URL
    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
      ...s,
      videoUrl,
      status: SlideStatus.COMPLETED
    } : s));
  };

  // 删除视频
  const handleVideoDelete = () => {
    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
      ...s,
      videoUrl: undefined
    } : s));

    console.log('视频已删除');
  };

  // 视频生成完成
  const handleVideoGenerated = (videoUrl: string) => {
    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
      ...s,
      videoUrl,
      status: SlideStatus.COMPLETED
    } : s));

    console.log('视频生成完成:', videoUrl);
  };

  // 更新幻灯片设置
  const handleSlideUpdate = (updates: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
      ...s,
      ...updates
    } : s));

    console.log('幻灯片设置已更新:', updates);
  };

  // 添加互动工具
  const handleAddInteractiveTool = () => {
    if (!interactiveHtmlInput.trim()) {
      alert('请输入HTML内容');
      return;
    }

    if (!activeSlide) return;

    const currentTools = activeSlide.interactiveTools || [];
    const newTool = {
      id: `interactive-${Date.now()}-${Math.random()}`,
      label: currentTools.length + 1,
      htmlContent: interactiveHtmlInput,
      x: 50, // 默认中心位置
      y: 50,
      width: interactiveWidth,
      height: interactiveHeight
    };

    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
      ...s,
      interactiveTools: [...currentTools, newTool]
    } : s));

    setInteractiveHtmlInput('');
    setInteractiveWidth(90);
    setInteractiveHeight(90);
    setShowInteractiveModal(false);
  };

  // 删除互动工具
  const handleDeleteInteractiveTool = (toolId: string) => {
    if (!confirm('确定要删除这个互动工具吗？') || !activeSlide) return;

    const currentTools = activeSlide.interactiveTools || [];
    const newTools = currentTools
      .filter(t => t.id !== toolId)
      .map((tool, index) => ({ ...tool, label: index + 1 })); // 重新排序标签

    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
      ...s,
      interactiveTools: newTools
    } : s));
  };

  // 编辑互动工具 - 直接展开编辑区域
  const handleEditInteractiveTool = (toolId: string) => {
    if (!activeSlide) return;
    const tool = (activeSlide.interactiveTools || []).find(t => t.id === toolId);
    if (tool) {
      setInteractiveHtmlInput(tool.htmlContent);
      setInteractiveWidth(tool.width || 90);
      setInteractiveHeight(tool.height || 90);
      setEditingInteractiveId(toolId);
    }
  };

  // 保存编辑的互动工具
  const handleSaveEditedInteractiveTool = () => {
    if (!interactiveHtmlInput.trim() || !editingInteractiveId) return;

    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
      ...s,
      interactiveTools: (s.interactiveTools || []).map(tool =>
        tool.id === editingInteractiveId
          ? { ...tool, htmlContent: interactiveHtmlInput, width: interactiveWidth, height: interactiveHeight }
          : tool
      )
    } : s));

    setInteractiveHtmlInput('');
    setInteractiveWidth(90);
    setInteractiveHeight(90);
    setEditingInteractiveId(null);
  };

  // 取消编辑互动工具
  const handleCancelEditInteractiveTool = () => {
    setInteractiveHtmlInput('');
    setInteractiveWidth(90);
    setInteractiveHeight(90);
    setEditingInteractiveId(null);
  };

  // 更新互动工具位置
  const handleUpdateInteractivePosition = (toolId: string, x: number, y: number) => {
    setSlides(prev => prev.map((s, i) => i === activeSlideIndex ? {
      ...s,
      interactiveTools: (s.interactiveTools || []).map(tool =>
        tool.id === toolId ? { ...tool, x, y } : tool
      )
    } : s));
  };

  // AI生成HTML
  const handleGenerateHtml = async () => {
    if (!generatePrompt.trim()) {
      alert('请输入提示词');
      return;
    }

    setIsGeneratingHtml(true);

    try {
      // 导入 OpenAI
      const OpenAI = (await import('openai')).default;

      // 初始化 OpenAI 客户端
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: process.env.OPENAI_BASE_URL || 'https://dalu.chatgptten.com/v1',
        dangerouslyAllowBrowser: true
      });

      // 构建完整提示词
      const fullPrompt = `${generatePrompt}\n\n背景颜色：${generateBgColor}\n\n请只返回HTML格式，不要包含任何解释文字。HTML应该是完整的，包含必要的样式。`;

      // 调用 API
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的前端开发工程师，擅长编写简洁、美观的HTML代码。'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.7,
      });

      const htmlContent = response.choices[0]?.message?.content;

      if (!htmlContent) {
        throw new Error('AI 未返回有效响应');
      }

      // 提取HTML代码（去除markdown代码块标记）
      let extractedHtml = htmlContent;
      const htmlMatch = htmlContent.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch) {
        extractedHtml = htmlMatch[1];
      } else {
        // 如果没有html标记，尝试匹配普通代码块
        const codeMatch = htmlContent.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          extractedHtml = codeMatch[1];
        }
      }

      // 设置生成的HTML到输入框
      setInteractiveHtmlInput(extractedHtml.trim());

      // 关闭生成对话框
      setShowGenerateDialog(false);
      setGeneratePrompt('');
      setGenerateBgColor('#FFFFFF');

      alert('HTML生成成功！');
    } catch (error) {
      console.error('生成HTML失败:', error);
      alert('生成HTML失败: ' + (error as Error).message);
    } finally {
      setIsGeneratingHtml(false);
    }
  };

  // 如果没有幻灯片，显示空状态
  if (!activeSlide) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">没有可用的幻灯片</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* Sidebar: Thumbnail Strip - 仅编辑模式显示 */}
      {viewMode === 'edit' && (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full z-10">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-700">幻灯片概览</h3>
            <p className="text-xs text-slate-500">已生成 {slides.filter(s => s.status === SlideStatus.COMPLETED).length} / {slides.length} 页</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable={viewMode === 'edit'}
                onDragStart={(e) => handleSlideDragStart(e, index)}
                onDragEnd={handleSlideDragEnd}
                onDragOver={(e) => handleSlideDragOver(e, index)}
                onDragLeave={handleSlideDragLeave}
                onDrop={(e) => handleSlideDrop(e, index)}
                className={`cursor-pointer rounded-lg border-2 p-2 transition-all relative group ${activeSlideIndex === index
                    ? 'border-blue-500 bg-blue-50'
                    : dragOverSlideIndex === index
                      ? 'border-green-500 bg-green-50'
                      : 'border-transparent hover:bg-slate-50'
                  } ${viewMode === 'edit' ? 'cursor-move' : ''}`}
              >
                {/* 拖拽图标 - 仅编辑模式显示 */}
                {viewMode === 'edit' && (
                  <div
                    className="absolute top-1 left-1 w-5 h-5 rounded bg-slate-400 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 cursor-move"
                    title="拖拽排序"
                  >
                    <GripVertical className="w-3 h-3" />
                  </div>
                )}

                {/* 删除按钮 - 仅编辑模式显示 */}
                {viewMode === 'edit' && (
                  <button
                    onClick={(e) => handleDeleteSlide(index, e)}
                    className="absolute top-1 right-1 w-5 h-5 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10"
                    title="删除此页"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                <div onClick={() => setActiveSlideIndex(index)}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500">第 {slide.pageNumber} 页</span>

                      {/* 图片状态 - 圆点 */}
                      <span className={`w-2 h-2 rounded-full ${slide.status === SlideStatus.COMPLETED ? 'bg-green-500' :
                          slide.status === SlideStatus.GENERATING ? 'bg-yellow-400 animate-pulse' :
                            slide.status === SlideStatus.ERROR ? 'bg-red-500' : 'bg-slate-300'
                        }`} title={
                          slide.status === SlideStatus.COMPLETED ? '图片已生成' :
                            slide.status === SlideStatus.GENERATING ? '图片生成中' :
                              slide.status === SlideStatus.ERROR ? '图片生成失败' : '图片待生成'
                        } />

                      {/* 语音状态 - 方框（仅在启用语音时显示） */}
                      {settings.enableVoice && (
                        <span className={`w-2 h-2 ${slide.voiceUrl ? 'bg-green-500' : 'bg-slate-300'
                          }`} title={
                            slide.voiceUrl ? '语音已生成' :
                              slide.voiceScript ? '语音待生成' : '语音未配置'
                          } />
                      )}
                    </div>
                  </div>
                  <div className="aspect-video bg-slate-200 rounded overflow-hidden relative border border-slate-200">
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-1 px-2">
                        {slide.title}
                      </div>
                    )}
                  </div>
                </div>

                {/* 保存到阿里云按钮 - 仅编辑模式且图片地址不是 https://s.mamale.vip 开头时显示 */}
                {viewMode === 'edit' && slide.imageUrl && !slide.imageUrl.startsWith('https://s.mamale.vip') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveToAliyun(index);
                    }}
                    className="mt-1 w-full py-1 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600 transition-colors"
                    title="将图片保存到阿里云"
                  >
                    保存到阿里云
                  </button>
                )}
              </div>
            ))}
          </div>
          {viewMode === 'edit' && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
              {/* 添加新页面按钮 */}
              <button
                onClick={handleAddSlide}
                className="w-full py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加页面
              </button>

              <button
                onClick={handleGenerateAll}
                disabled={isGeneratingImages}
                className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-slate-400"
              >
                {isGeneratingImages ? '正在生成...' : '全部生成图片'}
              </button>

              {/* 如果启用了语音合成，显示全部生成语音按钮 */}
              {settings.enableVoice && (
                <button
                  onClick={handleGenerateAllVoices}
                  disabled={isGeneratingVoices}
                  className="w-full py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-slate-400 flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  {isGeneratingVoices ? '正在生成...' : '全部生成语音'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Stage */}
      <div className="flex-1 flex flex-col h-full relative">

        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-50 relative">
          {/* 左侧按钮组 */}
          <div className="flex items-center gap-3">
            {/* 文件 */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800">
                  <Download className="w-4 h-4" />
                  文件
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              }
              items={[
                {
                  label: (() => {
                    const currentUserId = globalConfig.get('userid');
                    const isMyCourseware = currentCoursewareData && currentCoursewareData.creatorId === currentUserId;
                    if (editMode === 'edit' && currentCoursewareId && isMyCourseware) {
                      return "保存到云端";
                    } else {
                      return "另存为新课件";
                    }
                  })(),
                  icon: <Cloud className="w-4 h-4" />,
                  onClick: handleSaveToCloud,
                },
                {
                  label: "导出为 PDF",
                  icon: <FileText className="w-4 h-4" />,
                  onClick: handleDownloadPDF,
                },
                {
                  label: "导出为 PPTX",
                  icon: <Presentation className="w-4 h-4" />,
                  onClick: handleDownloadPPTX,
                },
                {
                  label: "保存到本地",
                  icon: <FileJson className="w-4 h-4" />,
                  onClick: handleDownloadJSON,
                },
                {
                  label: "加载本地文件",
                  icon: <Upload className="w-4 h-4" />,
                  onClick: handleLoadJSON,
                },
              ]}
            />

            {/* 播放方式 */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                  <Play className="w-4 h-4" />
                  播放方式
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              }
              items={[
                {
                  label: "全屏播放",
                  icon: <Maximize2 className="w-4 h-4" />,
                  onClick: () => {
                    setActiveSlideIndex(0);
                    setAutoPlayVoice(false);
                    setEnableScreenRecording(false);
                    setIsFullscreen(true);
                  },
                },
                {
                  label: "当页播放",
                  icon: <Monitor className="w-4 h-4" />,
                  onClick: () => {
                    setAutoPlayVoice(false);
                    setEnableScreenRecording(false);
                    setIsFullscreen(true);
                  },
                },
                {
                  label: "自动语音播放",
                  icon: <Volume2 className="w-4 h-4" />,
                  onClick: () => {
                    setActiveSlideIndex(0);
                    setAutoPlayVoice(true);
                    setEnableScreenRecording(false);
                    setIsFullscreen(true);
                  },
                },
                {
                  label: "自动语音播放并录屏",
                  icon: <Video className="w-4 h-4" />,
                  onClick: async () => {
                    // 先请求屏幕共享权限（必须在用户手势中调用）
                    const stream = await requestDisplayStream();
                    displayStreamRef.current = stream; // stream 可能为 null（用户取消）
                    setActiveSlideIndex(0);
                    setAutoPlayVoice(true);
                    setEnableScreenRecording(true);
                    setIsFullscreen(true);
                  },
                },
              ]}
            />

            {/* 翻页方式 */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors">
                  <Sparkles className="w-4 h-4" />
                  翻页方式
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              }
              items={[
                {
                  label: "淡入淡出",
                  icon: <Sparkles className="w-4 h-4" />,
                  onClick: () => setTransitionEffect('fade'),
                },
                {
                  label: "向上推入",
                  icon: <ChevronDown className="w-4 h-4 rotate-180" />,
                  onClick: () => setTransitionEffect('slideUp'),
                },
                {
                  label: "向左推入",
                  icon: <ChevronRight className="w-4 h-4 rotate-180" />,
                  onClick: () => setTransitionEffect('slideLeft'),
                },
                {
                  label: "拟真翻页",
                  icon: <FileText className="w-4 h-4" />,
                  onClick: () => setTransitionEffect('flip'),
                },
              ]}
            />

            {viewMode === 'edit' && (
              <div className="h-6 w-px bg-slate-200" />
            )}

            {/* 模型选择 - 仅编辑模式显示 */}
            {viewMode === 'edit' && (
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  disabled={isGeneratingImages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{providers.find(p => p.value === provider)?.label} | {currentModels.find(m => m.value === model)?.label}</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>

                {/* 模型选择下拉面板 */}
                {showModelSelector && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowModelSelector(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden">
                      {/* 通道选择 */}
                      <div className="p-3 border-b border-slate-200 bg-slate-50">
                        <div className="text-xs font-semibold text-slate-600 mb-2">选择通道</div>
                        <div className="flex gap-2">
                          {providers.map(p => (
                            <button
                              key={p.value}
                              onClick={() => setProvider(p.value)}
                              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${provider === p.value
                                  ? 'bg-blue-600 text-white font-medium'
                                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 模型列表 */}
                      <div className="p-2 max-h-96 overflow-y-auto">
                        <div className="text-xs font-semibold text-slate-600 px-2 py-2">选择模型</div>
                        {currentModels.map(m => (
                          <button
                            key={m.value}
                            onClick={() => {
                              setModel(m.value);
                              setShowModelSelector(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${model === m.value
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-slate-700 hover:bg-slate-100'
                              }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 重新生成 - 仅编辑模式显示 */}
            {viewMode === 'edit' && (
              <button
                onClick={() => handleGenerateSingle(activeSlideIndex)}
                disabled={isGeneratingImages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4" />
                {activeSlide.status === SlideStatus.COMPLETED ? '重新生成' : '生成图片'}
              </button>
            )}

            {/* 中止生成按钮 - 仅在正在生成时显示 */}
            {viewMode === 'edit' && activeSlide.status === SlideStatus.GENERATING && abortControllers.has(activeSlideIndex) && (
              <button
                onClick={() => handleAbortGeneration(activeSlideIndex)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                中止生成
              </button>
            )}
          </div>

          {/* 右侧内容组 */}
          <div className="flex items-center gap-4">
            {/* 1. 标题 */}
            <h2 className="font-semibold text-slate-800 truncate max-w-md">{activeSlide.title}</h2>

            <div className="h-6 w-px bg-slate-200" />

            {/* 2. 返回按钮（下拉选择） */}
            <DropdownMenu
              trigger={
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  <Layout className="w-4 h-4" />
                  返回
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              }
              items={[
                {
                  label: "返回大纲",
                  icon: <Layout className="w-4 h-4" />,
                  onClick: onBack,
                },
                ...(onBackToCoursewareCenter ? [{
                  label: "返回课件中心",
                  icon: <Home className="w-4 h-4" />,
                  onClick: onBackToCoursewareCenter,
                }] : [])
              ]}
            />
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 flex overflow-hidden">

          {/* Center: Preview */}
          <div className="flex-1 bg-slate-100 p-8 flex flex-col items-center justify-center relative overflow-y-auto">
            <div className="w-full max-w-4xl flex flex-col gap-4">
              <div className="aspect-video bg-white shadow-2xl rounded-lg overflow-hidden relative border border-slate-200">
                {/* 互动工具预览弹窗 - 覆盖在图片上 */}
                {showInteractivePreview && (
                  <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100]">
                    <div className="relative" style={{ width: `${previewWidth}%`, height: `${previewHeight}%` }}>
                      {/* 关闭按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowInteractivePreview(false);
                          setPreviewHtmlContent('');
                          setCurrentPreviewToolId(null);
                        }}
                        className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 rounded-full shadow-lg transition-all"
                        title="关闭"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      {/* 四个角的拖动控制点 */}
                      {/* 左上角 */}
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const container = document.querySelector('.aspect-video');
                          if (container) {
                            resizeStateRef.current = {
                              startX: e.clientX,
                              startY: e.clientY,
                              startWidth: previewWidth,
                              startHeight: previewHeight,
                              containerRect: container.getBoundingClientRect()
                            };
                            setIsResizing(true);
                            setResizeCorner('tl');
                          }
                        }}
                        className="absolute -top-2 -left-2 w-4 h-4 bg-orange-500 border-2 border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform z-20"
                        title="拖动调整大小"
                      />
                      {/* 右上角 */}
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const container = document.querySelector('.aspect-video');
                          if (container) {
                            resizeStateRef.current = {
                              startX: e.clientX,
                              startY: e.clientY,
                              startWidth: previewWidth,
                              startHeight: previewHeight,
                              containerRect: container.getBoundingClientRect()
                            };
                            setIsResizing(true);
                            setResizeCorner('tr');
                          }
                        }}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 border-2 border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform z-20"
                        title="拖动调整大小"
                      />
                      {/* 左下角 */}
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const container = document.querySelector('.aspect-video');
                          if (container) {
                            resizeStateRef.current = {
                              startX: e.clientX,
                              startY: e.clientY,
                              startWidth: previewWidth,
                              startHeight: previewHeight,
                              containerRect: container.getBoundingClientRect()
                            };
                            setIsResizing(true);
                            setResizeCorner('bl');
                          }
                        }}
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-500 border-2 border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform z-20"
                        title="拖动调整大小"
                      />
                      {/* 右下角 */}
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const container = document.querySelector('.aspect-video');
                          if (container) {
                            resizeStateRef.current = {
                              startX: e.clientX,
                              startY: e.clientY,
                              startWidth: previewWidth,
                              startHeight: previewHeight,
                              containerRect: container.getBoundingClientRect()
                            };
                            setIsResizing(true);
                            setResizeCorner('br');
                          }
                        }}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 border-2 border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform z-20"
                        title="拖动调整大小"
                      />

                      {/* iframe内容区域 - 全屏显示 */}
                      <iframe
                        srcDoc={previewHtmlContent}
                        className="w-full h-full bg-white"
                        sandbox="allow-scripts allow-forms allow-modals allow-popups"
                        title="互动工具预览"
                      />
                    </div>
                  </div>
                )}
                {activeSlide.videoUrl ? (
                  // 显示视频
                  <video
                    src={activeSlide.videoUrl}
                    controls
                    className="w-full h-full object-contain bg-black"
                    title="页面视频"
                  />
                ) : activeSlide.imageUrl ? (
                  // 显示图片
                  <img
                    src={activeSlide.imageUrl}
                    alt="Slide Preview"
                    className="w-full h-full object-contain select-none"
                    style={{ zIndex: 1 }}
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                    <div className="w-16 h-16 mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                      {activeSlide.status === SlideStatus.GENERATING ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      ) : (
                        <Maximize2 className="w-8 h-8 opacity-50" />
                      )}
                    </div>
                    <p className="text-lg font-medium">
                      {activeSlide.status === SlideStatus.GENERATING ? '正在生成页面...' : '暂无预览图'}
                    </p>

                    {/* 如果不在生成中，显示操作按钮 */}
                    {activeSlide.status !== SlideStatus.GENERATING && (
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleUploadImage}
                          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                        >
                          <Upload className="w-5 h-5" />
                          上传图片
                        </button>
                        <button
                          onClick={handleUploadVideo}
                          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                        >
                          <Upload className="w-5 h-5" />
                          上传小视频
                        </button>
                        <button
                          onClick={() => handleGenerateSingle(activeSlideIndex)}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                        >
                          <Wand2 className="w-5 h-5" />
                          生成图片
                        </button>
                      </div>
                    )}

                    <p className="text-sm mt-4 opacity-60">
                      {activeSlide.status === SlideStatus.GENERATING ? '请稍候...' : '选择一种方式来添加页面内容'}
                    </p>
                  </div>
                )}

                {/* SVG 绘图层（只读模式） */}
                {activeSlide.imageUrl && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                    style={{ zIndex: 10 }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* 渲染已保存的标注 (仅绘图类型) */}
                    {(annotations[activeSlide.id] || []).filter(ann => ann.type !== 'hotspot').map((ann, idx) => {
                      if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
                        const pathData = ann.points.map((p, i) =>
                          `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                        ).join(' ');
                        return (
                          <path
                            key={idx}
                            d={pathData}
                            stroke={ann.color}
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      } else if (ann.type === 'arrow' && ann.start && ann.end) {
                        const dx = ann.end.x - ann.start.x;
                        const dy = ann.end.y - ann.start.y;
                        const angle = Math.atan2(dy, dx);
                        const arrowLength = 15;
                        const arrowAngle = Math.PI / 6;
                        return (
                          <g key={idx}>
                            <line
                              x1={ann.start.x}
                              y1={ann.start.y}
                              x2={ann.end.x}
                              y2={ann.end.y}
                              stroke={ann.color}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <path
                              d={`M ${ann.end.x} ${ann.end.y} L ${ann.end.x - arrowLength * Math.cos(angle - arrowAngle)} ${ann.end.y - arrowLength * Math.sin(angle - arrowAngle)} M ${ann.end.x} ${ann.end.y} L ${ann.end.x - arrowLength * Math.cos(angle + arrowAngle)} ${ann.end.y - arrowLength * Math.sin(angle + arrowAngle)}`}
                              stroke={ann.color}
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                            />
                          </g>
                        );
                      } else if (ann.type === 'rect' && ann.start && ann.end) {
                        return (
                          <rect
                            key={idx}
                            x={Math.min(ann.start.x, ann.end.x)}
                            y={Math.min(ann.start.y, ann.end.y)}
                            width={Math.abs(ann.end.x - ann.start.x)}
                            height={Math.abs(ann.end.y - ann.start.y)}
                            stroke={ann.color}
                            strokeWidth="3"
                            fill="none"
                          />
                        );
                      }
                      return null;
                    })}
                  </svg>
                )}

                {/* 互动工具小图标层 */}
                {activeSlide.imageUrl && activeSlide.interactiveTools && activeSlide.interactiveTools.length > 0 && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 40 }}>
                    {activeSlide.interactiveTools.map((tool) => (
                      <InteractiveToolIcon
                        key={tool.id}
                        tool={tool}
                      />
                    ))}
                  </div>
                )}

                {/* 视频触发按钮图标层 */}
                {activeSlide.imageUrl && activeSlide.videoUrl && activeSlide.videoTriggerMode === 'manual' && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 40 }}>
                    <VideoTriggerButtonIcon slide={activeSlide} />
                  </div>
                )}

                {/* Overlay Navigation */}
                <button
                  onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                  disabled={activeSlideIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg backdrop-blur text-slate-700 disabled:opacity-0 transition-all"
                  style={{ zIndex: 20 }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
                  disabled={activeSlideIndex === slides.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg backdrop-blur text-slate-700 disabled:opacity-0 transition-all"
                  style={{ zIndex: 20 }}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* 编辑按钮 - 仅在有图片且编辑模式时显示 */}
              {viewMode === 'edit' && activeSlide.imageUrl && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setEditingSlideIndex(activeSlideIndex)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
                  >
                    <Edit3 className="w-5 h-5" />
                    编辑图片
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Contextual Edit */}
          {viewMode === 'edit' && (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-10">
              {/* TAB 切换 */}
              <div className="border-b border-slate-200 flex">
                <button
                  onClick={() => setActiveTab('image')}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'image'
                      ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  图片
                </button>
                <button
                  onClick={() => setActiveTab('voice')}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'voice'
                      ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <Volume2 className="w-4 h-4" />
                  语音
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'video'
                      ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <Video className="w-4 h-4" />
                  视频
                </button>
                <button
                  onClick={() => setActiveTab('interactive')}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'interactive'
                      ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <Code className="w-4 h-4" />
                  互动
                </button>
              </div>

              {/* TAB 内容 */}
              {activeTab === 'image' ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">图片</h4>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">标题</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-slate-200 rounded text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={activeSlide.title}
                        onChange={(e) => updateActiveSlideContent('title', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">内容</label>
                      <textarea
                        className="w-full h-32 p-2 border border-slate-200 rounded text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                        value={activeSlide.content}
                        onChange={(e) => updateActiveSlideContent('content', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        视觉提示词
                        <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1 rounded">AI 指令</span>
                      </label>
                      <textarea
                        className="w-full h-32 p-2 border border-slate-200 rounded text-xs font-mono text-slate-600 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                        value={activeSlide.visualPrompt}
                        onChange={(e) => updateActiveSlideContent('visualPrompt', e.target.value)}
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 italic">
                        提示: 修改视觉提示词可以改变图片生成的效果。您可以指定颜色、布局或具体的图像元素。
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'voice' ? (
                <VoiceSettings
                  slide={activeSlide}
                  onScriptChange={handleVoiceScriptChange}
                  onGenerateVoice={handleGenerateVoice}
                  onVoiceGenerated={handleVoiceGenerated}
                />
              ) : activeTab === 'video' ? (
                <VideoSettings
                  slide={activeSlide}
                  onVideoUpload={handleVideoUploadFromSettings}
                  onVideoDelete={handleVideoDelete}
                  onVideoGenerated={handleVideoGenerated}
                  onSlideUpdate={handleSlideUpdate}
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-6">
                  {/* 互动工具标题和添加按钮 */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">互动工具</h4>
                    <button
                      onClick={() => {
                        setEditingInteractiveId(null);
                        setInteractiveHtmlInput('');
                        setInteractiveWidth(90);
                        setInteractiveHeight(90);
                        setShowInteractiveModal(true);
                      }}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>

                  {/* 互动工具列表 */}
                  {(!activeSlide.interactiveTools || activeSlide.interactiveTools.length === 0) ? (
                    <div className="text-center py-12">
                      <Code className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-400">暂无互动工具</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSlide.interactiveTools.map((tool) => {
                        const isEditing = editingInteractiveId === tool.id;

                        return (
                          <div
                            key={tool.id}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {tool.label}
                                </span>
                                <span className="text-sm font-medium text-slate-700">互动工具 {tool.label}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditInteractiveTool(tool.id)}
                                  disabled={isEditing}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                  title="编辑"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInteractiveTool(tool.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* 编辑模式 - 展开编辑区域 */}
                            {isEditing ? (
                              <div className="space-y-2 mt-2">
                                <textarea
                                  value={interactiveHtmlInput}
                                  onChange={(e) => setInteractiveHtmlInput(e.target.value)}
                                  placeholder='输入HTML代码'
                                  className="w-full h-48 px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono text-xs"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleSaveEditedInteractiveTool}
                                    disabled={!interactiveHtmlInput.trim()}
                                    className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={handleCancelEditInteractiveTool}
                                    className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 图片编辑器弹窗 */}
      {editingSlideIndex !== null && slides[editingSlideIndex]?.imageUrl && (
        <ImageEditor
          imageUrl={slides[editingSlideIndex].imageUrl!}
          onClose={() => setEditingSlideIndex(null)}
          onRegenerate={handleRegenerateWithEdit}
        />
      )}

      {/* 全屏播放 */}
      {isFullscreen && (
        <FullscreenPresentation
          slides={slides}
          initialSlideIndex={activeSlideIndex}
          onClose={() => {
            setIsFullscreen(false);
            setAutoPlayVoice(false); // 退出时重置自动播放状态
            setEnableScreenRecording(false); // 退出时重置录屏状态
            displayStreamRef.current = null; // 清理屏幕共享流
          }}
          transitionEffect={transitionEffect}
          annotations={annotations}
          autoPlayVoice={autoPlayVoice}
          enableScreenRecording={enableScreenRecording}
          displayStream={displayStreamRef.current}
        />
      )}

      {/* 分类选择弹窗 */}
      <CategorySelectModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelectCategory={handleConfirmSaveToCloud}
      />

      {/* AI生成HTML对话框 */}
      {showGenerateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-800">AI生成HTML</h3>
              </div>
              <button
                onClick={() => {
                  setShowGenerateDialog(false);
                  setGeneratePrompt('');
                  setGenerateBgColor('#FFFFFF');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-4">
              {/* 提示词输入 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  提示词
                </label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="例如：创建一个计时器，有开始、暂停、重置按钮"
                  className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* 背景颜色选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  背景颜色
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={generateBgColor}
                    onChange={(e) => setGenerateBgColor(e.target.value)}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={generateBgColor}
                    onChange={(e) => setGenerateBgColor(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              {/* 提示信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  AI将根据你的提示词生成完整的HTML代码，包含样式和交互功能。
                </p>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowGenerateDialog(false);
                  setGeneratePrompt('');
                  setGenerateBgColor('#FFFFFF');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleGenerateHtml}
                disabled={!generatePrompt.trim() || isGeneratingHtml}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {isGeneratingHtml ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    生成
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 互动工具HTML输入弹窗 */}
      {showInteractiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingInteractiveId ? '编辑互动工具' : '添加互动工具'}
              </h3>
              <button
                onClick={() => {
                  setShowInteractiveModal(false);
                  setInteractiveHtmlInput('');
                  setInteractiveWidth(90);
                  setInteractiveHeight(90);
                  setEditingInteractiveId(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  HTML内容
                </label>
                <textarea
                  value={interactiveHtmlInput}
                  onChange={(e) => setInteractiveHtmlInput(e.target.value)}
                  placeholder='输入HTML代码，例如：<div><button onclick="alert(Hello!)">点击我</button></div>'
                  className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono text-sm"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">提示:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 添加后会在中间预览区域显示一个带标签的小图标</li>
                  <li>• 小图标可以拖拽调整位置</li>
                  <li>• 点击小图标会在图片上方预览HTML内容</li>
                  <li>• 支持完整的HTML、CSS和JavaScript</li>
                  <li>• 预览时可以拖动四个角调整弹窗大小</li>
                </ul>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setShowGenerateDialog(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI生成
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowInteractiveModal(false);
                    setInteractiveHtmlInput('');
                    setInteractiveWidth(90);
                    setInteractiveHeight(90);
                    setEditingInteractiveId(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={editingInteractiveId ? handleSaveEditedInteractiveTool : handleAddInteractiveTool}
                  disabled={!interactiveHtmlInput.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {editingInteractiveId ? '保存' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkbenchStage;