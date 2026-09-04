import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {useState, useEffect} from 'react';

type WishlistStore = {
  items: string[];
  toggleItem: (id: string) => void;
  hasItem: (id: string) => boolean;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (id) => set((state) => ({
        items: state.items.includes(id) ? state.items.filter(i => i !== id) : [...state.items, id]
      })),
      hasItem: (id) => get().items.includes(id)
    }),
    {name: 'rc_wishlist'}
  )
);

export function useWishlist() {
  const store = useWishlistStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  
  return {
    ...store,
    items: hydrated ? store.items : [],
    hasItem: (id: string) => hydrated ? store.hasItem(id) : false
  };
}
