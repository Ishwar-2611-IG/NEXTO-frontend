import type { ImgHTMLAttributes, SyntheticEvent } from 'react';

const FALLBACK_IMAGE = '/images/fashion-fallback.svg';

type StoreImageProps = ImgHTMLAttributes<HTMLImageElement> & { src: string };

function makeResponsiveSrcSet(src: string): string | undefined {
  if (!src.startsWith('https://images.unsplash.com/')) return undefined;
  return [200, 400, 640, 800, 1200, 1800]
    .map((width) => `${src.replace(/([?&]w=)\d+/, `$1${width}`)} ${width}w`)
    .join(', ');
}

/**
 * Responsive image wrapper for the storefront. Unsplash images receive a srcSet
 * so mobile screens can download smaller files; failed remote images use a local fallback.
 */
export function StoreImage({
  src,
  srcSet,
  sizes = '100vw',
  onError,
  fetchPriority,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: StoreImageProps) {
  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    onError?.(event);
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied === 'true') return;
    image.dataset.fallbackApplied = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = FALLBACK_IMAGE;
  };

  return (
    <img
      {...props}
      src={src}
      srcSet={srcSet ?? makeResponsiveSrcSet(src)}
      sizes={sizes}
      {...(fetchPriority ? { ['fetchpriority']: fetchPriority } : {})}
      loading={loading}
      decoding={decoding}
      onError={handleError}
    />
  );
}
