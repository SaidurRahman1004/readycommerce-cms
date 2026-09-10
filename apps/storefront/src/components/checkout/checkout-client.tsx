'use client';

import { FormEvent, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { addressService, cartService, CustomerAddress, orderService, ServerCart, shippingService } from '@/services/api-service';
import { useCart } from '@/components/store/cart-context';
import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

type Values = { name: string; email: string; phone: string; address: string; city: string; postal: string; payment: string; txid: string; senderNumber: string; reference: string };
const initialValues: Values = { name: '', email: '', phone: '', address: '', city: '', postal: '', payment: '', txid: '', senderNumber: '', reference: '' };

type PaymentMethod = { id: string; name: string; type: 'online' | 'manual' | 'cod'; accountNumber?: string; accountType?: string; bankInfo?: string; instructions?: string; logo?: string; details?: any; };

export default function CheckoutClient() {
  const t = useTranslations('Checkout');
  const authT = useTranslations('Auth');
  const router = useRouter();
  const { clearCart } = useCart();
  const [cart, setCart] = useState<ServerCart | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [values, setValues] = useState<Values>(initialValues);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cartLoading, setCartLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shipping, setShipping] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([cartService.get(), addressService.list(), fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/payments/methods`).then(r => r.json())]).then(([cartResult, addressResult, methodsResult]) => {
      if (!active) return;
      if (cartResult.status === 'fulfilled') setCart(cartResult.value.data);
      if (addressResult.status === 'fulfilled') {
        setAddresses(addressResult.value.data);
        const preferred = addressResult.value.data.find((address) => address.isDefault) || addressResult.value.data[0];
        if (preferred) selectAddress(preferred);
      }
      if (methodsResult.status === 'fulfilled' && methodsResult.value.success) {
        setPaymentMethods(methodsResult.value.data);
        if (methodsResult.value.data.length > 0) {
          setValues(v => ({ ...v, payment: methodsResult.value.data[0].id }));
        }
      }
      setCartLoading(false);
      setAddressLoading(false);
      setPaymentLoading(false);
    });
    return () => { active = false; };
  }, [t]);

  const [codAvailable, setCodAvailable] = useState(true);

  useEffect(() => {
    let active = true;
    if (!values.city.trim() || !values.postal.trim()) { window.setTimeout(() => { if (active) { setShipping(0); setCodAvailable(true); } }, 0); return () => { active = false; }; }
    window.setTimeout(() => { if (active) setShippingLoading(true); }, 0);
    shippingService.quote(values.city, values.postal).then((result) => { 
      if (active) { 
        setShipping(result.data.cost); 
        setCodAvailable(result.data.codAvailable); 
        if (!result.data.codAvailable && values.payment === 'cod') {
          setValues(current => ({ ...current, payment: '' }));
        }
      } 
    }).catch(() => { if (active) toast.error(t('errors.required')); }).finally(() => { if (active) setShippingLoading(false); });
    return () => { active = false; };
  }, [values.city, values.postal, values.payment, t]);

  const update = (key: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };
  function selectAddress(address: CustomerAddress) {
    setSelectedAddress(address._id);
    setValues((current) => ({ ...current, name: address.recipientName, phone: address.phone, address: address.addressLine1, city: address.city, postal: address.postalCode }));
  }
  const schema = z.object({ name: z.string().trim().min(2, t('errors.required')), email: z.string().email(t('errors.email')), phone: z.string().trim().min(7, t('errors.required')), address: z.string().trim().min(3, t('errors.required')), city: z.string().trim().min(2, t('errors.required')), postal: z.string().trim().min(3, t('errors.required')), payment: z.string().min(1, t('errors.required')), txid: z.string().trim(), senderNumber: z.string().trim(), reference: z.string().trim() }).superRefine((data, ctx) => {
    const method = paymentMethods.find(m => m.id === data.payment);
    if (method?.type === 'manual') {
      if (data.txid.length < 4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('errors.txid'), path: ['txid'] });
      }
      if (data.senderNumber.length < 11) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('errors.required'), path: ['senderNumber'] });
      }
    }
  });
  const reportErrors = (error: z.ZodError) => { const next: Record<string, string> = {}; error.issues.forEach((issue) => { next[String(issue.path[0])] = issue.message; }); setErrors(next); toast.error(t('errors.required')); };
  async function saveAddress() {
    const result = schema.pick({ name: true, phone: true, address: true, city: true, postal: true }).safeParse(values);
    if (!result.success) { const next: Record<string, string> = {}; result.error.issues.forEach((issue) => { next[String(issue.path[0])] = issue.message; }); setErrors(next); toast.error(t('errors.required')); return; }
    setSaveLoading(true);
    try { const response = await addressService.create({ type: 'shipping', label: values.name, recipientName: values.name, phone: values.phone, addressLine1: values.address, city: values.city, postalCode: values.postal, country: 'Bangladesh' }); setAddresses((current) => [...current, response.data]); selectAddress(response.data); toast.success(t('success')); } catch { toast.error(authT('errors.generic')); } finally { setSaveLoading(false); }
  }
  const idempotencyRef = useRef<string>('');
  if (!idempotencyRef.current && typeof crypto !== 'undefined' && crypto.randomUUID) idempotencyRef.current = crypto.randomUUID();
  else if (!idempotencyRef.current) idempotencyRef.current = Math.random().toString(36).substring(2) + Date.now().toString(36);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) { reportErrors(result.error); return; }
    if (!cart?.items.length) { toast.error(t('summary.empty')); return; }
    if (!selectedAddress) { toast.error(t('errors.required')); return; }
    setOrderLoading(true);
    try { const created = await orderService.create({ addressId: selectedAddress, paymentMethod: values.payment, txid: values.txid, senderNumber: values.senderNumber, reference: values.reference, idempotencyKey: idempotencyRef.current }); window.localStorage.setItem('readycommerce_last_order_id', created.data.orderId); clearCart(); if (created.data.paymentUrl) { window.location.href = created.data.paymentUrl; } else { toast.success(t('success')); router.push(`/success?orderId=${encodeURIComponent(created.data.orderId)}`); } } catch { toast.error(authT('errors.generic')); } finally { setOrderLoading(false); }
  }
  const input = (key: string) => `mt-2.5 min-h-[52px] w-full rounded-xl border bg-background px-5 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-subtle ${errors[key] ? 'border-rose-400' : 'border-border'}`;
  const addressFields: Array<[keyof Values, string]> = [['name', 'fields.name'], ['phone', 'fields.phone'], ['address', 'fields.address'], ['city', 'fields.city'], ['postal', 'fields.postal']];
  const subtotal = cart?.subtotal || 0;

  if (!cartLoading && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <main className="min-h-screen bg-background pb-12 text-foreground">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="text-[17px] font-semibold">
              ReadyCommerce
            </Link>
            <Link href="/shop" className="text-[15px] font-bold text-primary">
              {t('continueShopping')}
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8 text-center">
          <EmptyState
            icon={ShoppingBag}
            badge="Checkout unavailable"
            title="Your cart is currently empty"
            description="You don't have any items in your cart to checkout. Explore our premium collections, add your favorite products, and return to complete your order."
            action={{
              label: 'Explore Shop',
              href: '/shop',
              icon: ShoppingBag,
            }}
            secondaryAction={{
              label: 'Return Home',
              href: '/',
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-12 text-foreground">
      <header className="border-b border-border bg-surface"><div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8"><Link href="/" className="text-[17px] font-semibold">ReadyCommerce</Link><Link href="/shop" className="text-[15px] font-bold text-primary">{t('continueShopping')}</Link></div></header>
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-20"><div className="mb-12"><p className="mb-4 text-[13px] font-bold uppercase tracking-[0.25em] text-primary">{t('eyebrow')}</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1></div>
        <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
          <div className="space-y-10">
            <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8"><h2 className="text-xl font-bold">{t('contact.title')}</h2><label className="mt-6 block text-sm font-bold">{t('fields.email')}<input className={input('email')} type="email" value={values.email} onChange={(event) => update('email', event.target.value)} />{errors.email && <span className="mt-2 block text-xs text-rose-600">{errors.email}</span>}</label></section>
            <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8"><h2 className="text-xl font-bold">{t('shipping.title')}</h2>{addresses.length > 0 && <div className="mt-6 grid gap-3 sm:grid-cols-2">{addresses.map((address) => <button type="button" key={address._id} onClick={() => selectAddress(address)} className={`rounded-2xl border p-4 text-left transition ${selectedAddress === address._id ? 'border-primary bg-primary-subtle' : 'border-border hover:border-primary/50'}`}><span className="block text-sm font-bold">{address.label}</span><span className="mt-1 block text-sm text-muted-foreground">{address.recipientName} · {address.city}</span></button>)}</div>}{addressLoading && <div className="mt-5 h-12 animate-pulse rounded-xl bg-muted" />}<div className="mt-6 grid gap-5 sm:grid-cols-2">{addressFields.map(([key, label]) => <label key={key} className={`block text-sm font-bold ${key === 'address' ? 'sm:col-span-2' : ''}`}>{t(label)}<input className={input(key)} value={values[key]} onChange={(event) => update(key, event.target.value)} />{errors[key] && <span className="mt-2 block text-xs text-rose-600">{errors[key]}</span>}</label>)}</div><button type="button" onClick={saveAddress} disabled={saveLoading} className="mt-6 min-h-12 rounded-xl border border-primary px-5 font-bold text-primary disabled:opacity-60">{saveLoading && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary align-[-2px]" />}{saveLoading ? authT('loading') : t('placeOrder')}</button></section>
            <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-xl font-bold">{t('payment.title')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t('payment.description')}</p>
              
              {paymentLoading ? (
                <div className="mt-6 h-14 animate-pulse rounded-xl bg-muted" />
              ) : paymentMethods.length > 0 ? (
                <>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {paymentMethods.filter(m => m.id !== 'cod' || codAvailable).map((method) => (
                      <label key={method.id} className={`flex min-h-14 items-center gap-3 rounded-xl border p-4 font-bold cursor-pointer transition ${values.payment === method.id ? 'border-primary bg-primary-subtle' : 'border-border hover:border-primary/50'}`}>
                        <input type="radio" name="payment" value={method.id} checked={values.payment === method.id} onChange={() => update('payment', method.id)} className="accent-primary" />
                        {method.type === 'online' && method.id === 'stripe' ? 'Credit Card (Stripe)' : method.name}
                      </label>
                    ))}
                  </div>

                  {paymentMethods.find(m => m.id === values.payment && m.type === 'manual') && (() => {
                    const activeMethod = paymentMethods.find(m => m.id === values.payment)!;
                    return (
                      <div className="mt-6 space-y-6 rounded-2xl border border-border bg-slate-50 p-6 animate-in fade-in slide-in-from-top-2">
                        {activeMethod.instructions && (
                          <div className="prose prose-sm prose-slate max-w-none">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Instructions</h4>
                            <div className="mt-2 whitespace-pre-wrap">{activeMethod.instructions}</div>
                          </div>
                        )}
                        
                        {(activeMethod.accountNumber || activeMethod.bankInfo) && (
                          <div className="grid gap-4 sm:grid-cols-2 bg-white p-4 rounded-xl border border-border">
                            {activeMethod.accountNumber && (
                              <div>
                                <span className="block text-xs font-bold uppercase text-slate-500">Account Number</span>
                                <span className="font-mono text-base font-bold select-all">{activeMethod.accountNumber}</span>
                                {activeMethod.accountType && <span className="ml-2 text-sm text-slate-500">({activeMethod.accountType})</span>}
                              </div>
                            )}
                            {activeMethod.bankInfo && (
                              <div>
                                <span className="block text-xs font-bold uppercase text-slate-500">Bank Info</span>
                                <span className="text-sm font-semibold">{activeMethod.bankInfo}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid gap-5 sm:grid-cols-2 pt-4 border-t border-border">
                          <label className="block text-sm font-bold">
                            Sender Number / Account Name *
                            <input className={input('senderNumber')} placeholder="017XXXXXXXX" value={values.senderNumber} onChange={(event) => update('senderNumber', event.target.value)} />
                            {errors.senderNumber && <span className="mt-2 block text-xs text-rose-600">{errors.senderNumber}</span>}
                          </label>
                          <label className="block text-sm font-bold">
                            Transaction ID (TxID) *
                            <input className={input('txid')} placeholder="e.g. 8A7B6C5D" value={values.txid} onChange={(event) => update('txid', event.target.value)} />
                            {errors.txid && <span className="mt-2 block text-xs text-rose-600">{errors.txid}</span>}
                          </label>
                          <label className="block text-sm font-bold sm:col-span-2">
                            Reference / Note (Optional)
                            <input className={input('reference')} placeholder="Order for John" value={values.reference} onChange={(event) => update('reference', event.target.value)} />
                          </label>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="mt-6 p-4 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200">
                  No payment methods are currently available. Please contact support.
                </div>
              )}
            </section>
          </div>
          <aside className="h-fit rounded-3xl border border-border bg-surface p-6 shadow-premium sm:p-8 lg:sticky lg:top-8"><h2 className="text-xl font-bold">{t('summary.title')}</h2>{cartLoading ? <div className="mt-8 space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div> : !cart?.items.length ? <p className="mt-8 text-sm text-muted-foreground">{t('summary.empty')}</p> : <div className="mt-8 space-y-6">{(cart.items || []).map((item) => <div key={`${item.productId}-${item.variantId || 'base'}`} className="flex gap-4"><div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">{item.image && <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{t('summary.quantity')}: {item.quantity}</p></div><p className="text-sm font-bold">&#2547;{(item.price * item.quantity).toLocaleString()}</p></div>)}</div>}<div className="my-8 border-t border-border" /><div className="space-y-3 text-sm"><div className="flex justify-between"><span>{t('summary.subtotal')}</span><span>&#2547;{subtotal.toLocaleString()}</span></div><div className="flex justify-between"><span>{t('summary.shipping')}</span><span>{shippingLoading ? '…' : `\u09F3${shipping.toLocaleString()}`}</span></div></div><div className="my-6 border-t border-border" /><div className="flex items-center justify-between text-lg font-bold"><span>{t('summary.total')}</span><span>&#2547;{(subtotal + shipping).toLocaleString()}</span></div><button type="submit" disabled={orderLoading || cartLoading} className="mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary font-bold text-white disabled:opacity-60">{orderLoading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}{orderLoading ? authT('loading') : t('placeOrder')}</button></aside>
        </form>
      </div>
    </main>
  );
}
