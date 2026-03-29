import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';

vi.mock('../components/AdminBooks', () => ({ default: () => <div>Books module</div> }));
vi.mock('../components/AdminOrders', () => ({ default: () => <div>Orders module</div> }));
vi.mock('../components/AdminAuthors', () => ({ default: () => <div>Authors module</div> }));
vi.mock('../components/AdminCategories', () => ({ default: () => <div>Categories module</div> }));
vi.mock('../components/AdminCoupons', () => ({ default: () => <div>Coupons module</div> }));
vi.mock('../components/AdminUsers', () => ({ default: () => <div>Users module</div> }));
vi.mock('../components/AdminLogs', () => ({ default: () => <div>Logs module</div> }));
vi.mock('../components/AdminAnalytics', () => ({ default: () => <div>Analytics module</div> }));
vi.mock('../components/AdminTikiInspector', () => ({ default: () => <div>Inspector module</div> }));
vi.mock('../sections/AdminOverview', () => ({ default: () => <div>Overview module</div> }));

vi.mock('../hooks/useAdminTheme', () => ({
  useAdminTheme: () => ({
    theme: 'midnight',
    isMidnight: true,
    toggleTheme: vi.fn(),
  }),
}));

const collectionState = {
  data: [],
  setData: vi.fn(),
  isLoading: false,
  error: null,
  refresh: vi.fn().mockResolvedValue([]),
};

vi.mock('../hooks/useAdminBooks', () => ({
  useAdminBooks: () => ({ ...collectionState, books: [] }),
}));
vi.mock('../hooks/useAdminOrders', () => ({
  useAdminOrders: () => ({ ...collectionState, orders: [] }),
}));
vi.mock('../hooks/useAdminAuthors', () => ({
  useAdminAuthors: () => ({ ...collectionState, authors: [] }),
}));
vi.mock('../hooks/useAdminCategories', () => ({
  useAdminCategories: () => ({ ...collectionState, categories: [] }),
}));
vi.mock('../hooks/useAdminCoupons', () => ({
  useAdminCoupons: () => ({ ...collectionState, coupons: [] }),
}));
vi.mock('../hooks/useAdminUsers', () => ({
  useAdminUsers: () => ({ ...collectionState, users: [] }),
}));
vi.mock('../hooks/useAdminLogs', () => ({
  useAdminLogs: () => ({
    logs: [],
    setLogs: vi.fn(),
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    refresh: vi.fn().mockResolvedValue([]),
    loadMore: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../services/admin.service', () => ({
  adminService: {
    syncAllUsersMembership: vi.fn().mockResolvedValue({ success: true, updatedCount: 0 }),
  },
}));

describe('AdminDashboard', () => {
  it('renders overview by default and switches modules from sidebar', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText('Overview module')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /người dùng/i }));
    expect(await screen.findByText('Users module')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /kho sách/i }));
    expect(await screen.findByText('Books module')).toBeInTheDocument();
  });
});
