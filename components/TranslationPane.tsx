
import React, { useState, useEffect, useRef } from 'react';
import { TranslatedSegment } from '../types';

interface TranslationPaneProps {
  segments: TranslatedSegment[];
}

const TranslationPane: React.FC<TranslationPaneProps> = ({ segments }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  // 简单的滚动同步逻辑，增强阅读连贯性
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const source = e.currentTarget;
    const target = source === leftPaneRef.current ? rightPaneRef.current : leftPaneRef.current;
    
    if (target) {
      const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
      target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
      {/* 表头 */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/50 backdrop-blur-md font-semibold text-slate-500 divide-x divide-slate-200 sticky top-0 z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            English Literature (Source)
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Original</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Academic Chinese (Target)
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Translation</span>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 h-full divide-x divide-slate-100">
          {/* 英文原文面板 */}
          <div 
            ref={leftPaneRef}
            onScroll={handleScroll}
            className="p-10 space-y-2 overflow-y-auto custom-scrollbar bg-white"
          >
            {segments.map((seg, idx) => (
              <div
                key={`en-${idx}`}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className={`
                  p-3 rounded-xl transition-all duration-300 leading-relaxed text-[15px] cursor-default
                  ${hoverIndex === idx 
                    ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-100 shadow-sm translate-x-1' 
                    : 'text-slate-600 hover:text-slate-900'}
                `}
              >
                {seg.en}
              </div>
            ))}
          </div>

          {/* 中文译文面板 */}
          <div 
            ref={rightPaneRef}
            onScroll={handleScroll}
            className="p-10 space-y-2 overflow-y-auto custom-scrollbar bg-slate-50/30"
          >
            {segments.map((seg, idx) => (
              <div
                key={`zh-${idx}`}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className={`
                  p-3 rounded-xl transition-all duration-300 leading-relaxed text-[16px] cursor-default
                  ${hoverIndex === idx 
                    ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100 shadow-sm -translate-x-1' 
                    : 'text-slate-800'}
                `}
              >
                {seg.zh}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
};

export default TranslationPane;
