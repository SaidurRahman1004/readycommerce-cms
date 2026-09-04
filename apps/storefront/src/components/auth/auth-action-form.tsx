'use client';

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link, useRouter} from '@/i18n/routing';
import {useSearchParams} from 'next/navigation';
import {z} from 'zod';
import toast from 'react-hot-toast';
import {authService} from '@/services/api-service';

type Action = 'forgot' | 'reset';
export default function AuthActionForm({action}: {action: Action}) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isReset = action === 'reset';
  const submit = async (event: FormEvent) => {event.preventDefault(); const schema = isReset ? z.object({value: z.string().min(8, t('errors.passwordShort')), confirm: z.string().min(1, t('errors.confirmRequired'))}).refine((data) => data.value === data.confirm, {path: ['confirm'], message: t('errors.passwordMismatch')}) : z.object({value: z.string().email(t('errors.emailInvalid'))}); const result = schema.safeParse({value, confirm}); if (!result.success) {setError(result.error.issues[0]?.message ?? t('errors.generic')); toast.error(t('errors.fixForm')); return;} if (isReset && !searchParams.get('token')) {setError(t('errors.invalidResetLink')); toast.error(t('errors.invalidResetLink')); return;} setError(''); setLoading(true); try {if (isReset) await authService.resetPassword(value, searchParams.get('token') || ''); else await authService.forgotPassword(value); toast.success(t(`${action}.success`)); router.push(isReset ? '/login' : '/reset-password');} catch (error: unknown) {toast.error(error instanceof Error ? error.message : t('errors.generic'));} finally {setLoading(false);}};
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16"><div className="w-full max-w-md rounded-[1.5rem] border border-border bg-surface p-7 shadow-premium sm:p-10"><Link href="/login" className="text-[14px] font-bold text-primary transition-colors hover:text-primary-hover">{t('backToLogin')}</Link><p className="mb-4 mt-10 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">{t(`${action}.eyebrow`)}</p><h1 className="text-4xl font-bold tracking-tight text-foreground">{t(`${action}.title`)}</h1><p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{t(`${action}.description`)}</p><form onSubmit={submit} className="mt-8 space-y-6" noValidate><label className="block text-[14px] font-bold text-foreground">{t(isReset ? 'fields.password' : 'fields.email')}<input value={value} onChange={(event) => setValue(event.target.value)} type={isReset ? 'password' : 'email'} className="mt-2.5 min-h-[52px] w-full rounded-xl border border-border bg-background px-5 text-[15px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary-subtle" placeholder={t(isReset ? 'placeholders.password' : 'placeholders.email')} />{error && <span className="mt-2 block text-[13px] font-medium text-rose-600">{error}</span>}</label>{isReset && <label className="block text-[14px] font-bold text-foreground">{t('fields.confirmPassword')}<input value={confirm} onChange={(event) => setConfirm(event.target.value)} type="password" className="mt-2.5 min-h-[52px] w-full rounded-xl border border-border bg-background px-5 text-[15px] text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary-subtle" placeholder={t('placeholders.confirmPassword')} /></label>}<button type="submit" disabled={loading} className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-primary text-[15px] font-bold text-white shadow-premium transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">{loading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}{loading ? t('loading') : t(`${action}.submit`)}</button></form></div></main>;
}
