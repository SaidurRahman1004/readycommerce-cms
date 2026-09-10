'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Breadcrumbs, PageHeader } from '../../../components/ui/page-header';
import { Skeleton, ErrorState } from '../../../components/ui/primitives';
import { adminPaymentSettingsService, type PaymentSetting } from '../../../services/api-service';

export default function PaymentSettingsPage() {
  const [providers, setProviders] = useState<PaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeProvider, setActiveProvider] = useState<PaymentSetting | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = () => {
    setLoading(true);
    adminPaymentSettingsService.getSettings()
      .then(res => setProviders(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  const toggleStatus = async (provider: PaymentSetting) => {
    const toastId = toast.loading(`Updating ${provider.name}...`);
    try {
      await adminPaymentSettingsService.updateSetting(provider.provider, { enabled: !provider.enabled });
      toast.success(`${provider.name} ${!provider.enabled ? 'enabled' : 'disabled'}`, { id: toastId });
      loadProviders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status', { id: toastId });
    }
  };

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState title="Failed to load payment settings" retry={loadProviders} />;

  return (
    <section className="mx-auto max-w-5xl">
      <Breadcrumbs items={[{ label: 'Settings', href: '/settings' }, { label: 'Payments' }]} />
      <PageHeader 
        eyebrow="Configuration" 
        title="Payment Methods" 
        description="Configure online gateways, manual transfers, and cash on delivery for your store." 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder Provider Cards. In reality, these are seeded by backend or defined strictly */}
        {['stripe', 'sslcommerz', 'bkash', 'manual', 'cod'].map((providerId) => {
          const provider = providers.find(p => p.provider === providerId) || {
            provider: providerId as any,
            name: providerId.toUpperCase(),
            type: 'online',
            enabled: false,
            mode: 'test',
            isConfigured: false
          };

          return (
            <div key={providerId} className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{provider.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${provider.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {provider.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {provider.isConfigured ? 'Configured' : 'Needs configuration'}
                  {provider.type === 'online' && ` • ${provider.mode === 'test' ? 'Test Mode' : 'Live Mode'}`}
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => toggleStatus(provider)}
                  className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-semibold transition hover:bg-slate-200"
                >
                  {provider.enabled ? 'Disable' : 'Enable'}
                </button>
                <button 
                  onClick={() => setActiveProvider(provider)}
                  className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeProvider && (
        <ProviderConfigModal 
          provider={activeProvider} 
          onClose={() => setActiveProvider(null)} 
          onRefresh={loadProviders} 
        />
      )}
    </section>
  );
}

// Temporary Modal Component
function ProviderConfigModal({ provider, onClose, onRefresh }: { provider: PaymentSetting, onClose: () => void, onRefresh: () => void }) {
  const [mode, setMode] = useState(provider.mode || 'test');
  const [saving, setSaving] = useState(false);
  
  // Stripe Credentials State
  const [creds, setCreds] = useState({
    testPublishableKey: '',
    testSecretKey: '',
    testWebhookSecret: '',
    livePublishableKey: '',
    liveSecretKey: '',
    liveWebhookSecret: ''
  });

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = { mode };
      if (provider.provider === 'stripe') {
        payload.credentials = creds;
      }
      await adminPaymentSettingsService.updateSetting(provider.provider, payload);
      toast.success('Configuration saved');
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-1 w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl my-8">
        <h2 className="text-xl font-bold">Configure {provider.name}</h2>
        <div className="mt-6 space-y-4">
          {provider.type === 'online' && (
            <div>
              <label className="text-sm font-semibold">Environment Mode</label>
              <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value as any)}
                className={inputClass}
              >
                <option value="test">Test / Sandbox Mode</option>
                <option value="live">Live / Production Mode</option>
              </select>
            </div>
          )}
          
          {provider.provider === 'stripe' && (
             <div className="space-y-4 pt-4 border-t border-border">
                <div className="rounded-xl bg-slate-50 p-4 space-y-4">
                  <h3 className="font-bold text-sm">Test Environment Keys</h3>
                  <div><label className="text-xs font-semibold text-slate-600">Test Publishable Key</label><input type="text" className={inputClass} value={creds.testPublishableKey} onChange={e => setCreds({...creds, testPublishableKey: e.target.value})} placeholder="pk_test_..." /></div>
                  <div><label className="text-xs font-semibold text-slate-600">Test Secret Key</label><input type="password" className={inputClass} value={creds.testSecretKey} onChange={e => setCreds({...creds, testSecretKey: e.target.value})} placeholder="sk_test_..." /></div>
                  <div><label className="text-xs font-semibold text-slate-600">Test Webhook Secret</label><input type="password" className={inputClass} value={creds.testWebhookSecret} onChange={e => setCreds({...creds, testWebhookSecret: e.target.value})} placeholder="whsec_..." /></div>
                </div>

                <div className="rounded-xl bg-red-50 p-4 space-y-4">
                  <h3 className="font-bold text-sm text-red-900">Live Environment Keys</h3>
                  <div><label className="text-xs font-semibold text-red-800">Live Publishable Key</label><input type="text" className={inputClass} value={creds.livePublishableKey} onChange={e => setCreds({...creds, livePublishableKey: e.target.value})} placeholder="pk_live_..." /></div>
                  <div><label className="text-xs font-semibold text-red-800">Live Secret Key</label><input type="password" className={inputClass} value={creds.liveSecretKey} onChange={e => setCreds({...creds, liveSecretKey: e.target.value})} placeholder="sk_live_..." /></div>
                  <div><label className="text-xs font-semibold text-red-800">Live Webhook Secret</label><input type="password" className={inputClass} value={creds.liveWebhookSecret} onChange={e => setCreds({...creds, liveWebhookSecret: e.target.value})} placeholder="whsec_..." /></div>
                </div>
                {provider.isConfigured && <p className="text-xs text-muted-foreground mt-2">Credentials are already securely stored. Fill these fields only to update them.</p>}
             </div>
          )}

          {provider.provider !== 'stripe' && (
             <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
               Full credentials form will be implemented per provider interface. Foundation ready.
             </div>
          )}
        </div>
        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl py-3 text-sm font-bold hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Configuration'}</button>
        </div>
      </div>
    </div>
  );
}
