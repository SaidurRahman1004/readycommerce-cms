'use client';

import {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';

export type CartLine = {productId: string; quantity: number; price?: number; name?: string; image?: string};
type CartContextValue = {items: CartLine[]; count: number; subtotal: number; wishlist: string[]; isOpen: boolean; addItem: (productId?: string, quantity?: number, product?: {price: number; name: string; image: string}) => void; updateQuantity: (productId: string, quantity: number) => void; removeItem: (productId: string) => void; clearCart: () => void; toggleWishlist: (productId: string) => void; isWishlisted: (productId: string) => boolean; openCart: () => void; closeCart: () => void};
const CartContext = createContext<CartContextValue | null>(null);
const readCart = (raw: string | null): CartLine[] => { try { const parsed: unknown = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed.filter((item): item is CartLine => Boolean(item) && typeof item === 'object' && typeof (item as CartLine).productId === 'string' && Number.isInteger((item as CartLine).quantity) && (item as CartLine).quantity > 0) : []; } catch { return []; } };
const readWishlist = (raw: string | null): string[] => { try { const parsed: unknown = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []; } catch { return []; } };

export function CartProvider({children}: {children: React.ReactNode}) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const hydrated = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { setItems(readCart(window.localStorage.getItem('readycommerce_cart'))); setWishlist(readWishlist(window.localStorage.getItem('readycommerce_wishlist'))); hydrated.current = true; }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (hydrated.current) window.localStorage.setItem('readycommerce_cart', JSON.stringify(items)); }, [items]);
  useEffect(() => { if (hydrated.current) window.localStorage.setItem('readycommerce_wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  const addItem = (productId = 'noir-07', quantity = 1, product?: {price: number; name: string; image: string}) => setItems((current) => { const existing = current.find((item) => item.productId === productId); return existing ? current.map((item) => item.productId === productId ? {...item, quantity: item.quantity + quantity, ...product} : item) : [...current, {productId, quantity, ...product}]; });
  const updateQuantity = (productId: string, quantity: number) => setItems((current) => quantity > 0 ? current.map((item) => item.productId === productId ? {...item, quantity} : item) : current.filter((item) => item.productId !== productId));
  const removeItem = (productId: string) => setItems((current) => current.filter((item) => item.productId !== productId));
  const toggleWishlist = (productId: string) => setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);
  const value = useMemo(() => ({items, count, subtotal, wishlist, isOpen, addItem, updateQuantity, removeItem, clearCart: () => setItems([]), toggleWishlist, isWishlisted: (productId: string) => wishlist.includes(productId), openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false)}), [items, count, subtotal, wishlist, isOpen]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
