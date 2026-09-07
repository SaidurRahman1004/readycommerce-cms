import { useState, useEffect } from 'react';
import { CatalogProduct } from '@/services/api-service';

const STORAGE_KEY = 'readycommerce_recently_viewed';
const MAX_ITEMS = 4;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to parse recently viewed items', err);
    }
  }, []);

  const addProduct = (product: CatalogProduct) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let items: CatalogProduct[] = stored ? JSON.parse(stored) : [];
      
      // Remove if it already exists
      items = items.filter((item) => item._id !== product._id);
      
      // Add to beginning
      items.unshift(product);
      
      // Keep only max items
      if (items.length > MAX_ITEMS) {
        items = items.slice(0, MAX_ITEMS);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setRecentlyViewed(items);
    } catch (err) {
      console.error('Failed to update recently viewed items', err);
    }
  };

  return { recentlyViewed, addProduct };
}
