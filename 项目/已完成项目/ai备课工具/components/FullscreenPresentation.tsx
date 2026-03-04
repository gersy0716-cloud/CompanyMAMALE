import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Slide, InteractiveTool } from '../types';
import { Target, MapPin, Star, ThumbsUp, ThumbsDown, Pen, ArrowRight, Square, Trash2, Code, X, Video, Menu } from 'lucide-react';
import {
  initAudioCapture,
  routeAudioThroughContext,
  routeVideoThroughContext,
  startScreenRecording,
  stopScreenRecording,
  downloadRecording,
  AudioCaptureContext,
  RecordingContext,
} from '../services/screenRecordingService';

// 标注类型定义
interface Annotation {
  type: 'pen' | 'arrow' | 'rect' | 'hotspot';
  color?: string;
  strokeWidth?: number;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  x?: number;
  y?: number;
  text?: string;
  style?: 'dot' | 'pin' | 'star' | 'thumbsUp' | 'thumbsDown';
  fontSize?: string;
  textColor?: string;
  iconSize?: number;
  iconColor?: string;
}

interface Props {
  slides: Slide[];
  initialSlideIndex?: number;
  onClose: () => void;
  transitionEffect?: 'fade' | 'slideUp' | 'slideLeft' | 'flip';
  annotations?: Record<string, Annotation[]>;
  autoPlayVoice?: boolean; // 是否自动播放语音
  enableScreenRecording?: boolean; // 是否启用录屏模式
  displayStream?: MediaStream | null; // 预授权的屏幕共享流
  onRecordingComplete?: (blob: Blob) => void; // 录制完成回调
}

interface RenderItem {
  slide: Slide;
  index: number;
  key: string;
}

// 全局计数器确保key唯一性
let renderKeyCounter = 0;

