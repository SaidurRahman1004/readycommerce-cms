'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { MessageSquare, Star } from 'lucide-react';
import { reviewService, ProductReview } from '@/services/api-service';
import { useAuth } from '@/components/auth/auth-context';

export default function ProductReviews({ productId }: { productId: string }) {
  const t = useTranslations('Storefront');
  const t13 = useTranslations('Phase13F');
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    reviewService
      .list(productId)
      .then((result) => setReviews(result.data || []))
      .catch(() => toast.error(t13('loadError')))
      .finally(() => setLoading(false));
  }, [productId, t13]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (body.trim().length < 3) {
      toast.error(t13('validation'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await reviewService.create({ productId, rating, body });
      setReviews((current) => [result.data, ...current]);
      setBody('');
      toast.success(t13('success'));
    } catch {
      toast.error(t13('error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-10">
      <div className="border-t border-border pt-12">
        <h2 className="text-2xl font-bold">{t('pdp.reviews')}</h2>

        {/* 1. Loading State */}
        {loading && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface p-5 animate-pulse space-y-3"
              >
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-3 w-5/6 rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                </div>
                <div className="h-3 w-28 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* 2. Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/60 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-4 ring-amber-50/50">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Be the first to review this product
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {t13('empty')} Share your thoughts and verified experience to help others.
            </p>
          </div>
        )}

        {/* 3. Reviews Grid */}
        {!loading && reviews.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <article
                key={review._id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-2xs"
              >
                <div
                  className="flex items-center gap-0.5 text-amber-500"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{review.body}</p>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold text-slate-900">
                    {review.user?.firstName || t13('customer')}
                  </p>
                  {review.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                      <span aria-hidden="true">✓</span>
                      {t13('verifiedPurchase')}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Review Submission Form */}
        {!authLoading && user && (
          <form
            onSubmit={submit}
            className="mt-10 max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xs"
          >
            <h3 className="text-lg font-bold">{t13('write')}</h3>
            <div className="mt-4 flex gap-1.5" aria-label={t('pdp.rating')}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setRating(value)}
                  className="p-1 text-lg transition hover:scale-110 active:scale-95"
                  aria-label={`${value} stars`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={t13('placeholder')}
              className="mt-4 min-h-32 w-full rounded-xl border border-border bg-background p-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-subtle"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 min-h-12 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {submitting ? t13('submitting') : t13('submit')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
