import React from 'react';
import { Slide, SlideStatus } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Check, Plus } from 'lucide-react';

interface Props {
  slides: Slide[];
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;
  onConfirm: () => void;
}

const OutlineEditor: React.FC<Props> = ({ slides, setSlides, onConfirm }) => {

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    // Use spread syntax to create a shallow copy, preserving types better than Array.from
    const items: Slide[] = [...slides];
    const [reorderedItem] = items.splice(result.source.index, 1);
    
    if (!reorderedItem) return;

    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update page numbers
    const reindexedItems = items.map((slide, idx) => ({
      ...slide,
      pageNumber: idx + 1
    }));
    
    setSlides(reindexedItems);
  };

  const handleUpdateSlide = (id: string, field: keyof Slide, value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDelete = (id: string) => {
    setSlides(prev => prev.filter(s => s.id !== id).map((s, idx) => ({ ...s, pageNumber: idx + 1 })));
  };

  const handleAddSlide = () => {
    // 检查现有幻灯片是否有语音文稿字段
    const hasVoiceScript = slides.length > 0 && slides[0].voiceScript !== undefined;

    const newSlide: Slide = {
      id: `new-${Date.now()}`,
      pageNumber: slides.length + 1,
      title: "新页面",
      content: "在此添加内容...",
      visualPrompt: "符合整体主题的专业幻灯片背景。",
      status: SlideStatus.PENDING,
      ...(hasVoiceScript ? { voiceScript: '' } : {})
    };
    setSlides([...slides, newSlide]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">大纲预览与调整</h2>
          <p className="text-slate-500 text-sm">在生成图片前，请确认或调整演示文稿的结构（共 {slides.length} 页）</p>
        </div>
        <div className="flex gap-3">
             <button
            onClick={handleAddSlide}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <Plus className="w-4 h-4" />
            添加页面
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            <Check className="w-4 h-4" />
            确认并生成 PPT
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="slides">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 pb-20">
                {slides.map((slide, index) => (
                  <Draggable key={slide.id} draggableId={slide.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 group hover:border-blue-300 transition-colors"
                      >
                        <div className="flex gap-4">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-2 text-slate-300 hover:text-slate-500 cursor-move"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    第 {slide.pageNumber} 页
                                </div>
                                <button onClick={() => handleDelete(slide.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                              className="w-full text-lg font-bold text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none bg-transparent"
                              placeholder="幻灯片标题"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">内容要点</label>
                                    <textarea
                                      value={slide.content}
                                      onChange={(e) => handleUpdateSlide(slide.id, 'content', e.target.value)}
                                      className="w-full h-24 p-2 text-sm text-slate-600 bg-slate-50 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none resize-none"
                                      placeholder="输入内容要点..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">视觉提示词 (AI 指令)</label>
                                    <textarea
                                      value={slide.visualPrompt}
                                      onChange={(e) => handleUpdateSlide(slide.id, 'visualPrompt', e.target.value)}
                                      className="w-full h-24 p-2 text-sm text-slate-600 bg-slate-50 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none resize-none font-mono text-xs"
                                      placeholder="指导 AI 如何生成图片的指令..."
                                    />
                                </div>
                            </div>

                            {/* 语音文稿 - 如果存在 */}
                            {slide.voiceScript !== undefined && (
                              <div className="mt-4">
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">语音文稿 (讲解稿)</label>
                                <textarea
                                  value={slide.voiceScript || ''}
                                  onChange={(e) => handleUpdateSlide(slide.id, 'voiceScript', e.target.value)}
                                  className="w-full h-28 p-2 text-sm text-slate-600 bg-blue-50/30 rounded border border-transparent hover:border-blue-200 focus:border-blue-500 focus:outline-none resize-none"
                                  placeholder="输入适合口头讲解的文稿，约100-200字..."
                                />
                                <div className="mt-1 text-xs text-slate-400 text-right">
                                  {slide.voiceScript?.length || 0} 字
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default OutlineEditor;