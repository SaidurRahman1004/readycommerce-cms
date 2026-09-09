export const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : 'http://localhost:5000/api'
);
export type AuthUser = {id: string; firstName: string; lastName: string; email: string; phone?: string; role: string; isActive: boolean; isEmailVerified: boolean; createdAt?: string};
export type CatalogVariant = { _id: string; sku: string; name: string; size?: string; color?: string; price: number; stock: number | null };
export type CatalogProduct = { _id: string; name: string; slug: string; shortDescription?: string; description?: string; basePrice: number; discountPrice?: number; images: string[]; category: { _id: string; name: string; slug: string }; variants: CatalogVariant[]; specifications?: {name: string; value: string}[]; isFeatured?: boolean; isSpecialOffer?: boolean; ratingAverage?: number; reviewCount?: number };
export type CatalogCategory = {_id: string; name: string; slug: string; image?: string};
export type CustomerManual = { _id: string; title: string; slug: string; type: 'customer_guide'; content: string; relatedProducts: Array<{ _id: string; name: string; slug: string; images?: string[] }>; status: 'active' | 'draft'; updatedAt: string };
class ApiError extends Error { status: number; code?: string; constructor(message: string, status: number, code?: string) { super(message); this.status = status; this.code = code; } }
type ApiRequestInit = RequestInit & { next?: { revalidate?: number; tags?: string[] } };
async function request<T>(path: string, options: ApiRequestInit = {}): Promise<T> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const id = controller ? setTimeout(() => controller.abort(), 15000) : null;
  const externalSignal = options.signal;
  const abortFromCaller = () => controller?.abort();
  externalSignal?.addEventListener('abort', abortFromCaller, { once: true });
  const config = controller ? { ...options, signal: controller.signal } : options;

  try {
    const response = await fetch(`${getApiUrl()}${path}`, { ...config, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    if (id) clearTimeout(id);

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
      }
      throw new ApiError(body?.error?.message || body?.message || 'Request failed.', response.status, body?.error?.code);
    }
    return body as T;
  } catch (error: unknown) {
    if (id) clearTimeout(id);
    const errorName = error instanceof Error ? error.name : '';
    if (errorName === 'AbortError') {
      throw new ApiError(
        externalSignal?.aborted ? 'Request cancelled.' : 'Network connection timed out. Please check your internet.',
        externalSignal?.aborted ? 499 : 408,
        externalSignal?.aborted ? 'ABORTED' : 'TIMEOUT'
      );
    }
    if (!(error instanceof ApiError)) {
      throw new ApiError('Network error. Please try again.', 500, 'NETWORK_ERROR');
    }
    throw error;
  } finally {
    if (id) clearTimeout(id);
    externalSignal?.removeEventListener('abort', abortFromCaller);
  }
}
export const catalogService = {
  products: async (params: Record<string, string | number | boolean | undefined> = {}, options?: ApiRequestInit) => {const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])); return request<{success: boolean; data: CatalogProduct[]; pagination: {page: number; limit: number; total: number; pages: number}}>(`/products?${query}`, options);},
  product: async (id: string, options?: ApiRequestInit) => request<{success: boolean; data: CatalogProduct}>(`/products/${encodeURIComponent(id)}`, options),
  relatedProducts: async (id: string) => request<{success: boolean; data: CatalogProduct[]}>(`/products/${encodeURIComponent(id)}/related`),
  categories: async (options?: ApiRequestInit) => request<{success: boolean; data: CatalogCategory[]}>('/categories', options),
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
export type WishlistResponse = {productId: string; addedAt?: string};
export const wishlistService = {
  get: async () => request<{success: boolean; data: {items: WishlistResponse[]}}>('/wishlist'),
  toggle: async (productId: string) => request<{success: boolean; data: {items: WishlistResponse[]; productId: string; added: boolean}}>('/wishlist/toggle', {method: 'POST', body: JSON.stringify({productId})}),
  sync: async (productIds: string[]) => request<{success: boolean; data: {items: WishlistResponse[]}}>('/wishlist/sync', {method: 'POST', body: JSON.stringify({productIds})}),
};
export const manualService = { customerGuides: async () => request<{ success: boolean; data: CustomerManual[] }>('/manuals/customer-guides') };

