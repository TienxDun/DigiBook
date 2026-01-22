
import {
  getDocs,
  getDoc,
  doc,
  collection,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";
import { db_fs } from "../../lib/firebase";
import { Coupon } from '../../types/';
import { wrap } from "./core";

export async function validateCoupon(code: string, subtotal: number): Promise<{ code: string, value: number, type: 'percentage' | 'fixed' } | null> {
  const couponRef = doc(db_fs, 'coupons', code.toUpperCase());
  const snap = await getDoc(couponRef);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data() as Coupon;
  const now = new Date().toISOString().split('T')[0];

  const isValid = data.isActive &&
    subtotal >= data.minOrderValue &&
    (data.usedCount || 0) < data.usageLimit &&
    data.expiryDate >= now;

  if (isValid) return { code: data.code, value: data.discountValue, type: data.discountType };
  return null;
}

export async function getCoupons(): Promise<Coupon[]> {
  return wrap(
    getDocs(collection(db_fs, 'coupons')).then(snap =>
      snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon))
    ),
    []
  );
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  const code = coupon.code.toUpperCase();
  await wrap(
    setDoc(doc(db_fs, 'coupons', code), { ...coupon, code, updatedAt: serverTimestamp() }, { merge: true }),
    undefined,
    'SAVE_COUPON',
    code
  );
}

export async function deleteCoupon(code: string): Promise<void> {
  await wrap(
    deleteDoc(doc(db_fs, 'coupons', code.toUpperCase())),
    undefined,
    'DELETE_COUPON',
    code
  );
}

export async function incrementCouponUsage(code: string): Promise<void> {
  const couponRef = doc(db_fs, 'coupons', code.toUpperCase());
  await wrap(
    updateDoc(couponRef, {
      usedCount: increment(1)
    }),
    undefined,
    'COUPON_USE',
    code
  );
}
