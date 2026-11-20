import { ButtonLink } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { ROUTES } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <Container className="py-32 text-center space-y-6">
      <span className="text-xs font-mono text-[#7E7C77] uppercase tracking-widest block">ERROR 404</span>
      <h1 className="text-5xl sm:text-8xl font-semibold tracking-tighter uppercase text-[#2E2D2B]">LOST IN THE STREETS.</h1>
      <p className="text-xs sm:text-sm text-[#7E7C77] max-w-md mx-auto">The page you're looking for doesn't exist or has moved.</p>
      <div className="flex flex-wrap justify-center gap-3 pt-4">
        <ButtonLink to={ROUTES.home} size="lg" arrow>Back to Home</ButtonLink>
        <ButtonLink to={ROUTES.newArrivals} variant="ghost" size="lg">New Arrivals</ButtonLink>
      </div>
    </Container>
  );
}
