'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminTeamService, type StaffMember, type StaffRole } from '@/services/api-service';
import { Breadcrumbs, PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog, EmptyState, ErrorState, Skeleton } from '@/components/ui/primitives';
import StaffModal from './staff-modal';

type Locale = 'en' | 'bn';
const copy = {
  en: {
    breadcrumb: 'Team & Roles', eyebrow: 'Access control', title: 'Team & Roles', description: 'Give every staff member the minimum access they need to operate safely.',
    add: 'Add staff member', total: 'Team members', active: 'Active accounts', superAdmins: 'Super-admins', member: 'Staff member', role: 'Role', status: 'Status', lastLogin: 'Last login', actions: 'Actions',
    activeLabel: 'Active', inactiveLabel: 'Inactive', never: 'Never', edit: 'Edit access', revoke: 'Revoke access', empty: 'No staff members found.', emptyDetail: 'Create the first staff account to begin delegating operations.',
    error: 'Team data could not be loaded. Confirm that you have super-admin access.', retry: 'Retry', saved: 'Staff access saved.', created: 'Staff member created.',
    revokeTitle: 'Revoke staff access?', revokeBody: 'This immediately signs the staff member out and removes dashboard access while preserving audit history.', cancel: 'Cancel', confirm: 'Revoke access', revoked: 'Staff access revoked.', language: 'Switch language', self: 'You',
  },
  bn: {
    breadcrumb: 'টিম ও রোল', eyebrow: 'অ্যাক্সেস কন্ট্রোল', title: 'টিম ও রোল', description: 'নিরাপদ পরিচালনার জন্য প্রত্যেক সদস্যকে শুধু প্রয়োজনীয় অ্যাক্সেস দিন।',
    add: 'স্টাফ সদস্য যোগ করুন', total: 'টিম সদস্য', active: 'সক্রিয় অ্যাকাউন্ট', superAdmins: 'সুপার-অ্যাডমিন', member: 'স্টাফ সদস্য', role: 'রোল', status: 'স্ট্যাটাস', lastLogin: 'শেষ লগইন', actions: 'অ্যাকশন',
    activeLabel: 'সক্রিয়', inactiveLabel: 'নিষ্ক্রিয়', never: 'কখনো নয়', edit: 'অ্যাক্সেস সম্পাদনা', revoke: 'অ্যাক্সেস বাতিল', empty: 'কোনো স্টাফ সদস্য পাওয়া যায়নি।', emptyDetail: 'কাজ ভাগ করতে প্রথম স্টাফ অ্যাকাউন্ট তৈরি করুন।',
    error: 'টিমের তথ্য লোড করা যায়নি। আপনার সুপার-অ্যাডমিন অ্যাক্সেস নিশ্চিত করুন।', retry: 'আবার চেষ্টা করুন', saved: 'স্টাফ অ্যাক্সেস সংরক্ষিত হয়েছে।', created: 'স্টাফ সদস্য তৈরি হয়েছে।',
    revokeTitle: 'স্টাফ অ্যাক্সেস বাতিল করবেন?', revokeBody: 'এটি সদস্যকে তাৎক্ষণিক sign out করে dashboard access সরিয়ে দেবে, তবে audit history সংরক্ষিত থাকবে।', cancel: 'বাতিল', confirm: 'অ্যাক্সেস বাতিল', revoked: 'স্টাফ অ্যাক্সেস বাতিল হয়েছে।', language: 'ভাষা পরিবর্তন করুন', self: 'আপনি',
  },
} as const;

