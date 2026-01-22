
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db_fs } from "../../lib/firebase";
import { UserProfile } from '../../types/';
import { wrap } from "./core";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return wrap(
    getDoc(doc(db_fs, 'users', userId)).then(snap => {
      if (snap.exists()) return snap.data() as UserProfile;
      return null;
    }),
    null
  );
}

export async function updateUserProfile(profile: Partial<UserProfile> & { id: string }, actionName: string = 'UPDATE_USER_PROFILE', detail?: string): Promise<void> {
  const userRef = doc(db_fs, 'users', profile.id);
  const snap = await getDoc(userRef);

  await wrap(
    setDoc(userRef, {
      ...profile,
      updatedAt: serverTimestamp(),
      ...(!snap.exists() ? { createdAt: serverTimestamp(), status: 'active' } : {})
    }, { merge: true }),
    undefined,
    actionName,
    detail || profile.id
  );
}

export async function updateWishlist(userId: string, bookIds: string[]): Promise<void> {
  await updateUserProfile(
    { id: userId, wishlistIds: bookIds },
    'UPDATE_WISHLIST',
    `Items: ${bookIds.length}`
  );
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db_fs, 'users'));
    const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));

    return allUsers.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<void> {
  await wrap(
    updateDoc(doc(db_fs, 'users', userId), {
      role: newRole,
      updatedAt: serverTimestamp()
    }),
    undefined,
    'UPDATE_USER_ROLE',
    `UserId: ${userId} to ${newRole}`
  );
}

export async function updateUserStatus(userId: string, newStatus: 'active' | 'banned'): Promise<void> {
  await wrap(
    updateDoc(doc(db_fs, 'users', userId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    }),
    undefined,
    'UPDATE_USER_STATUS',
    `UserId: ${userId} to ${newStatus}`
  );
}

export async function deleteUser(userId: string): Promise<void> {
  await wrap(
    deleteDoc(doc(db_fs, 'users', userId)),
    undefined,
    'DELETE_USER',
    `UserId: ${userId}`
  );
}
