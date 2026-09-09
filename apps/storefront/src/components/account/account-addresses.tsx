'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MapPin, Plus } from 'lucide-react';
import { addressService, CustomerAddress } from '@/services/api-service';

export default function AccountAddresses() {
  const t = useTranslations('Account');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: '',
    recipientName: '',
    phone: '',
    addressLine1: '',
    city: '',
    postalCode: '',
  });

  useEffect(() => {
    addressService
      .list()
      .then((result) => setAddresses(result.data || []))
      .catch(() => toast.error(t('errors.generic')))
      .finally(() => setLoading(false));
  }, [t]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const result = z
      .object({
        label: z.string().trim().min(1, t('errors.required')),
        recipientName: z.string().trim().min(2, t('errors.required')),
        phone: z.string().trim().min(7, t('errors.phone')),
        addressLine1: z.string().trim().min(3, t('errors.required')),
        city: z.string().trim().min(2, t('errors.required')),
        postalCode: z.string().trim().min(3, t('errors.required')),
      })
      .safeParse(form);

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      const response = await addressService.create({
        ...form,
        type: 'shipping',
        country: 'Bangladesh',
      });
      setAddresses((current) => [...current, response.data]);
      setForm({
        label: '',
        recipientName: '',
        phone: '',
        addressLine1: '',
        city: '',
        postalCode: '',
      });
      toast.success(t('addresses.saved'));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Existing Addresses Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xs">
        <h2 className="text-xl font-semibold">{t('addresses.title')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('addresses.description')}</p>

        {loading ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-slate-200 p-4 bg-slate-50/70 animate-pulse"
              />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">No saved addresses</p>
            <p className="mt-1 text-xs text-slate-500">
              Add your delivery address below for fast 1-click checkout.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address._id}
                className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs transition hover:border-indigo-300"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm font-bold text-slate-900">{address.label}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {address.recipientName}
                  <br />
                  {address.addressLine1}
                  <br />
                  {address.city} · {address.postalCode}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add New Address Form Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xs">
        <h2 className="text-xl font-semibold">{t('addresses.addTitle')}</h2>
        <form onSubmit={save} className="mt-6 grid gap-5 sm:grid-cols-2" noValidate>
          {(
            [
              'label',
              'recipientName',
              'phone',
              'addressLine1',
              'city',
              'postalCode',
            ] as const
          ).map((key) => (
            <label
              key={key}
              className={`block text-sm font-medium text-slate-700 ${
                key === 'addressLine1' ? 'sm:col-span-2' : ''
              }`}
            >
              {key === 'recipientName'
                ? t('profile.fields.firstName')
                : key === 'addressLine1'
                ? t('addresses.fields.line')
                : key === 'postalCode'
                ? t('addresses.fields.postal')
                : key === 'label'
                ? t('addresses.fields.label')
                : key === 'phone'
                ? t('profile.fields.phone')
                : t('addresses.fields.city')}
              <input
                value={form[key]}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:col-span-2 sm:w-fit active:scale-95"
          >
            {saving ? (
              <span>{t('loading')}</span>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>{t('addresses.save')}</span>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
