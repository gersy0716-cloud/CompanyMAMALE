import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronDown, Loader2, Check } from 'lucide-react';
import { getCourseMethodTree, CourseMethodTreeNode } from '../services/coursewareService';

interface CourseMethodTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  title?: string;
}

// 扩展树节点，增加本地状态
interface TreeNodeState extends CourseMethodTreeNode {
  isExpanded?: boolean;
  isLoading?: boolean;
  childrenLoaded?: boolean;
}

export default function CourseMethodTreeModal({
  isOpen,
  onClose,
  onConfirm,
  title = '选择目录'
}: CourseMethodTreeModalProps) {
  const [treeData, setTreeData] = useState<TreeNodeState[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载根节点
  useEffect(() => {
    if (isOpen) {
      loadRootNodes();
      // 重置选中状态
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const loadRootNodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCourseMethodTree('');
      setTreeData(result.items.map(item => ({
        ...item,
        isExpanded: false,
        isLoading: false,
        childrenLoaded: false
      })));
    } catch (err: any) {
      setError(err.message || '加载目录失败');
    } finally {
      setLoading(false);
    }
  };

  // 递归更新树节点
  const updateTreeNode = useCallback((
    nodes: TreeNodeState[],
    nodeId: string,
    updater: (node: TreeNodeState) => TreeNodeState
  ): TreeNodeState[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return updater(node);
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateTreeNode(node.children as TreeNodeState[], nodeId, updater)
        };
      }
      return node;
    });
  }, []);

  // 展开/折叠节点
  const handleToggleExpand = async (nodeId: string, node: TreeNodeState) => {
    if (node.isExpanded) {
      // 折叠
      setTreeData(prev => updateTreeNode(prev, nodeId, n => ({
        ...n,
        isExpanded: false
      })));
    } else {
      // 展开
      if (!node.childrenLoaded) {
        // 需要加载子节点
        setTreeData(prev => updateTreeNode(prev, nodeId, n => ({
          ...n,
          isLoading: true,
          isExpanded: true
        })));

        try {
          const result = await getCourseMethodTree(nodeId);
          setTreeData(prev => updateTreeNode(prev, nodeId, n => ({
            ...n,
            isLoading: false,
            childrenLoaded: true,
            children: result.items.map(item => ({
              ...item,
              isExpanded: false,
              isLoading: false,
              childrenLoaded: false
            }))
          })));
        } catch (err) {
          setTreeData(prev => updateTreeNode(prev, nodeId, n => ({
            ...n,
            isLoading: false
          })));
        }
      } else {
        // 已加载，直接展开
        setTreeData(prev => updateTreeNode(prev, nodeId, n => ({
          ...n,
          isExpanded: true
        })));
      }
    }
  };

  // 切换选中状态
  const handleToggleSelect = (nodeId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // 确认选择
  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
  };

  // 渲染单个树节点
  const renderTreeNode = (node: TreeNodeState, level: number = 0) => {
    const isSelected = selectedIds.has(node.id);
    const hasChildren = node.children?.length > 0 || !node.childrenLoaded;
    const paddingLeft = level * 24 + 12;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-2 px-3 hover:bg-slate-700/50 cursor-pointer transition-colors ${
            isSelected ? 'bg-slate-700/30' : ''
          }`}
          style={{ paddingLeft }}
        >
          {/* 展开/折叠图标 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand(node.id, node);
            }}
            className="w-5 h-5 flex items-center justify-center mr-1 text-slate-400 hover:text-white"
          >
            {node.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : hasChildren ? (
              node.isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <span className="w-4" />
            )}
          </button>

          {/* 复选框 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSelect(node.id);
            }}
            className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-500 border-blue-500'
                : 'border-slate-500 hover:border-slate-400'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </button>

          {/* 节点名称 */}
          <span
            className="text-slate-200 text-sm flex-1 truncate"
            onClick={() => handleToggleExpand(node.id, node)}
          >
            {node.name}
          </span>
        </div>

        {/* 子节点 */}
        {node.isExpanded && node.children && node.children.length > 0 && (
          <div>
            {(node.children as TreeNodeState[]).map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-slate-800 rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 树内容区域 */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-slate-400 text-sm">加载中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                onClick={loadRootNodes}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                重试
              </button>
            </div>
          ) : treeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-slate-400 text-sm">暂无目录数据</p>
            </div>
          ) : (
            <div className="py-2">
              {treeData.map(node => renderTreeNode(node))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedIds.size > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            确定{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
