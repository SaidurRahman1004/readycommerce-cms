export const catalog = [
  {id: 'noir-07', key: 'noir', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=88', price: 86, category: 'perfume', scent: 'woody', color: 'amber'},
  {id: 'santal-33', key: 'santal', image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=88', price: 72, category: 'boutique', scent: 'woody', color: 'cream'},
  {id: 'botanical-glow', key: 'serum', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=88', price: 48, category: 'skincare', scent: 'fresh', color: 'green'},
  {id: 'muse-veil', key: 'muse', image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=88', price: 64, category: 'wellness', scent: 'floral', color: 'rose'},
  {id: 'amber-dusk', key: 'amber', image: 'https://images.unsplash.com/photo-1610461888750-10bfc601b8a3?auto=format&fit=crop&w=900&q=88', price: 94, category: 'perfume', scent: 'spicy', color: 'amber'},
  {id: 'cloud-cream', key: 'cloud', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=88', price: 42, category: 'skincare', scent: 'fresh', color: 'cream'}
];

export type CatalogProduct = (typeof catalog)[number];
