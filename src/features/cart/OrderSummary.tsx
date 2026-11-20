import { TrustPoints } from '../../components/common/TrustPoints';
import { Button } from '../../components/common/Button';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/format';

const PAYMENT_BADGES = ['VISA', 'MASTERCARD', 'UPI', 'PAYTM'];

export function OrderSummary({ onCheckout }: { onCheckout: () => void }) {
  const cart = useCart();

  return (
    <div className="rounded-lg bg-[#FFFCF7] border border-[#7E7C77]/20 p-6 space-y-6 lg:sticky lg:top-28 shadow-[0_10px_30px_-10px_rgba(46,45,43,0.06)]">
      <h3 className="text-lg font-semibold uppercase text-[#2E2D2B] border-b border-[#7E7C77]/20 pb-4">Order Summary</h3>

      <div className="space-y-3 text-xs font-mono">
        <div className="flex justify-between text-[#7E7C77]">
          <span>Subtotal ({cart.count} items)</span>
          <span className="text-[#2E2D2B]">{formatPrice(cart.subtotal)}</span>
        </div>
        {cart.appliedCode && cart.discountAmount > 0 && (
          <div className="flex justify-between text-[#6B7B6E]">
            <span>Discount ({cart.appliedCode})</span>
            <span>-{formatPrice(cart.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[#7E7C77]">
          <span>Shipping</span>
          {cart.shipping > 0 ? (
            <span className="text-[#2E2D2B]">{formatPrice(cart.shipping)}</span>
          ) : (
            <span className="text-[#6B7B6E] font-bold uppercase">Free</span>
          )}
        </div>
        {cart.shipping > 0 && (
          <p className="text-[10px] text-[#7E7C77] text-right">Free delivery over ₹999.</p>
        )}
        <div className="flex justify-between text-base font-bold text-[#2E2D2B] pt-4 border-t border-[#7E7C77]/20">
          <span>Total</span>
          <span>{formatPrice(cart.total)}</span>
        </div>
        <p className="text-[10px] text-[#7E7C77] text-right">(Inclusive of all taxes)</p>
      </div>

      <form
        className="flex space-x-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          cart.applyDiscount();
        }}
      >
        <input
          type="text"
          aria-label="Discount code"
          placeholder="Apply Discount Code"
          value={cart.discountInput}
          onChange={(e) => cart.setDiscountInput(e.target.value)}
          className="min-w-0 rounded-full bg-[#FFFCF7] text-xs text-[#2E2D2B] placeholder-[#7E7C77] px-4 py-3 border border-[#7E7C77]/25 flex-1 uppercase focus:outline-none focus:border-[#6B7B6E]"
        />
        <button type="submit" className="rounded-full bg-[#526457] text-white px-5 font-extrabold uppercase tracking-[0.12em] text-[10px] hover:bg-[#445549]">
          Apply
        </button>
      </form>

      <Button size="lg" arrow className="w-full" onClick={onCheckout} disabled={cart.items.length === 0}>
        Proceed to Checkout
      </Button>

      <div className="space-y-2 pt-4 border-t border-[#7E7C77]/20 text-center">
        <span className="text-[10px] font-mono text-[#7E7C77] uppercase tracking-widest block">We Accept</span>
        <div className="flex justify-center space-x-2 pt-1 opacity-80">
          {PAYMENT_BADGES.map((badge) => (
            <span key={badge} className="px-2 py-1 bg-[#F0EBE2] border border-[#7E7C77]/20 text-[10px] font-mono text-[#2E2D2B]">{badge}</span>
          ))}
        </div>
      </div>

      <TrustPoints />
    </div>
  );
}
