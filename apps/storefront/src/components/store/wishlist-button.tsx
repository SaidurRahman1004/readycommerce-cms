'use client';

import {useWishlist} from './wishlist-store';

export default function WishlistButton({productId, className = ''}: {productId: string, className?: string}) {
  const {hasItem, toggleItem} = useWishlist();
  const active = hasItem(productId);
  
  return (
    <button 
      type="button" 
      onClick={(e) => {e.preventDefault(); e.stopPropagation(); toggleItem(productId);}}
      className={`flex items-center justify-center transition-all ${className} ${active ? 'text-rose-500 hover:text-rose-600' : 'text-slate-400 hover:text-rose-500'}`}
      aria-label="Toggle Wishlist"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
