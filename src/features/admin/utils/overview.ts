import { getOrderStatusMeta, isOrderActiveStep, normalizeOrderStatusStep } from '@/shared/utils/orderStatus';
import { AdminChartPoint, AdminChartView, AdminOverviewStats, Author, Book, CategoryInfo, Coupon, Order } from '../types';
import { getEntityTimestamp, parseDateVN } from './date';

const buildRevenueByDay = (orders: Order[], chartView: AdminChartView): AdminChartPoint[] => {
  const daysToShow = chartView === 'week' ? 7 : 30;
  const dateList = [...Array(daysToShow)]
    .map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      return date.toDateString();
    })
    .reverse();

  return dateList.map((dateStr) => {
    const total = orders
      .filter((order) => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : parseDateVN(order.date);
        return orderDate.toDateString() === dateStr;
      })
      .reduce((sum, order) => sum + (order.payment?.total || 0), 0);

    const date = new Date(dateStr);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: (date.getMonth() + 1).toString().padStart(2, '0'),
      total,
    };
  });
};

export const buildAdminOverviewStats = ({
  orders,
  books,
  categories,
  authors,
  coupons,
  chartView,
}: {
  orders: Order[];
  books: Book[];
  categories: CategoryInfo[];
  authors: Author[];
  coupons: Coupon[];
  chartView: AdminChartView;
}): AdminOverviewStats => {
  const totalRevenue = orders.reduce((sum, order) => sum + (order.payment?.total || 0), 0);
  const lowStock = books.filter((book) => book.stockQuantity > 0 && book.stockQuantity < 10).length;
  const outOfStock = books.filter((book) => book.stockQuantity === 0).length;
  const pendingOrders = orders.filter((order) => isOrderActiveStep(order.statusStep, order.status)).length;
  const completedOrders = orders.filter((order) => normalizeOrderStatusStep(order.statusStep, order.status) === 3).length;
  const totalBooks = books.reduce((sum, book) => sum + book.stockQuantity, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => {
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : parseDateVN(order.date);
    return orderDate.toDateString() === today;
  }).length;

  const revenueByDay = buildRevenueByDay(orders, chartView);
  const maxRevenue = Math.max(...revenueByDay.map((point) => point.total), 1);

  const recentOrders = [...orders]
    .sort((left, right) => getEntityTimestamp(right) - getEntityTimestamp(left))
    .slice(0, 5);

  const bookSalesMap = new Map<string, number>();
  orders.forEach((order) => {
    order.items?.forEach((item) => {
      bookSalesMap.set(item.bookId, (bookSalesMap.get(item.bookId) || 0) + item.quantity);
    });
  });

  const topSellingBooks = [...books]
    .map((book) => ({
      ...book,
      salesCount: bookSalesMap.get(book.id) || 0,
    }))
    .sort((left, right) => right.salesCount - left.salesCount)
    .slice(0, 5);

  return {
    totalRevenue,
    lowStock,
    outOfStock,
    pendingOrders,
    completedOrders,
    totalOrders: orders.length,
    totalBooks,
    avgOrderValue,
    todayOrders,
    totalCategories: categories.length,
    totalAuthors: authors.length,
    totalCoupons: coupons.length,
    revenueByDay,
    maxRevenue,
    recentOrders,
    topSellingBooks,
  };
};

export const getRecentOrderStatusMeta = getOrderStatusMeta;
