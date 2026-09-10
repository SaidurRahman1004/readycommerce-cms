'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Breadcrumbs, PageHeader } from '../../../../components/ui/page-header';
import { ErrorState, Skeleton } from '../../../../components/ui/primitives';
import { adminPaymentSettingsService, PaymentSetting } from '../../../../services/api-service';

export default function BKashSettingsPage() {
  const [form, setForm] = useState<Partial<PaymentSetting>>({
    provider: 'bkash',
    type: 'online',
    name: 'bKash Tokenized',
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
        const setting = res.data.find((s: PaymentSetting) => s.provider === 'bkash');
        if (setting) {
          let creds = { test: {}, live: {} };
          if (typeof setting.credentials === 'string') {
            try { creds = JSON.parse(setting.credentials); } catch(e){}
          } else if (setting.credentials) {
            creds = setting.credentials as any;
          }
          
          setForm({
            ...setting,
            credentials: creds
          });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const setCreds = (mode: 'test' | 'live', key: 'app_key' | 'app_secret' | 'username' | 'password', value: string) => {
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
      const fullCredsPayload = {
        test_app_key: form.credentials?.test?.app_key || '',
        test_app_secret: form.credentials?.test?.app_secret || '',
        test_username: form.credentials?.test?.username || '',
        test_password: form.credentials?.test?.password || '',
        live_app_key: form.credentials?.live?.app_key || '',
        live_app_secret: form.credentials?.live?.app_secret || '',
        live_username: form.credentials?.live?.username || '',
        live_password: form.credentials?.live?.password || '',
        
        // Populate standard mapped fields based on the currently selected mode so provider code is simple
        app_key: form.mode === 'live' ? form.credentials?.live?.app_key || '' : form.credentials?.test?.app_key || '',
        app_secret: form.mode === 'live' ? form.credentials?.live?.app_secret || '' : form.credentials?.test?.app_secret || '',
        username: form.mode === 'live' ? form.credentials?.live?.username || '' : form.credentials?.test?.username || '',
        password: form.mode === 'live' ? form.credentials?.live?.password || '' : form.credentials?.test?.password || '',
      };

      const payload = {
        enabled: form.enabled,
        mode: form.mode,
        credentials: JSON.stringify(fullCredsPayload) as any
      };
      
      const res = await adminPaymentSettingsService.updateSetting('bkash', payload);
      
      let creds = { test: {}, live: {} };
      if (typeof res.data.credentials === 'string') {
        try { 
          const parsed = JSON.parse(res.data.credentials); 
          creds = {
            test: { app_key: parsed.test_app_key, app_secret: parsed.test_app_secret, username: parsed.test_username, password: parsed.test_password },
            live: { app_key: parsed.live_app_key, app_secret: parsed.live_app_secret, username: parsed.live_username, password: parsed.live_password }
          }
        } catch(e){}
      } else if (res.data.credentials) {
         const parsed = res.data.credentials as any;
         creds = {
          test: { app_key: parsed.test_app_key, app_secret: parsed.test_app_secret, username: parsed.test_username, password: parsed.test_password },
          live: { app_key: parsed.live_app_key, app_secret: parsed.live_app_secret, username: parsed.live_username, password: parsed.live_password }
        }
      }
      
      setForm(v => ({ ...v, ...res.data, credentials: creds }));
      toast.success('bKash settings saved.');
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
      <Breadcrumbs items={[{ label: 'Settings', href: '/settings' }, { label: 'Payments' }, { label: 'bKash' }]} />
      <PageHeader 
        eyebrow="Payment Gateway" 
        title="bKash Configuration" 
        description="Configure your sandbox and live credentials for bKash payment gateway."
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
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#e2136e] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#e2136e]/20"></div>
            </label>
            <span className="font-semibold">{form.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
            <button 
              type="button"
              onClick={() => setForm({ ...form, mode: 'test' })}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${form.mode === 'test' ? 'bg-white text-[#e2136e] shadow' : 'text-slate-600 hover:text-slate-900'}`}
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
                App Key
                <input 
                  type="text" 
                  value={form.credentials?.test?.app_key || ''} 
                  onChange={e => setCreds('test', 'app_key', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-[#e2136e]" 
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                App Secret
                <input 
                  type="password" 
                  value={form.credentials?.test?.app_secret || ''} 
                  onChange={e => setCreds('test', 'app_secret', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-[#e2136e]" 
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Username
                <input 
                  type="text" 
                  value={form.credentials?.test?.username || ''} 
                  onChange={e => setCreds('test', 'username', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-[#e2136e]" 
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Password
                <input 
                  type="password" 
                  value={form.credentials?.test?.password || ''} 
                  onChange={e => setCreds('test', 'password', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-[#e2136e]" 
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
                App Key (Live)
                <input 
                  type="text"
                  value={form.credentials?.live?.app_key || ''} 
                  onChange={e => setCreds('live', 'app_key', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-green-600" 
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                App Secret (Live)
                <input 
                  type="password" 
                  value={form.credentials?.live?.app_secret || ''} 
                  onChange={e => setCreds('live', 'app_secret', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-green-600" 
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Username (Live)
                <input 
                  type="text"
                  value={form.credentials?.live?.username || ''} 
                  onChange={e => setCreds('live', 'username', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-green-600" 
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Password (Live)
                <input 
                  type="password" 
                  value={form.credentials?.live?.password || ''} 
                  onChange={e => setCreds('live', 'password', e.target.value)} 
                  className="min-h-11 rounded-xl border border-border px-3 outline-none focus:border-green-600" 
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
