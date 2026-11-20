import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { ROUTES } from '../constants/routes';
import { AdminRoute } from '../features/admin/AdminRoute';

// Route-level code splitting: each page is its own chunk, shown behind <Suspense> in Layout.
const page = <K extends string>(loader: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const HomePage = page(() => import('../pages/Home/HomePage'), 'HomePage');
const AboutPage = page(() => import('../pages/About/AboutPage'), 'AboutPage');
const MenPage = page(() => import('../pages/Catalog/MenPage'), 'MenPage');
const WomenPage = page(() => import('../pages/Catalog/WomenPage'), 'WomenPage');
const AccessoriesPage = page(() => import('../pages/Catalog/AccessoriesPage'), 'AccessoriesPage');
const NewArrivalsPage = page(() => import('../pages/Catalog/NewArrivalsPage'), 'NewArrivalsPage');
const CollectionsPage = page(() => import('../pages/Collections/CollectionsPage'), 'CollectionsPage');
const LoginPage = page(() => import('../pages/Login/LoginPage'), 'LoginPage');
const AccountPage = page(() => import('../pages/Account/AccountPage'), 'AccountPage');
const CartPage = page(() => import('../pages/Cart/CartPage'), 'CartPage');
const WishlistPage = page(() => import('../pages/Wishlist/WishlistPage'), 'WishlistPage');
const ProductDetailPage = page(() => import('../pages/ProductDetail/ProductDetailPage'), 'ProductDetailPage');
const OrderConfirmationPage = page(() => import('../pages/OrderConfirmation/OrderConfirmationPage'), 'OrderConfirmationPage');
const SupportPage = page(() => import('../pages/Support/SupportPage'), 'SupportPage');
const SearchPage = page(() => import('../pages/Search/SearchPage'), 'SearchPage');
const NotFoundPage = page(() => import('../pages/NotFound/NotFoundPage'), 'NotFoundPage');
const AdminDashboardPage = page(() => import('../pages/Admin/AdminDashboardPage'), 'AdminDashboardPage');
const ChangePasswordPage = page(() => import('../pages/ChangePassword/ChangePasswordPage'), 'ChangePasswordPage');
const ForgotPasswordPage = page(() => import('../pages/ForgotPassword/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('../pages/ResetPassword/ResetPasswordPage'), 'ResetPasswordPage');
const AcceptInvitePage = page(() => import('../pages/AcceptInvite/AcceptInvitePage'), 'AcceptInvitePage');

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="px-4 py-20 text-center text-sm text-[#7E7C77]">Loading NEXTO…</div>}>
    <Routes>
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/admin/*" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path={ROUTES.about} element={<AboutPage />} />
        <Route path={ROUTES.men} element={<MenPage />} />
        <Route path={ROUTES.women} element={<WomenPage />} />
        <Route path={ROUTES.accessories} element={<AccessoriesPage />} />
        <Route path={ROUTES.newArrivals} element={<NewArrivalsPage />} />
        <Route path={ROUTES.collections} element={<CollectionsPage />} />
        <Route path={ROUTES.search} element={<SearchPage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path={ROUTES.cart} element={<CartPage />} />
        <Route path={ROUTES.wishlist} element={<WishlistPage />} />
        <Route path={ROUTES.orderConfirmation} element={<OrderConfirmationPage />} />
        <Route path={ROUTES.support} element={<SupportPage />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route
          path={ROUTES.account}
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
