import { Link, useNavigate, useParams } from 'react-router-dom';
import { ButtonLink } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { EmptyState } from '../../components/common/EmptyState';
import { PDP_EXTRA_IMAGES } from '../../constants/commerce';
import { ROUTES } from '../../constants/routes';
import { ProductGallery } from '../../features/product/ProductGallery';
import { ProductPurchasePanel } from '../../features/product/ProductPurchasePanel';
import { ALL_PRODUCTS, getProductById } from '../../data/products';
import { useCart } from '../../hooks/useCart';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { useBackendProducts } from '../../hooks/useBackendProducts';
import { useEffect, useState } from 'react';
import type { Product } from '../../types';
import { getProduct } from '../../services/storeApi';
import { ProductReviews } from '../../features/product/ProductReviews';
import { ProductDetailSkeleton } from '../../components/common/Skeleton';

export function ProductDetailPage() {
  const { productId } = useParams();
  const { products: backendProducts, loading: backendLoading } = useBackendProducts();
  const [directProduct, setDirectProduct] = useState<Product | null>(null);
  const [directLoading, setDirectLoading] = useState(false);
  useEffect(() => {
    let active = true;
    if (productId && !/^\d+$/.test(productId)) {
      setDirectLoading(true);
      setDirectProduct(null);
      void getProduct(productId).then((product) => { if (active) { setDirectProduct(product); setDirectLoading(false); } }).catch(() => { if (active) { setDirectProduct(null); setDirectLoading(false); } });
    }
    return () => { active = false; };
  }, [productId]);
  const isLoading = backendLoading || directLoading;
  const product = directProduct ?? backendProducts.find((item) => item.slug === productId || item.backendId === productId || String(item.id) === productId) ?? getProductById(Number(productId));
  usePageTitle(product?.name ?? 'Product not found');

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (isLoading && !product) {
    return (
      <Container className="space-y-8 py-8 sm:py-12">
        <ProductDetailSkeleton />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-20">
        <EmptyState message="We couldn't find that product.">
          <ButtonLink to={ROUTES.newArrivals}>Browse new arrivals</ButtonLink>
        </EmptyState>
      </Container>
    );
  }

  const productList = backendProducts.length ? backendProducts : ALL_PRODUCTS;
  const index = productList.findIndex((p) => String(p.id) === String(product.id));
  const goTo = (offset: number) => {
    const safeIndex = index < 0 ? 0 : index;
    const next = productList[(safeIndex + offset + productList.length) % productList.length];
    if (next) navigate(ROUTES.product(next.slug ?? next.id));
  };

  const categoryGallery: Record<string, string[]> = {
    Hoodies: [PDP_EXTRA_IMAGES[0], PDP_EXTRA_IMAGES[1]],
    'T-Shirts': [PDP_EXTRA_IMAGES[1], PDP_EXTRA_IMAGES[0]],
    Bottoms: [PDP_EXTRA_IMAGES[2], PDP_EXTRA_IMAGES[0]],
    Pants: [PDP_EXTRA_IMAGES[2], PDP_EXTRA_IMAGES[0]],
    Jackets: [PDP_EXTRA_IMAGES[0], PDP_EXTRA_IMAGES[2]],
    Shirts: [PDP_EXTRA_IMAGES[1], PDP_EXTRA_IMAGES[0]],
    Dresses: [PDP_EXTRA_IMAGES[1], PDP_EXTRA_IMAGES[2]],
    Accessories: [PDP_EXTRA_IMAGES[2], PDP_EXTRA_IMAGES[1]],
    Caps: [PDP_EXTRA_IMAGES[2], PDP_EXTRA_IMAGES[1]],
    Bags: [PDP_EXTRA_IMAGES[2], PDP_EXTRA_IMAGES[0]],
    Jewellery: [PDP_EXTRA_IMAGES[1], PDP_EXTRA_IMAGES[2]],
    Sunglasses: [PDP_EXTRA_IMAGES[2], PDP_EXTRA_IMAGES[1]],
    Footwear: [PDP_EXTRA_IMAGES[2], PDP_EXTRA_IMAGES[0]],
  };
  const images = product.backendId ? [product.img, ...((product.variants ?? []).flatMap((variant) => variant.images?.map((image) => image.url) ?? []).filter((url) => url !== product.img))].slice(0, 4) : [product.img, ...(categoryGallery[product.category] ?? [PDP_EXTRA_IMAGES[0], PDP_EXTRA_IMAGES[2]])];

  return (
    <Container className="space-y-8 py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 break-words text-xs font-mono text-[#7E7C77]">
        <Link to={ROUTES.home} className="hover:text-[#6B7B6E]">Home</Link>
        <span aria-hidden="true">›</span>
        <Link to={ROUTES.men} className="hover:text-[#6B7B6E]">Men</Link>
        <span aria-hidden="true">›</span>
        <Link to={ROUTES.men} className="hover:text-[#6B7B6E]">Tops</Link>
        <span aria-hidden="true">›</span>
        <span className="text-[#2E2D2B]" aria-current="page">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* key resets the selected image when navigating between products */}
        <ProductGallery
          key={product.id}
          images={images}
          name={product.name}
          onPrev={() => goTo(-1)}
          onNext={() => goTo(1)}
          onWatchVideo={() => showToast('Playing product video...')}
        />
        <ProductPurchasePanel
          key={`panel-${product.id}`}
          product={product}
          onSizeGuide={() => showToast('Opening Size Guide modal...')}
          onAddToBag={(options) => addToCart({ ...product, name: product.name, price: product.price, img: images[0] }, options)}
          onBuyNow={async (options) => {
            const added = await addToCart({ ...product, name: product.name, price: product.price, img: images[0] }, options);
            if (added) navigate(ROUTES.cart);
          }}
        />
      </div>
      <ProductReviews product={product} />
    </Container>
  );
}
