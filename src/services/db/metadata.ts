
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { db_fs } from "../../lib/firebase";
import { CategoryInfo, Author, Book } from '../../types/';
import { wrap, logActivity } from "./core";
import { INITIAL_CATEGORIES } from '../../constants/categories';

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

export async function saveAuthor(author: Author): Promise<string> {
  const id = author.id || Date.now().toString();
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

export async function seedDatabase(): Promise<{ success: boolean, count: number, error?: string }> {
  if (!db_fs) return { success: false, count: 0, error: "Firebase chưa được cấu hình" };
  try {
    const batch = writeBatch(db_fs);
    INITIAL_CATEGORIES.forEach(cat => {
      const ref = doc(db_fs, 'categories', cat.name);
      batch.set(ref, cat);
    });

    await batch.commit();
    logActivity('SEED_DATA', `Seeded ${INITIAL_CATEGORIES.length} categories.`, 'SUCCESS', 'INFO', 'ADMIN');
    return { success: true, count: INITIAL_CATEGORIES.length };
  } catch (error: any) {
    logActivity('SEED_DATA', error.message, 'ERROR', 'ERROR', 'ADMIN');
    return { success: false, count: 0, error: error.message };
  }
}

export async function saveBooksBatch(books: Book[]): Promise<number> {
  if (books.length === 0) return 0;

  return wrap(
    (async () => {
      const batch = writeBatch(db_fs);

      const existingAuthors = await getAuthors();
      const authorMap = new Map(existingAuthors.map(a => [a.name.toLowerCase().trim(), a.id]));

      for (const book of books) {
        const authorName = book.author.trim();
        const authorKey = authorName.toLowerCase();

        let authorId: string;

        if (authorMap.has(authorKey)) {
          authorId = authorMap.get(authorKey)!;
        } else {
          authorId = `author-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const newAuthor: Author = {
            id: authorId,
            name: authorName,
            bio: book.authorBio || `Tác giả của cuốn sách "${book.title}".`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&size=256`
          };

          const authorDocRef = doc(db_fs, 'authors', authorId);
          batch.set(authorDocRef, { ...newAuthor, createdAt: serverTimestamp() });
          authorMap.set(authorKey, authorId);
        }

        book.authorId = authorId;
        const cleanBook = Object.fromEntries(
          Object.entries(book).filter(([_, v]) => v !== undefined)
        );

        const bookDocRef = doc(db_fs, 'books', book.id);
        batch.set(bookDocRef, { ...cleanBook, updatedAt: serverTimestamp() }, { merge: true });
      }

      await batch.commit();
      return books.length;
    })(),
    0,
    'BATCH_SAVE_BOOKS',
    `Imported ${books.length} items and synced authors`
  );
}
