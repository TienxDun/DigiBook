
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
import { db_fs } from "../../../lib/firebase";
import { UserProfile, Address } from '@/shared/types/';
import { wrap } from "../core";

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

// --- Address Management ---
export async function addUserAddress(userId: string, address: Omit<Address, 'id'>): Promise<void> {
  const userRef = doc(db_fs, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const userData = snap.data() as UserProfile;
  const currentAddresses = userData.addresses || [];

  // If this is the first address, make it default automatically
  const isDefault = currentAddresses.length === 0 ? true : address.isDefault;

  // If new address is default, unset others
  let updatedAddresses = [...currentAddresses];
  if (isDefault) {
    updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
  }

  const newAddress: Address = {
    ...address,
    id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    isDefault
  };

  updatedAddresses.push(newAddress);

  await wrap(
    updateDoc(userRef, {
      addresses: updatedAddresses,
      updatedAt: serverTimestamp()
    }),
    undefined,
    'ADD_ADDRESS',
    newAddress.label
  );
}

export async function removeUserAddress(userId: string, addressId: string): Promise<void> {
  const userRef = doc(db_fs, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const userData = snap.data() as UserProfile;
  const currentAddresses = userData.addresses || [];
  const updatedAddresses = currentAddresses.filter(a => a.id !== addressId);

  await wrap(
    updateDoc(userRef, {
      addresses: updatedAddresses,
      updatedAt: serverTimestamp()
    }),
    undefined,
    'REMOVE_ADDRESS',
    addressId
  );
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  const userRef = doc(db_fs, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const userData = snap.data() as UserProfile;
  const currentAddresses = userData.addresses || [];

  const updatedAddresses = currentAddresses.map(a => ({
    ...a,
    isDefault: a.id === addressId
  }));

  await wrap(
    updateDoc(userRef, {
      addresses: updatedAddresses,
      updatedAt: serverTimestamp()
    }),
    undefined,
    'SET_DEFAULT_ADDRESS',
    addressId
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
