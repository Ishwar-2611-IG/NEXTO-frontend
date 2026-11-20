import { TRUST_POINTS } from '../../constants/commerce';

/** Three-column shipping / returns / payment reassurance strip (cart + product page). */
export function TrustPoints({ textClassName = 'text-[10px]', className = 'gap-2' }: { textClassName?: string; className?: string }) {
  return (
    <div className={`grid grid-cols-3 ${className} pt-4 border-t border-[#7E7C77]/20 text-center font-sans ${textClassName} text-[#7E7C77]`}>
      {TRUST_POINTS.map((point) => (
        <div key={point.id} className="flex flex-col items-center space-y-1">
          <point.icon aria-hidden="true" className="size-4 text-[#6B7B6E]" />
          <span>{point.description}</span>
        </div>
      ))}
    </div>
  );
}
