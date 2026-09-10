'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Breadcrumbs, PageHeader } from '../../../../components/ui/page-header';
import { ErrorState, Skeleton } from '../../../../components/ui/primitives';
import { adminPaymentSettingsService, PaymentSetting } from '../../../../services/api-service';
import { Plus, Trash2, GripVertical } from 'lucide-react';

type ManualMethod = { id: string; name: string; accountNumber?: string; accountType?: string; bankInfo?: string; instructions?: string; logo?: string; enabled: boolean; sortOrder: number; };

export default function ManualPaymentSettingsPage() {
  const [form, setForm] = useState<Partial<PaymentSetting>>({
    provider: 'manual',
    type: 'manual',
    name: 'Manual Payments',
    enabled: true,
    manualMethods: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminPaymentSettingsService.getSettings()
      .then(res => {
        const setting = res.data.find((s: PaymentSetting) => s.provider === 'manual');
        if (setting) {
          setForm({
            ...setting,
            manualMethods: setting.manualMethods || []
          });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const addMethod = () => {
    const newId = 'manual_' + Date.now().toString(36);
    setForm(v => ({
      ...v,
      manualMethods: [
        ...(v.manualMethods || []),
        { id: newId, name: '', enabled: true, sortOrder: (v.manualMethods?.length || 0) }
      ]
    }));
  };

  const removeMethod = (id: string) => {
    setForm(v => ({
      ...v,
      manualMethods: v.manualMethods?.filter(m => m.id !== id) || []
    }));
  };

  const updateMethod = (id: string, field: keyof ManualMethod, value: any) => {
    setForm(v => ({
      ...v,
      manualMethods: v.manualMethods?.map(m => m.id === id ? { ...m, [field]: value } : m) || []
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        enabled: form.enabled,
        manualMethods: form.manualMethods
      };
      
      const res = await adminPaymentSettingsService.updateSetting('manual', payload);
      setForm(res.data);
      toast.success('Manual payment settings saved.');
    } catch (x) {
      toast.error(x instanceof Error ? x.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState title="Settings could not be loaded." retry={() => window.location.reload()} />;

  return (
    <section className="mx-auto max-w-4xl">
      <Breadcrumbs items={[{ label: 'Settings', href: '/settings' }, { label: 'Payments' }, { label: 'Manual Payments' }]} />
      <div className="flex items-start justify-between">
        <PageHeader 
          eyebrow="Payment Gateway" 
          title="Manual Payments" 
          description="Configure your manual payment methods like bank transfers or mobile banking."
        />
        <button type="button" onClick={save} disabled={saving} className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {saving ? 'Saving…' : 'Save all'}
        </button>
      </div>
      
      <div className="grid gap-8">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input 
                  type="checkbox" 
                  checked={form.enabled} 
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="peer sr-only" 
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
              </label>
              <span className="font-semibold">{form.enabled ? 'Enabled globally' : 'Disabled globally'}</span>
            </div>
            
            <button type="button" onClick={addMethod} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
              <Plus className="h-4 w-4" /> Add Method
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {(form.manualMethods || []).map((method, index) => (
            <div key={method.id} className="relative rounded-2xl border border-border bg-white shadow-sm overflow-hidden group">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <label className="relative inline-flex cursor-pointer items-center mr-4">
                  <input type="checkbox" checked={method.enabled} onChange={(e) => updateMethod(method.id, 'enabled', e.target.checked)} className="peer sr-only" />
                  <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
                <button type="button" onClick={() => removeMethod(method.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-start gap-4 p-6 sm:p-8 pt-10 sm:pt-10">
                <div className="cursor-move text-slate-300 hover:text-slate-500 mt-2">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1 grid gap-6 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Method Name *
                    <input type="text" placeholder="e.g. bKash Personal" value={method.name || ''} onChange={e => updateMethod(method.id, 'name', e.target.value)} className="min-h-11 w-full rounded-xl border border-border px-3 outline-none focus:border-primary" />
                  </label>
                  
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Account Number / IBAN
                    <input type="text" placeholder="e.g. 017XXXXXXX" value={method.accountNumber || ''} onChange={e => updateMethod(method.id, 'accountNumber', e.target.value)} className="min-h-11 w-full rounded-xl border border-border px-3 outline-none focus:border-primary" />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Account Type
                    <input type="text" placeholder="e.g. Personal, Agent, Current" value={method.accountType || ''} onChange={e => updateMethod(method.id, 'accountType', e.target.value)} className="min-h-11 w-full rounded-xl border border-border px-3 outline-none focus:border-primary" />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Bank Info (if Bank Transfer)
                    <input type="text" placeholder="e.g. City Bank, Gulshan Branch" value={method.bankInfo || ''} onChange={e => updateMethod(method.id, 'bankInfo', e.target.value)} className="min-h-11 w-full rounded-xl border border-border px-3 outline-none focus:border-primary" />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                    Payment Instructions
                    <textarea placeholder="e.g. 1. Go to your app. 2. Select Send Money..." rows={3} value={method.instructions || ''} onChange={e => updateMethod(method.id, 'instructions', e.target.value)} className="w-full rounded-xl border border-border p-3 outline-none focus:border-primary resize-y" />
                  </label>
                </div>
              </div>
            </div>
          ))}
          
          {(!form.manualMethods || form.manualMethods.length === 0) && (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border bg-slate-50 text-slate-500">
              <p>No manual payment methods configured.</p>
              <button type="button" onClick={addMethod} className="mt-4 text-primary font-bold">Add your first method</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
