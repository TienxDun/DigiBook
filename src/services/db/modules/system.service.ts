
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
import { db_fs, auth } from "../../../lib/firebase";
import { SystemLog } from '@/shared/types/';
import { wrap } from "../core";

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


