/**
 * Barrel export file cho layouts
 * Centralize tất cả layout-related exports để dễ import
 */

// Individual components
export { default as Header } from './Header';
export { default as Footer } from './Footer';
export { default as MobileNav } from './MobileNav';

// Layout wrappers
export {
    LayoutWrapper as MainLayout,  // Alias rõ ràng hơn
    AdminRoute,
    MainContent
} from './Layout';

export { AdminLayout } from './AdminLayout';
