const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export type AuthUser = {id: string; firstName: string; lastName: string; email: string; phone?: string; role: string; isActive: boolean; isEmailVerified: boolean; createdAt?: string};
export type CatalogVariant = { _id: string; sku: string; name: string; size?: string; color?: string; price: number; stock: number | null };
export type CatalogProduct = { _id: string; name: string; slug: string; shortDescription?: string; description?: string; basePrice: number; images: string[]; category: { _id: string; name: string; slug: string }; variants: CatalogVariant[]; isFeatured?: boolean };
export type CatalogCategory = {_id: string; name: string; slug: string; image?: string};
class ApiError extends Error { status: number; code?: string; constructor(message: string, status: number, code?: string) { super(message); this.status = status; this.code = code; } }
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {...options, credentials: 'include', headers: {'Content-Type': 'application/json', ...(options.headers || {})}});
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body?.error?.message || 'Request failed.', response.status, body?.error?.code);
  return body as T;
}
export const catalogService = {
  products: async (params: Record<string, string | number | undefined> = {}) => {const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])); return request<{success: boolean; data: CatalogProduct[]; pagination: {page: number; limit: number; total: number; pages: number}}>(`/products?${query}`);},
  product: async (id: string) => request<{success: boolean; data: CatalogProduct}>(`/products/${encodeURIComponent(id)}`),
  categories: async () => request<{success: boolean; data: CatalogCategory[]}>('/categories'),
};
export type ServerCart = {id: string; items: Array<{id: string; productId: string; variantId?: string; quantity: number; price: number; name: string; image?: string; sku?: string}>; subtotal: number; total: number; currency: string};
export const cartService = {
  get: async () => request<{success: boolean; data: ServerCart}>('/cart'),
  add: async (productId: string, quantity: number, variantId?: string) => request<{success: boolean; data: ServerCart}>('/cart/add', {method: 'POST', body: JSON.stringify({productId, quantity, variantId})}),
  update: async (productId: string, quantity: number, variantId?: string) => request<{success: boolean; data: ServerCart}>('/cart/update', {method: 'PUT', body: JSON.stringify({productId, quantity, variantId})}),
  remove: async (productId: string, variantId?: string) => request<{success: boolean; data: ServerCart}>('/cart/remove', {method: 'DELETE', body: JSON.stringify({productId, variantId})}),
};
export type CustomerAddress = { _id: string; type: string; label: string; recipientName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state?: string; postalCode: string; country: string; isDefault: boolean };
export const addressService = { list: async () => request<{success: boolean; data: CustomerAddress[]}>('/addresses'), create: async (payload: Omit<CustomerAddress, '_id' | 'isDefault'> & {isDefault?: boolean}) => request<{success: boolean; data: CustomerAddress}>('/addresses', {method: 'POST', body: JSON.stringify(payload)}) };
export const shippingService = { quote: async (city: string) => request<{success: boolean; data: {city: string; cost: number; currency: string}}>(`/shipping/quote?city=${encodeURIComponent(city)}`) };

export type AuthPayload = {name?: string; email: string; password: string};
export type CheckoutPayload = {name: string; email: string; phone: string; address: string; city: string; postal: string; payment: string; txid: string; items: unknown[]; shippingCost?: number};

async function mockRequest<T>(result: T): Promise<T> {
  await wait(1000);
  return result;
}

export const authService = {
  login: async (payload: AuthPayload) => request<{success: boolean; user: AuthUser}>('/auth/login', {method: 'POST', body: JSON.stringify({email: payload.email, password: payload.password})}),
  register: async (payload: AuthPayload) => request<{success: boolean; user: AuthUser}>('/auth/register', {method: 'POST', body: JSON.stringify({name: payload.name, email: payload.email, password: payload.password})}),
  me: async () => request<{success: boolean; user: AuthUser}>('/auth/me'),
  refresh: async () => request<{success: boolean; user: AuthUser}>('/auth/refresh', {method: 'POST'}),
  forgotPassword: async (email: string) => request<{success: boolean}>('/auth/forgot-password', {method: 'POST', body: JSON.stringify({email})}),
  resetPassword: async (password: string, token: string) => request<{success: boolean}>('/auth/reset-password', {method: 'POST', body: JSON.stringify({password, token})}),
  changePassword: async (currentPassword: string, newPassword: string) => request<{success: boolean}>('/auth/change-password', {method: 'POST', body: JSON.stringify({currentPassword, newPassword})}),
  logout: async () => request<{success: boolean}>('/auth/logout', {method: 'POST'})
};

export const accountService = {
  updateProfile: async (payload: {firstName: string; lastName: string; phone: string}) => mockRequest({message: 'profile_updated', payload}),
  listOrders: async () => mockRequest([
    {id: 'RC-2409-1842', date: '09 Sep 2026', status: 'Delivered', total: 158, items: 2},
    {id: 'RC-2408-0931', date: '27 Aug 2026', status: 'Shipped', total: 94, items: 1},
    {id: 'RC-2407-7710', date: '14 Jul 2026', status: 'Processing', total: 136, items: 3}
  ]),
  saveAddress: async (payload: {label: string; line: string; city: string; postal: string}) => mockRequest({message: 'address_saved', payload}),
  deleteAddress: async (id: string) => mockRequest({message: 'address_deleted', id})
};

export const orderService = {
  create: async (payload: CheckoutPayload) => mockRequest({message: 'order_created', orderId: `RC-${Date.now().toString().slice(-8)}`, payload})
};
