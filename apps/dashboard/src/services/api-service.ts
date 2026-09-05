const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export type AuthUser = {id: string; firstName: string; lastName: string; email: string; phone?: string; role: string; isActive: boolean; isEmailVerified: boolean; createdAt?: string};
export type CatalogVariant = { _id: string; sku: string; name: string; size?: string; color?: string; price: number; stock: number | null };
export type CatalogProduct = { _id: string; name: string; slug: string; shortDescription?: string; description?: string; basePrice: number; discountPrice?: number; images: string[]; category: { _id: string; name: string; slug: string }; variants: CatalogVariant[]; isFeatured?: boolean; isSpecialOffer?: boolean };
export type CatalogCategory = {_id: string; name: string; slug: string; image?: string};
class ApiError extends Error { status: number; code?: string; constructor(message: string, status: number, code?: string) { super(message); this.status = status; this.code = code; } }
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {...options, credentials: 'include', headers: {'Content-Type': 'application/json', ...(options.headers || {})}});
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body?.error?.message || 'Request failed.', response.status, body?.error?.code);
  return body as T;
}
export const catalogService = {
  products: async (params: Record<string, string | number | boolean | undefined> = {}) => {const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])); return request<{success: boolean; data: CatalogProduct[]; pagination: {page: number; limit: number; total: number; pages: number}}>(`/products?${query}`);},
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
export const couponService = { validate: async (code: string, orderAmount: number) => request<{success: boolean; data: {code: string; discount: number; discountType: string; discountValue: number}}>('/coupons/validate', {method: 'POST', body: JSON.stringify({code, orderAmount})}) };

export type AuthPayload = {name?: string; email: string; password: string};
export type CheckoutPayload = {addressId: string; paymentMethod: 'bkash' | 'nagad'; txid: string; couponCode?: string};

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

export const orderService = {
  create: async (payload: CheckoutPayload) => request<{success: boolean; data: {orderId: string; orderNumber: string; total: number; status: string}}>('/orders', {method: 'POST', body: JSON.stringify(payload)}),
  myOrders: async () => request<{success: boolean; data: CustomerOrder[]}>('/orders/myorders'),
  cancel: async (id: string) => request<{success: boolean; data: {orderId: string; status: string}}>(`/orders/${encodeURIComponent(id)}/cancel`, {method: 'PUT'})
  ,details: async (id: string) => request<{success: boolean; data: CustomerOrder & {shippingAddress: {recipientName: string; phone: string; addressLine1: string; city: string; postalCode: string}; items: Array<{productName: string; quantity: number; unitPrice: number; total: number}>}}>(`/orders/${encodeURIComponent(id)}`)
};
export type CustomerOrder = { _id: string; orderNumber: string; status: string; paymentStatus: string; subtotal: number; shipping: number; total: number; createdAt: string };
export const userService = { profile: async () => request<{success: boolean; user: AuthUser}>('/users/profile'), updateProfile: async (payload: {firstName: string; lastName: string; phone: string}) => request<{success: boolean; user: AuthUser}>('/users/profile', {method: 'PUT', body: JSON.stringify(payload)}) };
export type ProductReview = { _id: string; rating: number; title?: string; body: string; createdAt: string; user?: { firstName: string; lastName: string } };
export const reviewService = { list: async (productId: string) => request<{success: boolean; data: ProductReview[]}>(`/reviews/${encodeURIComponent(productId)}`), create: async (payload: {productId: string; rating: number; title?: string; body: string}) => request<{success: boolean; data: ProductReview}>('/reviews', {method: 'POST', body: JSON.stringify(payload)}) };
export type AdminOverview = { range: number; orders: { total: number; byStatus: Record<string, number> }; revenue: { total: number; today: number; period: number; trend: Array<{ date: string; amount: number; orders: number }> }; customers: { total: number; newInPeriod: number }; products: { total: number; active: number; lowStock: number; outOfStock: number }; payments: { byStatus: Record<string, number> }; recentOrders: Array<{ _id: string; orderNumber?: string; customerName: string; amount: number; status: string; paymentStatus: string; createdAt: string }>; lowStock: Array<{ _id: string; product: string; sku?: string; stock: number; threshold: number; status: string }> };
export const adminService = { overview: (range: 7 | 30 = 7) => request<{success: boolean; data: AdminOverview}>(`/admin/overview?range=${range}`) };
export type AdminOrder = { _id: string; orderNumber?: string; customer: { name: string; email?: string }; amount: number; status: string; paymentStatus: string; createdAt: string };
export type AdminOrderDetail = AdminOrder & { shippingAddress: { recipientName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state?: string; postalCode: string; country: string }; billingAddress?: AdminOrderDetail['shippingAddress']; subtotal: number; discount: number; shipping: number; tax: number; total: number; currency: string; shippingMethod?: string; trackingNumber?: string; carrier?: string; placedAt?: string; items: Array<{ productName: string; sku?: string; quantity: number; unitPrice: number; discount: number; total: number; variant?: { name?: string; size?: string; color?: string; scent?: string; sku?: string } }>; payments: Array<{ provider: string; method?: string; amount: number; currency: string; transactionId?: string; status: string; failureReason?: string; verifiedAt?: string; createdAt: string }> };
export const adminOrderService = { list: (params: Record<string, string | number | undefined> = {}) => { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])); return request<{ success: boolean; data: AdminOrder[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/admin/orders?${query}`); }, detail: (id: string) => request<{ success: boolean; data: AdminOrderDetail }>(`/admin/orders/${encodeURIComponent(id)}`), status: (id: string, status: string) => request<{ success: boolean; data: { orderId: string; status: string } }>(`/admin/orders/${encodeURIComponent(id)}/status`, { method: 'PUT', body: JSON.stringify({ status }) }), payment: (id: string, status: string, failureReason?: string) => request<{ success: boolean; data: { orderId: string; paymentStatus: string } }>(`/admin/orders/${encodeURIComponent(id)}/payment`, { method: 'PUT', body: JSON.stringify({ status, failureReason }) }) };
