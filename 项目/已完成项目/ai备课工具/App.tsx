import React, { useState, useEffect } from 'react';
import { AppStage, Slide, PresentationSettings } from './types';
import InputPanel from './components/InputPanel';
import OutlineEditor from './components/OutlineEditor';
import WorkbenchStage from './components/WorkbenchStage';
import CoursewareCenter from './components/CoursewareCenter';
import { generateOutline } from './services/geminiService';
import { getCoursewareDetail } from './services/coursewareService';
import { Key } from 'lucide-react';
import globalConfig from './utils/globalConfig';

// 获取应用的 base 路径（从 import.meta.env 中读取，Vite 会自动注入）
const BASE_PATH = import.meta.env.BASE_URL || '/';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [stage, setStage] = useState<AppStage>(AppStage.COURSEWARE_CENTER);
  const [settings, setSettings] = useState<PresentationSettings>({
    targetPageCount: 10,
    style: 'playful',
    focus: 'summary'
  });
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑模式状态
  type EditMode = 'new' | 'edit' | 'view';
  const [editMode, setEditMode] = useState<EditMode>('new');
  const [currentCoursewareId, setCurrentCoursewareId] = useState<string | null>(null);
  const [currentCoursewareData, setCurrentCoursewareData] = useState<any>(null);

  // URL初始化完成标记 - 防止因时序问题导致跳转
  const [urlInitialized, setUrlInitialized] = useState(false);

  // 在组件加载时立即保存原始URL（在任何useEffect执行前）
  // 这样可以避免URL同步useEffect把Hash改掉后导致路径解析错误
  const [initialUrlInfo] = useState(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    console.log('保存初始URL信息:', { hash, search });
    return { hash, search };
  });

  // 检测是否在iframe中运行（供其他逻辑使用）
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    // 初始化全局配置（解析URL参数）
    globalConfig.initialize();
    console.log('URL参数已加载:', globalConfig.getAll());

    // 检查初始历史状态，如果存在则恢复
    if (window.history.state) {
      const state = window.history.state;
      console.log('恢复历史状态:', state);
      if (state.stage) setStage(state.stage);
      if (state.editMode) setEditMode(state.editMode);
      if (state.currentCoursewareId !== undefined) {
        setCurrentCoursewareId(state.currentCoursewareId);
      }
    }

    const checkKey = async () => {
      if (window.aistudio) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        // Fallback for environments without the wrapper
        setHasApiKey(true);
      }
    };
    checkKey();

    // 监听浏览器前进/后退按钮
    const handlePopState = (event: PopStateEvent) => {
      console.log('浏览器回退/前进，状态:', event.state);
      if (event.state && event.state.stage) {
        setStage(event.state.stage as AppStage);
        // 如果有课件相关状态，也恢复
        if (event.state.editMode) setEditMode(event.state.editMode);
        if (event.state.currentCoursewareId !== undefined) {
          setCurrentCoursewareId(event.state.currentCoursewareId);
        }
      }
    };

    // 监听Hash变化（用于Hash路由模式）
    const handleHashChange = () => {
      console.log('Hash变化:', window.location.hash);
      // Hash变化时可以触发页面状态更新，但我们已经通过popstate处理了
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    // 清理监听器
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // 从URL加载课件（仅在初次加载时）
  useEffect(() => {
    const loadCoursewareFromUrl = async () => {
      try {
        // 使用保存的初始URL信息，而不是当前的window.location
        // 因为URL同步useEffect可能已经把Hash改掉了
        const hash = initialUrlInfo.hash;
        const search = initialUrlInfo.search;
        console.log('开始检查URL中的课件ID...', 'Hash:', hash, 'Search:', search);

        // 从Hash或Search参数中获取课件ID
        let urlParams: URLSearchParams;
        let pathFromHash = '';

        if (hash && hash.includes('?')) {
          // Hash模式: #/preview?id=xxx
          const [path, queryString] = hash.substring(1).split('?'); // 去掉 # 号
          pathFromHash = path;
          urlParams = new URLSearchParams(queryString);
          console.log('Hash模式(带参数):', '路径=', path, '参数=', queryString);
        } else if (hash) {
          // Hash模式但没有参数: #/preview
          pathFromHash = hash.substring(1);
          urlParams = new URLSearchParams(search);
          console.log('Hash模式(无参数):', '路径=', pathFromHash);
        } else {
          // 普通模式: /preview?id=xxx
          urlParams = new URLSearchParams(search);
          console.log('普通模式');
        }

        const coursewareIdFromUrl = urlParams.get('id');
        console.log('从URL参数中获取的课件ID:', coursewareIdFromUrl);

        if (!coursewareIdFromUrl) {
          console.log('URL中没有课件ID，跳过加载');
          return; // 没有课件ID，不需要加载
        }

        // 确定路径
        let relativePath = '';
        if (pathFromHash) {
          relativePath = pathFromHash;
        } else {
          const fullPath = window.location.pathname;
          relativePath = fullPath.replace(BASE_PATH, '/').replace(/\/+/g, '/');
        }

        console.log('从URL加载课件:', coursewareIdFromUrl, 'Hash:', hash, '解析的路径:', relativePath);

        if (relativePath === '/preview' || relativePath === 'preview') {
          // 浏览模式
          console.log('进入浏览模式，加载课件...');
          await handleViewCourseware(coursewareIdFromUrl);
        } else if (relativePath === '/workbench' || relativePath === 'workbench') {
          // 编辑模式
          console.log('进入编辑模式，加载课件...');
          await handleEditCourseware(coursewareIdFromUrl);
        } else {
          console.log('未匹配到任何路径模式，当前路径:', relativePath);
        }
      } catch (err) {
        console.error('URL加载课件出错:', err);
      } finally {
        // 标记URL初始化完成（无论成功、失败、或无需加载都要标记）
        setUrlInitialized(true);
      }
    };

    loadCoursewareFromUrl();
  }, []); // 只在组件挂载时执行一次

  // 监听 stage 变化，同步更新 URL（所有参数都放在Hash后面）
  useEffect(() => {
    // 等待URL初始化完成后再同步URL
    // 这样可以确保loadCoursewareFromUrl先读取到正确的初始URL
    if (!urlInitialized) {
      console.log('URL初始化未完成，跳过URL同步');
      return;
    }

    // 获取现有参数
    const existingParams: Record<string, string> = {};

    // 从 Hash 中获取现有参数
    const hash = window.location.hash;
    if (hash && hash.includes('?')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      params.forEach((value, key) => {
        existingParams[key] = value;
      });
    }

    // 如果 Hash 中没有参数，尝试从主 URL 中获取
    if (Object.keys(existingParams).length === 0) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.forEach((value, key) => {
        existingParams[key] = value;
      });
    }

    // 构建新的路径
    let routePath = '';

    if (stage === AppStage.WORKBENCH && editMode === 'view') {
      routePath = 'preview'; // 浏览模式使用独立路径
    } else {
      const stagePathMap: Record<AppStage, string> = {
        [AppStage.COURSEWARE_CENTER]: 'courseware-center',
        [AppStage.INPUT]: 'input',
        [AppStage.OUTLINE]: 'outline',
        [AppStage.WORKBENCH]: 'workbench',
        [AppStage.EXPORT]: 'export'
      };
      routePath = stagePathMap[stage] || '';
    }

    // 构建参数，确保 id 在最前面
    const allParams = new URLSearchParams();

    // 1. 首先添加 id（如果存在）
    if (currentCoursewareId) {
      allParams.set('id', currentCoursewareId);
    }

    // 2. 然后添加其他参数
    Object.keys(existingParams).forEach((key) => {
      if (key !== 'id') { // 跳过 id，因为已经添加了
        allParams.set(key, existingParams[key]);
      }
    });

    // 使用Hash模式构建URL：所有参数都在 Hash 后面
    // base路径 + / + #/ + 路径 + 所有参数（id在最前）
    // 注意：必须保留尾部斜杠，否则浏览器可能无法正确加载资源
    const basePath = BASE_PATH.endsWith('/') ? BASE_PATH : BASE_PATH + '/';
    const cleanBasePath = basePath.replace(/\/$/, ''); // 移除尾部斜杠，后面会加回来
    const queryString = allParams.toString();

    let newUrl = cleanBasePath;

    // 添加Hash路径和参数（在base路径后加/再加#）
    if (routePath) {
      newUrl += '/#/' + routePath;
      if (queryString) {
        newUrl += '?' + queryString;
      }
    } else if (queryString) {
      newUrl += '/#/?' + queryString;
    } else {
      newUrl += '/';
    }

    // 构建状态对象
    const state = {
      stage,
      editMode,
      currentCoursewareId,
    };

    // 使用 replaceState 更新 URL
    window.history.replaceState(state, '', newUrl);

    console.log('URL已更新(Hash模式):', newUrl, '路径:', routePath, '所有参数:', queryString, '状态:', state);
  }, [stage, editMode, currentCoursewareId, urlInitialized]);

  const handleSelectKey = async () => {
    if (!window.aistudio) return;
    try {
      await window.aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasApiKey(true);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("API Key 选择失败，请重试。");
      }
    }
  };

  const handleInputSubmit = async (text: string, newSettings: PresentationSettings) => {
    setIsLoading(true);
    setError(null);
    setSettings(newSettings);

    // 重置为新课件状态，清除之前打开的课件信息
    setEditMode('new');
    setCurrentCoursewareId(null);
    setCurrentCoursewareData(null);

    try {
      const generatedSlides = await generateOutline(text, newSettings);

      const fullSlides: Slide[] = generatedSlides.map(s => ({
        ...s,
        status: 'PENDING' // Add status explicitly here
      })) as Slide[];

      setSlides(fullSlides);
      setStage(AppStage.OUTLINE);
    } catch (err: any) {
      setError(err.message || "大纲生成失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutlineConfirm = () => {
    setStage(AppStage.WORKBENCH);
  };

  const handleDirectEdit = (newSettings: PresentationSettings, imageUrls?: string[]) => {
    setSettings(newSettings);

    // 重置为新课件状态，清除之前打开的课件信息
    setEditMode('new');
    setCurrentCoursewareId(null);
    setCurrentCoursewareData(null);

    // 如果有上传的图片，根据图片数量和目标页数决定最终幻灯片数量
    let finalPageCount = newSettings.targetPageCount;
    if (imageUrls && imageUrls.length > 0) {
      // 如果图片数量大于目标页数，使用图片数量
      finalPageCount = Math.max(imageUrls.length, newSettings.targetPageCount);
    }

    // 创建幻灯片
    const emptySlides: Slide[] = Array.from({ length: finalPageCount }, (_, i) => {
      const slide: Slide = {
        id: `slide-${i + 1}`,
        pageNumber: i + 1,
        title: `幻灯片 ${i + 1}`,
        content: '',
        visualPrompt: '',
        status: 'PENDING'
      } as Slide;

      // 如果有对应的图片，设置图片URL和状态
      if (imageUrls && imageUrls[i]) {
        slide.imageUrl = imageUrls[i];
        slide.status = 'COMPLETED';
      }

      return slide;
    });

    setSlides(emptySlides);
    setStage(AppStage.WORKBENCH);
  };

  // 从课件中心跳转到课件生成页面
  const handleCreateNew = () => {
    // 重置为新课件状态，清除之前打开的课件信息
    setEditMode('new');
    setCurrentCoursewareId(null);
    setCurrentCoursewareData(null);
    setSlides([]);

    setStage(AppStage.INPUT);
  };

  // 返回课件中心
  const handleBackToCoursewareCenter = () => {
    setStage(AppStage.COURSEWARE_CENTER);
  };

  // 查看课件 - 加载课件数据并进入工作台（查看模式，保存时另存为新课件）
  const handleViewCourseware = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('查看课件:', id);
      const coursewareData = await getCoursewareDetail(id);

      // 保存课件数据
      setCurrentCoursewareData(coursewareData);
      setCurrentCoursewareId(id);
      setEditMode('view'); // 查看模式

      // 解析课件数据
      if (coursewareData.pptData) {
        let parsedData;

        // 判断 pptData 是 URL 还是 JSON 字符串
        if (coursewareData.pptData.startsWith('http://') || coursewareData.pptData.startsWith('https://')) {
          // 如果是 URL，先下载文件
          console.log('下载课件数据:', coursewareData.pptData);
          const response = await fetch(coursewareData.pptData);
          if (!response.ok) {
            throw new Error('下载课件数据失败');
          }
          parsedData = await response.json();
        } else {
          // 如果是 JSON 字符串，直接解析
          parsedData = JSON.parse(coursewareData.pptData);
        }

        if (parsedData.slides && Array.isArray(parsedData.slides)) {
          setSlides(parsedData.slides);
        }

        if (parsedData.settings) {
          setSettings(parsedData.settings);
        }
      }

      setStage(AppStage.WORKBENCH);
    } catch (err: any) {
      console.error('加载课件失败:', err);
      setError(err.message || '加载课件失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 编辑课件 - 加载课件数据并进入工作台（编辑模式，保存时更新原课件）
  const handleEditCourseware = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('编辑课件:', id);
      const coursewareData = await getCoursewareDetail(id);

      // 保存课件数据
      setCurrentCoursewareData(coursewareData);
      setCurrentCoursewareId(id);
      setEditMode('edit'); // 编辑模式

      // 解析课件数据
      if (coursewareData.pptData) {
        let parsedData;

        // 判断 pptData 是 URL 还是 JSON 字符串
        if (coursewareData.pptData.startsWith('http://') || coursewareData.pptData.startsWith('https://')) {
          // 如果是 URL，先下载文件
          console.log('下载课件数据:', coursewareData.pptData);
          const response = await fetch(coursewareData.pptData);
          if (!response.ok) {
            throw new Error('下载课件数据失败');
          }
          parsedData = await response.json();
        } else {
          // 如果是 JSON 字符串，直接解析
          parsedData = JSON.parse(coursewareData.pptData);
        }

        if (parsedData.slides && Array.isArray(parsedData.slides)) {
          setSlides(parsedData.slides);
        }

        if (parsedData.settings) {
          setSettings(parsedData.settings);
        }
      }

      setStage(AppStage.WORKBENCH);
    } catch (err: any) {
      console.error('加载课件失败:', err);
      setError(err.message || '加载课件失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">配置 API 密钥</h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            本应用使用 AI 模型生成高质量教学课件图片。
            <br />
            请点击下方按钮选择您的 API 密钥。
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md mb-4"
          >
            选择 API 密钥
          </button>
          <p className="text-xs text-slate-400 text-center">
            如需配置 API，请联系管理员
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <main className={stage === AppStage.WORKBENCH || stage === AppStage.COURSEWARE_CENTER ? '' : 'max-w-6xl mx-auto px-6 pb-10'}>

        {error && stage !== AppStage.COURSEWARE_CENTER && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
             <span>{error}</span>
             <button onClick={() => setError(null)} className="text-sm font-bold hover:underline">关闭</button>
          </div>
        )}

        {stage === AppStage.COURSEWARE_CENTER && (
          <CoursewareCenter
            onCreateNew={handleCreateNew}
            onViewCourseware={handleViewCourseware}
            onEditCourseware={handleEditCourseware}
          />
        )}

        {stage === AppStage.INPUT && (
          <InputPanel
            onNext={handleInputSubmit}
            onDirectEdit={handleDirectEdit}
            onBack={handleBackToCoursewareCenter}
            isLoading={isLoading}
          />
        )}

        {stage === AppStage.OUTLINE && (
          <OutlineEditor
            slides={slides}
            setSlides={setSlides}
            onConfirm={handleOutlineConfirm}
          />
        )}

        {stage === AppStage.WORKBENCH && (
          <WorkbenchStage
            slides={slides}
            setSlides={setSlides}
            settings={settings}
            editMode={editMode}
            currentCoursewareId={currentCoursewareId}
            currentCoursewareData={currentCoursewareData}
            onBack={() => setStage(AppStage.OUTLINE)}
            onBackToCoursewareCenter={handleBackToCoursewareCenter}
          />
        )}
      </main>
    </div>
  );
};

export default App;