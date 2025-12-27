
import { GoogleGenAI, Type } from "@google/genai";
import { TranslatedSegment, TranslationMode } from "./types";

// Initialize with process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 并发控制器：限制同时进行的请求数量，防止 API 频率限制 (429)
const MAX_CONCURRENCY = 12; 

const callGeminiTurbo = async (
  chunk: string, 
  chunkIndex: number,
  mode: TranslationMode,
  onLog: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void,
  retries = 3
): Promise<TranslatedSegment[]> => {
  try {
    const isTurbo = mode === TranslationMode.TURBO;
    
    // Call generateContent with model name and contents directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: isTurbo 
        ? `你是极速翻译助手。将英文小说/教材内容译为中文。保持自然流利，直接返回JSON数组。内容：\n${chunk}`
        : `你是一位顶级学术论文翻译专家。请将以下内容翻译为中文。要求：1.术语准确 2.意译通顺 3.严格返回JSON。内容：\n${chunk}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              en: { type: Type.STRING },
              zh: { type: Type.STRING },
            },
            required: ["en", "zh"]
          }
        },
        // 极速模式下降低采样随机性，提高稳定性
        temperature: isTurbo ? 0.3 : 0.7,
      },
    });

    // Directly access the .text property from GenerateContentResponse
    const text = response.text || '[]';
    const result = JSON.parse(text);
    return result;
  } catch (e) {
    if (retries > 0) {
      const delay = 2000 * (4 - retries); // 指数退避
      onLog(`分片 ${chunkIndex + 1} 繁忙，${delay}ms 后重试...`, 'warning');
      await new Promise(r => setTimeout(r, delay));
      return callGeminiTurbo(chunk, chunkIndex, mode, onLog, retries - 1);
    }
    throw e;
  }
};

export const translateText = async (
  text: string, 
  mode: TranslationMode,
  onProgress: (progress: number) => void,
  onLog: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void
): Promise<TranslatedSegment[]> => {
  const isTurbo = mode === TranslationMode.TURBO;
  onLog(isTurbo ? '启动极速引擎模式 (Turbo Engine)...' : '启动深度学术精译模式...', 'info');

  // 根据模式调整分块大小：极速模式使用大分块减少请求数
  const CHUNK_SIZE = isTurbo ? 4000 : 1500;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  let chunks: string[] = [];
  let currentChunk = "";
  for (const p of paragraphs) {
    if ((currentChunk + p).length > CHUNK_SIZE) {
      chunks.push(currentChunk);
      currentChunk = p;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + p;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  onLog(`待处理总量: ${text.length} 字符 | 切分为 ${chunks.length} 个并发单元`, 'info');

  // Corrected type to TranslatedSegment[][] to store the array of segments returned for each chunk
  const allSegments: TranslatedSegment[][] = new Array(chunks.length);
  let completedCount = 0;

  // 并发池控制逻辑
  const processBatch = async () => {
    const queue = chunks.map((chunk, index) => ({ chunk, index }));
    const workers = Array(Math.min(MAX_CONCURRENCY, chunks.length)).fill(null).map(async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        
        try {
          const result = await callGeminiTurbo(item.chunk, item.index, mode, onLog);
          allSegments[item.index] = result;
          completedCount++;
          onProgress(Math.round((completedCount / chunks.length) * 100));
          if (completedCount % 5 === 0 || isTurbo) {
            onLog(`进度更新: [${completedCount}/${chunks.length}] 单元已完成`, 'success');
          }
        } catch (err) {
          onLog(`分片 ${item.index + 1} 最终失败，已跳过。`, 'error');
        }
      }
    });
    await Promise.all(workers);
  };

  const startTime = Date.now();
  await processBatch();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  onLog(`全书翻译完成！耗时: ${duration}s。正在合并结果...`, 'success');
  
  // 展平数组并过滤空结果
  return allSegments.flat().filter(s => s && s.en && s.zh);
};
