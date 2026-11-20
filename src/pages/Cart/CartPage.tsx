import { Link, useNavigate } from 'react-router-dom';
import { ButtonLink } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { EmptyState } from '../../components/common/EmptyState';
import { HeroBanner } from '../../components/common/HeroBanner';
import { SuggestedProducts } from '../../components/common/SuggestedProducts';
import { IMG, unsplash } from '../../constants/images';
import { ROUTES } from '../../constants/routes';
import { CartLineItem } from '../../features/cart/CartLineItem';
import { OrderSummary } from '../../features/cart/OrderSummary';
import { ALL_PRODUCTS } from '../../data/products';
import { useCart } from '../../hooks/useCart';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { useWishlist } from '../../hooks/useWishlist';
import type { CartItem } from '../../types';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CheckoutDialog } from '../../features/checkout/CheckoutDialog';
import type { Product } from '../../types';
import type { OrderRecord } from '../../features/checkout/CheckoutDialog';
import { useBackendProducts } from '../../hooks/useBackendProducts';

export function CartPage() {
  usePageTitle('Your Bag');
  const cart = useCart();
  const wishlist = useWishlist();
  const { showToast } = useToast();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { products: backendProducts } = useBackendProducts();

  // Use the exact API product when available; fall back to the curated preview catalogue.
  const handleSaveForLater = (item: CartItem) => {
    const product = (backendProducts.find((p) => p.backendId === item.backendId) ?? ALL_PRODUCTS.find((p) => p.name === item.name)) as Product | undefined;
    if (product) void wishlist.add(product);
    showToast('Saved to wishlist!');
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate(ROUTES.login, { state: { from: ROUTES.cart } });
      showToast('Sign in to continue to secure checkout.');
      return;
    }
    if (cart.items.some((item) => !item.backendId || !item.sku)) {
      showToast('Some items are demo-only. Seed the connected catalog and add those products again before checkout.');
      return;
    }
    setCheckoutOpen(true);
  };
  const handleOrderComplete = (order: OrderRecord) => {
    setCheckoutOpen(false);
    const paid = ['paid', 'captured', 'succeeded'].includes(order.paymentStatus.toLowerCase());
    if (order.paymentMethod === 'razorpay' && !paid) {
      showToast('Order saved. Payment is still pending — check the order in your account.');
    }
    void cart.clearCart().finally(() => navigate(`${ROUTES.orderConfirmation}?orderId=${encodeURIComponent(order._id)}`, { replace: true, state: { order } }));
  };

  return (
    <div className="space-y-16 pb-20">
      <HeroBanner
        image={unsplash(IMG.mensStreetwear, 1800)}
        alt="Cart Hero"
        eyebrow="YOUR CART"
        titleLines={['ALMOST', 'YOURS']}
        titleClassName="text-4xl sm:text-6xl lg:text-7xl"
        description="Great choices. Make them yours."
        heightClassName="h-[360px] sm:h-[420px]"
        overlayClassName="from-[#F9F6F0]/94 via-[#F9F6F0]/70 to-[#F9F6F0]/12"
      />

      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col items-start gap-3 border-b border-[#7E7C77]/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold uppercase text-[#2E2D2B]">Shopping Cart ({cart.count} items)</h2>
            <Link to={ROUTES.home} className="text-xs font-mono text-[#7E7C77] hover:text-[#6B7B6E] underline">
              Continue Shopping →
            </Link>
          </div>

          {cart.items.length === 0 ? (
            <EmptyState message="Your shopping cart is currently empty.">
              <ButtonLink to={ROUTES.men}>Shop Collection</ButtonLink>
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  onQtyChange={cart.updateQty}
                  onRemove={cart.removeItem}
                  onSaveForLater={handleSaveForLater}
                />
              ))}
            </ul>
          )}

          <div className="pt-12">
            <SuggestedProducts />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <OrderSummary onCheckout={handleCheckout} />
        </div>
      </Container>
      {checkoutOpen && <CheckoutDialog items={cart.items} subtotal={cart.subtotal} couponCode={cart.appliedCode} onClose={() => setCheckoutOpen(false)} onComplete={handleOrderComplete} />}
    </div>
  );
}
