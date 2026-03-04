import React, { useState } from 'react';
import { FileText, Clock, User, Eye, Trash2, Edit, Lock, Unlock, CalendarPlus, Pencil } from 'lucide-react';

export interface CoursewareData {
  id: string;
  name: string;
  converImg: string;
  creationTime: string;
  slideCount?: number;
  creatorName?: string;
  viewCount?: number;
  creatorId?: string; // 创建者ID
  isShare?: boolean; // 是否分享（true=分享/解锁，false=不分享/锁定）
}

interface CoursewareCardProps {
  courseware: CoursewareData;
  currentUserId?: string; // 当前用户ID
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string, currentShareState: boolean) => void; // 切换锁定状态（传入当前的isShare状态）
  onAddToCourseMethod?: (id: string, name: string) => void; // 加入课表
  onRename?: (id: string, newName: string) => void; // 重命名
}

export default function CoursewareCard({
  courseware,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onToggleLock,
  onAddToCourseMethod,
  onRename
}: CoursewareCardProps) {
  // 判断是否是我的课件
  const isMine = currentUserId && courseware.creatorId === currentUserId;

  // 重命名状态
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState(courseware.name);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="group bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all overflow-hidden">
      {/* 封面图 */}
      <div
        className="relative h-40 bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onView?.(courseware.id)}
      >
        {courseware.converImg ? (
          <img
            src={courseware.converImg}
            alt={courseware.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-slate-300" />
          </div>
        )}

        {/* 锁定状态指示器（右上角）- isShare=false表示锁定 */}
        {courseware.isShare === false && (
          <div className="absolute top-2 right-2 p-1.5 bg-yellow-500 rounded-full shadow-md">
            <Lock className="w-3 h-3 text-white" />
          </div>
        )}

        {/* 悬停时显示的操作按钮 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {/* 只有是我的课件才显示编辑按钮 */}
          {isMine && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(courseware.id);
              }}
              className="p-2 bg-white rounded-full hover:bg-blue-50 transition-colors"
              title="编辑"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
          )}
          {/* 加入课表按钮 */}
          {onAddToCourseMethod && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCourseMethod(courseware.id, courseware.name);
              }}
              className="p-2 bg-white rounded-full hover:bg-green-50 transition-colors"
              title="加入课表"
            >
              <CalendarPlus className="w-4 h-4 text-green-600" />
            </button>
          )}
          {/* 查看按钮始终显示 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(courseware.id);
            }}
            className="p-2 bg-white rounded-full hover:bg-blue-50 transition-colors"
            title="查看"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>
          {/* 锁定/解锁按钮（仅在"我的课件"且传入 onToggleLock 时显示） */}
          {isMine && onToggleLock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // 传递当前的isShare状态，默认为true（分享状态）
                onToggleLock(courseware.id, courseware.isShare ?? true);
              }}
              className={`p-2 bg-white rounded-full transition-colors ${
                courseware.isShare === false
                  ? 'hover:bg-green-50'
                  : 'hover:bg-yellow-50'
              }`}
              title={courseware.isShare === false ? '解锁课件（分享）' : '锁定课件（不分享）'}
            >
              {courseware.isShare === false ? (
                <Unlock className="w-4 h-4 text-green-600" />
              ) : (
                <Lock className="w-4 h-4 text-yellow-600" />
              )}
            </button>
          )}
          {/* 删除按钮（仅在传入 onDelete 时显示） */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`确定要删除"${courseware.name}"吗？`)) {
                  onDelete(courseware.id);
                }
              }}
              className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* 课件信息 */}
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3
            className="font-medium text-slate-800 truncate cursor-pointer hover:text-blue-600 flex-1"
            onClick={() => onView?.(courseware.id)}
            title={courseware.name}
          >
            {courseware.name}
            {courseware.creatorName && (
              <span className="text-xs text-slate-400 font-normal ml-2">
                - {courseware.creatorName}
              </span>
            )}
          </h3>
          {isMine && onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewName(courseware.name);
                setShowRenameModal(true);
              }}
              className="flex-shrink-0 p-1 rounded hover:bg-slate-100 transition-colors"
              title="修改名称"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(courseware.creationTime)}</span>
          </div>
        </div>

        {(courseware.slideCount !== undefined || courseware.viewCount !== undefined) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            {courseware.slideCount !== undefined && (
              <span>{courseware.slideCount}页</span>
            )}
            {courseware.viewCount !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{courseware.viewCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 重命名弹窗 */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={() => setShowRenameModal(false)}>
          <div className="bg-white rounded-lg p-5 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-medium text-slate-700 mb-3">修改课件名称</h4>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  onRename?.(courseware.id, newName.trim());
                  setShowRenameModal(false);
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-1.5 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (newName.trim()) {
                    onRename?.(courseware.id, newName.trim());
                    setShowRenameModal(false);
                  }
                }}
                disabled={!newName.trim()}
                className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}