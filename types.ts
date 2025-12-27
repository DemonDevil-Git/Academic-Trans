
export interface TranslatedSegment {
  en: string;
  zh: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export enum TranslationMode {
  PRECISION = 'PRECISION', // 精准学术模式
  TURBO = 'TURBO'          // 极速吞吐模式（小说、教科书）
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  TRANSLATING = 'TRANSLATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ExportConfig {
  mode: 'zh-only' | 'bilingual';
  format: FileType;
}

export type FileType = 'pdf' | 'docx' | 'doc' | 'pages' | 'txt' | 'epub';
