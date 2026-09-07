'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Users, ShoppingBag, ArrowRight, Settings } from 'lucide-react';
import { adminService } from '../../services/api-service';

type ResultItem = { id: string; title: string; subtitle: string; image?: string };
type GlobalResults = { users: ResultItem[]; orders: ResultItem[]; products: ResultItem[] };

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      adminService.globalSearch(query)
        .then(res => setResults(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Flatten results for keyboard navigation
  const flatItems = (() => {
    const arr: { type: string; item: ResultItem }[] = [];
    if (!results) return arr;
    results.orders.forEach(o => arr.push({ type: 'order', item: o }));
    results.products.forEach(p => arr.push({ type: 'product', item: p }));
    results.users.forEach(u => arr.push({ type: 'user', item: u }));
    return arr;
  })();

  // Reset selection when items change
  useEffect(() => { setSelectedIndex(0); }, [flatItems.length, results === null]);

  const handleNavigate = (type: string, id: string) => {
    setIsOpen(false);
    if (type === 'order') router.push(`/orders/${id}`);
    else if (type === 'product') router.push(`/products/${id}`);
    else if (type === 'user') router.push(`/customers/${id}`);
    else if (type === 'link') router.push(id);
  };

  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const totalItems = flatItems.length || defaultLinks.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems.length > 0) {
          const selected = flatItems[selectedIndex];
          if (selected) handleNavigate(selected.type, selected.item.id);
        } else {
          const selected = defaultLinks[selectedIndex];
          if (selected) handleNavigate('link', selected.href);
        }
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, flatItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-slate-100 px-4 py-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent px-4 text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Search orders, products, or customers..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-400 ml-2">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {!results && query.length < 2 ? (
            <div className="px-2">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Actions</div>
              {defaultLinks.map((link, idx) => (
                <button
                  key={link.href}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${idx === selectedIndex ? 'bg-primary/5 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => handleNavigate('link', link.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                    <link.icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{link.label}</span>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-40" />
                </button>
              ))}
            </div>
          ) : results && flatItems.length === 0 ? (
            <div className="py-14 text-center text-slate-500">
              No results found for "<span className="text-slate-900 font-medium">{query}</span>"
            </div>
          ) : (
            <div className="px-2">
              {results?.orders.length ? (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</div>
                  {results.orders.map((o) => {
                    const idx = flatItems.findIndex(x => x.item.id === o.id);
                    return <ResultRow key={o.id} item={o} icon={ShoppingBag} isSelected={idx === selectedIndex} onSelect={() => handleNavigate('order', o.id)} onHover={() => setSelectedIndex(idx)} />;
                  })}
                </div>
              ) : null}
              
              {results?.products.length ? (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</div>
                  {results.products.map((p) => {
                    const idx = flatItems.findIndex(x => x.item.id === p.id);
                    return <ResultRow key={p.id} item={p} isSelected={idx === selectedIndex} onSelect={() => handleNavigate('product', p.id)} onHover={() => setSelectedIndex(idx)} />;
                  })}
                </div>
              ) : null}

              {results?.users.length ? (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customers</div>
                  {results.users.map((u) => {
                    const idx = flatItems.findIndex(x => x.item.id === u.id);
                    return <ResultRow key={u.id} item={u} icon={Users} isSelected={idx === selectedIndex} onSelect={() => handleNavigate('user', u.id)} onHover={() => setSelectedIndex(idx)} />;
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({ item, icon: Icon, isSelected, onSelect, onHover }: { item: ResultItem, icon?: any, isSelected: boolean, onSelect: () => void, onHover: () => void }) {
  return (
    <button
      className={`w-full flex items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors ${isSelected ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50'}`}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      {item.image ? (
        <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover bg-slate-100" />
      ) : Icon ? (
        <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
          <Icon className="h-5 w-5" />
        </div>
      ) : (
        <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
          <FileText className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <p className={`font-semibold truncate ${isSelected ? 'text-primary' : 'text-slate-900'}`}>{item.title}</p>
        <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
      </div>
    </button>
  );
}

const defaultLinks = [
  { href: '/orders', label: 'View all orders', icon: ShoppingBag },
  { href: '/products', label: 'Manage product catalog', icon: FileText },
  { href: '/customers', label: 'View customers directory', icon: Users },
  { href: '/settings', label: 'Store settings', icon: Settings },
];
