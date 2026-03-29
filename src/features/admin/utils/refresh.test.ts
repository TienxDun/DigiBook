import { describe, expect, it, vi } from 'vitest';
import { createAdminRefreshCoordinator } from './refresh';

describe('createAdminRefreshCoordinator', () => {
  it('refreshes dependent datasets for book mutations', async () => {
    const refreshers = {
      books: vi.fn().mockResolvedValue(undefined),
      authors: vi.fn().mockResolvedValue(undefined),
      categories: vi.fn().mockResolvedValue(undefined),
      coupons: vi.fn().mockResolvedValue(undefined),
      orders: vi.fn().mockResolvedValue(undefined),
      users: vi.fn().mockResolvedValue(undefined),
      overviewLogs: vi.fn().mockResolvedValue(undefined),
      logs: vi.fn().mockResolvedValue(undefined),
    };

    const coordinator = createAdminRefreshCoordinator(refreshers);
    await coordinator.refreshBooksDeps();

    expect(refreshers.books).toHaveBeenCalledTimes(1);
    expect(refreshers.authors).toHaveBeenCalledTimes(1);
    expect(refreshers.categories).toHaveBeenCalledTimes(1);
    expect(refreshers.orders).not.toHaveBeenCalled();
    expect(refreshers.users).not.toHaveBeenCalled();
  });

  it('refreshes orders and users together after order mutations', async () => {
    const refreshers = {
      books: vi.fn().mockResolvedValue(undefined),
      authors: vi.fn().mockResolvedValue(undefined),
      categories: vi.fn().mockResolvedValue(undefined),
      coupons: vi.fn().mockResolvedValue(undefined),
      orders: vi.fn().mockResolvedValue(undefined),
      users: vi.fn().mockResolvedValue(undefined),
      overviewLogs: vi.fn().mockResolvedValue(undefined),
      logs: vi.fn().mockResolvedValue(undefined),
    };

    const coordinator = createAdminRefreshCoordinator(refreshers);
    await coordinator.refreshOrdersDeps();

    expect(refreshers.orders).toHaveBeenCalledTimes(1);
    expect(refreshers.users).toHaveBeenCalledTimes(1);
  });

  it('refreshes the full overview bundle when requested', async () => {
    const refreshers = {
      books: vi.fn().mockResolvedValue(undefined),
      authors: vi.fn().mockResolvedValue(undefined),
      categories: vi.fn().mockResolvedValue(undefined),
      coupons: vi.fn().mockResolvedValue(undefined),
      orders: vi.fn().mockResolvedValue(undefined),
      users: vi.fn().mockResolvedValue(undefined),
      overviewLogs: vi.fn().mockResolvedValue(undefined),
      logs: vi.fn().mockResolvedValue(undefined),
    };

    const coordinator = createAdminRefreshCoordinator(refreshers);
    await coordinator.refreshOverviewData();

    expect(refreshers.books).toHaveBeenCalledTimes(1);
    expect(refreshers.orders).toHaveBeenCalledTimes(1);
    expect(refreshers.authors).toHaveBeenCalledTimes(1);
    expect(refreshers.categories).toHaveBeenCalledTimes(1);
    expect(refreshers.coupons).toHaveBeenCalledTimes(1);
    expect(refreshers.overviewLogs).toHaveBeenCalledTimes(1);
    expect(refreshers.users).not.toHaveBeenCalled();
  });
});
