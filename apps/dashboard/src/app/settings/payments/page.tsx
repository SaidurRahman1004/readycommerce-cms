'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Breadcrumbs, PageHeader } from '../../../components/ui/page-header';
import { ErrorState, Skeleton } from '../../../components/ui/primitives';
import { adminPaymentSettingsService, type PaymentSetting } from '../../../services/api-service';

type ProviderId = PaymentSetting['provider'];
type ProviderType = PaymentSetting['type'];
type CredentialValues = Record<string, string>;
type ManualMethod = {
  id: string;
  name: string;
  accountNumber?: string;
  accountType?: string;
  bankInfo?: string;
  instructions?: string;
  logo?: string;
  enabled: boolean;
  sortOrder: number;
};
type CodDetails = { minAmount: number; maxAmount: number; fee: number };

const providerMeta: Record<ProviderId, { name: string; type: ProviderType }> = {
  stripe: { name: 'Stripe', type: 'online' },
  sslcommerz: { name: 'SSLCommerz', type: 'online' },
  bkash: { name: 'bKash', type: 'online' },
  manual: { name: 'Manual Payments', type: 'manual' },
  cod: { name: 'Cash on Delivery', type: 'cod' },
};

const providerIds: ProviderId[] = ['stripe', 'sslcommerz', 'bkash', 'manual', 'cod'];

