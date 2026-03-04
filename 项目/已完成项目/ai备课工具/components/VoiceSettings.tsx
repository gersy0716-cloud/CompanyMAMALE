import React, { useState, useRef, useEffect } from 'react';
import { Slide } from '../types';
import { Volume2, Play, Pause, Loader2 } from 'lucide-react';

interface Props {
  slide: Slide;
  onScriptChange: (newScript: string) => void;
  onGenerateVoice: (slideId: string, script: string) => Promise<string>;
  onVoiceGenerated: (voiceUrl: string) => void;
}

export const VoiceSettings: React.FC<Props> = ({
  slide,
  onScriptChange,
  onGenerateVoice,
  onVoiceGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 清理音频资源并重置播放状态
  useEffect(() => {
    // 当切换到不同的幻灯片时
    // 1. 重置播放状态
    setIsPlaying(false);

    // 2. 清理之前的音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [slide.id]);

  const handleGenerateVoice = async () => {
    if (!slide.voiceScript?.trim()) {
      alert('请先输入语音文稿');
      return;
    }

    setIsGenerating(true);
    try {
      const voiceUrl = await onGenerateVoice(slide.id, slide.voiceScript);
      onVoiceGenerated(voiceUrl);
    } catch (error) {
      console.error('语音生成失败:', error);
      alert('语音生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!slide.voiceUrl) return;

    if (isPlaying) {
      // 暂停
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // 播放前，检查是否需要重新创建Audio对象
      // 如果URL改变了（重新生成了语音），需要创建新的Audio对象
      if (!audioRef.current || audioRef.current.src !== slide.voiceUrl) {
        // 清理旧的音频对象
        if (audioRef.current) {
          audioRef.current.pause();
        }
        // 创建新的音频对象
        audioRef.current = new Audio(slide.voiceUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">语音</h4>

      <div className="space-y-6">
        {/* 当前页面信息 */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            {slide.pageNumber}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">{slide.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">为当前页面配置语音讲解</p>
          </div>
        </div>

        {/* 语音文稿编辑 */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            语音文稿
          </label>
          <textarea
            value={slide.voiceScript || ''}
            onChange={(e) => onScriptChange(e.target.value)}
            className="w-full h-48 p-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            placeholder="输入适合口头讲解的文稿内容，约100-200字...&#10;&#10;例如：同学们好，今天我们来学习..."
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {slide.voiceScript?.length || 0} 字
            </span>
            {slide.voiceScript && slide.voiceScript.length > 300 && (
              <span className="text-xs text-orange-600">
                建议控制在200字以内，当前较长
              </span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateVoice}
              disabled={!slide.voiceScript?.trim() || isGenerating}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                !slide.voiceScript?.trim() || isGenerating
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  {slide.voiceUrl ? '重新生成语音' : '生成语音'}
                </span>
              )}
            </button>

            {slide.voiceUrl && (
              <button
                onClick={handlePlayPause}
                className="px-4 py-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                title={isPlaying ? "暂停" : "播放试听"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {slide.voiceUrl && (
            <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              语音已生成，点击播放按钮试听
            </div>
          )}
        </div>

        {/* 提示信息 */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 italic leading-relaxed">
            💡 提示: 语音文稿应该用自然、口语化的方式描述该页内容，就像老师在课堂上讲解一样。
            可以包含引导语、解释说明和互动问题。
          </p>
        </div>
      </div>
    </div>
  );
};
