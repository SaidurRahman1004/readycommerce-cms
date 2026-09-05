import OrderDetailClient from './order-detail-client';
import RefundActions from './refund-actions';
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <><OrderDetailClient id={id} /><RefundActions id={id} /></>; }
