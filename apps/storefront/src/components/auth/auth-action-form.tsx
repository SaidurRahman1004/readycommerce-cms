'use client';

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link, useRouter} from '@/i18n/routing';
import {z} from 'zod';
import toast from 'react-hot-toast';
import {authService} from '@/services/api-service';

type Action = 'forgot' | 'reset';
export default function AuthActionForm({action}: {action: Action}) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isReset = action === 'reset';
  const submit = async (event: FormEvent) => {event.preventDefault(); const schema = isReset ? z.object({value: z.string().min(8, t('errors.passwordShort')), confirm: z.string().min(1, t('errors.confirmRequired'))}).refine((data) => data.value === data.confirm, {path: ['confirm'], message: t('errors.passwordMismatch')}) : z.object({value: z.string().email(t('errors.emailInvalid'))}); const result = schema.safeParse({value, confirm}); if (!result.success) {setError(result.error.issues[0]?.message ?? t('errors.generic')); toast.error(t('errors.fixForm')); return;} setError(''); setLoading(true); try {if (isReset) await authService.resetPassword(value); else await authService.forgotPassword(value); toast.success(t(`${action}.success`)); router.push(isReset ? '/login' : '/reset-password');} catch {toast.error(t('errors.generic'));} finally {setLoading(false);}};
  return <main className="flex min-h-screen items-center justify-center bg-[#fafbff] px-5 py-16"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10"><Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-violet-600">{t('backToLogin')}</Link><p className="mb-3 mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{t(`${action}.eyebrow`)}</p><h1 className="text-3xl font-semibold tracking-[-0.05em]">{t(`${action}.title`)}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{t(`${action}.description`)}</p><form onSubmit={submit} className="mt-8 space-y-5" noValidate><label className="block text-sm font-medium text-slate-700">{t(isReset ? 'fields.password' : 'fields.email')}<input value={value} onChange={(event) => setValue(event.target.value)} type={isReset ? 'password' : 'email'} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder={t(isReset ? 'placeholders.password' : 'placeholders.email')} />{error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}</label>{isReset && <label className="block text-sm font-medium text-slate-700">{t('fields.confirmPassword')}<input value={confirm} onChange={(event) => setConfirm(event.target.value)} type="password" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder={t('placeholders.confirmPassword')} /></label>}<button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}{loading ? t('loading') : t(`${action}.submit`)}</button></form></div></main>;
}
