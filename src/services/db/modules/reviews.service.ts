
import {
  getDocs,
  getDoc,
  doc,
  collection,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  increment
} from "firebase/firestore";

import { db_fs } from "../../../lib/firebase";
import { Review } from '@/shared/types/';
import { wrap } from "../core";

export async function getReviewsByBookId(bookId: string): Promise<Review[]> {
  return wrap(
    (async () => {
      if (!db_fs) return [];
      const snap = await getDocs(query(collection(db_fs, 'books', bookId, 'reviews'), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
    })(),
    []
  );
}

export async function addReview(review: Omit<Review, 'createdAt'>): Promise<void> {
  await wrap(
    (async () => {
      if (!db_fs) return;
      const reviewRef = collection(db_fs, 'books', review.bookId, 'reviews');
      await addDoc(reviewRef, { ...review, createdAt: serverTimestamp() });

      // Incremental rating calculation (O(1) instead of O(n))
      // Formula: newRating = (currentRating * currentCount + newRating) / (currentCount + 1)
      const bookRef = doc(db_fs, 'books', review.bookId);
      const bookSnap = await getDoc(bookRef);
      const bookData = bookSnap.data();

      const currentRating = bookData?.rating || 0;
      const currentCount = bookData?.reviewCount || 0;
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + review.rating) / newCount;

      await updateDoc(bookRef, {
        rating: Number(newRating.toFixed(1)),
        reviewCount: increment(1)
      });
    })(),
    undefined,
    'ADD_REVIEW',
    review.bookId
  );
}

