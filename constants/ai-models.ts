import { AIModelConfig } from '../types';

export const AVAILABLE_AI_MODELS: AIModelConfig[] = [
  { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro (Experimental)', category: 'Frontier AI', rpm: '2', tpm: '1M', rpd: '50' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Hành động)', category: 'Next-Gen Models', rpm: '15', tpm: '1M', rpd: '1500' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Ổn định)', category: 'Stable Models', rpm: '5', tpm: '2M', rpd: '50' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Tốc độ)', category: 'Stable Models', rpm: '15', tpm: '1M', rpd: '1500' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B', category: 'Stable Models', rpm: '15', tpm: '1M', rpd: '1500' },
  { id: 'gemma-2-27b-it', name: 'Gemma 2 27B IT', category: 'Open Models', rpm: '30', tpm: '15K', rpd: '14.4K' },
  { id: 'gemma-2-9b-it', name: 'Gemma 2 9B IT', category: 'Open Models', rpm: '30', tpm: '15K', rpd: '14.4K' },
  { id: 'gemma-2-2b-it', name: 'Gemma 2 2B IT', category: 'Open Models', rpm: '30', tpm: '15K', rpd: '14.4K' },
  { id: 'text-embedding-004', name: 'Text Embedding 004', category: 'Utility', rpm: '100', tpm: '30K', rpd: '1K' },
];
