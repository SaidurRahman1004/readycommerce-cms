import InvoiceClient from '@/components/account/invoice-client';
export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) { return <InvoiceClient params={params} />; }
