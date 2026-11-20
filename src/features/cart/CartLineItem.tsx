import { StoreImage } from '../../components/common/StoreImage';
import type { CartItem } from '../../types';
import { formatPrice } from '../../utils/format';

interface CartLineItemProps {
  item: CartItem;
  onQtyChange: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater: (item: CartItem) => void;
}

export function CartLineItem({ item, onQtyChange, onRemove, onSaveForLater }: CartLineItemProps) {
  return (
    <li className="rounded-lg bg-[#FFFCF7] border border-[#7E7C77]/20 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_-10px_rgba(46,45,43,0.04)]">
      <div className="flex items-center space-x-6 w-full sm:w-auto">
        <StoreImage src={item.img} alt={item.name} sizes="96px" className="w-24 h-32 rounded-md object-cover border border-[#7E7C77]/20 bg-[#F0EBE2] shrink-0" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#2E2D2B]">{item.name}</h3>
          <p className="text-xs font-mono text-[#7E7C77]">{item.variant}</p>
          <div className="flex items-center space-x-3 pt-2">
            <span className="text-sm font-mono font-bold text-[#2E2D2B]">{formatPrice(item.price)}</span>
            {item.originalPrice && (
              <span className="text-xs font-mono text-[#7E7C77] line-through">{formatPrice(item.originalPrice)}</span>
            )}
            {item.discount && <span className="bg-[#6B7B6E]/15 text-[#6B7B6E] text-[10px] font-mono px-2 py-0.5">{item.discount}</span>}
          </div>
          <div className="flex items-center space-x-4 pt-3 text-xs font-mono text-[#7E7C77]">
            <button type="button" onClick={() => onSaveForLater(item)} className="hover:text-[#6B7B6E] underline">Save for Later</button>
            <span aria-hidden="true">|</span>
            <button type="button" onClick={() => onRemove(item.id)} className="hover:text-red-400">Remove</button>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6 justify-between w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-[#7E7C77]/20">
        <div className="flex items-center overflow-hidden rounded-full border border-[#7E7C77]/25 bg-[#F0EBE2]">
          <button type="button" aria-label={`Decrease quantity of ${item.name}`} onClick={() => onQtyChange(item.id, -1)} className="px-3 py-2 text-[#7E7C77] hover:text-[#6B7B6E] font-mono">−</button>
          <span className="px-4 py-2 font-mono text-sm text-[#2E2D2B] font-bold" aria-live="polite">{item.qty}</span>
          <button type="button" aria-label={`Increase quantity of ${item.name}`} onClick={() => onQtyChange(item.id, 1)} className="px-3 py-2 text-[#7E7C77] hover:text-[#6B7B6E] font-mono">+</button>
        </div>
        <span className="text-base font-mono font-bold text-[#2E2D2B] min-w-[90px] text-right">{formatPrice(item.price * item.qty)}</span>
      </div>
    </li>
  );
}
