import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { Container } from './Container';

interface HeroImage {
  url: string;
  alt?: string;
}

interface HeroSlide {
  _id: string;
  title: string;
  eyebrow: string;
  description: string;
  image: HeroImage;
  mobileImage?: HeroImage;
  href: string;
  ctaLabel: string;
}

interface HeroSlidesResponse {
  banners: HeroSlide[];
}

interface HomepageHeroCarouselProps {
  fallback: ReactNode;
}

export function HomepageHeroCarousel({ fallback }: HomepageHeroCarouselProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    api.get<HeroSlidesResponse>('/banners')
      .then((response) => {
        if (active) setSlides(response.banners);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const move = useCallback((direction: -1 | 1) => {
    setIndex((current) => (current + direction + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => move(1), 6000);
    return () => window.clearInterval(timer);
  }, [move, paused, slides.length]);

  if (slides.length === 0) {
    return (
      <>
        {fallback}
        {error && <p role="status" className="sr-only">Homepage promotions could not be loaded. The standard hero is shown instead.</p>}
      </>
    );
  }

  const slide = slides[index];
  const titleLines = slide.title.split('\n').map((line) => line.trim()).filter(Boolean);
  const isExternal = /^https:\/\//i.test(slide.href);

  return (
    <section
      className="relative min-h-[560px] overflow-hidden border-b border-[#7E7C77]/20 bg-[#F7F6F2] sm:min-h-[640px] lg:min-h-[700px]"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start === null || end === undefined) return;
        const distance = end - start;
        if (Math.abs(distance) >= 48) move(distance < 0 ? 1 : -1);
      }}
    >
      <div className="absolute inset-0">
        <picture>
          {slide.mobileImage?.url && <source media="(max-width: 639px)" srcSet={slide.mobileImage.url} />}
          <img
            src={slide.image.url}
            alt={slide.image.alt ?? ''}
            className="h-full w-full object-cover object-center brightness-[.96] saturate-[.78]"
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-[#F9F6F0]/95 via-[#F9F6F0]/76 to-[#F9F6F0]/10" />
      </div>
      <Container className="relative z-10 flex min-h-[560px] w-full items-center justify-between py-20 sm:min-h-[640px] lg:min-h-[700px]">
        <div className="max-w-2xl space-y-6">
          {slide.eyebrow && <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7B6E] sm:text-xs">{slide.eyebrow}</span>}
          <h1 className="whitespace-pre-line font-serif text-4xl font-semibold uppercase leading-[0.92] tracking-[-0.045em] text-[#2E2D2B] sm:text-7xl lg:text-8xl">
            {titleLines.map((line) => <span className="block" key={line}>{line}</span>)}
          </h1>
          {slide.description && <p className="max-w-lg text-sm leading-7 text-[#5E5C56] sm:text-base">{slide.description}</p>}
          <a
            href={slide.href}
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="inline-flex items-center gap-2 rounded-full bg-[#1F3A2E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#162a21]"
          >
            {slide.ctaLabel || 'Shop now'} <span aria-hidden="true">→</span>
          </a>
        </div>
        {slides.length > 1 && (
          <div className="absolute bottom-7 right-5 flex items-center gap-2 sm:right-8">
            <button type="button" onClick={() => move(-1)} aria-label="Previous banner" className="rounded-full border border-[#1F3A2E]/40 bg-white/70 p-2 text-[#1F3A2E] backdrop-blur hover:bg-white">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5" role="group" aria-label="Choose banner">
              {slides.map((item, dotIndex) => (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => setIndex(dotIndex)}
                  aria-label={`Go to banner ${dotIndex + 1}`}
                  aria-current={index === dotIndex}
                  className={`h-2.5 rounded-full transition-all ${index === dotIndex ? 'w-7 bg-[#1F3A2E]' : 'w-2.5 bg-[#1F3A2E]/40'}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => move(1)} aria-label="Next banner" className="rounded-full border border-[#1F3A2E]/40 bg-white/70 p-2 text-[#1F3A2E] backdrop-blur hover:bg-white">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
