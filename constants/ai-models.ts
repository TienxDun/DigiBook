import { AIModelConfig } from '../types';

export const AVAILABLE_AI_MODELS: AIModelConfig[] = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Tốt nhất)', category: 'Frontier AI', rpm: '5', tpm: '1M', rpd: '50' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', category: 'Text-out models', rpm: '5', tpm: '250K', rpd: '20' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Text-out models', rpm: '5', tpm: '250K', rpd: '20' },
  { id: 'gemma-3-27b', name: 'Gemma 3 27B', category: 'Open Models (Large)', rpm: '30', tpm: '15K', rpd: '14.4K' },
  { id: 'gemma-3-12b', name: 'Gemma 3 12B', category: 'Open Models (Medium)', rpm: '30', tpm: '15K', rpd: '14.4K' },
  { id: 'gemma-3-4b', name: 'Gemma 3 4B', category: 'Open Models (Small)', rpm: '30', tpm: '15K', rpd: '14.4K' },
  { id: 'gemma-3-2b', name: 'Gemma 3 2B', category: 'Open Models (Micro)', rpm: '30', tpm: '15K', rpd: '14.4K' },
  { id: 'gemma-3-1b', name: 'Gemma 3 1B', category: 'Open Models (Micro)', rpm: '30', tpm: '15K', rpd: '14.4K' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', category: 'Text-out models', rpm: '10', tpm: '250K', rpd: '20' },
  { id: 'gemini-2.5-flash-tts', name: 'Gemini 2.5 Flash-TTS', category: 'Multi-modal', rpm: '3', tpm: '10K', rpd: '10' },
  { id: 'gemini-2.5-flash-native-audio-dialog', name: 'Gemini 2.5 Flash Native Audio', category: 'Live API', rpm: 'Unlimited', tpm: '1M', rpd: 'Unlimited' },
  { id: 'gemini-robotics-er-1.5-preview', name: 'Gemini Robotics ER 1.5', category: 'Research/Other', rpm: '10', tpm: '250K', rpd: '20' },
  { id: 'gemini-embedding-1.0', name: 'Gemini Embedding 1.0', category: 'Utility', rpm: '100', tpm: '30K', rpd: '1K' },
];
