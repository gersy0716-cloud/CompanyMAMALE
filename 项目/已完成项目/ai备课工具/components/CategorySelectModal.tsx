import React, { useState, useEffect } from 'react';
import { X, Loader2, FolderOpen } from 'lucide-react';
import { getCategories, Category } from '../services/cloudSaveService';

interface CategorySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: string, categoryName: string) => void;
}

export default function CategorySelectModal({
  isOpen,
  onClose,
  onSelectCategory
}: CategorySelectModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // 加载分类列表
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCategories();
      setCategories(response.items);
    } catch (err) {
      setError((err as Error).message);
      console.error('加载分类失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategoryId(category.id);
  };

  const handleConfirm = () => {
    if (selectedCategoryId) {
      const selectedCategory = categories.find(c => c.id === selectedCategoryId);
      if (selectedCategory) {
        onSelectCategory(selectedCategory.id, selectedCategory.name);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[75vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">选择保存分类</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-slate-600">加载分类中...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">加载失败</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={loadCategories}
                className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无分类</p>
            </div>
          )}

          {!loading && !error && categories.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    p-2.5 rounded-lg border-2 transition-all text-left
                    ${selectedCategoryId === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded flex items-center justify-center flex-shrink-0
                      ${selectedCategoryId === category.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                      }
                    `}>
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`
                        text-sm font-medium truncate
                        ${selectedCategoryId === category.id
                          ? 'text-blue-900'
                          : 'text-slate-800'
                        }
                      `}>
                        {category.name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedCategoryId}
            className={`
              px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors
              ${selectedCategoryId
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-slate-300 cursor-not-allowed'
              }
            `}
          >
            确认保存
          </button>
        </div>
      </div>
    </div>
  );
}
