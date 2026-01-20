import { AIModelConfig } from '../types';

export const AVAILABLE_AI_MODELS: AIModelConfig[] = [
  // --- GOOGLE GEMINI (Enhanced Free Tier) ---
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', category: 'Google Gemini', rpm: '5', tpm: '250K', rpd: '20' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Google Gemini', rpm: '5', tpm: '250K', rpd: '20' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'Google Gemini', rpm: '10', tpm: '250K', rpd: '20' },
  
  // --- GROQ CLOUD (High Performance Free) ---
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', category: 'Groq Cloud', rpm: '30', tpm: '6K', rpd: '14.4K' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', category: 'Groq Cloud', rpm: '30', tpm: '30K', rpd: '14.4K' },
  
  // --- OPENROUTER (Free / Low Cost Models) ---
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', category: 'OpenRouter', rpm: '20', tpm: '100K', rpd: 'Unlimited' },
];
