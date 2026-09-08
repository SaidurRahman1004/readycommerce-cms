'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Edit3, Plus, Trash2, X } from 'lucide-react';
import { manualService, catalogService, type AdminManual, type CatalogProduct } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives';

type Draft = { title: string; slug: string; type: 'staff_sop' | 'customer_guide'; content: string; relatedProducts: string[]; status: 'active' | 'draft' };
const emptyDraft: Draft = { title: '', slug: '', type: 'staff_sop', content: '', relatedProducts: [], status: 'draft' };

const makeDraft = (manual?: AdminManual): Draft => manual ? ({ title: manual.title, slug: manual.slug, type: manual.type, content: manual.content, relatedProducts: manual.relatedProducts.map((product) => product._id), status: manual.status }) : emptyDraft;

export default function ManualsPage() {
  const [items, setItems] = useState<AdminManual[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<AdminManual | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { const response = await manualService.list(); setItems(response.data); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); catalogService.products({ limit: 100 }).then((response) => setProducts(response.data)).catch(() => undefined); }, [load]);

  const openCreate = () => { setEditing(null); setDraft({ ...emptyDraft }); };
  const openEdit = (manual: AdminManual) => { setEditing(manual); setDraft(makeDraft(manual)); };
  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.title.trim().length < 3 || !draft.content.trim()) return toast.error('Title and content are required.');
    setSaving(true);
    try {
      const payload = { ...draft, title: draft.title.trim(), slug: draft.slug.trim() || draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') };
      if (editing) await manualService.update(editing._id, payload); else await manualService.create(payload);
      toast.success(editing ? 'Manual updated.' : 'Manual created.'); setEditing(null); setDraft({ ...emptyDraft }); await load();
    } catch (value) { toast.error(value instanceof Error ? value.message : 'Could not save manual.'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this manual permanently?')) return;
    try { await manualService.remove(id); toast.success('Manual deleted.'); await load(); }
    catch (value) { toast.error(value instanceof Error ? value.message : 'Could not delete manual.'); }
  };

  return <section className="mx-auto max-w-7xl overflow-x-hidden">
    <Breadcrumbs items={[{ label: 'Manuals & SOPs' }]} />
    <PageHeader eyebrow="Knowledge base" title="Manuals & SOPs" description="Create staff procedures and product activation guides from one controlled workspace." action={<button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> New manual</button>} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div>{loading ? <Skeleton className="h-64" /> : error ? <ErrorState title="Manuals could not be loaded." retry={() => void load()} /> : !items.length ? <EmptyState title="No manuals yet." description="Create your first SOP or customer guide." /> : <div className="overflow-x-auto rounded-2xl border border-border bg-white/90"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wider text-slate-500"><tr>{['Title', 'Type', 'Status', 'Updated', 'Actions'].map((label) => <th className="px-5 py-4" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{items.map((manual) => <tr className="hover:bg-muted/40" key={manual._id}><td className="max-w-xs px-5 py-4"><p className="font-bold">{manual.title}</p><p className="truncate text-xs text-slate-500">/{manual.slug}</p></td><td className="px-5 py-4 capitalize">{manual.type.replace('_', ' ')}</td><td className="px-5 py-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{manual.status}</span></td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{new Date(manual.updatedAt).toLocaleDateString()}</td><td className="whitespace-nowrap px-5 py-4"><button type="button" onClick={() => openEdit(manual)} className="mr-4 inline-flex min-h-10 items-center gap-1 font-bold text-primary"><Edit3 className="h-4 w-4" /> Edit</button><button type="button" onClick={() => void remove(manual._id)} className="inline-flex min-h-10 items-center gap-1 font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Delete</button></td></tr>)}</tbody></table></div>}</div>
      <form onSubmit={save} className="rounded-2xl border border-border bg-white/90 p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">{editing ? 'Edit manual' : 'New manual'}</p><h2 className="mt-1 text-xl font-bold">{editing ? editing.title : 'Build a guide'}</h2></div>{editing && <button type="button" onClick={() => { setEditing(null); setDraft({ ...emptyDraft }); }} aria-label="Close editor" className="rounded-lg p-2 text-slate-500 hover:bg-muted"><X className="h-5 w-5" /></button>}</div><div className="grid gap-4"><label className="grid gap-2 text-sm font-semibold">Title<input value={draft.title} onChange={(event) => setField('title', event.target.value)} className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="e.g. Perfume care guide" /></label><label className="grid gap-2 text-sm font-semibold">Slug<input value={draft.slug} onChange={(event) => setField('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="min-h-11 rounded-xl border border-border px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="perfume-care-guide" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Type<select value={draft.type} onChange={(event) => setField('type', event.target.value as Draft['type'])} className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-primary"><option value="staff_sop">Staff SOP</option><option value="customer_guide">Customer guide</option></select></label><label className="grid gap-2 text-sm font-semibold">Status<select value={draft.status} onChange={(event) => setField('status', event.target.value as Draft['status'])} className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-primary"><option value="draft">Draft</option><option value="active">Active</option></select></label></div>{draft.type === 'customer_guide' && <label className="grid gap-2 text-sm font-semibold">Related products<span className="text-xs font-normal text-slate-500">Leave empty for a general guide.</span><select multiple value={draft.relatedProducts} onChange={(event) => setField('relatedProducts', Array.from(event.target.selectedOptions, (option) => option.value))} className="min-h-28 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary">{products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}</select></label>}<label className="grid gap-2 text-sm font-semibold">Content<span className="text-xs font-normal text-slate-500">Markdown-friendly text: headings, lists, and image URLs are supported.</span><textarea required value={draft.content} onChange={(event) => setField('content', event.target.value)} rows={12} className="w-full resize-y rounded-xl border border-border px-3 py-3 font-mono text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="# How to use\n\n1. Apply to clean skin..." /></label><div className="rounded-xl border border-border bg-slate-50 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><BookOpen className="h-4 w-4" /> Preview</p><div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{draft.content || 'Your guide preview will appear here.'}</div></div><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Update manual' : 'Create manual'}</button></div></form>
    </div>
  </section>;
}
