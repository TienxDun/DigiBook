
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  increment,
  writeBatch,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { db_fs } from "../firebase";
import { Order, OrderItem, CartItem } from '../../types';
import { wrap, logActivity } from "./core";

export async function createOrder(orderInfo: any, cartItems: CartItem[]) {
  try {
    const bookChecks = await Promise.all(
      cartItems.map(item => getDoc(doc(db_fs, 'books', item.id)))
    );

    const outOfStockItems: string[] = [];
    cartItems.forEach((item, index) => {
      const snap = bookChecks[index];
      if (snap.exists()) {
        const currentStock = snap.data().stockQuantity || 0;
        if (currentStock < item.quantity) {
          outOfStockItems.push(item.title);
        }
      }
    });

    if (outOfStockItems.length > 0) {
      const error = new Error(`Rất tiếc, các sách sau đã hết hàng hoặc không đủ số lượng: ${outOfStockItems.join(', ')}`);
      (error as any).code = 'OUT_OF_STOCK';
      throw error;
    }

    const items: OrderItem[] = cartItems.map(item => ({
      bookId: item.id,
      title: item.title,
      priceAtPurchase: item.price,
      quantity: item.quantity,
      cover: item.cover
    }));

    const batch = writeBatch(db_fs);
    const orderRef = doc(collection(db_fs, 'orders'));
    const orderId = orderRef.id;

    batch.set(orderRef, {
      ...orderInfo,
      items,
      date: new Date().toLocaleDateString('vi-VN'),
      createdAt: serverTimestamp()
    });

    cartItems.forEach((item, index) => {
      if (bookChecks[index].exists()) {
        batch.update(doc(db_fs, 'books', item.id), { stockQuantity: increment(-item.quantity) });
      }
    });

    await batch.commit();

    logActivity('ORDER_CREATED', orderId, 'SUCCESS', 'INFO', 'ORDER');
    return { id: orderId };
  } catch (e: any) {
    if (e.code === 'OUT_OF_STOCK') {
      logActivity('ORDER_FAILED', e.message, 'ERROR', 'WARN', 'ORDER');
    } else {
      logActivity('ORDER_CREATED', e.message, 'ERROR', 'ERROR', 'ORDER');
    }
    throw e;
  }
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const q = userId === 'admin'
    ? collection(db_fs, 'orders')
    : query(collection(db_fs, 'orders'), where("userId", "==", userId));

  return wrap(
    getDocs(q).then(snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      return orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }),
    []
  );
}

export async function checkIfUserPurchasedBook(userId: string, bookId: string): Promise<boolean> {
  return wrap(
    getDocs(query(collection(db_fs, 'orders'), where("userId", "==", userId)))
      .then(snap => {
        return snap.docs.some(d => {
          const orderData = d.data();
          return orderData.items?.some((item: any) => item.bookId === bookId);
        });
      }),
    false
  );
}

export async function getOrderWithItems(orderId: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
  return wrap(
    getDoc(doc(db_fs, 'orders', orderId)).then(snap => snap.exists() ? { id: snap.id, ...snap.data() } as any : undefined),
    undefined
  );
}

export async function updateOrderStatus(orderId: string, newStatus: string, newStatusStep: number): Promise<void> {
  await wrap(
    updateDoc(doc(db_fs, 'orders', orderId), {
      status: newStatus,
      statusStep: newStatusStep,
      updatedAt: serverTimestamp()
    }),
    undefined,
    'UPDATE_ORDER_STATUS',
    `${orderId} -> ${newStatus} (step ${newStatusStep})`
  );
}

export async function syncUserCart(userId: string, cartItems: CartItem[]): Promise<void> {
  await wrap(
    setDoc(doc(db_fs, 'userCarts', userId), {
      items: cartItems.map(item => ({ ...item, updatedAt: new Date().toISOString() })),
      updatedAt: serverTimestamp()
    }),
    undefined,
    'SYNC_CART',
    userId
  );
}

export async function getUserCart(userId: string): Promise<CartItem[]> {
  return wrap(
    getDoc(doc(db_fs, 'userCarts', userId)).then(snap => snap.exists() ? snap.data().items as CartItem[] : []),
    []
  );
}
