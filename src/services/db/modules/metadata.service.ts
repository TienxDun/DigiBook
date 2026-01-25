
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  where,
  query,
  limit,
  serverTimestamp
} from "firebase/firestore";

import { db_fs } from "../../../lib/firebase";
import { CategoryInfo, Author, Book } from '@/shared/types/';
import { wrap, logActivity, fetchWithProxy } from "../core";
import { INITIAL_CATEGORIES } from '@/shared/config/categories';

export async function getCategories(): Promise<CategoryInfo[]> {
  return wrap(
    getDocs(collection(db_fs, 'categories')).then(snap => snap.docs.map(d => d.data() as CategoryInfo)),
    []
  );
}

export async function getAuthors(): Promise<Author[]> {
  return wrap(
    getDocs(collection(db_fs, 'authors')).then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Author))),
    []
  );
}

// --- Wikipedia Enrichment ---
export async function enrichAuthorFromWiki(name: string): Promise<Partial<Author> | null> {
  try {
    // 1. Search for generic page
    const searchUrl = `https://vi.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(name)}&limit=1&namespace=0&format=json&origin=*`;
    const searchRes = await fetchWithProxy(searchUrl);

    // Wiki opensearch returns [search, [titles], [descriptions], [urls]]
    if (!searchRes || !searchRes[1] || searchRes[1].length === 0) return null;

    const pageTitle = searchRes[1][0];

    // 2. Get details (summary & thumbnail)
    const detailUrl = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const detailRes = await fetchWithProxy(detailUrl);

    if (!detailRes) return null;

    return {
      bio: detailRes.extract || undefined,
      avatar: detailRes.thumbnail ? detailRes.thumbnail.source : undefined
    };

  } catch (error) {
    console.warn("Wiki enrichment failed:", error);
    return null;
  }
}

export async function getAuthorByName(name: string): Promise<Author | undefined> {

  if (!name) return undefined;
  return wrap(
    (async () => {
      const q = query(
        collection(db_fs, 'authors'),
        where('name', '==', name),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return undefined;
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() } as Author;
    })(),
    undefined
  );
}

export async function saveAuthor(author: Author): Promise<string> {
  const id = author.id || Date.now().toString();

  // Nếu đang update author có sẵn, kiểm tra xem name có thay đổi không
  if (author.id) {
    const existingSnap = await getDoc(doc(db_fs, 'authors', author.id));
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as Author;

      // Nếu name thay đổi, cần sync tất cả books
      if (existingData.name !== author.name) {
        return wrap(
          (async () => {
            const batch = writeBatch(db_fs);

            // 1. Update author
            batch.set(doc(db_fs, 'authors', id), { ...author, id }, { merge: true });

            // 2. Find and update all books with this authorId
            const booksSnap = await getDocs(
              query(collection(db_fs, 'books'), where('authorId', '==', author.id))
            );

            booksSnap.docs.forEach(d => {
              batch.update(d.ref, { author: author.name });
            });

            await batch.commit();
            return id;
          })(),
          id,
          'SAVE_AUTHOR_AND_SYNC',
          `${author.name} (synced ${0} books)`
        );
      }
    }
  }

  // Normal save (no name change or new author)
  return wrap(
    setDoc(doc(db_fs, 'authors', id), { ...author, id }, { merge: true }).then(() => id),
    id,
    'SAVE_AUTHOR',
    author.name
  );
}


export async function deleteAuthor(id: string): Promise<void> {
  await wrap(
    deleteDoc(doc(db_fs, 'authors', id)),
    undefined,
    'DELETE_AUTHOR',
    id
  );
}

export async function saveCategory(category: CategoryInfo): Promise<void> {
  await wrap(
    setDoc(doc(db_fs, 'categories', category.name), category, { merge: true }),
    undefined,
    'SAVE_CAT',
    category.name
  );
}

export async function deleteCategory(name: string): Promise<void> {
  await wrap(
    deleteDoc(doc(db_fs, 'categories', name)),
    undefined,
    'DELETE_CAT',
    name
  );
}

export async function deleteAuthorsBulk(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await wrap(
    (async () => {
      const batch = writeBatch(db_fs);
      ids.forEach(id => {
        batch.delete(doc(db_fs, 'authors', id));
      });
      await batch.commit();
    })(),
    undefined,
    'DELETE_AUTHORS_BULK',
    `${ids.length} items`
  );
}

export async function deleteCategoriesBulk(names: string[]): Promise<void> {
  if (names.length === 0) return;
  await wrap(
    (async () => {
      const batch = writeBatch(db_fs);
      names.forEach(name => {
        batch.delete(doc(db_fs, 'categories', name));
      });
      await batch.commit();
    })(),
    undefined,
    'DELETE_CATEGORIES_BULK',
    `${names.length} items`
  );
}

