
import React, { useState, useCallback } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group border-2 border-dashed rounded-3xl p-12 transition-all duration-300
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'}
        ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
      `}
    >
      <input 
        type="file" 
        className="absolute inset-0 opacity-0 cursor-pointer" 
        onChange={handleFileInput}
        accept=".pdf,.docx,.doc,.txt,.epub"
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">
            {isDragging ? 'Drop your file here' : 'Drag & drop your literature'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Support for PDF, DOCX, TXT, EPUB (Max 50MB)
          </p>
        </div>
        <div className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-black transition">
          Choose File
        </div>
      </div>
    </div>
  );
};

export default UploadZone;
