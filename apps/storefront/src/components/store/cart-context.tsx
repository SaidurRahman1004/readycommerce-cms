'use client';

import {createContext, useContext, useMemo, useState} from 'react';
import {catalog} from './catalog';

export type CartLine = {productId: string; quantity: number};
type CartContextValue = {items: CartLine[]; count: number; subtotal: number; isOpen: boolean; addItem: (productId?: string, quantity?: number) => void; updateQuantity: (productId: string, quantity: number) => void; removeItem: (productId: string) => void; clearCart: () => void; openCart: () => void; closeCart: () => void};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({children}: {children: React.ReactNode}) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const addItem = (productId = 'noir-07', quantity = 1) => setItems((current) => { const existing = current.find((item) => item.productId === productId); return existing ? current.map((item) => item.productId === productId ? {...item, quantity: item.quantity + quantity} : item) : [...current, {productId, quantity}]; });
  const updateQuantity = (productId: string, quantity: number) => setItems((current) => quantity > 0 ? current.map((item) => item.productId === productId ? {...item, quantity} : item) : current.filter((item) => item.productId !== productId));
  const removeItem = (productId: string) => setItems((current) => current.filter((item) => item.productId !== productId));
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (catalog.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0);
  const value = useMemo(() => ({items, count, subtotal, isOpen, addItem, updateQuantity, removeItem, clearCart: () => setItems([]), openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false)}), [items, count, subtotal, isOpen]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
