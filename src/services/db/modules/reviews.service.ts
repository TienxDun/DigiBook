
import {
  getDocs,
  getDoc,
  doc,
  collection,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db_fs } from "../../../lib/firebase";
import { Review } from '@/shared/types/';
import { wrap } from "../core";

export async function getReviewsByBookId(bookId: string): Promise<Review[]> {
  return wrap(
    getDocs(query(collection(db_fs, 'books', bookId, 'reviews'), orderBy('createdAt', 'desc')))
      .then(snap => {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
      }),
    []
  );
}

export async function addReview(review: Omit<Review, 'createdAt'>): Promise<void> {
  await wrap(
    (async () => {
      const reviewRef = collection(db_fs, 'books', review.bookId, 'reviews');
      await addDoc(reviewRef, { ...review, createdAt: serverTimestamp() });

      const allReviewsSnap = await getDocs(reviewRef);
      const reviews = allReviewsSnap.docs.map(d => d.data() as Review);

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);

        await updateDoc(doc(db_fs, 'books', review.bookId), {
          rating: Number(averageRating)
        });
      }
    })(),
    undefined,
    'ADD_REVIEW',
    review.bookId
  );
}
