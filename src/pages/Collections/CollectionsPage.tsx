import { StoreImage } from '../../components/common/StoreImage';
import { Link } from 'react-router-dom';
import { Button, ButtonLink } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { HeroBanner } from '../../components/common/HeroBanner';
import { PromoBanner } from '../../components/common/PromoBanner';
import { LINK_BUTTON_CLASS, RailArrows, SectionHeading } from '../../components/common/SectionHeading';
import { TileGrid } from '../../components/common/TileGrid';
import { IMG, unsplash } from '../../constants/images';
import { ROUTES } from '../../constants/routes';
import { COLLECTION_TILES, CURATED_LOOKS, LOOKBOOK } from '../../data/collections';
import { useCart } from '../../hooks/useCart';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { formatPrice } from '../../utils/format';

export function CollectionsPage() {
  usePageTitle('Collections');
  const { showToast } = useToast();
  const { addToCart } = useCart();

  return (
    <div className="space-y-16 pb-20">
      <HeroBanner
        image={unsplash(IMG.minimalistWardrobe, 1800)}
        alt="Collections Hero"
        eyebrow="COLLECTIONS"
        titleLines={['WEAR', 'THE NEXT', 'STORY.']}
        titleClassName="text-4xl sm:text-7xl"
        description="Curated collections. Real stories. Same people. New Perspectives."
        heightClassName="h-[420px] sm:h-[480px]"
      >
        <Button size="lg" arrow onClick={() => showToast('Exploring lookbook...')}>
          Explore Lookbook
        </Button>
      </HeroBanner>

      <TileGrid
        tiles={COLLECTION_TILES}
        gridClassName="grid grid-cols-2 sm:grid-cols-5 gap-4"
        tileClassName="h-28 flex items-end p-4"
        imageClassName="w-full h-full object-cover filter brightness-50 group-hover:scale-105 transition-transform"
        onSelect={(tile) => showToast(`Opening ${tile.title}...`)}
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-lg bg-[#FFFCF7] border border-[#7E7C77]/20 shadow-[0_10px_30px_-10px_rgba(46,45,43,0.06)]">
          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-mono text-[#7E7C77] uppercase tracking-widest block">FEATURED COLLECTION</span>
              <h2 className="text-4xl sm:text-6xl font-semibold uppercase tracking-tight text-[#2E2D2B] leading-none">URBAN ESSENTIALS</h2>
              <p className="text-xs sm:text-sm text-[#66645F] leading-relaxed">
                Everyday pieces for an uncommon mindset. Clean silhouettes. Premium fits. Made to move.
              </p>
            </div>
            <ButtonLink to={ROUTES.men} size="lg" arrow className="w-fit">
              Shop the Collection
            </ButtonLink>
          </div>
          <div className="lg:col-span-7 relative min-h-[350px]">
            <StoreImage src={unsplash(IMG.editorialStreetwear, 1200)} alt="Urban Essentials" className="absolute inset-0 w-full h-full object-cover filter brightness-85" />
            <div className="absolute bottom-6 right-6 rounded-full font-mono text-[10px] text-[#2E2D2B] uppercase tracking-widest bg-[#F9F6F0]/95 px-4 py-2 border border-[#7E7C77]/25">
              URBAN ESSENTIALS // 01
            </div>
          </div>
        </div>
      </Container>

      <Container className="space-y-8">
        <SectionHeading eyebrow="THE LOOKBOOK" title="Real people. Real style. Real streets." actions={<RailArrows />} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {LOOKBOOK.map((look) => (
            <button
              key={look.title}
              type="button"
              onClick={() => showToast(`Opening look: ${look.title}`)}
              className="relative aspect-[3/4] rounded-lg bg-[#F0EBE2] border border-[#7E7C77]/20 group cursor-pointer overflow-hidden flex flex-col justify-end p-3 sm:p-6 text-left"
            >
              <StoreImage src={look.img} alt="" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="absolute inset-0 w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <span className="relative z-10 space-y-1 block">
                <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest block">{look.subtitle}</span>
                <span className="text-base font-semibold uppercase text-white block sm:text-xl">{look.title}</span>
              </span>
            </button>
          ))}
        </div>
      </Container>

      <Container className="space-y-8 pt-6">
        <SectionHeading
          eyebrow="SHOP THE LOOK"
          title="Complete outfits, curated by our stylists."
          actions={
            <Link to={ROUTES.men} className={LINK_BUTTON_CLASS}>
              View All →
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {CURATED_LOOKS.map((look) => (
            <div key={look.name} className="min-w-0 rounded-lg bg-[#FFFCF7] border border-[#7E7C77]/20 p-3 sm:p-4 space-y-4 shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)]">
              <div className="relative aspect-[3/4] bg-[#F0EBE2]">
                <StoreImage src={look.img} alt={look.name} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="break-words text-xs font-bold text-[#2E2D2B] sm:text-sm">{look.name}</h4>
                <p className="text-xs font-mono text-[#7E7C77]">{look.items} • {formatPrice(look.price)}</p>
              </div>
              <button
                type="button"
                onClick={() => addToCart({ name: look.name, price: look.price, img: look.img })}
                className="w-full rounded-full bg-[#526457] text-white px-2 py-3 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.14em] hover:bg-[#445549]"
              >
                + Add All to Bag
              </button>
            </div>
          ))}
        </div>
      </Container>

      <PromoBanner
        image={unsplash(IMG.streetwearLook, 1600)}
        alt="Monsoon Edit"
        eyebrow="LIMITED EDITION"
        title="THE MONSOON EDIT"
        text="Weather changes. Style stays."
        ctaLabel="Explore Now"
        onCta={() => showToast('Exploring Monsoon Edit...')}
      />
    </div>
  );
}
