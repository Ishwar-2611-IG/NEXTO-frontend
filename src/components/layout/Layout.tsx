import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AiStylist } from '../../features/ai-stylist/AiStylist';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Footer } from './Footer';
import { Header } from './Header';
import { AnnouncementBar } from './AnnouncementBar';
import { ScrollToTop } from './ScrollToTop';
import { Toast } from './Toast';

function PageLoader() {
  return (
    <div role="status" className="mx-auto max-w-[1440px] px-6 py-32 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#7E7C77]">
      Loading…
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2E2D2B] font-sans antialiased selection:bg-[#6B7B6E] selection:text-white">
      <ScrollToTop />
      <Toast />
      <AiStylist />
      <AnnouncementBar />
      <Header />
      <main>
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
