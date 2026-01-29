
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
  setDoc,
  runTransaction
} from "firebase/firestore";
import { db_fs } from "../../../lib/firebase";
import { Order, OrderItem, CartItem } from '@/shared/types/';
import { wrap, logActivity } from "../core";

export async function createOrder(orderInfo: any, cartItems: CartItem[]) {
  try {
    const orderRef = doc(collection(db_fs, 'orders'));
    const orderId = orderRef.id;

    await runTransaction(db_fs, async (transaction) => {
      // 1. READ: Get all books to check stock
      const bookRefs = cartItems.map(item => doc(db_fs, 'books', item.id));
      const bookSnaps = await Promise.all(bookRefs.map(ref => transaction.get(ref)));

      const outOfStockItems: string[] = [];

      // 2. CHECK: Validate stock for all items
      cartItems.forEach((item, index) => {
        const snap = bookSnaps[index];
        if (!snap.exists()) {
          outOfStockItems.push(`${item.title} (Không tồn tại)`);
        } else {
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

      // 3. WRITE: Deduct stock and Create Order
      const items: OrderItem[] = cartItems.map(item => ({
        bookId: item.id,
        title: item.title,
        priceAtPurchase: item.price,
        quantity: item.quantity,
        cover: item.cover
      }));

      transaction.set(orderRef, {
        ...orderInfo,
        items,
        date: new Date().toLocaleDateString('vi-VN'),
        createdAt: serverTimestamp()
      });

      cartItems.forEach((item, index) => {
        // We can safely use increment here inside transaction or manual calculation
        // Atomic increment is still good practice even inside transaction
        transaction.update(bookRefs[index], { stockQuantity: increment(-item.quantity) });
      });
    });

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
