
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import TranslationPane from './components/TranslationPane';
import ExportModal from './components/ExportModal';
import { translateText } from './geminiService';
import { AppStatus, TranslatedSegment, ExportConfig, LogEntry, TranslationMode } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.PRECISION);
  const [progress, setProgress] = useState(0);
  const [segments, setSegments] = useState<TranslatedSegment[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fileName, setFileName] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState("");
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false, minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-100), { // 限制日志数量防止卡顿
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      message,
      type
    }]);
  };

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.PARSING);
    setFileName(file.name);
    setError("");
    setProgress(0);
    setLogs([]);
    
    addLog(`准备解析巨量文档: ${file.name}`, 'info');
    
    try {
      let text = "";
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'txt') {
        text = await file.text();
      } else if (extension === 'docx') {
        // @ts-ignore
        const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = result.value;
      } else if (extension === 'pdf') {
        // @ts-ignore
        const pdfJS = window.pdfjsLib;
        pdfJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const loadingTask = pdfJS.getDocument(await file.arrayBuffer());
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(" ") + "\n\n";
          if (i % 20 === 0) addLog(`PDF 解析进度: ${i}/${pdf.numPages} 页`, 'info');
        }
        text = fullText;
      }

      if (!text.trim()) throw new Error("文档中未识别出有效文本。");

      setStatus(AppStatus.TRANSLATING);
      
      const result = await translateText(
        text, 
        mode,
        (p) => setProgress(p),
        (msg, type) => addLog(msg, type)
      );
      
      setSegments(result);
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      setError(err.message || "翻译过程发生错误");
      setStatus(AppStatus.ERROR);
    }
  };

  // Implementation of export functionality
  const handleExport = (config: ExportConfig) => {
    let output = "";
    if (config.mode === 'zh-only') {
      output = segments.map(s => s.zh).join("\n\n");
    } else {
      output = segments.map(s => `${s.en}\n\n${s.zh}`).join("\n\n---\n\n");
    }

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Note: Complex formats like PDF/DOCX would require specialized libraries; exporting as TXT for now
    a.download = `${fileName.split('.')[0]}_translated.${config.format === 'txt' ? 'txt' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExport(false);
    addLog(`文档导出成功 (${config.mode}, ${config.format})`, 'success');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-100 bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex flex-col min-h-0">
        {status === AppStatus.IDLE && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto space-y-12 py-12">
            <div className="text-center space-y-6">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                全书翻译，<br/>
                <span className="text-blue-600 italic">分钟级交付。</span>
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed">
                针对英文小说、教科书等超长文本优化。采用并发流水线技术，5分钟内可处理数十万字。
              </p>
            </div>

            {/* 模式选择器 */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-200 rounded-2xl w-full max-w-md shadow-inner">
              <button 
                onClick={() => setMode(TranslationMode.PRECISION)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${mode === TranslationMode.PRECISION ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" /></svg>
                学术精译
              </button>
              <button 
                onClick={() => setMode(TranslationMode.TURBO)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${mode === TranslationMode.TURBO ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                极速吞吐
              </button>
            </div>

            <div className="w-full">
              <UploadZone onFileSelect={handleFileSelect} isProcessing={false} />
            </div>
          </div>
        )}

        {(status === AppStatus.PARSING || status === AppStatus.TRANSLATING) && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto w-full">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className={`w-24 h-24 border-4 border-slate-200 border-t-blue-600 rounded-full ${mode === TranslationMode.TURBO ? 'animate-[spin_0.5s_linear_infinite]' : 'animate-spin'}`}></div>
                {mode === TranslationMode.TURBO && (
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg animate-bounce shadow-lg">TURBO</div>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-black text-slate-900">
                  {status === AppStatus.PARSING ? '深度结构解析中' : '全书并发译制中'}
                </h3>
                <p className="text-slate-500 font-bold mt-2">已完成: {progress}%</p>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden shadow-inner p-1">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${mode === TranslationMode.TURBO ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600' : 'bg-blue-600'}`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* 日志区 */}
            <div className="w-full bg-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-80">
               <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Concurrent Translation Pipeline</span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-emerald-500 font-bold">ACTIVE</span>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed custom-scrollbar">
                  {logs.map(log => (
                    <div key={log.id} className="mb-2 flex gap-4 animate-in fade-in slide-in-from-left-4">
                      <span className="text-white/20 shrink-0">[{log.timestamp}]</span>
                      <span className={`
                        ${log.type === 'success' ? 'text-emerald-400' : ''}
                        ${log.type === 'warning' ? 'text-amber-300' : ''}
                        ${log.type === 'error' ? 'text-red-400' : ''}
                        ${log.type === 'info' ? 'text-blue-400' : ''}
                      `}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
               </div>
            </div>
          </div>
        )}

        {status === AppStatus.COMPLETED && (
          <div className="flex-1 flex flex-col space-y-6 min-h-0 animate-in fade-in duration-500">
             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 truncate max-w-sm">{fileName}</h3>
                      <p className="text-sm font-bold text-slate-400">处理完成 · {mode === TranslationMode.TURBO ? '极速引擎模式' : '学术模式'}</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => setStatus(AppStatus.IDLE)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-900 transition">处理新文档</button>
                   <button onClick={() => setShowExport(true)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition active:scale-95">导出并下载</button>
                </div>
             </div>
             <div className="flex-1 min-h-0">
                <TranslationPane segments={segments} />
             </div>
          </div>
        )}

        {status === AppStatus.ERROR && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl">⚠️</div>
             <h3 className="text-3xl font-black text-slate-900">任务中断</h3>
             <p className="text-slate-500 max-w-md mx-auto">{error}</p>
             <button onClick={() => setStatus(AppStatus.IDLE)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl">重试</button>
          </div>
        )}
      </main>

      {showExport && <ExportModal onClose={() => setShowExport(false)} onExport={handleExport} />}
    </div>
  );
};

export default App;
