import React, { useState, useRef } from 'react';
import { Slide } from '../types';
import { Video, Upload, Trash2, Loader2, Wand2, X } from 'lucide-react';
import { compressImageToWidth } from '../utils/imageCompression';
import { uploadImage } from '../services/uploadService';
import { createVideoTask, pollVideoTask } from '../services/videoGenerationService';

interface Props {
  slide: Slide;
  onVideoUpload: (file: File) => Promise<void>;
  onVideoDelete: () => void;
  onVideoGenerated: (videoUrl: string) => void;
  onSlideUpdate: (updates: Partial<Slide>) => void; // 新增：更新幻灯片的回调
}

export const VideoSettings: React.FC<Props> = ({
  slide,
  onVideoUpload,
  onVideoDelete,
  onVideoGenerated,
  onSlideUpdate
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('video/')) {
      alert('请选择视频文件');
      return;
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('视频文件不能超过 10MB，如需插入大视频请导出为 PPTX 后在本地编辑');
      return;
    }

    setIsUploading(true);
    try {
      await onVideoUpload(file);
    } catch (error) {
      console.error('视频上传失败:', error);
      alert('视频上传失败，请重试');
    } finally {
      setIsUploading(false);
      // 清空文件选择，允许重新选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除该视频吗？')) {
      onVideoDelete();
    }
  };

  const handleGenerateClick = () => {
    if (!slide.imageUrl) {
      alert('暂无图片，无法生成视频');
      return;
    }
    setVideoPrompt(''); // 清空之前的提示词
    setShowPromptDialog(true);
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      alert('请输入视频提示词');
      return;
    }

    if (!slide.imageUrl) {
      alert('暂无图片，无法生成视频');
      return;
    }

    setIsGenerating(true);
    setShowPromptDialog(false);

    try {
      console.log('📸 第一步：压缩图片到1024宽度');
      const compressedBlob = await compressImageToWidth(slide.imageUrl, 1024, 0.9);

      console.log('☁️ 第二步：上传压缩后的图片');
      const compressedImageUrl = await uploadImage(compressedBlob);

      console.log('🎬 第三步：创建视频生成任务');
      // 自动在提示词前添加横屏要求
      const finalPrompt = `16:9横屏，${videoPrompt}`;
      const taskId = await createVideoTask(finalPrompt, compressedImageUrl);

      console.log('⏳ 第四步：轮询等待视频生成完成');
      const videoUrl = await pollVideoTask(taskId);

      console.log('✅ 视频生成成功！');
      onVideoGenerated(videoUrl);
      alert('视频生成成功！');
    } catch (error) {
      console.error('视频生成失败:', error);
      alert('视频生成失败: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">

      <div className="space-y-6">
        {/* 视频触发模式设置 */}
        {slide.videoUrl && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">视频播放模式</h4>

            <div className="flex gap-2">
              <label className="flex-1 flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="videoTriggerMode"
                  value="auto"
                  checked={!slide.videoTriggerMode || slide.videoTriggerMode === 'auto'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSlideUpdate({ videoTriggerMode: 'auto' });
                    }
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="text-sm font-medium text-slate-700">自动播放</div>
              </label>

              <label className="flex-1 flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="videoTriggerMode"
                  value="manual"
                  checked={slide.videoTriggerMode === 'manual'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSlideUpdate({
                        videoTriggerMode: 'manual',
                        videoTriggerX: 50,
                        videoTriggerY: 50
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="text-sm font-medium text-slate-700">手动触发</div>
              </label>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="pt-4 border-t border-slate-100">
          <div className="space-y-3">
            {/* 生成视频按钮 */}
            <button
              onClick={handleGenerateClick}
              disabled={!slide.imageUrl || isGenerating || isUploading}
              className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                !slide.imageUrl || isGenerating || isUploading
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
                  <Wand2 className="w-4 h-4" />
                  {!slide.imageUrl ? '暂无图片' : '生成视频'}
                </span>
              )}
            </button>

            {/* 上传视频按钮 */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={handleUploadClick}
                disabled={isUploading || isGenerating}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isUploading || isGenerating
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    上传中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    {slide.videoUrl ? '重新上传小视频' : '上传小视频'}
                  </span>
                )}
              </button>

              {slide.videoUrl && (
                <button
                  onClick={handleDelete}
                  disabled={isUploading || isGenerating}
                  className="px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="删除视频"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 italic leading-relaxed">
            💡 提示: 支持上传常见视频格式（MP4、MOV、AVI等），文件大小不超过 10MB。
            视频将在全屏演示时自动播放。
          </p>
          <p className="text-xs text-orange-500 italic leading-relaxed mt-2">
            ⚠️ 如需插入大视频，请导出为 PPTX 格式后在本地 PowerPoint 中编辑插入。
          </p>
        </div>

        {/* 视频生成说明 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="text-xs font-semibold text-blue-700 mb-2">视频生成说明</h5>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• 使用 AI 大模型将图片转换为动态视频</li>
            <li>• 生成过程需要 60-90 秒，请耐心等待</li>
            <li>• 图片会自动压缩至 1024 宽度以优化生成效果</li>
            <li>• 提示词越详细，生成效果越好</li>
          </ul>
        </div>

        {/* 视频播放说明 */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h5 className="text-xs font-semibold text-slate-700 mb-2">视频播放说明</h5>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• 全屏演示时，视频会优先于图片显示</li>
            <li>• 视频会自动播放（无需开启"自动语音播放"）</li>
            <li>• 启用"自动语音播放"时，视频播放完毕后自动翻页</li>
            <li>• 支持手动控制播放、暂停和进度</li>
          </ul>
        </div>
      </div>

      {/* 提示词对话框 */}
      {showPromptDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPromptDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {/* 对话框标题 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">生成视频</h3>
              <button
                onClick={() => setShowPromptDialog(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* 对话框内容 */}
            <div className="px-6 py-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                视频提示词
              </label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="描述视频中的动作和效果，例如：&#10;横屏，图中人物在奔跑&#10;镜头缓慢推进，背景模糊&#10;物体旋转360度"
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-400">
                提示：详细描述视频效果能获得更好的生成结果
              </p>
            </div>

            {/* 对话框按钮 */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowPromptDialog(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGenerateVideo}
                disabled={!videoPrompt.trim()}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !videoPrompt.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                开始生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
