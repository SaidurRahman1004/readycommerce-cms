'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Breadcrumbs, PageHeader } from '../../../../components/ui/page-header';
import { ErrorState, Skeleton } from '../../../../components/ui/primitives';
import { adminPaymentSettingsService, PaymentSetting } from '../../../../services/api-service';

export default function SSLCommerzSettingsPage() {
  const [form, setForm] = useState<Partial<PaymentSetting>>({
    provider: 'sslcommerz',
    type: 'online',
    name: 'SSLCommerz',
    enabled: false,
    mode: 'test',
    credentials: { test: {}, live: {} },
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminPaymentSettingsService.getSettings()
      .then(res => {
        const sslSetting = res.data.find((s: PaymentSetting) => s.provider === 'sslcommerz');
        if (sslSetting) {
          // Parse JSON if credentials comes as a string from backend, but getSettings should return object.
          // However, our backend decrypts and doesn't explicitly parse if we don't map it. Let's assume it's object or string.
          let creds = { test: {}, live: {} };
          if (typeof sslSetting.credentials === 'string') {
            try { creds = JSON.parse(sslSetting.credentials); } catch(e){}
          } else if (sslSetting.credentials) {
            creds = sslSetting.credentials as any;
          }
          
          setForm({
            ...sslSetting,
            credentials: creds
          });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const setCreds = (mode: 'test' | 'live', key: 'key' | 'secret', value: string) => {
    setForm(v => ({
      ...v,
      credentials: {
        ...v.credentials,
        [mode]: {
          ...(v.credentials?.[mode] || {}),
          [key]: value
        }
      }
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create a flat credentials JSON string that the backend encrypts automatically in PaymentSetting model.
      const credsPayload = {
        testStoreId: form.credentials?.test?.key || '',
        testStorePassword: form.credentials?.test?.secret || '',
        liveStoreId: form.credentials?.live?.key || '',
        liveStorePassword: form.credentials?.live?.secret || '',
      };

      const payload = {
        enabled: form.enabled,
        mode: form.mode,
        credentials: JSON.stringify(credsPayload) as any // Cast to any because the frontend service type might expect an object
      };
      
      const res = await adminPaymentSettingsService.updateSetting('sslcommerz', payload);
      
      let creds = { test: {}, live: {} };
      if (typeof res.data.credentials === 'string') {
        try { creds = JSON.parse(res.data.credentials); } catch(e){}
      } else if (res.data.credentials) {
         creds = res.data.credentials as any;
      }
      
      setForm(v => ({ ...v, ...res.data, credentials: creds }));
      toast.success('SSLCommerz settings saved.');
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
      <Breadcrumbs items={[{ label: 'Settings', href: '/settings' }, { label: 'Payments' }, { label: 'SSLCommerz' }]} />
      <PageHeader 
        eyebrow="Payment Gateway" 
        title="SSLCommerz Configuration" 
        description="Configure your sandbox and live credentials for SSLCommerz payment gateway."
      />
      
      <form onSubmit={save} className="grid gap-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
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
            <span className="font-semibold">{form.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
            <button 
              type="button"
              onClick={() => setForm({ ...form, mode: 'test' })}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${form.mode === 'test' ? 'bg-white text-primary shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Test Mode
            </button>
            <button 
              type="button"
              onClick={() => setForm({ ...form, mode: 'live' })}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${form.mode === 'live' ? 'bg-white text-green-600 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Live Mode
            </button>
          </div>
        </div>

        {/* Dynamic Credentials Form */}
        {form.mode === 'test' ? (
          <div className="grid gap-5">
            <h3 className="font-bold text-slate-800">Sandbox Credentials</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Store ID (Sandbox)
                <input 
                  type="text" 
                  placeholder="e.g. testbox"
                  value={form.credentials?.test?.key || ''} 
                  onChange={e => setCreds('test', 'key', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-primary" 
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Store Password (Sandbox)
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={form.credentials?.test?.secret || ''} 
                  onChange={e => setCreds('test', 'secret', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-primary" 
                />
              </label>
            </div>
            <p className="text-sm text-slate-500">Sandbox transactions will not charge real money. Use this for testing.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            <h3 className="font-bold text-green-700">Live Credentials</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Store ID (Live)
                <input 
                  type="text"
                  placeholder="e.g. mycompany"
                  value={form.credentials?.live?.key || ''} 
                  onChange={e => setCreds('live', 'key', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-primary" 
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Store Password (Live)
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={form.credentials?.live?.secret || ''} 
                  onChange={e => setCreds('live', 'secret', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-primary" 
                />
              </label>
            </div>
            <p className="text-sm text-amber-600 font-medium">Warning: Transactions in Live mode will process real payments.</p>
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-6">
          <button disabled={saving} className="min-h-11 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save configuration'}
          </button>
        </div>
      </form>
    </section>
  );
}
