import { StoreImage } from './StoreImage';
import { Fragment, type ReactNode } from 'react';
import { Container } from './Container';

interface HeroBannerProps {
  image: string;
  alt: string;
  eyebrow: string;
  titleLines: string[];
  sectionClassName?: string;
  /** Optional final line rendered in a different style (e.g. italic serif). */
  accent?: { text: string; className: string };
  description?: string;
  heightClassName?: string;
  titleClassName?: string;
  overlayClassName?: string;
  contentClassName?: string;
  descriptionClassName?: string;
  /** Buttons / extra content under the description. */
  children?: ReactNode;
  /** Right-aligned decorative column (desktop only). */
  aside?: ReactNode;
}

export function HeroBanner({
  image,
  alt,
  eyebrow,
  titleLines,
  sectionClassName = '',
  accent,
  description,
  heightClassName = 'h-[440px] sm:h-[520px]',
  titleClassName = 'text-4xl sm:text-7xl lg:text-8xl',
  overlayClassName = 'from-[#F9F6F0]/94 via-[#F9F6F0]/70 to-[#F9F6F0]/12',
  contentClassName = 'max-w-2xl space-y-4',
  descriptionClassName = 'max-w-md',
  children,
  aside,
}: HeroBannerProps) {
  return (
    <section className={`relative w-full ${heightClassName} flex items-center overflow-hidden border-b border-[#7E7C77]/20 ${sectionClassName}`}>
      <div className="absolute inset-0 z-0">
        <StoreImage src={image} alt={alt} sizes="100vw" loading="eager" fetchPriority="high" className="w-full h-full object-cover object-center filter brightness-[.96] saturate-[.78]" />
        <div className={`absolute inset-0 bg-gradient-to-r ${overlayClassName}`} />
      </div>

      <Container className="relative z-10 w-full flex justify-between items-center">
        <div className={contentClassName}>
          <span className="text-[10px] sm:text-xs font-bold text-[#6B7B6E] uppercase tracking-[0.2em] block">{eyebrow}</span>
          <h1 className={`${titleClassName} font-semibold tracking-[-0.045em] uppercase leading-[0.88] text-[#2E2D2B]`}>
            {titleLines.map((line, i) => (
              <Fragment key={line}>
                {line}
                {(i < titleLines.length - 1 || accent) && <br />}
              </Fragment>
            ))}
            {accent && <span className={accent.className}>{accent.text}</span>}
          </h1>
          {description && <p className={`max-w-lg text-sm sm:text-base leading-7 text-[#5E5C56] ${descriptionClassName}`}>{description}</p>}
          {children}
        </div>
        {aside}
      </Container>
    </section>
  );
}

interface HeroAsideProps {
  lines: string[];
  scrollHint?: boolean;
}

export function HeroAside({ lines, scrollHint = false }: HeroAsideProps) {
  return (
    <div className="hidden lg:flex flex-col text-right text-[10px] font-bold text-[#5E5C56] space-y-2 tracking-[0.16em]" aria-hidden="true">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
      {scrollHint && (
        <div className="pt-8 flex flex-col items-end">
          <span className="mb-2">SCROLL</span>
          <span className="text-lg">↓</span>
        </div>
      )}
    </div>
  );
}
