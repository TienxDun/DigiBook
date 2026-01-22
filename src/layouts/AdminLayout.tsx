import React from 'react';
import { CartSidebar } from '@/features/cart';

/**
 * AdminLayout - Layout wrapper cho admin pages
 * 
 * Hiện tại chỉ là wrapper đơn giản, có thể mở rộng sau với:
 * - Admin Sidebar
 * - Admin Header với quick actions
 * - Admin-specific notifications
 */
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {/* Future: Admin Header/Sidebar sẽ được thêm vào đây */}
            <main className="flex-grow">
                {children}
            </main>

            {/* CartSidebar cần thiết cho admin khi manage orders */}
            <CartSidebar />
        </div>
    );
};

export default AdminLayout;