const roleStyles: Record<StaffRole, string> = {
  'super-admin': 'bg-violet-50 text-violet-700 ring-violet-200',
  manager: 'bg-blue-50 text-blue-700 ring-blue-200',
  editor: 'bg-amber-50 text-amber-700 ring-amber-200',
  support: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export default function TeamRolesPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null | undefined>(undefined);
  const [revokeTarget, setRevokeTarget] = useState<StaffMember | null>(null);
  const [revoking, setRevoking] = useState(false);
  const t = copy[locale];

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const response = await adminTeamService.list();
      setMembers(response.data);
      setCurrentUserId(response.meta.currentUserId);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => ({
    total: members.length,
    active: members.filter((member) => member.isActive).length,
    superAdmins: members.filter((member) => member.role === 'super-admin' && member.isActive).length,
  }), [members]);

  const saved = (member: StaffMember) => {
    const existed = members.some((item) => item.id === member.id);
    setMembers((current) => existed ? current.map((item) => item.id === member.id ? member : item) : [...current, member]);
    setEditing(undefined);
    toast.success(existed ? t.saved : t.created);
  };

  const revoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const response = await adminTeamService.revoke(revokeTarget.id);
      setMembers((current) => current.map((member) => member.id === response.data.id ? response.data : member));
      setRevokeTarget(null);
      toast.success(t.revoked);
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : t.error); }
    finally { setRevoking(false); }
  };

  const roleBadge = (member: StaffMember) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${roleStyles[member.role]}`}>{member.role.replace('-', ' ')}</span>;
  const statusBadge = (member: StaffMember) => <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />{member.isActive ? t.activeLabel : t.inactiveLabel}</span>;
  const actions = (member: StaffMember) => <div className="flex items-center justify-end gap-2"><button type="button" onClick={() => setEditing(member)} className="rounded-lg border border-border p-2 text-slate-600 transition hover:border-primary hover:text-primary" aria-label={`${t.edit}: ${member.name}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => setRevokeTarget(member)} disabled={member.id === currentUserId} className="rounded-lg border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`${t.revoke}: ${member.name}`}><Trash2 className="h-4 w-4" /></button></div>;

  return (
    <section className="mx-auto max-w-7xl">
      <Breadcrumbs items={[{ label: t.breadcrumb }]} />
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} action={<div className="flex gap-2"><button type="button" aria-label={t.language} onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')} className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold">{locale === 'en' ? 'BN' : 'EN'}</button><button type="button" onClick={() => setEditing(null)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm"><UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">{t.add}</span><span className="sm:hidden">{t.add.split(' ')[0]}</span></button></div>} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[{ label: t.total, value: metrics.total, icon: Users }, { label: t.active, value: metrics.active, icon: ShieldCheck }, { label: t.superAdmins, value: metrics.superAdmins, icon: ShieldCheck }].map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-border bg-white/85 p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div><span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></span></div></article>)}
      </div>

      {loading ? <div className="space-y-3">{[1, 2, 3, 4].map((item) => <Skeleton className="h-20" key={item} />)}</div>
        : error ? <ErrorState title={t.error} retry={() => void load()} retryLabel={t.retry} />
        : members.length === 0 ? <EmptyState title={t.empty} description={t.emptyDetail} />
        : <>
          <div className="grid gap-3 md:hidden">{members.map((member) => <article key={member.id} className="rounded-2xl border border-border bg-white/90 p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{member.name} {member.id === currentUserId && <span className="text-xs text-primary">({t.self})</span>}</p><p className="mt-1 truncate text-xs text-slate-500">{member.email}</p></div>{actions(member)}</div><div className="mt-4 flex flex-wrap items-center gap-2">{roleBadge(member)}{statusBadge(member)}</div><p className="mt-4 text-xs text-slate-500">{t.lastLogin}: {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-BD') : t.never}</p></article>)}</div>
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white/90 shadow-sm md:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">{t.member}</th><th className="px-5 py-4">{t.role}</th><th className="px-5 py-4">{t.status}</th><th className="px-5 py-4">{t.lastLogin}</th><th className="px-5 py-4 text-right">{t.actions}</th></tr></thead><tbody className="divide-y divide-border">{members.map((member) => <tr key={member.id} className="transition hover:bg-muted/40"><td className="px-5 py-4"><p className="font-bold">{member.name} {member.id === currentUserId && <span className="text-xs text-primary">({t.self})</span>}</p><p className="mt-1 text-xs text-slate-500">{member.email}</p></td><td className="px-5 py-4">{roleBadge(member)}</td><td className="px-5 py-4">{statusBadge(member)}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-BD') : t.never}</td><td className="px-5 py-4">{actions(member)}</td></tr>)}</tbody></table></div>
        </>}

      {editing !== undefined && <StaffModal key={editing?.id || 'new'} member={editing} isSelf={editing?.id === currentUserId} locale={locale} onClose={() => setEditing(undefined)} onSaved={saved} />}
      <ConfirmDialog open={Boolean(revokeTarget)} title={t.revokeTitle} description={t.revokeBody} onCancel={() => setRevokeTarget(null)} onConfirm={() => void revoke()} cancelLabel={t.cancel} confirmLabel={t.confirm} busy={revoking} />
    </section>
  );
}
