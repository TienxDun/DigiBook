import type { AdminCollectionLoadOptions } from '../hooks/useAdminCollection';

export type AdminRefreshScope =
  | 'books'
  | 'authors'
  | 'categories'
  | 'coupons'
  | 'orders'
  | 'users'
  | 'overview'
  | 'logs';

type RefreshHandler = (options?: AdminCollectionLoadOptions) => Promise<unknown>;

export interface AdminRefreshDependencies {
  books: RefreshHandler;
  authors: RefreshHandler;
  categories: RefreshHandler;
  coupons: RefreshHandler;
  orders: RefreshHandler;
  users: RefreshHandler;
  overviewLogs: RefreshHandler;
  logs: RefreshHandler;
}

const runRefreshHandlers = async (options: AdminCollectionLoadOptions | undefined, ...handlers: RefreshHandler[]) => {
  await Promise.all(handlers.map((handler) => handler(options)));
};

export const createAdminRefreshCoordinator = ({
  books,
  authors,
  categories,
  coupons,
  orders,
  users,
  overviewLogs,
  logs,
}: AdminRefreshDependencies) => {
  const forceRefresh = { force: true } as const;

  const refreshByScope: Record<AdminRefreshScope, () => Promise<void>> = {
    books: async () => {
      await books(forceRefresh);
    },
    authors: async () => {
      await authors(forceRefresh);
    },
    categories: async () => {
      await categories(forceRefresh);
    },
    coupons: async () => {
      await coupons(forceRefresh);
    },
    orders: async () => {
      await orders(forceRefresh);
    },
    users: async () => {
      await users(forceRefresh);
    },
    overview: async () => {
      await runRefreshHandlers(forceRefresh, books, orders, authors, categories, coupons, overviewLogs);
    },
    logs: async () => {
      await logs(forceRefresh);
    },
  };

  return {
    refreshAdminData: (scope: AdminRefreshScope) => refreshByScope[scope](),
    refreshBooksDeps: async () => {
      await runRefreshHandlers(forceRefresh, books, authors, categories);
    },
    refreshAuthorsDeps: async () => {
      await runRefreshHandlers(forceRefresh, authors);
    },
    refreshCategoriesDeps: async () => {
      await runRefreshHandlers(forceRefresh, categories);
    },
    refreshCouponsDeps: async () => {
      await runRefreshHandlers(forceRefresh, coupons);
    },
    refreshOrdersDeps: async () => {
      await runRefreshHandlers(forceRefresh, orders, users);
    },
    refreshUsersData: async () => {
      await runRefreshHandlers(forceRefresh, users);
    },
    refreshLogsData: async () => {
      await runRefreshHandlers(forceRefresh, logs);
    },
    refreshOverviewData: refreshByScope.overview,
  };
};
