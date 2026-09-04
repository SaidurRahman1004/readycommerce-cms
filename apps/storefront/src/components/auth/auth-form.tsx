'use client';

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';

type AuthMode = 'login' | 'register';
type FormValues = {name: string; email: string; password: string; confirmPassword: string};
type Field = keyof FormValues;

export default function AuthForm({mode}: {mode: AuthMode}) {
  const t = useTranslations('Auth');
  const [values, setValues] = useState<FormValues>({name: '', email: '', password: '', confirmPassword: ''});
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const isRegister = mode === 'register';
  const update = (field: Field, value: string) => { setValues((current) => ({...current, [field]: value})); setErrors((current) => ({...current, [field]: undefined})); setSubmitted(false); };
  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (isRegister && !values.name.trim()) next.name = t('errors.nameRequired');
    if (!values.email.trim()) next.email = t('errors.emailRequired'); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = t('errors.emailInvalid');
    if (!values.password) next.password = t('errors.passwordRequired'); else if (values.password.length < 8) next.password = t('errors.passwordShort');
    if (isRegister && !values.confirmPassword) next.confirmPassword = t('errors.confirmRequired'); else if (isRegister && values.password !== values.confirmPassword) next.confirmPassword = t('errors.passwordMismatch');
    return next;
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next = validate(); setErrors(next); setSubmitted(Object.keys(next).length === 0); };
  const inputClass = (field: Field) => `mt-2 block min-h-12 w-full rounded-xl border bg-white px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${errors[field] ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'}`;
  const fieldError = (field: Field) => errors[field] ? <span className="mt-1.5 block text-xs text-rose-600">{errors[field]}</span> : null;
  return <section className="flex w-full max-w-xl flex-col justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-16 xl:px-24">
    <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">R</span><span className="font-semibold tracking-tight text-slate-950">{t('visual.brand')}</span></div>
    <div className="mb-8"><p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">{t(`${mode}.eyebrow`)}</p><h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{t(`${mode}.title`)}</h1><p className="mt-3 max-w-md text-[15px] leading-7 text-slate-500">{t(`${mode}.description`)}</p></div>
    <form className="space-y-5" onSubmit={submit} noValidate>
      {isRegister && <label className="block text-sm font-medium text-slate-700">{t('fields.name')}<input className={inputClass('name')} value={values.name} onChange={(e) => update('name', e.target.value)} placeholder={t('placeholders.name')} autoComplete="name" aria-invalid={Boolean(errors.name)} />{fieldError('name')}</label>}
      <label className="block text-sm font-medium text-slate-700">{t('fields.email')}<input className={inputClass('email')} value={values.email} onChange={(e) => update('email', e.target.value)} placeholder={t('placeholders.email')} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} />{fieldError('email')}</label>
      <label className="block text-sm font-medium text-slate-700">{t('fields.password')}<input className={inputClass('password')} value={values.password} onChange={(e) => update('password', e.target.value)} placeholder={t('placeholders.password')} type="password" minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} aria-invalid={Boolean(errors.password)} />{fieldError('password')}</label>
      {isRegister && <label className="block text-sm font-medium text-slate-700">{t('fields.confirmPassword')}<input className={inputClass('confirmPassword')} value={values.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder={t('placeholders.confirmPassword')} type="password" minLength={8} autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} />{fieldError('confirmPassword')}</label>}
      {!isRegister && <div className="flex justify-end"><button type="button" className="text-sm font-medium text-indigo-600 transition hover:text-violet-600">{t('login.forgotPassword')}</button></div>}
      <button type="submit" className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 active:scale-[.99]">{t(`${mode}.submit`)}<span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">→</span></button>
      {submitted && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{t(`${mode}.success`)}</p>}
    </form>
    <p className="mt-8 text-center text-sm text-slate-500">{t(`${mode}.switchPrompt`)}{' '}<Link className="font-semibold text-indigo-600 hover:text-violet-600" href={isRegister ? '/login' : '/register'}>{t(`${mode}.switchAction`)}</Link></p>
  </section>;
}
