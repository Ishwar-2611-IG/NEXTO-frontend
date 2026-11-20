import { StoreImage } from '../../components/common/StoreImage';
import { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  name: string;
  onPrev: () => void;
  onNext: () => void;
  onWatchVideo: () => void;
}

export function ProductGallery({ images, name, onPrev, onNext, onWatchVideo }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-4">
      <div className="order-2 flex min-w-0 gap-3 overflow-x-auto pb-1 sm:col-span-2 sm:order-1 sm:flex-col sm:overflow-visible sm:pb-0">
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            aria-label={`Show image ${index + 1} of ${images.length}`}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
            className={`aspect-[3/4] w-16 shrink-0 rounded-md bg-[#F0EBE2] border sm:w-full ${active === index ? 'border-[#6B7B6E] ring-1 ring-[#6B7B6E]/20' : 'border-[#7E7C77]/20'} overflow-hidden cursor-pointer`}
          >
            <StoreImage src={src} alt="" sizes="100px" className="w-full h-full object-cover" />
          </button>
        ))}
        <button
          type="button"
          onClick={onWatchVideo}
          className="aspect-[3/4] w-16 shrink-0 rounded-md bg-[#F0EBE2] border border-[#7E7C77]/20 flex flex-col items-center justify-center sm:w-full text-xs font-mono text-[#7E7C77] cursor-pointer hover:border-[#7E7C77]/30"
        >
          <span className="text-xl mb-1" aria-hidden="true">▶</span>
          <span>VIDEO</span>
        </button>
      </div>

      <div className="sm:col-span-10 relative aspect-[3/4] rounded-lg bg-[#F0EBE2] border border-[#7E7C77]/20 order-1 sm:order-2 overflow-hidden">
        <StoreImage src={images[active]} alt={name} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 58vw" className="w-full h-full object-cover" />
        <button type="button" onClick={onPrev} aria-label="Previous product" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#F9F6F0]/90 text-[#2E2D2B] border border-[#7E7C77]/20 rounded-full shadow-sm flex items-center justify-center transition hover:scale-105 active:scale-95">
          ←
        </button>
        <button type="button" onClick={onNext} aria-label="Next product" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#F9F6F0]/90 text-[#2E2D2B] border border-[#7E7C77]/20 rounded-full shadow-sm flex items-center justify-center transition hover:scale-105 active:scale-95">
          →
        </button>
      </div>
    </div>
  );
}
