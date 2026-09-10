'use client';

import { useEffect, useState } from 'react';
import { adminPaymentSettingsService, PaymentSetting } from '@/services/api-service';
import { Truck, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export default function CashOnDeliverySettingsPage() {
  const [setting, setSetting] = useState<PaymentSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [enabled, setEnabled] = useState(false);
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);
  const [fee, setFee] = useState(0);

  async function fetchSettings() {
    try {
      const res = await adminPaymentSettingsService.getSettings();
      const cod = res.data.find(s => s.provider === 'cod');
      if (cod) {
        setSetting(cod);
        setEnabled(cod.enabled);
        setMinAmount(cod.codDetails?.minAmount || 0);
        setMaxAmount(cod.codDetails?.maxAmount || 0);
        setFee(cod.codDetails?.fee || 0);
      }
    } catch (error) {
      toast.error('Failed to load COD settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminPaymentSettingsService.updateSetting('cod', {
        enabled,
        codDetails: {
          minAmount: Number(minAmount),
          maxAmount: Number(maxAmount),
          fee: Number(fee)
        }
      });
      toast.success('Cash on Delivery settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Truck className="h-6 w-6 text-slate-700" />
            Cash on Delivery (COD)
          </h1>
          <p className="mt-1 text-sm text-slate-500">Configure global Cash on Delivery restrictions and extra fees.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900">Enable Cash on Delivery</h3>
            <p className="text-sm text-slate-500">Allow customers to pay when they receive their order.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="peer sr-only" />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300"></div>
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Order Amount (৳)</label>
            <input 
              type="number" 
              min="0" 
              value={minAmount} 
              onChange={(e) => setMinAmount(Number(e.target.value))} 
              className="w-full rounded-lg border-slate-300 focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">0 means no minimum.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Order Amount (৳)</label>
            <input 
              type="number" 
              min="0" 
              value={maxAmount} 
              onChange={(e) => setMaxAmount(Number(e.target.value))} 
              className="w-full rounded-lg border-slate-300 focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">0 means no maximum limit.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Extra COD Fee (৳)</label>
          <input 
            type="number" 
            min="0" 
            value={fee} 
            onChange={(e) => setFee(Number(e.target.value))} 
            className="w-full rounded-lg border-slate-300 focus:border-slate-500 focus:ring-slate-500 sm:text-sm max-w-xs"
          />
          <p className="mt-1 text-xs text-slate-500">Extra charge applied when COD is selected (usually left at 0).</p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button type="submit" disabled={submitting} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
