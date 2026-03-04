import React, { useState, useRef, useEffect } from 'react';
import { PresentationSettings, AppStage } from '../types';
import { DEFAULT_PAGE_COUNT, STYLE_PROMPTS, SUBJECTS, Subject, SUBJECT_STYLE_MAP, STYLE_NAMES, STYLE_IMAGE_URLS, VOICE_TYPES, DEFAULT_VOICE_TYPE, VoiceType, NARRATION_STYLES, DEFAULT_NARRATION_STYLE, NarrationStyle, COPYWRITING_STYLES, CopywritingStyle } from '../constants';
import { Upload, FileText, ArrowRight, Loader2, Edit3, ArrowLeft, Image } from 'lucide-react';
import { CustomStyleDialog } from './CustomStyleDialog';
import { uploadImage, uploadAndParsePdf } from '../services/uploadService';

interface Props {
  onNext: (text: string, settings: PresentationSettings) => void;
  onDirectEdit: (settings: PresentationSettings, imageUrls?: string[]) => void;
  onBack?: () => void;
  isLoading: boolean;
}

const focusNames: Record<string, string> = {
  summary: "概括摘要",
  detailed: "详细内容",
  visual: "视觉为主"
};

const InputPanel: React.FC<Props> = ({ onNext, onDirectEdit, onBack, isLoading }) => {
  const [text, setText] = useState('');
  const [pageCount, setPageCount] = useState<number>(DEFAULT_PAGE_COUNT);
  const [style, setStyle] = useState<PresentationSettings['style']>('playful');
  const [focus, setFocus] = useState<PresentationSettings['focus']>('detailed');
  const [enableVoice, setEnableVoice] = useState(true);
  const [voiceType, setVoiceType] = useState<VoiceType>(DEFAULT_VOICE_TYPE);
  const [narrationStyle, setNarrationStyle] = useState<NarrationStyle>(DEFAULT_NARRATION_STYLE);
  const [copywritingStyles, setCopywritingStyles] = useState<CopywritingStyle[]>([]);
  const [subject, setSubject] = useState<Subject>("全部");
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customStyleName, setCustomStyleName] = useState<string>('');
  const [customStylePrompt, setCustomStylePrompt] = useState<string>('');
  const [aiMode, setAiMode] = useState<'free' | 'rayleigh'>('free'); // AI模式选择
  const [isUploadingImages, setIsUploadingImages] = useState(false); // 图片上传中
  const [isUploadingFile, setIsUploadingFile] = useState(false); // 文件上传/解析中
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]); // 已上传的图片URLs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 统一处理文件上传（支持 txt、md、pdf）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // 根据文件类型选择不同的处理方式
    if (fileName.endsWith('.pdf')) {
      // PDF 文件：上传到云存储 → 解析 → 清理格式
      setIsUploadingFile(true);
      try {
        console.log('开始处理PDF:', file.name);
        const markdown = await uploadAndParsePdf(file);
        setText(markdown);
        console.log('PDF解析完成，内容长度:', markdown.length);
      } catch (error) {
        console.error('PDF处理失败:', error);
        alert('PDF处理失败: ' + (error as Error).message);
      } finally {
        setIsUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      // txt/md 文件：直接读取文本内容
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setText(result);
      };
      reader.readAsText(file);
    } else {
      alert('不支持的文件格式，请上传 .txt、.md 或 .pdf 文件');
    }
  };

  // 获取当前学科对应的可用风格
  const availableStyles = SUBJECT_STYLE_MAP[subject];

  const handleSubmit = () => {
    if (!text.trim()) return;
    const settings: PresentationSettings = {
      targetPageCount: pageCount,
      style,
      focus,
      customStyleName: style === 'custom' ? customStyleName : undefined,
      customStylePrompt: style === 'custom' ? customStylePrompt : undefined,
      enableVoice,
      voiceType: enableVoice ? voiceType : undefined,
      narrationStyle: enableVoice ? narrationStyle : undefined,
      copywritingStyles: enableVoice && copywritingStyles.length > 0 ? copywritingStyles : undefined,
      aiMode
    };
    onNext(text, settings);
  };

  // 当切换学科时，如果当前选中的风格不在新学科的可用列表中，则重置为第一个可用风格
  const handleSubjectChange = (newSubject: Subject) => {
    setSubject(newSubject);
    const newAvailableStyles = SUBJECT_STYLE_MAP[newSubject];
    if (!newAvailableStyles.includes(style)) {
      setStyle(newAvailableStyles[0] as PresentationSettings['style']);
    }
  };

  // 处理风格选择
  const handleStyleClick = (selectedStyle: string) => {
    if (selectedStyle === 'custom') {
      setShowCustomDialog(true);
    } else {
      setStyle(selectedStyle as PresentationSettings['style']);
    }
  };

  // 处理自定义风格确认
  const handleCustomStyleConfirm = (styleName: string, stylePrompt: string) => {
    setCustomStyleName(styleName);
    setCustomStylePrompt(stylePrompt);
    setStyle('custom');
    setShowCustomDialog(false);
  };

  // 处理图片选择
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const imageUrls: string[] = [];

    try {
      // 上传所有选中的图片
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          alert(`文件 "${file.name}" 不是有效的图片格式`);
          continue;
        }

        console.log(`上传第 ${i + 1}/${files.length} 张图片: ${file.name}`);
        const url = await uploadImage(file);
        imageUrls.push(url);
      }

      console.log(`成功上传 ${imageUrls.length} 张图片`);
      setUploadedImageUrls(imageUrls);

      // 根据图片数量调整页数
      if (imageUrls.length > pageCount) {
        setPageCount(imageUrls.length);
      }

      alert(`成功上传 ${imageUrls.length} 张图片！`);

    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败: ' + (error as Error).message);
    } finally {
      setIsUploadingImages(false);
      // 清空文件选择，允许重新选择
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // 处理直接编辑
  const handleDirectEditClick = () => {
    const settings: PresentationSettings = {
      targetPageCount: pageCount,
      style,
      focus,
      customStyleName: style === 'custom' ? customStyleName : undefined,
      customStylePrompt: style === 'custom' ? customStylePrompt : undefined,
      enableVoice,
      voiceType: enableVoice ? voiceType : undefined,
      narrationStyle: enableVoice ? narrationStyle : undefined,
      copywritingStyles: enableVoice && copywritingStyles.length > 0 ? copywritingStyles : undefined,
      aiMode
    };
    onDirectEdit(settings, uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined);
  };

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-lg animate-fade-in border border-slate-100">
      {/* 返回按钮 */}
      {onBack && (
        <div className="mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回课件中心
          </button>
        </div>
      )}

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">中小学课件制作助手</h2>
        <p className="text-slate-500">上传教案、课文或知识点，AI 自动生成适合课堂教学的 PPT。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700">教学内容材料</label>
            {/* AI模式选择 */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setAiMode('free')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  aiMode === 'free'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                自由输入
              </button>
              <button
                onClick={() => setAiMode('rayleigh')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  aiMode === 'rayleigh'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                雷老师教学认知引擎
              </button>
            </div>
          </div>

          <div className="relative">
             <textarea
              className="w-full h-64 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-slate-50"
              placeholder="在此粘贴您的教案内容、课文原文或知识点总结... (支持 Markdown 格式)"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {text.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">粘贴文本 或 使用下方按钮上传</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  isUploadingFile
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {isUploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    上传文档
                  </>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.md,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImages}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  isUploadingImages
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-700'
                }`}
              >
                {isUploadingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4" />
                    加载本地图片
                  </>
                )}
              </button>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              {uploadedImageUrls.length > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  已上传 {uploadedImageUrls.length} 张图片
                </span>
              )}
              <span className="text-xs text-slate-400">当前字数: {text.length}</span>
            </div>
          </div>

          {/* 图片加载提示 */}
          {uploadedImageUrls.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                已上传 {uploadedImageUrls.length} 张图片。
                {uploadedImageUrls.length > pageCount && (
                  <span className="font-medium"> 将创建 {uploadedImageUrls.length} 页幻灯片（多于设置的 {pageCount} 页）</span>
                )}
                {uploadedImageUrls.length <= pageCount && (
                  <span> 前 {uploadedImageUrls.length} 页将包含图片，其余页为空白</span>
                )}
              </p>
            </div>
          )}

          {/* 预计页数 - 移到左边 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              预计页数: <span className="text-blue-600">{pageCount} 页</span>
              {uploadedImageUrls.length > pageCount && (
                <span className="text-xs text-green-600 ml-2">
                  (将自动调整为 {uploadedImageUrls.length} 页)
                </span>
              )}
            </label>
            <input
              type="range"
              min="3"
              max="50"
              value={pageCount}
              onChange={(e) => setPageCount(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>3</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* 内容侧重 - 移到左边 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">内容侧重</label>
            <div className="flex bg-white p-1 rounded-lg border border-slate-200">
              {(['summary', 'detailed', 'visual'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                    focus === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {focusNames[f] || f}
                </button>
              ))}
            </div>
          </div>

          {/* 语音合成选项 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">语音合成</label>

            {/* 语音合成开关 */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
              <button
                onClick={() => setEnableVoice(!enableVoice)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableVoice ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableVoice ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-slate-600">
                {enableVoice ? '已启用' : '未启用'}（为每页生成语音文稿）
              </span>
            </div>

            {/* 音色和口播风格选择（仅在启用语音合成时显示） */}
            {enableVoice && (
              <>
                {/* 音色和讲解风格并排 */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 音色选择 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">选择音色</label>
                    <select
                      value={voiceType}
                      onChange={(e) => setVoiceType(e.target.value as VoiceType)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    >
                      {Object.entries(VOICE_TYPES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 讲解风格选择 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">讲解风格</label>
                    <select
                      value={narrationStyle}
                      onChange={(e) => setNarrationStyle(e.target.value as NarrationStyle)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    >
                      {Object.entries(NARRATION_STYLES).map(([code, config]) => (
                        <option key={code} value={code}>
                          {config.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 显示当前选中讲解风格的提示 */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-medium text-blue-700">讲解风格：</span>
                    {NARRATION_STYLES[narrationStyle].prompt}
                  </p>
                </div>

                {/* 文案风格多选 */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    文案风格 <span className="text-slate-400">（可多选，影响讲解稿内容特点）</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(COPYWRITING_STYLES).map(([code, config]) => {
                      const isSelected = copywritingStyles.includes(code as CopywritingStyle);
                      return (
                        <button
                          key={code}
                          onClick={() => {
                            setCopywritingStyles(prev =>
                              isSelected
                                ? prev.filter(s => s !== code)
                                : [...prev, code as CopywritingStyle]
                            );
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                          }`}
                          title={config.prompt}
                        >
                          {config.name}
                        </button>
                      );
                    })}
                  </div>
                  {copywritingStyles.length > 0 && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-medium text-purple-700">已选文案风格：</span>
                        {copywritingStyles.map(s => COPYWRITING_STYLES[s].name).join('、')}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-6 bg-slate-50 p-6 rounded-lg border border-slate-100">

          {/* 适用学科 - 标签和选择器在同一行 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">适用学科</label>
            <select
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value as Subject)}
              className="flex-1 p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            >
              {SUBJECTS.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* 课件风格 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              课件风格 <span className="text-xs text-slate-400">({availableStyles.length}个可选)</span>
            </label>
            <div className="grid grid-cols-4 gap-3 max-h-[32rem] overflow-y-auto pr-1">
              {availableStyles.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStyleClick(s)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${
                    style === s
                      ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500'
                      : 'border-slate-300 bg-white hover:border-blue-400 hover:shadow-sm'
                  }`}
                  title={s === 'custom' && customStyleName ? `自定义: ${customStyleName}` : undefined}
                >
                  {/* 预览图 */}
                  <div className={`w-full aspect-video rounded overflow-hidden ${
                    style === s ? 'ring-2 ring-blue-500' : ''
                  }`}>
                    {STYLE_IMAGE_URLS[s] ? (
                      <img
                        src={STYLE_IMAGE_URLS[s]}
                        alt={STYLE_NAMES[s] || s}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // 图片加载失败时显示占位符
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'placeholder w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center';
                            placeholder.innerHTML = '<span class="text-slate-400 text-xs">暂无预览</span>';
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-xs">暂无预览</span>
                      </div>
                    )}
                  </div>
                  {/* 风格名称 */}
                  <span className={`text-xs font-medium text-center ${
                    style === s ? 'text-blue-700' : 'text-slate-700'
                  }`}>
                    {s === 'custom' && customStyleName ? customStyleName : (STYLE_NAMES[s] || s)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || isLoading}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold text-white transition-all transform active:scale-[0.98] ${
                !text.trim() || isLoading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在备课中...
                </>
              ) : (
                <>
                  生成教学大纲
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={handleDirectEditClick}
              disabled={isLoading}
              className={`px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-slate-700 bg-white border-2 border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all transform active:scale-[0.98] ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              }`}
              title="跳过大纲生成，直接进入编辑"
            >
              <Edit3 className="w-5 h-5" />
              直接编辑
            </button>
          </div>
        </div>
      </div>

      {/* 自定义风格对话框 */}
      {showCustomDialog && (
        <CustomStyleDialog
          onClose={() => setShowCustomDialog(false)}
          onConfirm={handleCustomStyleConfirm}
        />
      )}
    </div>
  );
};

export default InputPanel;