export const FullscreenPresentation: React.FC<Props> = ({
  slides,
  initialSlideIndex = 0,
  onClose,
  transitionEffect = 'fade',
  annotations = {},
  autoPlayVoice = false,
  enableScreenRecording = false,
  displayStream = null,
  onRecordingComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [renderQueue, setRenderQueue] = useState<RenderItem[]>([]);
  const [isFullscreenReady, setIsFullscreenReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentSlide = slides[currentIndex];

  // 录屏相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingReady, setRecordingReady] = useState(false); // 录制是否已准备好（用户已授权）
  const audioCaptureRef = useRef<AudioCaptureContext | null>(null);
  const recordingContextRef = useRef<RecordingContext | null>(null);
  const routedElementsRef = useRef<WeakSet<HTMLMediaElement>>(new WeakSet()); // 跟踪已路由的媒体元素

  // 绘图工具状态（全屏模式专用，退出时自动清空）
  const [activeTool, setActiveTool] = useState<'none' | 'pen' | 'arrow' | 'rect'>('none');
  const [brushColor, setBrushColor] = useState('#EF4444');
  const [brushWidth, setBrushWidth] = useState(3);
  const [tempDrawings, setTempDrawings] = useState<Record<string, Annotation[]>>({});
  const [currentDrawing, setCurrentDrawing] = useState<Annotation | null>(null);

  // 互动工具预览状态
  const [showInteractivePreview, setShowInteractivePreview] = useState(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState('');
  const [previewWidth, setPreviewWidth] = useState(90);
  const [previewHeight, setPreviewHeight] = useState(90);

  // 视频触发状态 - 记录每个幻灯片的视频是否已被触发
  const [videoTriggered, setVideoTriggered] = useState<Record<string, boolean>>({});

  // 工具栏显示状态
  const [showToolbar, setShowToolbar] = useState(false);

  // 当工具栏打开时，自动选择画笔
  useEffect(() => {
    if (showToolbar) {
      setActiveTool('pen');
    } else {
      setActiveTool('none');
    }
  }, [showToolbar]);

  // 停止录制并下载的函数
  const handleStopRecording = useCallback(async () => {
    if (recordingContextRef.current && isRecording) {
      console.log('🛑 停止录制...');
      setIsRecording(false);
      const blob = await stopScreenRecording(recordingContextRef.current);

      // 关闭 AudioContext
      if (audioCaptureRef.current) {
        audioCaptureRef.current.audioContext.close();
        audioCaptureRef.current = null;
      }

      recordingContextRef.current = null;

      // 触发回调或直接下载
      if (onRecordingComplete) {
        onRecordingComplete(blob);
      } else {
        downloadRecording(blob);
      }
    }
  }, [isRecording, onRecordingComplete]);

  // 录屏模式初始化（使用预授权的 displayStream）
  useEffect(() => {
    if (!enableScreenRecording || !isFullscreenReady) return;

    // 如果没有预授权的屏幕共享流，直接标记就绪（正常播放，不录制）
    if (!displayStream) {
      console.log('⚠️ 没有屏幕共享流，跳过录制，正常播放');
      setRecordingReady(true);
      return;
    }

    console.log('🎬 初始化录屏模式（使用预授权流）...');

    // 初始化音频捕获
    const audioCapture = initAudioCapture();
    audioCaptureRef.current = audioCapture;

    // 使用预授权的 displayStream 启动录制
    const recordingContext = startScreenRecording(displayStream, audioCapture.audioDestination);
    recordingContextRef.current = recordingContext;
    setIsRecording(true);
    setRecordingReady(true);
    console.log('✅ 录屏已开始，等待播放媒体...');

    // 监听屏幕共享停止事件
    const videoTrack = displayStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        console.log('📺 用户停止了屏幕共享');
        handleStopRecording();
      };
    }

    // 清理函数
    return () => {
      if (recordingContextRef.current) {
        // 使用 ref 判断而非 state，避免闭包过期问题
        stopScreenRecording(recordingContextRef.current).then(blob => {
          downloadRecording(blob);
        });
        recordingContextRef.current = null;
      }
      if (audioCaptureRef.current) {
        audioCaptureRef.current.audioContext.close();
        audioCaptureRef.current = null;
      }
    };
  }, [enableScreenRecording, isFullscreenReady, displayStream]);

  // 监听最后一页播放完毕，自动停止录制
  const handleMediaEnded = useCallback((isLastSlide: boolean) => {
    if (isLastSlide && enableScreenRecording && isRecording) {
      console.log('📄 最后一页媒体播放完毕，停止录制');
      // 延迟一点停止录制，确保最后的画面被录制
      setTimeout(() => {
        handleStopRecording();
        // 退出全屏
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }, 500);
    }
  }, [enableScreenRecording, isRecording, handleStopRecording]);

  // 互动工具图标组件
  const InteractiveToolIcon: React.FC<{
    tool: InteractiveTool;
  }> = ({ tool }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviewHtmlContent(tool.htmlContent);
      setPreviewWidth(tool.width || 90);
      setPreviewHeight(tool.height || 90);
      setShowInteractivePreview(true);
    };

    return (
      <div
        className="absolute cursor-pointer select-none"
        style={{
          left: `${tool.x}%`,
          top: `${tool.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          zIndex: 40
        }}
        onClick={handleClick}
        title={`点击预览互动工具 ${tool.label}`}
      >
        <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white transition-all hover:scale-110 animate-pulse">
          {tool.label}
        </div>
      </div>
    );
  };

  // 视频触发按钮组件
  const VideoTriggerButton: React.FC<{
    slide: Slide;
  }> = ({ slide }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // 标记该幻灯片的视频已被触发
      setVideoTriggered(prev => ({
        ...prev,
        [slide.id]: true
      }));
    };

    const x = slide.videoTriggerX ?? 50; // 默认居中
    const y = slide.videoTriggerY ?? 50;

    return (
      <div
        className="absolute cursor-pointer select-none"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          zIndex: 40
        }}
        onClick={handleClick}
        title="点击播放视频"
      >
        <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all hover:scale-110 animate-pulse">
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
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {/* 图标主体 */}
        <div
          className={`relative ${
            hotspot.style === 'dot' ? 'dot-ripple' : 'animate-breathe'
          }`}
          style={{ transform: `scale(${sizeScale})` }}
        >
          <div
            className={`relative z-10 p-1 rounded-full shadow-lg transition-transform duration-300 ${
              isOpen ? 'scale-125' : ''
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
          className={`absolute left-full top-1/2 w-max max-w-xs bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-xl z-50 tooltip-content ${
            isOpen ? 'tooltip-visible' : 'tooltip-hidden'
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

  // 初始化和更新渲染队列
  useEffect(() => {
    const newItem: RenderItem = {
      slide: slides[currentIndex],
      index: currentIndex,
      key: `slide-render-${renderKeyCounter++}` // 使用全局计数器确保唯一性
    };

    setRenderQueue(prev => {
      const queue = [...prev, newItem];
      // 只保留最近的2个项目用于动画切换
      if (queue.length > 2) return queue.slice(queue.length - 2);
      return queue;
    });
  }, [currentIndex, slides]);

  // 进入全屏
  useEffect(() => {
    const enterFullscreen = async () => {
      if (containerRef.current && !document.fullscreenElement) {
        try {
          // 尝试进入全屏
          await containerRef.current.requestFullscreen();
          setIsFullscreenReady(true);
          console.log('✅ 成功进入全屏模式');
        } catch (err) {
          console.warn('⚠️ 自动进入全屏失败，等待用户手动触发:', err);
          // 全屏失败不影响使用，标记为已就绪
          setIsFullscreenReady(true);
        }
      }
    };

    // 稍微延迟确保DOM已挂载
    const timer = setTimeout(enterFullscreen, 100);
    return () => clearTimeout(timer);
  }, []);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = async () => {
      // 如果退出了全屏
      if (!document.fullscreenElement) {
        // 如果正在录制，先停止录制并下载
        if (enableScreenRecording && isRecording && recordingContextRef.current) {
          console.log('📺 退出全屏，停止录制...');
          setIsRecording(false);
          const blob = await stopScreenRecording(recordingContextRef.current);

          // 关闭 AudioContext
          if (audioCaptureRef.current) {
            audioCaptureRef.current.audioContext.close();
            audioCaptureRef.current = null;
          }

          recordingContextRef.current = null;

          // 触发回调或直接下载
          if (onRecordingComplete) {
            onRecordingComplete(blob);
          } else {
            downloadRecording(blob);
          }
        }
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onClose, enableScreenRecording, isRecording, onRecordingComplete]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          handlePrevious();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ': // 空格键
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          // 退出全屏
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
        case 'Home':
          setCurrentIndex(0);
          break;
        case 'End':
          setCurrentIndex(slides.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 自动视频播放逻辑（独立于autoPlayVoice）
  useEffect(() => {
    if (!isFullscreenReady) return;
    // 录屏模式下，等待录制准备好才开始播放
    if (enableScreenRecording && !recordingReady) return;

    const currentSlide = slides[currentIndex];

    // 清理之前的视频
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current = null;
    }

    // 如果有视频且应该显示（自动模式或手动模式已触发），则尝试自动播放
    const shouldShowVideo = currentSlide.videoUrl && (currentSlide.videoTriggerMode !== 'manual' || videoTriggered[currentSlide.id]);

    if (shouldShowVideo) {
      console.log(`📹 第 ${currentIndex + 1} 页有视频，准备自动播放`);

      // 使用setTimeout确保视频元素已经渲染
      const timer = setTimeout(() => {
        // 使用更精确的选择器，只选择当前显示的视频
        const allVideos = document.querySelectorAll(`video[data-slide-id="${currentSlide.id}"]`);

        // 如果有多个视频元素，选择最后一个（最新渲染的）
        const videoElement = allVideos[allVideos.length - 1] as HTMLVideoElement;

        if (videoElement) {
          videoRef.current = videoElement;

          console.log('✅ 找到视频元素，准备播放');
          console.log('视频URL:', currentSlide.videoUrl);
          console.log('视频readyState:', videoElement.readyState);

          // 录屏模式下，将视频音频路由到 AudioContext
          if (enableScreenRecording && audioCaptureRef.current && !routedElementsRef.current.has(videoElement)) {
            try {
              routeVideoThroughContext(
                videoElement,
                audioCaptureRef.current.audioContext,
                audioCaptureRef.current.audioDestination
              );
              routedElementsRef.current.add(videoElement);
              console.log('🎬 视频音频已路由到录制流');
            } catch (err) {
              console.warn('⚠️ 视频音频路由失败:', err);
            }
          }

          const isLastSlide = currentIndex === slides.length - 1;

          // 设置视频播放完毕事件（只有启用autoPlayVoice时才自动翻页）
          videoElement.onended = () => {
            console.log(`✅ 第 ${currentIndex + 1} 页视频播放完毕`);
            // 处理录屏模式下最后一页结束
            handleMediaEnded(isLastSlide);
            if (autoPlayVoice && currentIndex < slides.length - 1) {
              console.log(`⏭️ 自动翻页到第 ${currentIndex + 2} 页`);
              setCurrentIndex(currentIndex + 1);
            } else {
              console.log('📄 视频播放结束');
            }
          };

          // 尝试播放视频
          const attemptPlay = async () => {
            try {
              // 首先尝试有声音播放
              videoElement.muted = false;
              await videoElement.play();
              console.log('🔊 视频开始有声播放');
            } catch (err) {
              console.warn('⚠️ 有声播放失败，尝试静音播放:', err);
              try {
                // 如果有声播放失败，尝试静音播放
                videoElement.muted = true;
                await videoElement.play();
                console.log('🔇 视频开始静音播放');
              } catch (err2) {
                console.error('❌ 视频播放完全失败:', err2);
                // 如果播放失败，2秒后自动翻页
                if (currentIndex < slides.length - 1) {
                  setTimeout(() => setCurrentIndex(currentIndex + 1), 2000);
                }
              }
            }
          };

          // 如果视频已经加载好，立即播放；否则等待canplay事件
          if (videoElement.readyState >= 3) {
            // HAVE_FUTURE_DATA 或更高状态
            attemptPlay();
          } else {
            videoElement.oncanplay = () => {
              console.log('📺 视频可以播放了');
              attemptPlay();
            };
          }
        } else {
          console.error('❌ 未找到视频元素，slide ID:', currentSlide.id);
          console.log('所有视频元素:', document.querySelectorAll('video'));
        }
      }, 300); // 增加等待时间确保DOM已完全渲染

      return () => {
        clearTimeout(timer);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current = null;
        }
      };
    }
  }, [currentIndex, isFullscreenReady, slides, autoPlayVoice, videoTriggered, enableScreenRecording, recordingReady, handleMediaEnded]);

  // 自动语音播放逻辑（仅在启用autoPlayVoice时）
  useEffect(() => {
    if (!autoPlayVoice || !isFullscreenReady) return;
    // 录屏模式下，等待录制准备好才开始播放
    if (enableScreenRecording && !recordingReady) return;

    const currentSlide = slides[currentIndex];

    // 清理之前的音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 如果有视频，不处理语音（视频已经在上面的useEffect中处理）
    if (currentSlide.videoUrl) {
      return;
    }

    const isLastSlide = currentIndex === slides.length - 1;

    // 处理语音
    if (currentSlide.voiceUrl) {
      const audio = new Audio(currentSlide.voiceUrl);

      audioRef.current = audio;

      // 语音播放完毕后自动翻页
      audio.onended = () => {
        console.log(`🔊 第 ${currentIndex + 1} 页语音播放完毕`);
        // 处理录屏模式下最后一页结束
        handleMediaEnded(isLastSlide);

        // 如果不是最后一页，自动翻到下一页
        if (currentIndex < slides.length - 1) {
          console.log(`⏭️ 自动翻页到第 ${currentIndex + 2} 页`);
          setCurrentIndex(currentIndex + 1);
        } else {
          console.log('📄 已到达最后一页');
        }
      };

      audio.onerror = () => {
        console.error(`❌ 第 ${currentIndex + 1} 页语音播放失败`);
        // 播放失败也自动翻页（避免卡住）
        if (currentIndex < slides.length - 1) {
          setTimeout(() => setCurrentIndex(currentIndex + 1), 1000);
        }
      };

      // 录屏模式下，尝试路由音频到 AudioContext（用于录制捕获声音）
      if (enableScreenRecording && audioCaptureRef.current && !routedElementsRef.current.has(audio)) {
        try {
          // 先尝试设置 crossOrigin 以支持 createMediaElementSource
          audio.crossOrigin = 'anonymous';
          routeAudioThroughContext(
            audio,
            audioCaptureRef.current.audioContext,
            audioCaptureRef.current.audioDestination
          );
          routedElementsRef.current.add(audio);
          console.log('🎬 语音音频已路由到录制流');
        } catch (err) {
          console.warn('⚠️ 语音音频路由失败，回退到普通播放（录制文件可能无声音）:', err);
          // 路由失败时，重新创建不带 crossOrigin 的 Audio 以确保能正常播放
          const fallbackAudio = new Audio(currentSlide.voiceUrl);
          fallbackAudio.onended = audio.onended;
          fallbackAudio.onerror = audio.onerror;
          audioRef.current = fallbackAudio;
          fallbackAudio.play().catch(e => {
            console.error('❌ 回退语音播放也失败:', e);
          });
          return;
        }
      }

      // 开始播放
      audio.play().catch(err => {
        console.error('❌ 语音自动播放失败:', err);
        // 如果因为 crossOrigin 导致播放失败，回退到不带 crossOrigin 的播放
        if (enableScreenRecording && audio.crossOrigin) {
          console.log('🔄 尝试回退到普通播放...');
          const fallbackAudio = new Audio(currentSlide.voiceUrl);
          fallbackAudio.onended = audio.onended;
          fallbackAudio.onerror = audio.onerror;
          audioRef.current = fallbackAudio;
          fallbackAudio.play().catch(e => {
            console.error('❌ 回退语音播放也失败:', e);
          });
        }
      });

      console.log(`🔊 开始播放第 ${currentIndex + 1} 页语音`);
    } else {
      // 当前页没有视频也没有语音，自动跳到下一页
      console.log(`⏭️ 第 ${currentIndex + 1} 页没有媒体内容，2秒后自动翻页`);
      // 处理录屏模式下最后一页（无媒体）
      if (isLastSlide && enableScreenRecording && isRecording) {
        setTimeout(() => {
          handleMediaEnded(true);
        }, 2000);
      } else if (currentIndex < slides.length - 1) {
        const timer = setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
        }, 2000); // 2秒后自动翻页

        return () => clearTimeout(timer);
      }
    }

    // 清理函数
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentIndex, autoPlayVoice, isFullscreenReady, slides, enableScreenRecording, recordingReady, isRecording, handleMediaEnded]);

  // 绘图相关函数
  const getCoordinates = (e: React.MouseEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handleDrawingMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'none') return;
    e.preventDefault();
    e.stopPropagation();

    const { x, y } = getCoordinates(e, e.currentTarget);

    if (activeTool === 'pen') {
      setCurrentDrawing({ type: 'pen', color: brushColor, strokeWidth: brushWidth, points: [{ x, y }] });
    } else if (activeTool === 'arrow') {
      setCurrentDrawing({ type: 'arrow', color: brushColor, strokeWidth: brushWidth, start: { x, y }, end: { x, y } });
    } else if (activeTool === 'rect') {
      setCurrentDrawing({ type: 'rect', color: brushColor, strokeWidth: brushWidth, start: { x, y }, end: { x, y } });
    }
  };

  const handleDrawingMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!currentDrawing) return;
    e.preventDefault();
    e.stopPropagation();

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
    if (currentDrawing) {
      const slideId = slides[currentIndex].id;
      setTempDrawings(prev => ({
        ...prev,
        [slideId]: [...(prev[slideId] || []), currentDrawing]
      }));
      setCurrentDrawing(null);
    }
  };

  const clearDrawings = () => {
    const slideId = slides[currentIndex].id;
    setTempDrawings(prev => ({
      ...prev,
      [slideId]: []
    }));
  };

  const handleSlideClick = (e: React.MouseEvent) => {
    // 点击屏幕左半部分上一页，右半部分下一页
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;

    if (clickX < screenWidth / 3) {
      handlePrevious();
    } else if (clickX > screenWidth * 2 / 3) {
      handleNext();
    }
  };

  // 手动进入全屏
  const handleManualFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current && !document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreenReady(true);
        console.log('✅ 手动进入全屏成功');
      } catch (err) {
        console.error('❌ 手动进入全屏失败:', err);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[9999] overflow-hidden"
      onClick={handleSlideClick}
      style={{ perspective: '2000px' }}
    >
      {/* 动画舞台 */}
      <div className="w-full h-full relative">
        {/* 如果未进入全屏，显示提示按钮 */}
        {!document.fullscreenElement && (
          <div className="absolute top-4 right-4 z-[10001]">
            <button
              onClick={handleManualFullscreen}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all"
            >
              点击进入全屏
            </button>
          </div>
        )}

        {/* 录屏中指示器 */}
        {isRecording && (
          <div className="absolute top-4 left-4 z-[10001] flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg shadow-lg animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
            <span className="text-sm font-medium">录屏中</span>
          </div>
        )}

        {renderQueue.map((item, index) => {
          let animationClass = '';

          if (renderQueue.length === 2) {
            // 有两个元素时应用进入/退出动画
            if (index === 0) {
              // 旧的幻灯片 - 退出动画
              animationClass = `${transitionEffect}-exit`;
            } else if (index === 1) {
              // 新的幻灯片 - 进入动画
              animationClass = `${transitionEffect}-enter`;
            }
          }

          const slideAnnotations = annotations[item.slide.id] || [];
          const drawingAnnotations = slideAnnotations.filter(ann => ann.type !== 'hotspot');
          const hotspotAnnotations = slideAnnotations.filter(ann => ann.type === 'hotspot');

          return (
            <div
              key={item.key}
              className={`slide-wrapper ${animationClass}`}
            >
              <div className="w-full h-full flex items-center justify-center relative">
                {/* 互动工具预览弹窗 - 仅在当前幻灯片显示 */}
                {showInteractivePreview && item.index === currentIndex && (
                  <div className="absolute inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center">
                    {/* 限制弹窗参考区域为16:9，与工作台一致 */}
                    <div className="relative w-full h-full flex items-center justify-center" style={{ maxWidth: '177.78vh', maxHeight: '56.25vw' }}>
                      <div className="relative" style={{ width: `${previewWidth}%`, height: `${previewHeight}%` }}>
                        {/* 关闭按钮 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowInteractivePreview(false);
                            setPreviewHtmlContent('');
                          }}
                          className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-700 rounded-full shadow-lg transition-all"
                          title="关闭"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        {/* iframe内容区域 - 全屏显示 */}
                        <iframe
                          srcDoc={previewHtmlContent}
                          className="w-full h-full bg-white"
                          sandbox="allow-scripts allow-forms allow-modals allow-popups"
                          title="互动工具预览"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {item.slide.videoUrl && (item.slide.videoTriggerMode !== 'manual' || videoTriggered[item.slide.id]) ? (
                  // 显示视频（自动模式 或 手动模式已触发）
                  <video
                    data-slide-id={item.slide.id}
                    src={item.slide.videoUrl}
                    controls
                    playsInline
                    preload="auto"
                    className="slide-media bg-black"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : item.slide.imageUrl ? (
                  // 显示图片
                  <>
                    <img
                      src={item.slide.imageUrl}
                      alt={item.slide.title}
                      className="slide-media"
                    />

                    {/* SVG 绘图层 */}
                    <svg
                      className="absolute inset-0 w-full h-full"
                      style={{
                        zIndex: 10,
                        cursor: activeTool !== 'none' ? 'crosshair' : 'default',
                        pointerEvents: activeTool !== 'none' ? 'auto' : 'none'
                      }}
                      viewBox="0 0 100 100"
                      preserveAspectRatio="xMidYMid meet"
                      onMouseDown={handleDrawingMouseDown}
                      onMouseMove={handleDrawingMouseMove}
                      onMouseUp={handleDrawingMouseUp}
                      onMouseLeave={handleDrawingMouseUp}
                    >
                      {/* 渲染已保存的标注（只读） */}
                      {drawingAnnotations.map((ann, idx) => {
                        if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
                          const pathData = ann.points.map((p, i) =>
                            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                          ).join(' ');
                          return (
                            <path
                              key={idx}
                              d={pathData}
                              stroke={ann.color || '#EF4444'}
                              strokeWidth={(ann.strokeWidth || 3) * 0.15}
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
                                stroke={ann.color || '#EF4444'}
                                strokeWidth={(ann.strokeWidth || 3) * 0.15}
                                strokeLinecap="round"
                              />
                              <path
                                d={`M ${ann.end.x} ${ann.end.y} L ${ann.end.x - arrowLength * Math.cos(angle - arrowAngle)} ${ann.end.y - arrowLength * Math.sin(angle - arrowAngle)} M ${ann.end.x} ${ann.end.y} L ${ann.end.x - arrowLength * Math.cos(angle + arrowAngle)} ${ann.end.y - arrowLength * Math.sin(angle + arrowAngle)}`}
                                stroke={ann.color || '#EF4444'}
                                strokeWidth={(ann.strokeWidth || 3) * 0.15}
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
                              stroke={ann.color || '#EF4444'}
                              strokeWidth={(ann.strokeWidth || 3) * 0.15}
                              fill="none"
                            />
                          );
                        }
                        return null;
                      })}

                      {/* 渲染当前幻灯片的临时绘图 */}
                      {(tempDrawings[item.slide.id] || []).map((ann, idx) => {
                        if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
                          const pathData = ann.points.map((p, i) =>
                            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                          ).join(' ');
                          return (
                            <path
                              key={`temp-${idx}`}
                              d={pathData}
                              stroke={ann.color || '#EF4444'}
                              strokeWidth={(ann.strokeWidth || 3) * 0.15}
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
                            <g key={`temp-${idx}`}>
                              <line
                                x1={ann.start.x}
                                y1={ann.start.y}
                                x2={ann.end.x}
                                y2={ann.end.y}
                                stroke={ann.color || '#EF4444'}
                                strokeWidth={(ann.strokeWidth || 3) * 0.15}
                                strokeLinecap="round"
                              />
                              <path
                                d={`M ${ann.end.x} ${ann.end.y} L ${ann.end.x - arrowLength * Math.cos(angle - arrowAngle)} ${ann.end.y - arrowLength * Math.sin(angle - arrowAngle)} M ${ann.end.x} ${ann.end.y} L ${ann.end.x - arrowLength * Math.cos(angle + arrowAngle)} ${ann.end.y - arrowLength * Math.sin(angle + arrowAngle)}`}
                                stroke={ann.color || '#EF4444'}
                                strokeWidth={(ann.strokeWidth || 3) * 0.15}
                                fill="none"
                                strokeLinecap="round"
                              />
                            </g>
                          );
                        } else if (ann.type === 'rect' && ann.start && ann.end) {
                          return (
                            <rect
                              key={`temp-${idx}`}
                              x={Math.min(ann.start.x, ann.end.x)}
                              y={Math.min(ann.start.y, ann.end.y)}
                              width={Math.abs(ann.end.x - ann.start.x)}
                              height={Math.abs(ann.end.y - ann.start.y)}
                              stroke={ann.color || '#EF4444'}
                              strokeWidth={(ann.strokeWidth || 3) * 0.15}
                              fill="none"
                            />
                          );
                        }
                        return null;
                      })}

                      {/* 渲染正在绘制的内容 */}
                      {currentDrawing && item.index === currentIndex && (() => {
                        if (currentDrawing.type === 'pen' && currentDrawing.points && currentDrawing.points.length > 1) {
                          const pathData = currentDrawing.points.map((p, i) =>
                            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                          ).join(' ');
                          return (
                            <path
                              d={pathData}
                              stroke={currentDrawing.color || '#EF4444'}
                              strokeWidth={(currentDrawing.strokeWidth || 3) * 0.15}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          );
                        } else if (currentDrawing.type === 'arrow' && currentDrawing.start && currentDrawing.end) {
                          const dx = currentDrawing.end.x - currentDrawing.start.x;
                          const dy = currentDrawing.end.y - currentDrawing.start.y;
                          const angle = Math.atan2(dy, dx);
                          const arrowLength = 15;
                          const arrowAngle = Math.PI / 6;
                          return (
                            <g>
                              <line
                                x1={currentDrawing.start.x}
                                y1={currentDrawing.start.y}
                                x2={currentDrawing.end.x}
                                y2={currentDrawing.end.y}
                                stroke={currentDrawing.color || '#EF4444'}
                                strokeWidth={(currentDrawing.strokeWidth || 3) * 0.15}
                                strokeLinecap="round"
                              />
                              <path
                                d={`M ${currentDrawing.end.x} ${currentDrawing.end.y} L ${currentDrawing.end.x - arrowLength * Math.cos(angle - arrowAngle)} ${currentDrawing.end.y - arrowLength * Math.sin(angle - arrowAngle)} M ${currentDrawing.end.x} ${currentDrawing.end.y} L ${currentDrawing.end.x - arrowLength * Math.cos(angle + arrowAngle)} ${currentDrawing.end.y - arrowLength * Math.sin(angle + arrowAngle)}`}
                                stroke={currentDrawing.color || '#EF4444'}
                                strokeWidth={(currentDrawing.strokeWidth || 3) * 0.15}
                                fill="none"
                                strokeLinecap="round"
                              />
                            </g>
                          );
                        } else if (currentDrawing.type === 'rect' && currentDrawing.start && currentDrawing.end) {
                          return (
                            <rect
                              x={Math.min(currentDrawing.start.x, currentDrawing.end.x)}
                              y={Math.min(currentDrawing.start.y, currentDrawing.end.y)}
                              width={Math.abs(currentDrawing.end.x - currentDrawing.start.x)}
                              height={Math.abs(currentDrawing.end.y - currentDrawing.start.y)}
                              stroke={currentDrawing.color || '#EF4444'}
                              strokeWidth={(currentDrawing.strokeWidth || 3) * 0.15}
                              fill="none"
                            />
                          );
                        }
                        return null;
                      })()}
                    </svg>

                    {/* 交互点层 */}
                    <div className="hotspot-layer">
                      {hotspotAnnotations.map((hotspot, idx) => (
                        <HotspotItem key={idx} hotspot={hotspot} index={idx} />
                      ))}
                    </div>

                    {/* 互动工具小图标层 */}
                    {item.slide.interactiveTools && item.slide.interactiveTools.length > 0 && (
                      <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 50 }}>
                        {item.slide.interactiveTools.map((tool) => (
                          <InteractiveToolIcon key={tool.id} tool={tool} />
                        ))}
                      </div>
                    )}

                    {/* 视频触发按钮层 */}
                    {item.slide.videoUrl && item.slide.videoTriggerMode === 'manual' && !videoTriggered[item.slide.id] && (
                      <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 50 }}>
                        <VideoTriggerButton slide={item.slide} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full max-w-6xl aspect-video bg-slate-800/50 flex items-center justify-center text-white/50">
                    <div className="text-center">
                      <p className="text-xl mb-2">{item.slide.title}</p>
                      <p className="text-sm text-white/30">该幻灯片尚未生成图片</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 菜单开关按钮 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000]">
        <button
          onClick={() => setShowToolbar(!showToolbar)}
          className="w-16 h-16 bg-gradient-to-t from-black/90 to-black/70 backdrop-blur-sm rounded-full shadow-2xl border-2 border-white/20 flex items-center justify-center transition-all hover:scale-110 hover:border-white/40"
          style={{
            clipPath: showToolbar ? 'circle(50% at 50% 50%)' : 'ellipse(50% 30% at 50% 70%)'
          }}
          title={showToolbar ? "关闭工具栏" : "打开工具栏"}
        >
          <Menu className={`w-7 h-7 text-white transition-transform ${showToolbar ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* 绘图工具栏 */}
      {showToolbar && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[10000] animate-fade-in">
          <div className="bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-2xl border border-white/10">
            <div className="flex items-center gap-4">
            {/* 颜色选择器 */}
            <div className="flex items-center gap-2 pr-4 border-r border-white/20">
              {['#FFFFFF', '#FBBF24', '#EF4444', '#3B82F6', '#10B981', '#000000'].map((color) => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBrushColor(color);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    brushColor === color ? 'border-white scale-110' : 'border-white/30 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`选择颜色: ${color}`}
                />
              ))}
            </div>

            {/* 粗细选择器 */}
            <div className="flex items-center gap-2 pr-4 border-r border-white/20">
              <div className="flex flex-col items-center gap-1">
                <span className="text-white/60 text-xs">粗细</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 8].map((width) => (
                    <button
                      key={width}
                      onClick={(e) => {
                        e.stopPropagation();
                        setBrushWidth(width);
                      }}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                        brushWidth === width
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:bg-white/20'
                      }`}
                      title={`粗细: ${width}px`}
                    >
                      <div
                        className="rounded-full bg-current"
                        style={{
                          width: `${Math.min(width * 2, 16)}px`,
                          height: `${Math.min(width * 2, 16)}px`
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 绘图工具 */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTool(activeTool === 'pen' ? 'none' : 'pen');
                }}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === 'pen'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/20'
                }`}
                title="画笔 (P)"
              >
                <Pen className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTool(activeTool === 'arrow' ? 'none' : 'arrow');
                }}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === 'arrow'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/20'
                }`}
                title="箭头 (A)"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTool(activeTool === 'rect' ? 'none' : 'rect');
                }}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === 'rect'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/20'
                }`}
                title="矩形 (R)"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>

            {/* 清除按钮 */}
            <div className="pl-4 border-l border-white/20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearDrawings();
                }}
                className="p-2 rounded-lg text-white hover:bg-white/20 transition-all"
                title="清除当前页标注 (C)"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
