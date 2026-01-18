import { AIModelConfig } from '../types';

export const AVAILABLE_AI_MODELS: AIModelConfig[] = [
  // --- GOOGLE GEMINI (Free Tier) ---
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'Google Gemini', rpm: '20', tpm: '2M', rpd: '2K' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', category: 'Google Gemini', rpm: '15', tpm: '1M', rpd: '1.5K' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', category: 'Google Gemini', rpm: '2', tpm: '32K', rpd: '50' },
  
  // --- GROQ CLOUD (High Performance Free) ---
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', category: 'Groq Cloud', rpm: '30', tpm: '6K', rpd: '14.4K' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', category: 'Groq Cloud', rpm: '30', tpm: '30K', rpd: '14.4K' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', category: 'Groq Cloud', rpm: '30', tpm: '5K', rpd: '14.4K' },
  
  // --- OPENROUTER (Free / Low Cost Models) ---
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', category: 'OpenRouter', rpm: '10', tpm: '200K', rpd: 'Unlimited' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', category: 'OpenRouter', rpm: '20', tpm: '100K', rpd: 'Unlimited' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)', category: 'OpenRouter', rpm: '5', tpm: '50K', rpd: 'Unlimited' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (V3)', category: 'OpenRouter', rpm: 'High', tpm: 'High', rpd: 'Low Cost' },
];