export type AuthPayload = {name?: string; email: string; password: string};
export type CheckoutPayload = {addressId: string; paymentMethod: 'bkash' | 'nagad'; txid: string; couponCode?: string; idempotencyKey?: string};

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
  create: async (payload: CheckoutPayload) => request<{success: boolean; data: {orderId: string; orderNumber: string; total: number; status: string}}>('/orders', {method: 'POST', body: JSON.stringify(payload), headers: payload.idempotencyKey ? { 'x-idempotency-key': payload.idempotencyKey } : {}}),
  myOrders: async () => request<{success: boolean; data: CustomerOrder[]}>('/orders/myorders'),
  cancel: async (id: string) => request<{success: boolean; data: {orderId: string; status: string}}>(`/orders/${encodeURIComponent(id)}/cancel`, {method: 'PUT'})
  ,details: async (id: string) => request<{success: boolean; data: CustomerOrder & {shippingAddress: {recipientName: string; phone: string; addressLine1: string; city: string; postalCode: string}; items: Array<{productName: string; quantity: number; unitPrice: number; total: number}>}}>(`/orders/${encodeURIComponent(id)}`)
};
export type CustomerOrder = { _id: string; orderNumber: string; status: string; paymentStatus: string; subtotal: number; shipping: number; total: number; createdAt: string };
export const userService = { profile: async () => request<{success: boolean; user: AuthUser}>('/users/profile'), updateProfile: async (payload: {firstName: string; lastName: string; phone: string}) => request<{success: boolean; user: AuthUser}>('/users/profile', {method: 'PUT', body: JSON.stringify(payload)}) };
export type ProductReview = { _id: string; rating: number; title?: string; body: string; createdAt: string; isVerifiedPurchase?: boolean; user?: { firstName: string; lastName: string } };
export const reviewService = { list: async (productId: string) => request<{success: boolean; data: ProductReview[]}>(`/reviews/${encodeURIComponent(productId)}`), create: async (payload: {productId: string; rating: number; title?: string; body: string}) => request<{success: boolean; data: ProductReview}>('/reviews', {method: 'POST', body: JSON.stringify(payload)}) };
export type RestockLeadPayload = { email: string; productId: string; variantId?: string | null };
export type RestockLeadResponse = { success: boolean; message: string; alreadySubscribed?: boolean; data?: unknown };
export const leadService = {
  notifyRestock: async (payload: RestockLeadPayload) =>
    request<RestockLeadResponse>('/leads/restock', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export type PublicCampaignData = {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
  configuredStatus: string;
  startsAt?: string;
  expiresAt?: string;
  serverTime: string;
  showCountdown: boolean;
  onExpiryAction: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  offerPrice: number;
  regularPrice: number;
  discountPercentage: number;
  ctaText: string;
  ctaSubtext: string;
  bannerImage: string;
  mobileBannerImage: string;
  galleryImages: string[];
  benefits: Array<{ icon: string; title: string; description: string }>;
  specifications: Array<{ name: string; value: string }>;
  product: {
    _id: string;
    name: string;
    slug: string;
    ratingAverage: number;
    reviewCount: number;
    category?: { name: string; slug: string };
    variants: Array<{ _id: string; sku: string; name: string; price: number; stock: number; size?: string; color?: string }>;
    inStock: boolean;
  };
  recommendedProducts?: CatalogProduct[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl?: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard: string;
  };
  isPreview?: boolean;
  expired?: boolean;
  action?: string;
  targetUrl?: string;
};

export const campaignService = {
  getBySlug: async (slug: string, options?: ApiRequestInit) =>
    request<{ success: boolean; data: PublicCampaignData }>(`/campaigns/${encodeURIComponent(slug)}`, options),
  getPreview: async (slug: string, token: string, options?: ApiRequestInit) =>
    request<{ success: boolean; data: PublicCampaignData }>(`/campaigns/${encodeURIComponent(slug)}/preview?token=${encodeURIComponent(token)}`, options),
  trackAction: async (slug: string, actionType: 'view' | 'cta_click' | 'add_to_cart' | 'checkout', metadata?: Record<string, unknown>) =>
    request<{ success: boolean }>(`/campaigns/${encodeURIComponent(slug)}/track`, {
      method: 'POST',
      body: JSON.stringify({ actionType, metadata }),
    }),
};
