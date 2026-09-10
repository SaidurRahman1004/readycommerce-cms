'use client';
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, ImagePlus, Trash2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { adminMediaService, type AdminMedia } from '../../services/api-service';
import { Breadcrumbs, PageHeader } from '../../components/ui/page-header';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/primitives';

const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function MediaLibrary() {
  const [items, setItems] = useState<AdminMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    adminMediaService.list()
      .then(r => setItems(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: File[]) => {
    const valid = files.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 10 * 1024 * 1024);
    if (valid.length !== files.length) {
      toast.error('Only JPEG, PNG or WebP images up to 10MB are allowed.');
    }
    if (!valid.length) return;

    setUploading(true);
    setProgress(0);

    try {
      const r = await adminMediaService.upload(valid, (p) => setProgress(p));
      
      // Artificial slight delay so progress bar hitting 100% is visible before disappearing
      if (progress >= 100) {
         await new Promise(res => setTimeout(res, 500));
      }

      setItems(current => [...r.data, ...current]);
      toast.success(`${r.data.length} image${r.data.length === 1 ? '' : 's'} uploaded and optimized.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied.');
    } catch {
      toast.error('Could not copy URL.');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this asset permanently?')) return;
    try {
      await adminMediaService.remove(id);
      setItems(current => current.filter(item => item._id !== id));
      toast.success('Asset deleted.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete asset.');
    }
  };

  return (
    <section className="mx-auto max-w-7xl">
      <Breadcrumbs items={[{ label: 'Media Library' }]} />
      <PageHeader 
        eyebrow="Content operations" 
        title="Media library" 
        description="Upload and reuse optimized image assets across your storefront and CMS." 
      />
      
      <div 
        onDragOver={e => { e.preventDefault(); setDragging(true); }} 
        onDragLeave={() => setDragging(false)} 
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          void upload(Array.from(e.dataTransfer.files));
        }} 
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-10 ${
          dragging ? 'border-primary bg-primary/5' : 'border-border bg-white/70'
        }`}
      >
        <input 
          ref={input} 
          type="file" 
          accept="image/jpeg,image/png,image/webp" 
          multiple 
          className="hidden" 
          onChange={e => {
            if (e.target.files) void upload(Array.from(e.target.files));
            e.target.value = '';
          }} 
        />
        
        {uploading ? (
           <div className="mx-auto max-w-xs">
             <div className="mb-2 flex items-center justify-between text-sm font-bold">
               <span>Uploading and optimizing...</span>
               <span className="text-primary">{progress}%</span>
             </div>
             <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
               <div 
                 className="h-full bg-primary transition-all duration-300 ease-out" 
                 style={{ width: `${progress}%` }} 
               />
             </div>
             {progress === 100 && (
               <p className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 animate-pulse">
                 <CheckCircle2 className="h-4 w-4" /> Finalizing optimization...
               </p>
             )}
           </div>
        ) : (
          <>
            <UploadCloud className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-3 font-bold">Drop images here</h2>
            <p className="mt-1 text-sm text-slate-500">JPEG, PNG or WebP · maximum 10MB each (auto-optimized)</p>
            <button 
              onClick={() => input.current?.click()} 
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              <ImagePlus className="h-4 w-4" /> Choose images
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map(x => <Skeleton key={x} className="aspect-square" />)}
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState title="Media could not be loaded." retry={load} />
        </div>
      ) : !items.length ? (
        <div className="mt-6">
          <EmptyState title="Your library is empty." description="Upload your first image asset above." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map(item => (
            <article key={item._id} className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:shadow-md">
              <div className="aspect-square overflow-hidden bg-muted relative">
                <img 
                  src={item.url} 
                  alt={item.filename} 
                  loading="lazy" 
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" 
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-md">
                  WEBP
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-bold" title={item.filename}>{item.filename}</p>
                <p className="mt-1 text-[11px] text-slate-500">{formatSize(item.size)}</p>
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={() => void copy(item.url)} 
                    className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-border text-[11px] font-bold hover:border-primary hover:text-primary transition-colors bg-slate-50 hover:bg-white"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                  <button 
                    onClick={() => void remove(item._id)} 
                    aria-label={`Delete ${item.filename}`} 
                    className="rounded-lg border border-rose-200 px-2 text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
