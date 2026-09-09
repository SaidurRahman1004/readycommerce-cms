'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { adminCatalogService, adminDirectoryService, type AdminCategory } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { X, Plus, ImageIcon, Trash2, Check, Star } from 'lucide-react';

type VariantUI = {
  _id?: string;
  name: string;
  sku: string;
  price: string;
  stock: string;
  attributes: { key: string; value: string }[];
};

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-slate-50/50 px-6 py-4">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    basePrice: '',
    discountPrice: '',
    status: 'draft',
    isFeatured: false,
    isSpecialOffer: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [variants, setVariants] = useState<VariantUI[]>([
    { name: 'Default', sku: '', price: '', stock: '0', attributes: [] },
  ]);

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
            status: p.status || 'draft',
            isFeatured: p.isFeatured || false,
            isSpecialOffer: p.isSpecialOffer || false,
          });

          setImages(p.images || []);

          if (p.variants && p.variants.length > 0) {
            setVariants(p.variants.map((v) => ({
              _id: v._id,
              name: v.name || 'Default',
              sku: v.sku || '',
              price: String(v.price || ''),
              stock: String(v.stock || 0),
              attributes: v.attributes 
                ? Object.entries(v.attributes).map(([k, val]) => ({ key: k, value: String(val) })) 
                : []
            })));
          }
        })
        .catch(() => toast.error('Could not load product.'))
        .finally(() => setFetching(false));
    }
  }, [id]);

  const setF = (key: string, value: string | boolean) => setForm((x) => ({ ...x, [key]: value }));

  // Image actions
  const addImage = () => {
    if (!newImageUrl) return;
    if (images.includes(newImageUrl)) return toast.error('Image already exists.');
    setImages((prev) => [...prev, newImageUrl]);
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const target = copy.splice(index, 1)[0];
      copy.unshift(target);
      return copy;
    });
  };

  // Variant actions
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { name: `Variant ${prev.length + 1}`, sku: '', price: '', stock: '0', attributes: [] },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) return toast.error('Product must have at least one variant.');
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, key: keyof VariantUI, value: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const addAttribute = (varIdx: number) => {
    const copy = [...variants];
    copy[varIdx].attributes.push({ key: '', value: '' });
    setVariants(copy);
  };

  const updateAttribute = (varIdx: number, attrIdx: number, keyOrValue: 'key' | 'value', val: string) => {
    const copy = [...variants];
    copy[varIdx].attributes[attrIdx][keyOrValue] = val;
    setVariants(copy);
  };

  const removeAttribute = (varIdx: number, attrIdx: number) => {
    const copy = [...variants];
    copy[varIdx].attributes.splice(attrIdx, 1);
    setVariants(copy);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.basePrice) {
      return toast.error('Name, category, and base price are required.');
    }
    if (Number(form.basePrice) <= 0) {
      return toast.error('Base price must be positive.');
    }
    
    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      if (!variants[i].sku) return toast.error(`Variant ${i + 1} requires a SKU.`);
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name,
        description: form.description,
        category: form.category,
        basePrice: Number(form.basePrice),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        images: images,
        status: form.status,
        isFeatured: form.isFeatured,
        isSpecialOffer: form.isSpecialOffer,
        variants: variants.map((v) => {
          const attrObj: Record<string, string> = {};
          v.attributes.forEach((a) => {
            if (a.key && a.value) attrObj[a.key] = a.value;
          });

          return {
            ...(v._id && { _id: v._id }),
            name: v.name,
            sku: v.sku,
            price: v.price ? Number(v.price) : Number(form.discountPrice || form.basePrice),
            stock: Number(v.stock),
            attributes: Object.keys(attrObj).length > 0 ? attrObj : undefined,
          };
        }),
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
    <section className="mx-auto max-w-5xl pb-12">
      <Breadcrumbs items={[{ label: 'Products', href: '/products' }, { label: id ? 'Edit product' : 'New product' }]} />
      <PageHeader
        eyebrow="Catalog"
        title={id ? 'Edit product' : 'Create product'}
        description="Keep pricing, imagery and variants accurate for the storefront."
      />

      <form onSubmit={submit}>
        
        {/* BASIC INFO */}
        <SectionCard title="Basic Information" description="Primary details for the product page.">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Product Name *
              <input value={form.name} onChange={(e) => setF('name', e.target.value)} required className="min-h-11 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-primary" placeholder="E.g. Premium Cotton T-Shirt" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              URL Slug
              <input value={form.slug} onChange={(e) => setF('slug', e.target.value)} className="min-h-11 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-primary" placeholder="premium-cotton-tshirt" />
            </label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">
              Category *
              <select value={form.category} onChange={(e) => setF('category', e.target.value)} required className="min-h-11 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-primary">
                <option value="">Select a category</option>
                {categories.map((c) => <option value={c._id} key={c._id}>{c.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">
              Description
              <textarea value={form.description} onChange={(e) => setF('description', e.target.value)} rows={5} className="w-full rounded-xl border border-border p-4 font-normal outline-none focus:border-primary" placeholder="Enter full product description..." />
            </label>
          </div>
        </SectionCard>

        {/* PRICING & VISIBILITY */}
        <SectionCard title="Pricing & Status" description="Control base pricing and visibility.">
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold">
              Base Price (৳) *
              <input type="number" value={form.basePrice} onChange={(e) => setF('basePrice', e.target.value)} required className="min-h-11 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-primary" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Discount Price (৳)
              <input type="number" value={form.discountPrice} onChange={(e) => setF('discountPrice', e.target.value)} className="min-h-11 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-primary" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Status
              <select value={form.status} onChange={(e) => setF('status', e.target.value)} className="min-h-11 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-primary">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <div className="flex gap-6 sm:col-span-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setF('isFeatured', e.target.checked)} className="h-5 w-5 rounded border-border text-primary focus:ring-primary" />
                Featured Product
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={form.isSpecialOffer} onChange={(e) => setF('isSpecialOffer', e.target.checked)} className="h-5 w-5 rounded border-border text-primary focus:ring-primary" />
                Special Offer
              </label>
            </div>
          </div>
        </SectionCard>

        {/* MEDIA GALLERY */}
        <SectionCard title="Media Gallery" description="Manage images for the product. The first image is the primary cover.">
          <div className="mb-4 flex gap-3">
            <input 
              value={newImageUrl} 
              onChange={(e) => setNewImageUrl(e.target.value)} 
              placeholder="Paste image URL (https://...)" 
              className="min-h-11 flex-1 rounded-xl border border-border px-4 text-sm outline-none focus:border-primary" 
              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addImage(); } }}
            />
            <button type="button" onClick={addImage} className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
              <Plus className="h-4 w-4" /> Add Image
            </button>
          </div>

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12">
              <ImageIcon className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-500">No images added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
              {images.map((img, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-slate-100">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  
                  {/* Overlays on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {i !== 0 && (
                      <button type="button" onClick={() => setPrimaryImage(i)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 hover:text-primary shadow-sm" title="Set as primary">
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button type="button" onClick={() => removeImage(i)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm" title="Remove image">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 rounded bg-primary px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* DYNAMIC VARIANTS */}
        <SectionCard title="Variants & Inventory" description="Add variations like sizes and colors, and track stock levels.">
          <div className="space-y-4">
            {variants.map((v, i) => (
              <div key={i} className="relative rounded-2xl border border-border bg-slate-50/50 p-5 transition-colors hover:border-slate-300">
                
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(i)} className="absolute right-4 top-4 text-slate-400 hover:text-rose-500">
                    <X className="h-5 w-5" />
                  </button>
                )}
                
                <h4 className="mb-4 text-sm font-bold text-slate-900">{v.name || `Variant ${i + 1}`}</h4>
                
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <label className="grid gap-2 text-xs font-bold text-slate-700">
                    Variant Name
                    <input value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} className="min-h-10 w-full rounded-lg border border-border px-3 font-normal outline-none focus:border-primary" placeholder="E.g. Large / Red" />
                  </label>
                  <label className="grid gap-2 text-xs font-bold text-slate-700">
                    SKU *
                    <input value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} required className="min-h-10 w-full rounded-lg border border-border px-3 font-normal outline-none focus:border-primary" placeholder="PROD-LRG-RED" />
                  </label>
                  <label className="grid gap-2 text-xs font-bold text-slate-700">
                    Price Override (৳)
                    <input type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="min-h-10 w-full rounded-lg border border-border px-3 font-normal outline-none focus:border-primary" placeholder="Leave empty for base" />
                  </label>
                  <label className="grid gap-2 text-xs font-bold text-slate-700">
                    Stock Amount
                    <input type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} className="min-h-10 w-full rounded-lg border border-border px-3 font-normal outline-none focus:border-primary" />
                  </label>
                </div>

                {/* Attributes Builder */}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Custom Attributes</span>
                    <button type="button" onClick={() => addAttribute(i)} className="text-xs font-bold text-primary hover:underline">
                      + Add Attribute
                    </button>
                  </div>
                  
                  {v.attributes.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {v.attributes.map((attr, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2 rounded-lg border border-border bg-white px-2 py-1 shadow-sm">
                          <input 
                            value={attr.key} onChange={(e) => updateAttribute(i, aIdx, 'key', e.target.value)} 
                            placeholder="Key (e.g. Size)" 
                            className="w-full min-w-0 bg-transparent text-xs font-bold outline-none placeholder:font-normal" 
                          />
                          <span className="text-border">:</span>
                          <input 
                            value={attr.value} onChange={(e) => updateAttribute(i, aIdx, 'value', e.target.value)} 
                            placeholder="Value" 
                            className="w-full min-w-0 bg-transparent text-xs outline-none" 
                          />
                          <button type="button" onClick={() => removeAttribute(i, aIdx)} className="text-slate-400 hover:text-rose-500">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No custom attributes. E.g. add Size: Large</p>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addVariant} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">
              <Plus className="h-4 w-4" /> Add Another Variant
            </button>
          </div>
        </SectionCard>

        {/* FORM ACTIONS */}
        <div className="sticky bottom-6 z-10 mt-8 flex items-center justify-between rounded-2xl border border-border bg-white/80 px-6 py-4 shadow-lg backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-500">
            {id ? 'Editing existing product' : 'Creating new product'}
          </p>
          <div className="flex gap-4">
            <button type="button" onClick={() => router.back()} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm">
              <Check className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>

      </form>
    </section>
  );
}
