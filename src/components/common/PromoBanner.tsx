import { StoreImage } from './StoreImage';
import { Container } from './Container';
import { Button } from './Button';

interface PromoBannerProps {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  ctaLabel: string;
  onCta: () => void;
  ctaArrow?: boolean;
  heightClassName?: string;
  paddingClassName?: string;
  titleClassName?: string;
  imageClassName?: string;
  /** Adds the left-to-right dark gradient used by the home banner. */
  gradient?: boolean;
  className?: string;
}

export function PromoBanner({
  image,
  alt,
  eyebrow,
  title,
  text,
  ctaLabel,
  onCta,
  ctaArrow = true,
  heightClassName = 'h-[360px] sm:h-[420px]',
  paddingClassName = 'p-8 sm:p-12',
  titleClassName = 'text-3xl sm:text-6xl tracking-tighter',
  imageClassName = 'brightness-50',
  gradient = true,
  className = '',
}: PromoBannerProps) {
  return (
    <Container className={className}>
      <div className={`relative w-full ${heightClassName} rounded-2xl bg-[#F0EBE2] border border-[#7E7C77]/20 overflow-hidden flex items-center ${paddingClassName}`}>
        <StoreImage src={image} alt={alt} sizes="100vw" className={`absolute inset-0 w-full h-full object-cover filter ${imageClassName}`} />
        {gradient && <div className="absolute inset-0 bg-gradient-to-r from-[#211F1A]/85 via-[#211F1A]/35 to-transparent" />}
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="text-[10px] font-bold text-white/85 uppercase tracking-[0.2em] block">{eyebrow}</span>
          <h2 className={`${titleClassName} font-semibold uppercase text-white`}>{title}</h2>
          <p className="text-sm sm:text-base leading-7 text-white/85">{text}</p>
          <Button onClick={onCta} arrow={ctaArrow}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </Container>
  );
}
