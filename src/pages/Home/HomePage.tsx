import { StoreImage } from '../../components/common/StoreImage';
import { Link, useNavigate } from 'react-router-dom';
import { ButtonLink } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { HeroAside, HeroBanner } from '../../components/common/HeroBanner';
import { HomepageHeroCarousel } from '../../components/common/HomepageHeroCarousel';
import { ProductGrid } from '../../components/common/ProductGrid';
import { PromoBanner } from '../../components/common/PromoBanner';
import { LINK_BUTTON_CLASS, RailArrows, SectionHeading } from '../../components/common/SectionHeading';
import { IMG, unsplash } from '../../constants/images';
import { ROUTES } from '../../constants/routes';
import { HOME_CATEGORIES } from '../../data/home';
import { BEST_SELLERS, NEW_ARRIVALS_PRODUCTS } from '../../data/products';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FiTruck, FiRefreshCw, FiShield, FiAward } from 'react-icons/fi';
import { NewArrivalsRail } from './NewArrivalsRail';
import { useBackendProducts } from '../../hooks/useBackendProducts';
import { ProductGridSkeleton } from '../../components/common/Skeleton';

export function HomePage() {
  usePageTitle('');
  const navigate = useNavigate();
  const { products: backendProducts, loading } = useBackendProducts();
  const newArrivals = backendProducts.length
    ? backendProducts.filter((product) => product.newArrival).slice(0, 8)
    : NEW_ARRIVALS_PRODUCTS;
  const bestSellers = backendProducts.length
    ? backendProducts.filter((product) => product.featured).slice(0, 4)
    : BEST_SELLERS;

  return (
    <div className="space-y-16 pb-20 sm:space-y-20">
      <HomepageHeroCarousel
        fallback={
          <HeroBanner
            image={unsplash(IMG.editorialStreetwear, 1800)}
            alt="NEXTO seasonal collection in natural textures and muted tones"
            eyebrow="NEXTO STUDIO · THE NEW SEASON"
            titleLines={['EVERYDAY', 'FORM,']}
            accent={{ text: 'REFINED.', className: 'text-[#6B7B6E] font-serif italic normal-case' }}
            description="Considered essentials. Natural textures. A quieter kind of statement."
            heightClassName="min-h-[560px] sm:min-h-[640px] lg:min-h-[700px]"
            sectionClassName="!items-end pb-16 pt-32 md:!items-center md:pt-20 md:pb-10"
            overlayClassName="from-[#F9F6F0]/95 via-[#F9F6F0]/76 to-[#F9F6F0]/10"
            contentClassName="max-w-2xl space-y-6 md:py-12"
            aside={<HeroAside lines={['NATURAL MATERIALS', 'CONSIDERED DESIGN', 'MADE TO LIVE IN']} scrollHint />}
          >
            <ButtonLink to={ROUTES.collections} size="lg" arrow>
              Explore the collection
            </ButtonLink>
          </HeroBanner>
        }
      />

      <Container className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HOME_CATEGORIES.map((cat) => (
          <Link
            key={cat.title}
            to={cat.to}
            className="relative h-[320px] sm:h-[390px] group cursor-pointer overflow-hidden rounded-lg border border-[#7E7C77]/20 flex flex-col justify-end p-6 sm:p-8 shadow-[0_10px_30px_-10px_rgba(46,45,43,0.07)]"
          >
            <StoreImage src={cat.img} alt="" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out filter brightness-[.78] saturate-[.8]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="relative z-10 space-y-2">
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">{cat.title}</h2>
              <p className="text-sm text-white/85">{cat.subtitle}</p>
              <span className="inline-block pt-2 text-xs font-mono uppercase tracking-widest text-white underline underline-offset-4">
                Shop {cat.title} →
              </span>
            </div>
          </Link>
        ))}
      </Container>

      {newArrivals.length > 0 && <NewArrivalsRail products={newArrivals} />}

      {bestSellers.length > 0 && <Container className="space-y-8 pt-2">
        <SectionHeading
          eyebrow="THE PIECES YOU RETURN TO"
          title="Quiet favourites"
          className="pb-6"
          actions={
            <div className="flex items-center space-x-6">
              <Link to={ROUTES.collections} className={`${LINK_BUTTON_CLASS} text-[#66645F]`}>
                View All →
              </Link>
              <RailArrows />
            </div>
          }
        />
        {loading ? (
          <ProductGridSkeleton count={4} gridClassName="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" />
        ) : (
          <ProductGrid
            products={bestSellers}
            addLabel="+ Add to Bag"
            gridClassName="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          />
        )}
      </Container>}

      <PromoBanner
        className="pt-10"
        image={unsplash(IMG.minimalistWardrobe, 1800)}
        alt="NEXTO considered essentials in a warm editorial setting"
        eyebrow="DESIGNED FOR EVERY DAY"
        title="LESS, BUT BETTER"
        text="Thoughtful silhouettes and dependable essentials, made to become part of your everyday."
        ctaLabel="Discover our approach"
        ctaArrow={false}
        onCta={() => navigate(ROUTES.about)}
        heightClassName="h-[380px] sm:h-[460px]"
        paddingClassName="p-8 sm:p-16"
        titleClassName="text-5xl sm:text-7xl tracking-tight leading-[0.92]"
        gradient
      />

      <Container className="pt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#7E7C77]/20 rounded-lg border border-[#7E7C77]/20 bg-[#FFFCF7] p-4 sm:p-6 text-center shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)]">
          {[
            { icon: FiTruck, title: 'Thoughtful delivery', desc: 'Complimentary over ₹999' },
            { icon: FiRefreshCw, title: 'Easy returns', desc: 'Simple 7-day returns' },
            { icon: FiShield, title: 'Secure checkout', desc: 'Protected payments' },
            { icon: FiAward, title: 'Made with care', desc: 'Quality in every detail' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-4 space-y-2">
              <Icon className="mx-auto size-7 text-[#6B7B6E]" aria-hidden="true" />
              <h2 className="text-base font-extrabold uppercase tracking-[0.14em] text-[#2E2D2B]">{title}</h2>
              <p className="text-sm text-[#7E7C77]">{desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
