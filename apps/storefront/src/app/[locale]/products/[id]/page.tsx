import ProductDetail from '@/components/store/product-detail';

export default async function ProductPage({params}: {params: Promise<{id: string}>}) { return <ProductDetail productId={(await params).id} />; }
