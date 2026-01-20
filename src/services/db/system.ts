
import {
  getDocs,
  getDoc,
  doc,
  collection,
  query,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { db_fs, auth } from "../firebase";
import { SystemLog, AIModelConfig } from '../../types';
import { wrap, logActivity } from "./core";

export async function getSystemLogs(offset: number = 0, limitCount: number = 100): Promise<SystemLog[]> {
  return wrap(
    getDocs(query(collection(db_fs, 'system_logs'), orderBy('createdAt', 'desc'), limit(offset + limitCount)))
      .then(snap => {
        const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog));
        return allDocs.slice(offset);
      }),
    []
  );
}

export async function getAIConfig(): Promise<{ activeModelId: string }> {
  try {
    const docRef = doc(db_fs, 'system_configs', 'ai_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as { activeModelId: string };
    }
    return { activeModelId: 'gemini-3-flash' };
  } catch (error) {
    console.error("Error getting AI config:", error);
    return { activeModelId: 'gemini-3-flash' };
  }
}

export async function updateAIConfig(modelId: string): Promise<void> {
  await wrap(
    setDoc(doc(db_fs, 'system_configs', 'ai_settings'), { 
      activeModelId: modelId,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.email || 'admin'
    }),
    undefined,
    'UPDATE_AI_CONFIG',
    `Switched to model: ${modelId}`
  );
}

export async function getAIModels(): Promise<AIModelConfig[]> {
  const defaultModel: AIModelConfig = { 
    id: 'gemini-3-flash', 
    name: 'Gemini 3 Flash', 
    category: 'Google Gemini', 
    rpm: '5', 
    tpm: '250K', 
    rpd: '20' 
  };

  try {
    const snap = await getDocs(collection(db_fs, 'ai_models'));
    const models = snap.docs.map(doc => ({ ...doc.data() } as AIModelConfig));
    if (models.length === 0) return [defaultModel];
    return models;
  } catch (error) {
    console.error("Error getting AI models:", error);
    return [defaultModel];
  }
}

export async function addAIModel(model: AIModelConfig): Promise<void> {
  const docId = model.id.replace(/\//g, '_');
  await wrap(
    setDoc(doc(db_fs, 'ai_models', docId), {
      ...model,
      createdAt: serverTimestamp()
    }),
    undefined,
    'ADD_AI_MODEL',
    `Model: ${model.name} (${model.id})`
  );
}

export async function updateAIModelInfo(model: AIModelConfig): Promise<void> {
  const docId = model.id.replace(/\//g, '_');
  await wrap(
    updateDoc(doc(db_fs, 'ai_models', docId), {
      ...model,
      updatedAt: serverTimestamp()
    }),
    undefined,
    'UPDATE_AI_MODEL',
    `Model: ${model.id}`
  );
}

export async function deleteAIModel(modelId: string): Promise<void> {
  const docId = modelId.replace(/\//g, '_');
  await wrap(
    deleteDoc(doc(db_fs, 'ai_models', docId)),
    undefined,
    'DELETE_AI_MODEL',
    `Model: ${modelId}`
  );
}

export async function syncAIModels(models: AIModelConfig[]): Promise<number> {
  if (!db_fs) return 0;
  try {
    const colRef = collection(db_fs, 'ai_models');
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db_fs);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    models.forEach(model => {
      const docId = model.id.replace(/\//g, '_');
      const ref = doc(db_fs, 'ai_models', docId);
      batch.set(ref, {
        ...model,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
    logActivity(
      'SYNC_AI_MODELS', 
      `Đã làm mới danh mục AI models (${models.length} mục) từ cấu hình hệ thống.`,
      'SUCCESS',
      'INFO',
      'ADMIN'
    );
    return models.length;
  } catch (error) {
    console.error("Error syncing AI models:", error);
    throw error;
  }
}

