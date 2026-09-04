'use client';

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/routing';
import {z} from 'zod';
import toast from 'react-hot-toast';
import {authService} from '@/services/api-service';

export default function ProfilePanel() {
  const t = useTranslations('Profile');
  const router = useRouter();
  const [current, setCurrent] = useState(''); const [next, setNext] = useState(''); const [confirm, setConfirm] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {event.preventDefault(); const result = z.object({current: z.string().min(1, t('errors.required')), next: z.string().min(8, t('errors.short')), confirm: z.string().min(1, t('errors.required'))}).refine((data) => data.next === data.confirm, {path: ['confirm'], message: t('errors.mismatch')}).safeParse({current, next, confirm}); if (!result.success) {toast.error(result.error.issues[0]?.message ?? t('errors.generic')); return;} setLoading(true); try {await authService.changePassword(current, next); toast.success(t('success')); setCurrent(''); setNext(''); setConfirm('');} catch {toast.error(t('errors.generic'));} finally {setLoading(false);}};
  const logout = async () => {setLoading(true); try {await authService.logout(); toast.success(t('logoutSuccess')); router.push('/');} catch {toast.error(t('errors.generic'));} finally {setLoading(false);}};
  return <main className="mx-auto min-h-screen max-w-3xl bg-[#fafbff] px-5 py-14 sm:px-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{t('eyebrow')}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">{t('title')}</h1><div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">{t('account.title')}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{t('account.description')}</p><button type="button" disabled={loading} onClick={logout} className="mt-8 min-h-11 rounded-xl border border-rose-200 px-5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60">{loading ? t('loading') : t('logout')}</button></section><section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">{t('change.title')}</h2><form onSubmit={submit} className="mt-5 space-y-4" noValidate>{[['current', current, setCurrent], ['next', next, setNext], ['confirm', confirm, setConfirm]].map(([key, value, setter]) => <label key={key as string} className="block text-sm font-medium text-slate-700">{t(`fields.${key}`)}<input type="password" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>)}<button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? t('loading') : t('change.submit')}</button></form></section></div></main>;
}
