import React, { useState, useEffect } from 'react';
import { Plus, Presentation, Loader2, FileX, Search, AlertCircle } from 'lucide-react';
import CoursewareCard, { CoursewareData } from './CoursewareCard';
import CourseMethodTreeModal from './CourseMethodTreeModal';
import {
  getAllCourseware,
  getSchoolCourseware,
  getMyCourseware,
  toggleCoursewareShare,
  deleteCourseware,
  addToCourseMethod,
  renameCourseware
} from '../services/coursewareService';
import { getCategories, Category } from '../services/cloudSaveService';
import globalConfig from '../utils/globalConfig';

type CoursewareTab = 'all' | 'school' | 'my';

interface CoursewareCenterProps {
  onCreateNew: () => void;
  onViewCourseware: (id: string) => void;
  onEditCourseware: (id: string) => void;
}

export default function CoursewareCenter({
  onCreateNew,
  onViewCourseware,
  onEditCourseware
}: CoursewareCenterProps) {
  const [activeTab, setActiveTab] = useState<CoursewareTab>('all');
  const [coursewareList, setCoursewareList] = useState<CoursewareData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12); // 每页显示12个
  const [totalCount, setTotalCount] = useState(0);

  // 分类状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [loadingCategories, setLoadingCategories] = useState(false);

  // 加入课表弹窗状态
  const [courseMethodModalOpen, setCourseMethodModalOpen] = useState(false);
  const [selectedCoursewareForMethod, setSelectedCoursewareForMethod] = useState<{ id: string; name: string } | null>(null);

  // 获取当前用户ID
  const currentUserId = globalConfig.get('userid');

  // 加载分类列表
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const result = await getCategories();
      setCategories(result.items);
    } catch (err: any) {
      console.error('加载分类列表失败:', err);
      // 分类加载失败不影响课件列表显示
    } finally {
      setLoadingCategories(false);
    }
  };

  // 当标签切换时，重置到第一页并清空分类筛选
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedCategoryId('');
  }, [activeTab]);

  // 当分类切换时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId]);

  // 搜索防抖状态
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // 搜索防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // 搜索时重置到第一页
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 加载课件数据
  useEffect(() => {
    loadCourseware();
  }, [activeTab, currentPage, selectedCategoryId, debouncedSearchQuery]);

  const loadCourseware = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        pageIndex: currentPage,
        pageSize: pageSize,
        sorting: 'creationTime desc', // 按发布时间最新排序
        categoryId: selectedCategoryId || undefined,
        filter: debouncedSearchQuery || undefined
      };

      let result;
      switch (activeTab) {
        case 'all':
          result = await getAllCourseware(params);
          break;
        case 'school':
          result = await getSchoolCourseware(params);
          break;
        case 'my':
          result = await getMyCourseware(params);
          break;
        default:
          result = { items: [], totalCount: 0 };
      }

      // 对于"所有课件"和"校区课件"，只显示分享的课件（isShare !== false）
      let filteredItems = result.items;
      if (activeTab === 'all' || activeTab === 'school') {
        filteredItems = result.items.filter(item => item.isShare !== false);
      }

      setCoursewareList(filteredItems);
      // 使用 API 返回的总数，以便正确计算分页
      setTotalCount(result.totalCount);
    } catch (err: any) {
      console.error('加载课件列表失败:', err);
      setError(err.message || '加载课件列表失败，请重试');
      setCoursewareList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 切换课件分享状态（锁定/解锁）
  const handleToggleLock = async (id: string, currentShareState: boolean) => {
    try {
      // 切换分享状态：当前是分享(true)则改为不分享(false)，反之亦然
      const newShareState = !currentShareState;
      await toggleCoursewareShare(id, newShareState);

      // 更新本地课件列表中的分享状态
      setCoursewareList(prevList =>
        prevList.map(courseware =>
          courseware.id === id
            ? { ...courseware, isShare: newShareState }
            : courseware
        )
      );

      console.log(`课件 ${id} 已${newShareState ? '解锁（分享）' : '锁定（不分享）'}`);
    } catch (err: any) {
      console.error('切换分享状态失败:', err);
      alert(err.message || '切换分享状态失败，请重试');
    }
  };

  // 删除课件
  const handleDeleteCourseware = async (id: string) => {
    try {
      await deleteCourseware(id);

      // 从列表中移除已删除的课件
      setCoursewareList(prevList => prevList.filter(courseware => courseware.id !== id));
      setTotalCount(prev => prev - 1);

      console.log(`课件 ${id} 已删除`);
    } catch (err: any) {
      console.error('删除课件失败:', err);
      alert(err.message || '删除课件失败，请重试');
    }
  };

  // 重命名课件
  const handleRenameCourseware = async (id: string, newName: string) => {
    try {
      await renameCourseware(id, newName);
      setCoursewareList(prevList =>
        prevList.map(courseware =>
          courseware.id === id ? { ...courseware, name: newName } : courseware
        )
      );
    } catch (err: any) {
      console.error('重命名课件失败:', err);
      alert(err.message || '重命名课件失败，请重试');
    }
  };

  // 打开加入课表弹窗
  const handleOpenCourseMethodModal = (id: string, name: string) => {
    setSelectedCoursewareForMethod({ id, name });
    setCourseMethodModalOpen(true);
  };

  // 关闭加入课表弹窗
  const handleCloseCourseMethodModal = () => {
    setCourseMethodModalOpen(false);
    setSelectedCoursewareForMethod(null);
  };

  // 确认加入课表
  const handleConfirmAddToCourseMethod = async (selectedIds: string[]) => {
    if (!selectedCoursewareForMethod || selectedIds.length === 0) return;

    try {
      await addToCourseMethod({
        aiCourseMethodIds: selectedIds,
        aiPPTId: selectedCoursewareForMethod.id,
        targetType: 3, // aiPPTX 类型为 3
        name: selectedCoursewareForMethod.name
      });

      alert('已成功加入课表');
      handleCloseCourseMethodModal();
    } catch (err: any) {
      console.error('加入课表失败:', err);
      alert(err.message || '加入课表失败，请重试');
    }
  };

  // 使用后端搜索，不再需要前端过滤
  const displayCourseware = coursewareList;

  const tabs = [
    { key: 'all' as CoursewareTab, label: '所有课件' },
    { key: 'school' as CoursewareTab, label: '本校区课件' },
    { key: 'my' as CoursewareTab, label: '我的课件' }
  ];

  // 计算总页数
  const totalPages = Math.ceil(totalCount / pageSize);

  // 分页处理
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 生成分页按钮数组
  const getPaginationButtons = () => {
    const buttons: (number | string)[] = [];
    const maxButtons = 7; // 最多显示7个按钮

    if (totalPages <= maxButtons) {
      // 总页数少，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else {
      // 总页数多，显示省略号
      if (currentPage <= 3) {
        // 当前页靠前
        for (let i = 1; i <= 5; i++) buttons.push(i);
        buttons.push('...');
        buttons.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // 当前页靠后
        buttons.push(1);
        buttons.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) buttons.push(i);
      } else {
        // 当前页在中间
        buttons.push(1);
        buttons.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) buttons.push(i);
        buttons.push('...');
        buttons.push(totalPages);
      }
    }

    return buttons;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Presentation className="w-7 h-7" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  AI 备课工具
                </h1>
              </div>
              <div className="text-sm text-slate-500 ml-2">
                Powered by AI
              </div>
            </div>

            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              生成课件
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs and Search */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索课件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          {loadingCategories ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>加载分类中...</span>
            </div>
          ) : categories.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1">
                <button
                  onClick={() => setSelectedCategoryId('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategoryId === ''
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  全部
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategoryId === category.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              关闭
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : displayCourseware.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-slate-200">
            <FileX className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              {debouncedSearchQuery ? '未找到相关课件' : '暂无课件'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {debouncedSearchQuery ? '试试其他关键词' : '点击右上角"生成课件"按钮创建第一个课件'}
            </p>
            {!debouncedSearchQuery && (
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                生成课件
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayCourseware.map(courseware => (
                <CoursewareCard
                  key={courseware.id}
                  courseware={courseware}
                  currentUserId={currentUserId}
                  onView={onViewCourseware}
                  onEdit={onEditCourseware}
                  onDelete={activeTab === 'my' ? handleDeleteCourseware : undefined}
                  onToggleLock={activeTab === 'my' ? handleToggleLock : undefined}
                  onAddToCourseMethod={(activeTab === 'my' || activeTab === 'all') ? handleOpenCourseMethodModal : undefined}
                  onRename={activeTab === 'my' ? handleRenameCourseware : undefined}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {/* 上一页 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>

                {/* 页码按钮 */}
                {getPaginationButtons().map((btn, index) => (
                  btn === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={btn}
                      onClick={() => handlePageChange(btn as number)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === btn
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {btn}
                    </button>
                  )
                ))}

                {/* 下一页 */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}

            {/* 统计信息 */}
            <div className="mt-4 text-center text-sm text-slate-500">
              共 {totalCount} 个课件
              {debouncedSearchQuery && ' · 搜索结果'}
              {totalPages > 1 && ` · 第 ${currentPage} / ${totalPages} 页`}
            </div>
          </>
        )}
      </div>

      {/* 加入课表弹窗 */}
      <CourseMethodTreeModal
        isOpen={courseMethodModalOpen}
        onClose={handleCloseCourseMethodModal}
        onConfirm={handleConfirmAddToCourseMethod}
        title="选择目录"
      />
    </div>
  );
}
