
import React, { useState } from 'react';
import { FileType, ExportConfig } from '../types';

interface ExportModalProps {
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport }) => {
  const [mode, setMode] = useState<'zh-only' | 'bilingual'>('bilingual');
  const [format, setFormat] = useState<FileType>('pdf');

  const formats: FileType[] = ['pdf', 'docx', 'doc', 'txt', 'epub'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">Export Result</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Export Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('zh-only')}
                className={`p-3 rounded-2xl border-2 transition-all ${mode === 'zh-only' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <div className="text-sm font-bold">Chinese Only</div>
                <div className="text-xs opacity-70">Clean translation</div>
              </button>
              <button
                onClick={() => setMode('bilingual')}
                className={`p-3 rounded-2xl border-2 transition-all ${mode === 'bilingual' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <div className="text-sm font-bold">Bilingual</div>
                <div className="text-xs opacity-70">Side-by-side reference</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">File Format</label>
            <div className="flex flex-wrap gap-2">
              {formats.map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-xl border transition-all uppercase text-xs font-bold ${format === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:text-slate-800 transition">Cancel</button>
          <button 
            onClick={() => onExport({ mode, format })}
            className="flex-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95"
          >
            Download Document
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