export default function PaymentSettingsPage() {
  const [providers, setProviders] = useState<PaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeProvider, setActiveProvider] = useState<PaymentSetting | null>(null);

  async function loadProviders() {
    setLoading(true);
    setError(false);
    try {
      const response = await adminPaymentSettingsService.getSettings();
      setProviders(response.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProviders();
  }, []);

  async function toggleStatus(provider: PaymentSetting) {
    const toastId = toast.loading(`Updating ${provider.name}...`);
    try {
      await adminPaymentSettingsService.updateSetting(provider.provider, {
        name: provider.name,
        type: provider.type,
        enabled: !provider.enabled,
        mode: provider.mode,
      });
      toast.success(`${provider.name} ${provider.enabled ? 'disabled' : 'enabled'}`, { id: toastId });
      await loadProviders();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Failed to update status.', { id: toastId });
    }
  }

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState title="Failed to load payment settings" retry={() => void loadProviders()} />;

  return (
    <section className="mx-auto max-w-5xl">
      <Breadcrumbs items={[{ label: 'Settings', href: '/settings' }, { label: 'Payments' }]} />
      <PageHeader eyebrow="Configuration" title="Payment Methods" description="Configure online gateways, manual transfers, and cash on delivery for your store." />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providerIds.map((providerId) => {
          const provider = providers.find((item) => item.provider === providerId) ?? {
            provider: providerId,
            name: providerMeta[providerId].name,
            type: providerMeta[providerId].type,
            enabled: false,
            mode: 'test',
            isConfigured: false,
          } as PaymentSetting;

          return (
            <article key={providerId} className="flex min-h-52 flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold">{provider.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${provider.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {provider.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {provider.isConfigured ? 'Configured' : 'Needs configuration'}
                  {provider.type === 'online' ? ` · ${provider.mode === 'test' ? 'Test Mode' : 'Live Mode'}` : ''}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => void toggleStatus(provider)} className="min-h-11 rounded-xl bg-slate-100 px-3 text-sm font-semibold transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  {provider.enabled ? 'Disable' : 'Enable'}
                </button>
                <button type="button" onClick={() => setActiveProvider(provider)} className="min-h-11 rounded-xl bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  Configure
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {activeProvider && <ProviderConfigModal key={activeProvider.provider} provider={activeProvider} onClose={() => setActiveProvider(null)} onRefresh={loadProviders} />}
    </section>
  );
}

function ProviderConfigModal({ provider, onClose, onRefresh }: { provider: PaymentSetting; onClose: () => void; onRefresh: () => Promise<void> }) {
  const [enabled, setEnabled] = useState(provider.enabled);
  const [mode, setMode] = useState<'test' | 'live'>(provider.mode || 'test');
  const [credentials, setCredentials] = useState<CredentialValues>({});
  const [manualMethods, setManualMethods] = useState<ManualMethod[]>(provider.manualMethods || []);
  const [codDetails, setCodDetails] = useState<CodDetails>({
    minAmount: provider.codDetails?.minAmount || 0,
    maxAmount: provider.codDetails?.maxAmount || 0,
    fee: provider.codDetails?.fee || 0,
  });
  const [saving, setSaving] = useState(false);

  const updateCredential = (key: string, value: string) => setCredentials((current) => ({ ...current, [key]: value }));
  const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

  const credentialField = (label: string, key: string, type: 'text' | 'password' = 'text'): ReactNode => (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <input type={type} value={credentials[key] || ''} onChange={(event) => updateCredential(key, event.target.value)} className={inputClass} autoComplete="off" />
    </label>
  );

  const updateManualMethod = (id: string, key: keyof ManualMethod, value: string | boolean) => {
    setManualMethods((current) => current.map((method) => method.id === id ? { ...method, [key]: value } as ManualMethod : method));
  };

  const addManualMethod = () => {
    setManualMethods((current) => [...current, { id: `manual_${Date.now().toString(36)}`, name: '', enabled: true, sortOrder: current.length }]);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name: provider.name, type: provider.type, enabled, mode };

      if (provider.provider === 'stripe' || provider.provider === 'sslcommerz') {
        payload.credentials = credentials;
      }
      if (provider.provider === 'bkash') {
        const activePrefix = mode === 'live' ? 'live' : 'test';
        payload.credentials = {
          ...credentials,
          app_key: credentials[`${activePrefix}_app_key`] || '',
          app_secret: credentials[`${activePrefix}_app_secret`] || '',
          username: credentials[`${activePrefix}_username`] || '',
          password: credentials[`${activePrefix}_password`] || '',
        };
      }
      if (provider.provider === 'manual') payload.manualMethods = manualMethods;
      if (provider.provider === 'cod') payload.codDetails = codDetails;

      await adminPaymentSettingsService.updateSetting(provider.provider, payload as Partial<PaymentSetting>);
      toast.success(`${provider.name} configuration saved.`);
      await onRefresh();
      onClose();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Could not save configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="payment-config-title">
      <div className="mx-auto my-4 w-full max-w-3xl rounded-3xl bg-white shadow-2xl sm:my-8">
        <form onSubmit={save}>
          <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Payment configuration</p>
              <h2 id="payment-config-title" className="mt-1 text-xl font-bold sm:text-2xl">Configure {provider.name}</h2>
              <p className="mt-1 text-sm text-slate-500">Credentials are encrypted by the backend before storage.</p>
            </div>
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">Close</button>
          </div>

          <div className="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-slate-50 p-4">
              <label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-5 w-5 accent-primary" /> Enable {provider.name}</label>
              {provider.type === 'online' && <div className="flex rounded-xl bg-white p-1 shadow-sm"><button type="button" onClick={() => setMode('test')} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${mode === 'test' ? 'bg-primary text-white' : 'text-slate-600'}`}>Test mode</button><button type="button" onClick={() => setMode('live')} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${mode === 'live' ? 'bg-primary text-white' : 'text-slate-600'}`}>Live mode</button></div>}
            </div>

            {provider.provider === 'stripe' && <div className="grid gap-6 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><h3 className="font-bold">Test credentials</h3><div className="mt-4 grid gap-4">{credentialField('Publishable key', 'testPublishableKey')}{credentialField('Secret key', 'testSecretKey', 'password')}{credentialField('Webhook secret', 'testWebhookSecret', 'password')}</div></div><div className="rounded-2xl bg-amber-50 p-4"><h3 className="font-bold text-amber-900">Live credentials</h3><div className="mt-4 grid gap-4">{credentialField('Publishable key', 'livePublishableKey')}{credentialField('Secret key', 'liveSecretKey', 'password')}{credentialField('Webhook secret', 'liveWebhookSecret', 'password')}</div></div></div>}

            {provider.provider === 'sslcommerz' && <div className="grid gap-6 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><h3 className="font-bold">Sandbox credentials</h3><div className="mt-4 grid gap-4">{credentialField('Test store ID', 'testStoreId')}{credentialField('Test store password', 'testStorePassword', 'password')}</div></div><div className="rounded-2xl bg-amber-50 p-4"><h3 className="font-bold text-amber-900">Live credentials</h3><div className="mt-4 grid gap-4">{credentialField('Live store ID', 'liveStoreId')}{credentialField('Live store password', 'liveStorePassword', 'password')}</div></div></div>}

            {provider.provider === 'bkash' && <div className="grid gap-6 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><h3 className="font-bold">Sandbox credentials</h3><div className="mt-4 grid gap-4">{credentialField('App key', 'test_app_key')}{credentialField('App secret', 'test_app_secret', 'password')}{credentialField('Username', 'test_username')}{credentialField('Password', 'test_password', 'password')}</div></div><div className="rounded-2xl bg-amber-50 p-4"><h3 className="font-bold text-amber-900">Live credentials</h3><div className="mt-4 grid gap-4">{credentialField('App key', 'live_app_key')}{credentialField('App secret', 'live_app_secret', 'password')}{credentialField('Username', 'live_username')}{credentialField('Password', 'live_password', 'password')}</div></div></div>}

            {provider.provider === 'manual' && <div className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="font-bold">Manual payment methods</h3><p className="text-sm text-slate-500">Add bKash, Nagad, bank transfer, or other instructions.</p></div><button type="button" onClick={addManualMethod} className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">Add method</button></div>{manualMethods.map((method) => <div key={method.id} className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-semibold">Method name<input value={method.name} onChange={(event) => updateManualMethod(method.id, 'name', event.target.value)} className={inputClass} placeholder="bKash Personal" /></label><label className="grid gap-1.5 text-sm font-semibold">Account number<input value={method.accountNumber || ''} onChange={(event) => updateManualMethod(method.id, 'accountNumber', event.target.value)} className={inputClass} placeholder="017XXXXXXXX" /></label><label className="grid gap-1.5 text-sm font-semibold">Account type<input value={method.accountType || ''} onChange={(event) => updateManualMethod(method.id, 'accountType', event.target.value)} className={inputClass} placeholder="Personal / Agent / Current" /></label><label className="grid gap-1.5 text-sm font-semibold">Bank information<input value={method.bankInfo || ''} onChange={(event) => updateManualMethod(method.id, 'bankInfo', event.target.value)} className={inputClass} placeholder="Optional bank or branch details" /></label><label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Instructions<textarea rows={4} value={method.instructions || ''} onChange={(event) => updateManualMethod(method.id, 'instructions', event.target.value)} className="w-full resize-y rounded-xl border border-border p-3 text-sm outline-none focus:border-primary" placeholder="Explain how customers should complete payment." /></label><div className="flex items-center justify-between sm:col-span-2"><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={method.enabled} onChange={(event) => updateManualMethod(method.id, 'enabled', event.target.checked)} className="h-5 w-5 accent-primary" /> Active method</label><button type="button" onClick={() => setManualMethods((current) => current.filter((item) => item.id !== method.id))} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50">Remove</button></div></div>)}{manualMethods.length === 0 && <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-slate-500">No manual methods yet. Add one to display payment instructions at checkout.</div>}</div>}

            {provider.provider === 'cod' && <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1.5 text-sm font-semibold">Minimum order amount<input type="number" min="0" value={codDetails.minAmount} onChange={(event) => setCodDetails((current) => ({ ...current, minAmount: Number(event.target.value) }))} className={inputClass} /></label><label className="grid gap-1.5 text-sm font-semibold">Maximum order amount<input type="number" min="0" value={codDetails.maxAmount} onChange={(event) => setCodDetails((current) => ({ ...current, maxAmount: Number(event.target.value) }))} className={inputClass} /></label><label className="grid gap-1.5 text-sm font-semibold">COD fee<input type="number" min="0" value={codDetails.fee} onChange={(event) => setCodDetails((current) => ({ ...current, fee: Number(event.target.value) }))} className={inputClass} /></label><p className="text-xs text-slate-500 sm:col-span-3">Use zero for no limit or no additional fee.</p></div>}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end sm:p-7"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-5 text-sm font-bold hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-primary px-6 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save configuration'}</button></div>
        </form>
      </div>
    </div>
  );
}
