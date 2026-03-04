import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Eraser, Pencil, Wand2, Upload, Scissors } from 'lucide-react';
import { uploadImage } from '../services/uploadService';

interface Props {
  imageUrl: string;
  onClose: () => void;
  onRegenerate: (uploadedImageUrl: string, prompt: string) => Promise<void>;
}

export const ImageEditor: React.FC<Props> = ({ imageUrl, onClose, onRegenerate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null); // 用于抠图的 mask 画布
  const [isDrawing, setIsDrawing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(5);
  const [toolMode, setToolMode] = useState<'draw' | 'erase' | 'cutout'>('draw'); // 工具模式：画笔、橡皮擦、抠图
  const [isLoading, setIsLoading] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl); // 当前显示的图片URL

  // 初始化canvas和加载图片
  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 设置canvas尺寸为图片尺寸
      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;

      // 绘制原图
      ctx.drawImage(img, 0, 0);
      imageRef.current = img;

      // 初始化 mask 画布为透明
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    };
    img.src = currentImageUrl;
  }, [currentImageUrl]);

  // 开始绘画
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // 绘画中
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (toolMode === 'erase') {
      // 橡皮擦模式：恢复原图区域
      if (imageRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, brushSize * 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(imageRef.current, 0, 0);
        ctx.restore();
      }
      // 同时清除 mask
      maskCtx.save();
      maskCtx.globalCompositeOperation = 'destination-out';
      maskCtx.beginPath();
      maskCtx.arc(x, y, brushSize * 2, 0, Math.PI * 2);
      maskCtx.fill();
      maskCtx.restore();
    } else if (toolMode === 'cutout') {
      // 抠图模式：在主画布上显示半透明红色，在 mask 画布上绘制白色
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#FF0000';
      ctx.fillStyle = '#FF0000';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();

      // 在 mask 画布上绘制白色（表示要删除的区域）
      maskCtx.fillStyle = '#FFFFFF';
      maskCtx.beginPath();
      maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      maskCtx.fill();
    } else {
      // 绘画模式（标注）
      ctx.strokeStyle = '#FF0000'; // 红色
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  // 停止绘画
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // 清除所有绘画，恢复原图
  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    // 清除主画布并恢复原图
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);

    // 清除 mask 画布
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  };

  // 重新生成
  const handleRegenerate = async () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    setIsLoading(true);
    try {
      // 检查是否有 mask（抠图区域）
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error('无法获取 mask 画布上下文');

      const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const hasMask = maskImageData.data.some((value, index) => index % 4 === 3 && value > 0);

      let uploadedImageUrl: string;
      let maskUrl: string | undefined;

      if (hasMask && toolMode === 'cutout') {
        // 抠图模式：需要上传原图和 mask
        console.log('检测到抠图区域，准备上传原图和 mask...');

        // 第1步: 上传原图
        const originalBlob = await new Promise<Blob>((resolve, reject) => {
          if (!imageRef.current) {
            reject(new Error('原图不存在'));
            return;
          }
          // 创建临时 canvas 绘制原图
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imageRef.current.width;
          tempCanvas.height = imageRef.current.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) {
            reject(new Error('无法创建临时画布'));
            return;
          }
          tempCtx.drawImage(imageRef.current, 0, 0);
          tempCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('无法将原图转换为Blob'));
            }
          }, 'image/png');
        });

        console.log('原图转换为Blob成功，大小:', originalBlob.size);
        uploadedImageUrl = await uploadImage(originalBlob);
        console.log('原图上传成功，URL:', uploadedImageUrl);

        // 第2步: 上传 mask
        const maskBlob = await new Promise<Blob>((resolve, reject) => {
          maskCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('无法将mask转换为Blob'));
            }
          }, 'image/png');
        });

        console.log('Mask转换为Blob成功，大小:', maskBlob.size);
        maskUrl = await uploadImage(maskBlob);
        console.log('Mask上传成功，URL:', maskUrl);

        // 设置提示词为抠图模式
        const cutoutPrompt = prompt || '请移除标记的区域，并自然地填充背景，保持整体风格一致';
        await onRegenerate(uploadedImageUrl, `[INPAINT_MODE] mask_url: ${maskUrl} | ${cutoutPrompt}`);
      } else {
        // 标注模式：上传带标注的图片
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('无法将canvas转换为Blob'));
            }
          }, 'image/png');
        });

        console.log('Canvas转换为Blob成功，大小:', blob.size);
        uploadedImageUrl = await uploadImage(blob);
        console.log('图片上传成功，URL:', uploadedImageUrl);

        await onRegenerate(uploadedImageUrl, prompt);
      }

      onClose();
    } catch (error) {
      console.error('重新生成失败:', error);
      alert('重新生成失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* 头部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">图片编辑器</h3>
          <div className="flex items-center gap-3">
            {/* 工具模式切换 */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setToolMode('draw')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  toolMode === 'draw'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                title="画笔标注模式"
              >
                <Pencil className="w-4 h-4 inline mr-1" />
                画笔
              </button>
              <button
                onClick={() => setToolMode('cutout')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  toolMode === 'cutout'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                title="抠图模式：标记要删除的元素"
              >
                <Scissors className="w-4 h-4 inline mr-1" />
                抠图
              </button>
              <button
                onClick={() => setToolMode('erase')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  toolMode === 'erase'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                title="橡皮擦：清除标注"
              >
                <Eraser className="w-4 h-4 inline mr-1" />
                橡皮擦
              </button>
            </div>

            {/* 笔刷大小 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">大小:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-24 accent-blue-600"
              />
              <span className="text-sm text-slate-600 w-8">{brushSize}</span>
            </div>

            {/* 清除按钮 */}
            <button
              onClick={clearDrawing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              清除
            </button>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas 画布区域 */}
        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-6 relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="max-w-full max-h-full shadow-lg cursor-crosshair bg-white"
            style={{ imageRendering: 'crisp-edges' }}
          />
          {/* 隐藏的 mask 画布 */}
          <canvas
            ref={maskCanvasRef}
            className="hidden"
          />
          {/* 工具提示 */}
          {toolMode === 'cutout' && (
            <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
              <Scissors className="w-4 h-4 inline mr-2" />
              抠图模式：用笔刷涂抹要删除的元素
            </div>
          )}
        </div>

        {/* 底部提示词和重新生成 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {toolMode === 'cutout' ? '抠图提示词 (可选)' : '修改提示词 (可选)'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  toolMode === 'cutout'
                    ? '输入抠图后的填充要求，例如：用纯色背景填充、用模糊效果填充...'
                    : '输入你想要的修改建议，例如：让背景更亮一些，增加一些装饰元素...'
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-fit"
            >
              <Wand2 className="w-4 h-4" />
              {isLoading ? '生成中...' : toolMode === 'cutout' ? '抠图并生成' : '重新生成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
