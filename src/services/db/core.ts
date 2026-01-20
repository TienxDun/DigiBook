
import {
  collection,
  getDocs,
  addDoc,
  query,
  limit,
  terminate,
  clearIndexedDbPersistence,
  serverTimestamp
} from "firebase/firestore";
import { db_fs, auth } from "../firebase";
import { LogLevel, LogCategory } from '../../types';

let connectionTested = false;

export async function testConnection() {
  if (connectionTested || !db_fs) return;
  
  try {
    await getDocs(query(collection(db_fs, 'system_logs'), limit(1)));
    connectionTested = true;

    if (!(window as any).__db_connected) {
      console.log("✅ Firestore connection successful");
      (window as any).__db_connected = true;
    }
  } catch (error: any) {
    console.error("❌ Firestore connection failed:", error.message);
    
    if (error.name === 'BloomFilterError' || (error.message && error.message.includes('persistence'))) {
      console.warn("🔄 Attemping to clear Firestore persistence due to cache error...");
      try {
        await terminate(db_fs);
        await clearIndexedDbPersistence(db_fs);
        console.log("✨ Persistence cleared. Re-initializing...");
        window.location.reload();
      } catch (clearErr) {
        console.error("Failed to clear persistence:", clearErr);
      }
    }
    
    connectionTested = true;
  }
}

export async function logActivity(
  action: string, 
  detail: string, 
  status: 'SUCCESS' | 'ERROR' = 'SUCCESS',
  level: LogLevel = 'INFO',
  category: LogCategory = 'SYSTEM',
  metadata?: any
) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: true });
  const userEmail = auth?.currentUser?.email || 'Anonymous';
  const userShort = userEmail.split('@')[0] || 'Guest';
  
  let levelColor = 'background: #64748b; color: #fff;'; 
  if (level === 'ERROR' || status === 'ERROR') levelColor = 'background: #ef4444; color: #fff;';
  else if (level === 'WARN') levelColor = 'background: #f59e0b; color: #fff;';
  else if (level === 'DEBUG') levelColor = 'background: #10b981; color: #fff;';

  console.log(
    `%c ${level} %c ${status} %c ${time} | %c${userShort}%c | [%s] %c${action}%c ${detail}`,
    `${levelColor} border-radius: 4px; font-size: 11px; font-weight: bold; padding: 1px 4px;`,
    `${status === 'SUCCESS' ? 'color: #10b981;' : 'color: #ef4444;'} font-weight: bold;`,
    'color: #94a3b8; font-family: monospace;',
    'color: #6366f1; font-weight: 800;',
    'color: #e2e8f0;',
    category,
    'color: #1e293b; font-weight: bold;',
    'color: #64748b;'
  );

  if (metadata) {
    console.log('   Metadata:', metadata);
  }

  const criticalCategories: LogCategory[] = ['ADMIN', 'AUTH', 'ORDER', 'AI'];
  const shouldSaveToDb = 
    level === 'ERROR' || 
    level === 'WARN' || 
    status === 'ERROR' ||
    criticalCategories.includes(category);

  if (db_fs && shouldSaveToDb) {
    try {
      await addDoc(collection(db_fs, 'system_logs'), {
        action,
        detail: detail.length > 500 ? detail.substring(0, 500) + '...' : detail,
        status,
        level,
        category,
        user: userEmail,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to save log to Firestore", e);
    }
  }
}

export async function wrap<T>(
  promise: Promise<T>, 
  fallback: T, 
  actionName?: string, 
  detail?: string, 
  category: LogCategory = 'DATABASE'
): Promise<T> {
  if (!connectionTested) {
    await testConnection();
  }
  
  try {
    const result = await promise;
    if (actionName) logActivity(actionName, detail || 'Done', 'SUCCESS', 'DEBUG', category);
    return result;
  } catch (e: any) {
    if (actionName) logActivity(actionName, e.message, 'ERROR', 'ERROR', category);
    console.error(`[${category}] Database Error:`, e);
    return fallback;
  }
}
