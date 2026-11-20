import { useEffect, useState } from 'react';
import { Star, MessageSquareText } from 'lucide-react';
import { api } from '../../services/api';
import type { Product } from '../../types';

interface ProductReview { _id: string; rating: number; title?: string; comment: string; createdAt?: string; userId?: { name?: string } | string }
interface ReviewResponse { reviews: ProductReview[]; pagination?: { total: number; page: number; pages: number } }
export function ProductReviews({ product }: { product: Product }) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [total, setTotal] = useState(product.reviewCount ?? 0);
  const [loading, setLoading] = useState(Boolean(product.backendId));
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!product.backendId) { setReviews([]); setTotal(product.reviewCount ?? 0); setError(false); setLoading(false); return; }
    let active = true;
    setLoading(true); setError(false); setTotal(product.reviewCount ?? 0);
    void api.get<ReviewResponse>(`/reviews/product/${product.backendId}?page=1&limit=6`).then((result) => {
      if (active) { setReviews(result.reviews ?? []); setTotal(result.pagination?.total ?? 0); }
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [product.backendId, product.reviewCount]);
  return <section aria-labelledby="product-reviews-title" className="rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-5 sm:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#7E7C77]/15 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6B7B6E]">Real customer feedback</p><h2 id="product-reviews-title" className="mt-1 font-serif text-3xl text-[#2E2D2B]">Reviews</h2></div><p className="text-xs text-[#7E7C77]">{total} verified review{total === 1 ? '' : 's'}</p></div>
    {loading ? <p className="py-8 text-sm text-[#7E7C77]">Loading customer reviews…</p> : error ? <p className="py-8 text-sm text-[#7E7C77]">Reviews could not be loaded right now.</p> : reviews.length ? <ul className="divide-y divide-[#7E7C77]/15">{reviews.map((review) => <li key={review._id} className="py-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} className={index < review.rating ? 'fill-[#C5A880] text-[#C5A880]' : 'text-[#D7D0C5]'} />)}</div><span className="text-[10px] text-[#7E7C77]">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span></div>{review.title && <h3 className="mt-2 text-sm font-bold text-[#2E2D2B]">{review.title}</h3>}<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#66645F]">{review.comment}</p><p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77]">{typeof review.userId === 'object' && review.userId?.name ? review.userId.name : 'Verified customer'}</p></li>)}</ul> : <div className="py-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#F0EBE2] text-[#526457]"><MessageSquareText size={20}/></span><p className="mt-4 font-serif text-2xl text-[#2E2D2B]">No reviews yet</p><p className="mt-1 text-sm text-[#7E7C77]">Customer reviews will appear here after approval.</p></div>}
  </section>;
}
