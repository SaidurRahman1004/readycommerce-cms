const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const Product = require('./models/Product');
const ProductVariant = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');

dotenv.config();
const categories = [
  { name: 'Perfume', slug: 'perfume', sortOrder: 1, description: 'Signature scents for everyday rituals.' },
  { name: 'Skincare', slug: 'skincare', sortOrder: 2, description: 'Refined formulas for luminous skin.' },
  { name: 'Home Rituals', slug: 'home-rituals', sortOrder: 3, description: 'Objects that make a room feel like yours.' },
];
const products = [
  { name: 'Noir 07 Eau de Parfum', slug: 'noir-07-eau-de-parfum', category: 'perfume', basePrice: 6800, description: 'Smoked cedar, warm amber and soft skin musk.', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=88', size: ['30ml', '50ml', '100ml'] },
  { name: 'Santal 33 Candle', slug: 'santal-33-candle', category: 'home-rituals', basePrice: 3200, description: 'A slow-burning ritual with creamy sandalwood and spice.', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=88', size: ['180g', '300g'] },
  { name: 'Botanical Glow Serum', slug: 'botanical-glow-serum', category: 'skincare', basePrice: 4200, description: 'A botanical serum for a rested-looking glow.', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=88', size: ['30ml', '50ml'] },
  { name: 'Amber Dusk Extrait', slug: 'amber-dusk-extrait', category: 'perfume', basePrice: 8600, description: 'Saffron and golden woods with a rich, lingering finish.', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=88', size: ['50ml', '100ml'] },
  { name: 'Cloud Veil Cream', slug: 'cloud-veil-cream', category: 'skincare', basePrice: 3600, description: 'A plush daily cream for calm, nourished skin.', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=88', size: ['50ml', '100ml'] },
  { name: 'Muse Body Veil', slug: 'muse-body-veil', category: 'skincare', basePrice: 2900, description: 'Silky hydration with a soft floral finish.', image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1200&q=88', size: ['100ml', '200ml'] },
];

const seed = async () => {
  await connectDB();
  const categoryDocs = {}; for (const category of categories) categoryDocs[category.slug] = await Category.findOneAndUpdate({ slug: category.slug }, { ...category, isActive: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
  for (const item of products) {
    const product = await Product.findOneAndUpdate({ slug: item.slug }, { name: item.name, slug: item.slug, category: categoryDocs[item.category]._id, basePrice: item.basePrice, currency: 'BDT', description: item.description, shortDescription: item.description, images: [item.image], status: 'active', isFeatured: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
    for (const size of item.size) { const sku = `${item.slug.toUpperCase().replace(/-/g, '_')}_${size.toUpperCase()}`; const variant = await ProductVariant.findOneAndUpdate({ sku }, { product: product._id, sku, name: size, size, price: item.basePrice, isActive: true }, { upsert: true, new: true, setDefaultsOnInsert: true }); await Inventory.findOneAndUpdate({ variant: variant._id }, { variant: variant._id, quantity: 24, reservedQuantity: 0, trackInventory: true }, { upsert: true, new: true, setDefaultsOnInsert: true }); }
  }
  console.log(`Catalog seed complete: ${products.length} products, ${categories.length} categories.`);
  process.exitCode = 0;
};
seed().catch((error) => { console.error(`Catalog seed failed: ${error.message}`); process.exitCode = 1; });
