import React, { useState } from 'react';
import { X, Wand2, Sparkles } from 'lucide-react';
import { generateStyleDescription } from '../services/geminiService';

interface Props {
  onClose: () => void;
  onConfirm: (styleName: string, stylePrompt: string) => void;
}

export const CustomStyleDialog: React.FC<Props> = ({ onClose, onConfirm }) => {
  const [styleName, setStyleName] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePrompt = async () => {
    if (!styleName.trim()) {
      alert('请先输入风格名称');
      return;
    }

    setIsGenerating(true);
    try {
      const description = await generateStyleDescription(styleName);
      setStylePrompt(description);
    } catch (error) {
      console.error('生成风格描述失败:', error);
      alert('生成风格描述失败: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!styleName.trim()) {
      alert('请输入风格名称');
      return;
    }
    if (!stylePrompt.trim()) {
      alert('请输入或生成风格描述提示词');
      return;
    }
    onConfirm(styleName, stylePrompt);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">自定义PPT风格</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* 风格名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              风格名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              placeholder="例如：赛博朋克、森林童话、科技未来..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 风格描述提示词 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                风格描述提示词 <span className="text-red-500">*</span>
              </label>
              <button
                onClick={handleGeneratePrompt}
                disabled={isGenerating || !styleName.trim()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4" />
                {isGenerating ? 'AI生成中...' : 'AI生成提示词'}
              </button>
            </div>
            <textarea
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="描述该风格的视觉特征，包括色彩、元素、排版、氛围等。您可以手动输入，也可以点击上方按钮让AI帮您生成。"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={8}
            />
            <p className="mt-2 text-xs text-slate-500">
              💡 提示：描述越详细，AI生成的PPT风格越准确。建议包含色彩风格、视觉元素、排版特点、整体氛围等信息。
            </p>
          </div>

          {/* 示例参考 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">参考示例：</h4>
            <div className="space-y-2 text-xs text-blue-800">
              <div>
                <strong>童趣卡通：</strong>
                <span className="text-blue-700">
                  K12童趣卡通风格，色彩鲜艳明快（如明黄、天蓝、草绿），包含可爱的卡通插画角色（如学生、小动物），使用圆润可爱的字体，版式活泼有趣...
                </span>
              </div>
              <div>
                <strong>极简设计：</strong>
                <span className="text-blue-700">
                  遵循少即是多的设计原则，画面极度简洁，去除一切装饰性元素，仅保留核心信息。色彩单纯（黑白灰或单一主色），构图留白充足...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            确认使用
          </button>
        </div>
      </div>
    </div>
  );
};
