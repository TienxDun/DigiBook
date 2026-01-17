import { AIModelConfig } from '../types';

export const AVAILABLE_AI_MODELS: AIModelConfig[] = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'Text-out models', rpm: '2', tpm: '1.6K', rpd: '12' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Text-out models', rpm: '1', tpm: '508', rpd: '3' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Preview)', category: 'Text-out models', rpm: '1', tpm: '114', rpd: '1' },
];
