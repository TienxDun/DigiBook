import { AIModelConfig } from '../types';

export const AVAILABLE_AI_MODELS: AIModelConfig[] = [
  // --- GOOGLE GEMINI (Enhanced Free Tier) ---
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', category: 'Google Gemini', rpm: '5', tpm: '250K', rpd: '20' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Google Gemini', rpm: '5', tpm: '250K', rpd: '20' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'Google Gemini', rpm: '10', tpm: '250K', rpd: '20' },

  // --- GROQ CLOUD (High Performance Free) ---
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', category: 'Groq Cloud', rpm: '30', tpm: '6K', rpd: '14.4K' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', category: 'Groq Cloud', rpm: '30', tpm: '30K', rpd: '14.4K' },

  // --- OPENROUTER FREE MODELS ---
  { id: 'xiaomi/mimo-v2-flash:free', name: 'Xiaomi: MiMo-V2-Flash (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '262K', rpd: 'N/A' },
  { id: 'mistralai/devstral-2512:free', name: 'Mistral: Devstral 2 2512 (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '262K', rpd: 'N/A' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'TNG: DeepSeek R1T2 Chimera (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '163K', rpd: 'N/A' },
  { id: 'tngtech/deepseek-r1t-chimera:free', name: 'TNG: DeepSeek R1T Chimera (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '163K', rpd: 'N/A' },
  { id: 'z-ai/glm-4.5-air:free', name: 'Z.AI: GLM 4.5 Air (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek: R1 0528 (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '163K', rpd: 'N/A' },
  { id: 'tngtech/tng-r1t-chimera:free', name: 'TNG: R1T Chimera (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '163K', rpd: 'N/A' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen: Qwen3 Coder 480B A35B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '262K', rpd: 'N/A' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta: Llama 3.3 70B Instruct (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
  { id: 'google/gemma-3-27b-it:free', name: 'Google: Gemma 3 27B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'NVIDIA: Nemotron 3 Nano 30B A3B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '256K', rpd: 'N/A' },
  { id: 'openai/gpt-oss-120b:free', name: 'OpenAI: gpt-oss-120b (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Google: Gemini 2.0 Flash Exp (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '1M', rpd: 'N/A' },
  { id: 'openai/gpt-oss-20b:free', name: 'OpenAI: gpt-oss-20b (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
  { id: 'arcee-ai/trinity-mini:free', name: 'Arcee AI: Trinity Mini (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
  { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Venice: Uncensored (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '32K', rpd: 'N/A' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen: Qwen3 Next 80B A3B Instruct (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '262K', rpd: 'N/A' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Nous: Hermes 3 405B Instruct (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
  { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'NVIDIA: Nemotron Nano 9B V2 (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '128K', rpd: 'N/A' },
  { id: 'allenai/molmo-2-8b:free', name: 'AllenAI: Molmo2 8B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '36K', rpd: 'N/A' },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free', name: 'NVIDIA: Nemotron Nano 12B 2 VL (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '128K', rpd: 'N/A' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral: Mistral Small 3.1 24B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '128K', rpd: 'N/A' },
  { id: 'qwen/qwen-2.5-vl-7b-instruct:free', name: 'Qwen: Qwen2.5-VL 7B Instruct (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '32K', rpd: 'N/A' },
  { id: 'google/gemma-3-4b-it:free', name: 'Google: Gemma 3 4B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '32K', rpd: 'N/A' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Meta: Llama 3.2 3B Instruct (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
  { id: 'google/gemma-3n-e2b-it:free', name: 'Google: Gemma 3n 2B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '8K', rpd: 'N/A' },
  { id: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'LiquidAI: LFM2.5-1.2B-Thinking (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '32K', rpd: 'N/A' },
  { id: 'qwen/qwen3-4b:free', name: 'Qwen: Qwen3 4B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '40K', rpd: 'N/A' },
  { id: 'google/gemma-3-12b-it:free', name: 'Google: Gemma 3 12B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '32K', rpd: 'N/A' },
  { id: 'google/gemma-3n-e4b-it:free', name: 'Google: Gemma 3n 4B (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '8K', rpd: 'N/A' },
  { id: 'liquid/lfm-2.5-1.2b-instruct:free', name: 'LiquidAI: LFM2.5-1.2B-Instruct (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '32K', rpd: 'N/A' },
  { id: 'moonshotai/kimi-k2:free', name: 'MoonshotAI: Kimi K2 0711 (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '32K', rpd: 'N/A' },
  { id: 'meta-llama/llama-3.1-405b-instruct:free', name: 'Meta: Llama 3.1 405B Instruct (Free)', category: 'OpenRouter Free', rpm: '20', tpm: '131K', rpd: 'N/A' },
];
