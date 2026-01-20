import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

// Lazy load admin components with separate chunk
const AdminDashboard = lazy(() => import(/* webpackChunkName: "admin" */ '../pages/AdminDashboard'));

const AdminRoutes: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-micro font-bold uppercase tracking-premium text-slate-500">Đang tải trang quản lý...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route index element={<PageTransition><AdminDashboard /></PageTransition>} />
        <Route path="*" element={<PageTransition><AdminDashboard /></PageTransition>} />
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;