'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { z } from 'zod';
import { adminTeamService, type StaffMember, type StaffRole } from '@/services/api-service';

type Locale = 'en' | 'bn';
type Props = {
  member: StaffMember | null;
  isSelf: boolean;
  locale: Locale;
  onClose: () => void;
  onSaved: (member: StaffMember) => void;
};

const roles: StaffRole[] = ['super-admin', 'manager', 'editor', 'support'];
const createSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.email(),
  password: z.string().min(10).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, 'Use uppercase, lowercase, number, and symbol.'),
  role: z.enum(roles),
});

const copy = {
  en: { add: 'Add staff member', edit: 'Edit staff access', detail: 'Create a secure account and assign only the access this person needs.', editDetail: 'Update role and account status. Access changes revoke existing sessions.', first: 'First name', last: 'Last name', email: 'Email address', password: 'Temporary password', role: 'Role', status: 'Account active', cancel: 'Cancel', save: 'Save changes', create: 'Create staff', saving: 'Saving…', invalid: 'Please review the highlighted fields.', self: 'Your own super-admin access is protected.' },
  bn: { add: 'স্টাফ সদস্য যোগ করুন', edit: 'স্টাফ অ্যাক্সেস সম্পাদনা', detail: 'নিরাপদ অ্যাকাউন্ট তৈরি করে প্রয়োজনীয় অ্যাক্সেস দিন।', editDetail: 'রোল ও অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন করুন। পরিবর্তনে পুরোনো সেশন বাতিল হবে।', first: 'নামের প্রথম অংশ', last: 'নামের শেষ অংশ', email: 'ইমেইল ঠিকানা', password: 'অস্থায়ী পাসওয়ার্ড', role: 'রোল', status: 'অ্যাকাউন্ট সক্রিয়', cancel: 'বাতিল', save: 'পরিবর্তন সংরক্ষণ', create: 'স্টাফ তৈরি করুন', saving: 'সংরক্ষণ হচ্ছে…', invalid: 'চিহ্নিত তথ্যগুলো যাচাই করুন।', self: 'আপনার নিজের সুপার-অ্যাডমিন অ্যাক্সেস সুরক্ষিত।' },
};

export default function StaffModal({ member, isSelf, locale, onClose, onSaved }: Props) {
  const t = copy[locale];
  const [firstName, setFirstName] = useState(member?.firstName || '');
  const [lastName, setLastName] = useState(member?.lastName || '');
  const [email, setEmail] = useState(member?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>(member?.role || 'support');
  const [isActive, setIsActive] = useState(member?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [busy, onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError('');
    if (!member) {
      const result = createSchema.safeParse({ firstName, lastName, email, password, role });
      if (!result.success) {
        const nextErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => { nextErrors[String(issue.path[0])] = issue.message });
        setErrors(nextErrors);
        return;
      }
    }
    setErrors({});
    setBusy(true);
    try {
      const response = member
        ? await adminTeamService.update(member.id, { role, isActive })
        : await adminTeamService.create({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, role });
      onSaved(response.data);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t.invalid);
    } finally { setBusy(false); }
  };

  const fieldClass = (name: string) => `mt-1.5 min-h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${errors[name] ? 'border-rose-400' : 'border-border focus:border-primary'}`;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="staff-modal-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="staff-modal-title" className="text-xl font-bold">{member ? t.edit : t.add}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{member ? t.editDetail : t.detail}</p></div>
          <button type="button" onClick={onClose} disabled={busy} aria-label={t.cancel} className="rounded-xl border border-border p-2 text-slate-500 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {!member && <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">{t.first}<input autoFocus value={firstName} onChange={(event) => setFirstName(event.target.value)} className={fieldClass('firstName')} aria-invalid={Boolean(errors.firstName)} />{errors.firstName && <span className="mt-1 block text-xs text-rose-600">{errors.firstName}</span>}</label>
            <label className="text-sm font-semibold">{t.last}<input value={lastName} onChange={(event) => setLastName(event.target.value)} className={fieldClass('lastName')} aria-invalid={Boolean(errors.lastName)} />{errors.lastName && <span className="mt-1 block text-xs text-rose-600">{errors.lastName}</span>}</label>
          </div>}
          {!member && <label className="block text-sm font-semibold">{t.email}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass('email')} aria-invalid={Boolean(errors.email)} />{errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email}</span>}</label>}
          {!member && <label className="block text-sm font-semibold">{t.password}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass('password')} aria-invalid={Boolean(errors.password)} autoComplete="new-password" />{errors.password && <span className="mt-1 block text-xs text-rose-600">{errors.password}</span>}</label>}
          <label className="block text-sm font-semibold">{t.role}<select value={role} onChange={(event) => setRole(event.target.value as StaffRole)} disabled={isSelf} className={fieldClass('role')}>{roles.map((value) => <option value={value} key={value}>{value.replace('-', ' ')}</option>)}</select></label>
          {member && <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-border px-4 text-sm font-semibold"><span>{t.status}</span><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={isSelf} className="h-5 w-5 accent-primary" /></label>}
          {isSelf && <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">{t.self}</p>}
          {serverError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{serverError}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-xl border border-border px-5 text-sm font-bold">{t.cancel}</button><button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">{busy ? t.saving : member ? t.save : t.create}</button></div>
        </form>
      </section>
    </div>
  );
}
