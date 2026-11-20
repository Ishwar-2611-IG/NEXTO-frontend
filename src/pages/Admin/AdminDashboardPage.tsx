import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  Activity,
  Archive,
  Boxes,
  ClipboardList,
  Image,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Tags,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ToastProvider } from '../../components/admin/Toast';
import { OverviewPage } from './OverviewPage';
import { SettingsPage } from './SettingsPage';
import ProductsPage from './ProductsPage';
import CategoriesPage from './CategoriesPage';
import InventoryPage from './InventoryPage';
import OrdersPage from './OrdersPage';
import CustomersPage from './CustomersPage';
import AdminManagementPage from './AdminManagementPage';
import CouponsPage from './CouponsPage';
import ReviewsPage from './ReviewsPage';
import ContentPage from './ContentPage';
import AuditLogPage from './AuditLogPage';
import BannersPage from './BannersPage';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

const navigation = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, roles: ['admin'] },
  { to: '/admin/customers', label: 'Customers', icon: Users, roles: ['admin'] },
  { to: '/admin/admins', label: 'Admin Management', icon: Shield, roles: ['admin'] },
  { to: '/admin/products', label: 'Products', icon: Package, roles: ['admin', 'inventory_manager'] },
  { to: '/admin/categories', label: 'Categories', icon: Tags, roles: ['admin', 'inventory_manager'] },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'inventory_manager'] },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, roles: ['admin', 'support'] },
  { to: '/admin/coupons', label: 'Coupons', icon: Wallet, roles: ['admin'] },
  { to: '/admin/reviews', label: 'Reviews', icon: ClipboardList, roles: ['admin', 'support'] },
  { to: '/admin/content', label: 'Content', icon: Archive, roles: ['admin'] },
  { to: '/admin/banners', label: 'Banners', icon: Image, roles: ['admin'] },
  { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  { to: '/admin/audit-logs', label: 'Audit log', icon: Activity, roles: ['admin', 'support'] },
];

export function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = user?.role ?? '';
  const allowedNavigation = navigation.filter((item) => item.roles.includes(role));
  const fallbackPath = allowedNavigation.find((item) => !item.end)?.to ?? '/admin';
  const canAccess = (roles: string[]) => roles.includes(role);
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F7F5F0] text-[#2E2D2B]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#7E7C77]/15 bg-[#FFFCF7] lg:flex">
          <div className="border-b border-[#7E7C77]/15 px-6 py-6">
            <p className="text-lg font-black tracking-[0.2em]">
              NEXTO<span className="text-[#6B7B6E]">.</span>
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#7E7C77]">
              Store administration
            </p>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {allowedNavigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#E8EDE6] text-[#405346]'
                      : 'text-[#66645F] hover:bg-[#F0EBE2]'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-[#7E7C77]/15 p-4">
            <p className="truncate text-xs font-semibold">{user?.name}</p>
            <p className="truncate text-[10px] text-[#7E7C77]">{user?.email}</p>
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#7E7C77] hover:text-[#2E2D2B]"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>
        <main className="min-h-screen lg:pl-64">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#7E7C77]/15 bg-[#FFFCF7]/90 px-5 py-4 backdrop-blur sm:px-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#6B7B6E]">
                NEXTO / Admin
              </p>
              <p className="mt-1 text-xs text-[#7E7C77]">Signed in as {user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-full border border-[#7E7C77]/20 px-4 py-2 text-xs font-semibold lg:hidden"
            >
              <LogOut size={14} /> Sign out
            </button>
          </header>
          <nav className="flex gap-2 overflow-x-auto border-b border-[#7E7C77]/15 bg-[#FFFCF7] px-4 py-2 lg:hidden">
            {allowedNavigation.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-2 text-[10px] font-semibold ${
                    isActive ? 'bg-[#E8EDE6] text-[#405346]' : 'text-[#66645F]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mx-auto max-w-7xl p-5 sm:p-8">
            <ErrorBoundary resetKey={location.pathname}>
            <Routes>
              <Route index element={canAccess(['admin']) ? <OverviewPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="settings" element={canAccess(['admin']) ? <SettingsPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="products/new" element={canAccess(['admin', 'inventory_manager']) ? <ProductsPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="products" element={canAccess(['admin', 'inventory_manager']) ? <ProductsPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="categories" element={canAccess(['admin', 'inventory_manager']) ? <CategoriesPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="inventory" element={canAccess(['admin', 'inventory_manager']) ? <InventoryPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="orders" element={canAccess(['admin', 'support']) ? <OrdersPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="customers" element={canAccess(['admin']) ? <CustomersPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="admins" element={canAccess(['admin']) ? <AdminManagementPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="coupons" element={canAccess(['admin']) ? <CouponsPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="reviews" element={canAccess(['admin', 'support']) ? <ReviewsPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="content" element={canAccess(['admin']) ? <ContentPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="banners" element={canAccess(['admin']) ? <BannersPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="audit-logs" element={canAccess(['admin', 'support']) ? <AuditLogPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

export default AdminDashboardPage;
