import React, { useState, useEffect } from 'react';
import { X, Loader2, Cloud, FolderOpen } from 'lucide-react';
import globalConfig from '../utils/globalConfig';

interface Category {
  id: string;
  name: string;
  fullName: string;
  code: string;
  level: number;
  children: Category[];
}

interface Props {
  onClose: () => void;
  onSave: (categoryId: string, categoryName: string) => Promise<void>;
}

export const CloudSaveDialog: React.FC<Props> = ({ onClose, onSave }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl = globalConfig.getApiUrl('/app/aiApplicationCategory/public?Sorting=id%20desc&PageIndex=1&PageSize=100');
        const apiToken = globalConfig.getToken() || '';

        console.log('获取分类列表:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`获取分类失败 (${response.status})`);
        }

        const result = await response.json();
        console.log('分类列表:', result);

        if (result.items && Array.isArray(result.items)) {
          setCategories(result.items);
        } else {
          throw new Error('分类数据格式错误');
        }
      } catch (error) {
        console.error('获取分类失败:', error);
        setError('获取分类失败: ' + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSave = async () => {
    if (!selectedCategory) {
      alert('请选择一个分类');
      return;
    }

    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return;

    setIsSaving(true);
    try {
      await onSave(selectedCategory, category.name);
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">保存到云端</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">⚠️ {error}</div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-slate-500">加载分类中...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无分类</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                请选择课件要保存的分类：
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    disabled={isSaving}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCategory === category.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className={`w-5 h-5 ${
                        selectedCategory === category.id ? 'text-blue-600' : 'text-slate-400'
                      }`} />
                      <span className={`font-medium ${
                        selectedCategory === category.id ? 'text-blue-700' : 'text-slate-700'
                      }`}>
                        {category.name}
                      </span>
                    </div>
                    {category.count !== undefined && (
                      <div className="text-xs text-slate-400 mt-1">
                        {category.count} 个课件
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        {!error && !isLoading && categories.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedCategory || isSaving}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                !selectedCategory || isSaving
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </span>
              ) : (
                '确认保存'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
