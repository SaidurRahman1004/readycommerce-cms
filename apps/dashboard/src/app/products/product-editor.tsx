'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { adminCatalogService, adminDirectoryService, type AdminCategory } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';

export default function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    basePrice: '',
    discountPrice: '',
    image: '',
    sku: '',
    variantName: 'Default',
    stock: '0',
    status: 'draft',
    isFeatured: false,
    isSpecialOffer: false,
  });

  useEffect(() => {
    adminDirectoryService.categories()
      .then((r) => setCategories(r.data.filter((c) => c.isActive)))
      .catch(() => toast.error('Categories could not be loaded.'));

    if (id) {
      setFetching(true);
      adminCatalogService.product(id)
        .then((res) => {
          const p = res.data;
          setForm({
            name: p.name || '',
            slug: p.slug || '',
            description: p.description || '',
            category: p.category?._id || (p.category as any) || '',
            basePrice: p.basePrice ? String(p.basePrice) : '',
            discountPrice: p.discountPrice ? String(p.discountPrice) : '',
            image: p.images?.[0] || '',
            sku: p.variants?.[0]?.sku || '',
            variantName: p.variants?.[0]?.name || 'Default',
            stock: p.variants?.[0]?.stock ? String(p.variants[0].stock) : '0',
            status: p.status || 'draft',
            isFeatured: p.isFeatured || false,
            isSpecialOffer: p.isSpecialOffer || false,
          });
        })
        .catch(() => toast.error('Could not load product.'))
        .finally(() => setFetching(false));
    }
  }, [id]);

  const set = (key: string, value: string | boolean) => setForm((x) => ({ ...x, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.category || !form.basePrice || !form.sku) {
      return toast.error('Name, category, base price, and SKU are required.');
    }
    if (Number(form.basePrice) <= 0) {
      return toast.error('Base price must be a positive number.');
    }
    if (form.discountPrice && Number(form.discountPrice) >= Number(form.basePrice)) {
      return toast.error('Discount price must be less than base price.');
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name,
        description: form.description,
        category: form.category,
        basePrice: Number(form.basePrice),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : '',
        images: form.image ? [form.image] : [],
        status: form.status,
        isFeatured: form.isFeatured,
        isSpecialOffer: form.isSpecialOffer,
        variants: [
          {
            name: form.variantName,
            sku: form.sku,
            price: Number(form.discountPrice || form.basePrice),
            stock: Number(form.stock),
          },
        ],
      };

      if (id) {
        await adminCatalogService.update(id, payload);
        toast.success('Product updated successfully.');
      } else {
        await adminCatalogService.create(payload);
        toast.success('Product created successfully.');
      }
      router.push('/products');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <section className="mx-auto max-w-4xl">
        <PageHeader eyebrow="Catalog" title="Loading..." description="Fetching product details..." />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl">
      <Breadcrumbs
        items={[{ label: 'Products', href: '/products' }, { label: id ? 'Edit product' : 'New product' }]}
      />
      <PageHeader
        eyebrow="Catalog"
        title={id ? 'Edit product' : 'Create product'}
        description="Keep pricing, imagery and stock accurate for every storefront variant."
      />
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-white/85 p-5 sm:grid-cols-2 sm:p-8">
        {[
          ['name', 'Product name'],
          ['slug', 'Slug'],
          ['basePrice', 'Base price'],
          ['discountPrice', 'Discount price'],
          ['image', 'Image URL'],
          ['sku', 'Variant SKU'],
          ['stock', 'Initial stock'],
        ].map(([key, label]) => (
          <label className="grid gap-2 text-sm font-bold" key={key}>
            {label}
            <input
              value={form[key as keyof typeof form] as string}
              onChange={(e) => set(key, e.target.value)}
              type={['basePrice', 'discountPrice', 'stock'].includes(key) ? 'number' : 'text'}
              className="min-h-11 rounded-xl border border-border px-3 font-normal outline-none focus:border-primary"
            />
          </label>
        ))}

        <label className="grid gap-2 text-sm font-bold">
          Category
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="min-h-11 rounded-xl border border-border px-3 font-normal"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option value={c._id} key={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        
        <label className="grid gap-2 text-sm font-bold">
          Status
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className="min-h-11 rounded-xl border border-border px-3 font-normal"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => set('isFeatured', e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
            />
            Featured Product
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.isSpecialOffer}
              onChange={(e) => set('isSpecialOffer', e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
            />
            Special Offer
          </label>
        </div>

        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          Description
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={5}
            className="rounded-xl border border-border p-3 font-normal outline-none focus:border-primary"
          />
        </label>

        <div className="flex justify-end sm:col-span-2">
          <button
            disabled={loading}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Saving…' : id ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </section>
  );
}
