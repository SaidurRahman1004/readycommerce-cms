const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
export type AuthUser = {id: string; firstName: string; lastName: string; email: string; phone?: string; role: string; isActive: boolean; isEmailVerified: boolean; createdAt?: string};
export type CatalogVariant = { _id: string; sku: string; name: string; size?: string; color?: string; price: number; stock: number | null };
export type CatalogProduct = { _id: string; name: string; slug: string; shortDescription?: string; description?: string; basePrice: number; discountPrice?: number; images: string[]; category: { _id: string; name: string; slug: string }; variants: CatalogVariant[]; isFeatured?: boolean; isSpecialOffer?: boolean };
export type CatalogCategory = {_id: string; name: string; slug: string; image?: string};
export type AdminManual = { _id: string; title: string; slug: string; type: 'staff_sop' | 'customer_guide'; content: string; relatedProducts: Array<{ _id: string; name: string; slug: string; images?: string[] }>; status: 'active' | 'draft'; createdAt: string; updatedAt: string };
class ApiError extends Error { status: number; code?: string; constructor(message: string, status: number, code?: string) { super(message); this.status = status; this.code = code; } }
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {...options, credentials: 'include', headers: isFormData ? (options.headers || {}) : {'Content-Type': 'application/json', ...(options.headers || {})}});
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body?.error?.message || 'Request failed.', response.status, body?.error?.code);
  return body as T;
}
export const catalogService = {
  products: async (params: Record<string, string | number | boolean | undefined> = {}) => {const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])); return request<{success: boolean; data: CatalogProduct[]; pagination: {page: number; limit: number; total: number; pages: number}}>(`/products?${query}`);},
  product: async (id: string) => request<{success: boolean; data: CatalogProduct}>(`/products/${encodeURIComponent(id)}`),
  categories: async () => request<{success: boolean; data: CatalogCategory[]}>('/categories'),
};
export const manualService = {
  list: async (params: { type?: AdminManual['type']; status?: AdminManual['status']; search?: string } = {}) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();
    return request<{ success: boolean; data: AdminManual[] }>(`/admin/manuals${query ? `?${query}` : ''}`);
  },
  get: async (id: string) => request<{ success: boolean; data: AdminManual }>(`/admin/manuals/${encodeURIComponent(id)}`),
  create: async (payload: Omit<AdminManual, '_id' | 'createdAt' | 'updatedAt' | 'relatedProducts'> & { relatedProducts: string[] }) =>
    request<{ success: boolean; data: AdminManual }>('/admin/manuals', { method: 'POST', body: JSON.stringify(payload) }),
  update: async (id: string, payload: Omit<AdminManual, '_id' | 'createdAt' | 'updatedAt' | 'relatedProducts'> & { relatedProducts: string[] }) =>
    request<{ success: boolean; data: AdminManual }>(`/admin/manuals/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: async (id: string) => request<{ success: boolean; message?: string }>(`/admin/manuals/${encodeURIComponent(id)}`, { method: 'DELETE' }),
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
export const shippingService = { quote: async (city: string) => request<{success: boolean; data: {city: string; cost: number; insideDhakaRate: number; outsideDhakaRate: number; currency: string}}>(`/settings/shipping?city=${encodeURIComponent(city)}`) };
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
export const adminService = { overview: (range: 7 | 30 = 7) => request<{success: boolean; data: AdminOverview}>(`/admin/overview?range=${range}`), globalSearch: (q: string) => request<{success: boolean; data: { users: Array<{ id: string; title: string; subtitle: string; }>; orders: Array<{ id: string; title: string; subtitle: string; }>; products: Array<{ id: string; title: string; subtitle: string; image?: string; }> }}>(`/admin/search?q=${encodeURIComponent(q)}`) };
export type AdminAnalytics = { range: string; summary: { revenue: number; orders: number; customers: number }; trend: Array<{ date: string; revenue: number; orders: number }>; topProducts: Array<{ _id?: string; product: string; quantity: number; revenue: number }>; categories: Array<{ _id?: string; category: string; quantity: number; revenue: number }>; customerGrowth: Array<{ date: string; customers: number }> };
export const analyticsService = { get: (range: '7' | '30' | 'all' = '30') => request<{ success: boolean; data: AdminAnalytics }>(`/admin/analytics?range=${range}`) };
export type AdminOrder = { _id: string; orderNumber?: string; customer: { name: string; email?: string }; amount: number; status: string; paymentStatus: string; createdAt: string };
export type AdminOrderDetail = AdminOrder & { shippingAddress: { recipientName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state?: string; postalCode: string; country: string }; billingAddress?: AdminOrderDetail['shippingAddress']; subtotal: number; discount: number; shipping: number; tax: number; total: number; currency: string; shippingMethod?: string; trackingNumber?: string; carrier?: string; placedAt?: string; items: Array<{ productName: string; sku?: string; quantity: number; unitPrice: number; discount: number; total: number; variant?: { name?: string; size?: string; color?: string; scent?: string; sku?: string } }>; payments: Array<{ provider: string; method?: string; amount: number; currency: string; transactionId?: string; status: string; failureReason?: string; verifiedAt?: string; createdAt: string }> };
export const adminOrderService = { list: (params: Record<string, string | number | undefined> = {}) => { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])); return request<{ success: boolean; data: AdminOrder[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/admin/orders?${query}`); }, detail: (id: string) => request<{ success: boolean; data: AdminOrderDetail }>(`/admin/orders/${encodeURIComponent(id)}`), status: (id: string, status: string) => request<{ success: boolean; data: { orderId: string; status: string } }>(`/admin/orders/${encodeURIComponent(id)}/status`, { method: 'PUT', body: JSON.stringify({ status }) }), bulkStatus: (orderIds: string[], status: string) => request<{ success: boolean; message: string }>('/admin/orders/bulk-status', { method: 'PUT', body: JSON.stringify({ orderIds, status }) }), payment: (id: string, status: string, failureReason?: string) => request<{ success: boolean; data: { orderId: string; paymentStatus: string } }>(`/admin/orders/${encodeURIComponent(id)}/payment`, { method: 'PUT', body: JSON.stringify({ status, failureReason }) }), refund: (id: string, action: 'request'|'approve'|'refund') => request<{success:boolean;data:{orderId:string;status:string;returnStatus?:string;paymentStatus:string}}>(`/admin/orders/${encodeURIComponent(id)}/refund`, {method:'PUT',body:JSON.stringify({action})}) };
export type AdminProduct = { _id: string; name: string; slug: string; category?: { name: string }; basePrice: number; discountPrice?: number; images: string[]; status: string; variants: Array<{ _id: string; sku: string; name: string; price: number; stock: number }> };
export type AdminInventory = { _id: string; variantId: string; product: string; image?: string; sku: string; variant: string; quantity: number; reservedQuantity: number; available: number; threshold: number; status: string };
export const adminCatalogService = { products: (params: Record<string, string | number | undefined> = {}) => { const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])); return request<{ success: boolean; data: AdminProduct[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/admin/products?${q}`); }, create: (payload: Record<string, unknown>) => request<{ success: boolean; data: AdminProduct }>('/admin/products', { method: 'POST', body: JSON.stringify(payload) }), update: (id: string, payload: Record<string, unknown>) => request<{ success: boolean; data: AdminProduct }>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }), archive: (id: string) => request<{ success: boolean }>('/admin/products/' + id, { method: 'DELETE' }), inventory: () => request<{ success: boolean; data: AdminInventory[] }>('/admin/inventory'), adjust: (id: string, quantity: number, lowStockThreshold?: number) => request<{ success: boolean; data: AdminInventory }>(`/admin/inventory/${id}`, { method: 'PUT', body: JSON.stringify({ quantity, lowStockThreshold }) }), bulkThreshold: (inventoryIds: string[], lowStockThreshold: number) => request<{ success: boolean; message: string }>('/admin/inventory/bulk-threshold', { method: 'PUT', body: JSON.stringify({ inventoryIds, lowStockThreshold }) }) };
export type AdminCategory = { _id: string; name: string; slug: string; description?: string; parent?: { name: string }; isActive: boolean; sortOrder: number };
export type AdminCustomer = { _id: string; name: string; firstName: string; lastName: string; email: string; phone?: string; isActive: boolean; isEmailVerified: boolean; createdAt: string; totalOrders: number; totalSpend: number };
export const adminDirectoryService = { categories: () => request<{success:boolean;data:AdminCategory[]}>('/admin/categories'), createCategory: (payload: Record<string,unknown>) => request<{success:boolean;data:AdminCategory}>('/admin/categories',{method:'POST',body:JSON.stringify(payload)}), updateCategory: (id:string,payload:Record<string,unknown>) => request<{success:boolean;data:AdminCategory}>(`/admin/categories/${id}`,{method:'PUT',body:JSON.stringify(payload)}), deleteCategory: (id:string) => request<{success:boolean}>(`/admin/categories/${id}`,{method:'DELETE'}), customers: () => request<{success:boolean;data:AdminCustomer[]}>('/admin/customers'), customer: (id:string) => request<{success:boolean;data:AdminCustomer & {addresses:Array<Record<string,string>>;orders:Array<{_id:string;orderNumber:string;status:string;paymentStatus:string;totalAmount:number;createdAt:string}>}}>(`/admin/customers/${id}`), customerStatus:(id:string,isActive:boolean)=>request(`/admin/customers/${id}/status`,{method:'PUT',body:JSON.stringify({isActive})}) };
export type AdminReview={_id:string;product?:{name:string};user?:{firstName:string;lastName:string};rating:number;body:string;status:string;createdAt:string};export type AdminCoupon={_id:string;code:string;discountType:string;discountValue:number;expiresAt:string;isActive:boolean;usedCount:number};export const adminPromoService={reviews:()=>request<{success:boolean;data:AdminReview[]}>('/admin/reviews'),reviewStatus:(id:string,status:string)=>request('/admin/reviews/'+id+'/status',{method:'PUT',body:JSON.stringify({status})}),deleteReview:(id:string)=>request('/admin/reviews/'+id,{method:'DELETE'}),coupons:()=>request<{success:boolean;data:AdminCoupon[]}>('/admin/coupons'),createCoupon:(payload:Record<string,unknown>)=>request('/admin/coupons',{method:'POST',body:JSON.stringify(payload)}),deleteCoupon:(id:string)=>request('/admin/coupons/'+id,{method:'DELETE'})};

export type StaffRole = 'super-admin' | 'manager' | 'editor' | 'support';
export type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};
export type CreateStaffPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: StaffRole;
};
export const adminTeamService = {
  list: () => request<{ success: boolean; data: StaffMember[]; meta: { currentUserId: string } }>('/admin/team'),
  create: (payload: CreateStaffPayload) => request<{ success: boolean; data: StaffMember }>('/admin/team', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: { role?: StaffRole; isActive?: boolean }) => request<{ success: boolean; data: StaffMember }>(`/admin/team/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  revoke: (id: string) => request<{ success: boolean; message: string; data: StaffMember }>(`/admin/team/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export type AdminMedia = { _id: string; filename: string; url: string; size: number; mimetype: string; createdAt: string };
export const adminMediaService = {
  list: () => request<{ success: boolean; data: AdminMedia[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/admin/media'),
  upload: (files: File[]) => { const body = new FormData(); files.forEach((file) => body.append('files', file)); return request<{ success: boolean; data: AdminMedia[] }>('/admin/media/upload', { method: 'POST', body, headers: {} }); },
  remove: (id: string) => request<{ success: boolean }>(`/admin/media/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
export type AdminNotification = { _id: string; title: string; message: string; type: 'order'|'inventory'|'system'; isRead: boolean; targetUrl?: string; createdAt: string };
export const adminNotificationService = {
  list: (limit = 20, page = 1) => request<{success:boolean;data:AdminNotification[];pagination:{page:number;limit:number;total:number;pages:number}}>(`/admin/notifications?limit=${limit}&page=${page}`),
  unreadCount: () => request<{success:boolean;data:{count:number}}>('/admin/notifications/unread-count'),
  markRead: (id:string) => request<{success:boolean;data:AdminNotification}>(`/admin/notifications/${encodeURIComponent(id)}/read`,{method:'PUT'}),
  markAllRead: () => request<{success:boolean;data:{updated:number}}>('/admin/notifications/read-all',{method:'PUT'}),
};

export type AdminCampaign = {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
  liveStatus?: 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
  product: { _id: string; name: string; basePrice: number; discountPrice?: number; images: string[]; category?: any; variants?: any[] };
  selectedVariants?: string[];
  headline?: string;
  subheadline?: string;
  badgeText?: string;
  offerPrice?: number;
  discountPercentage?: number;
  ctaText?: string;
  ctaSubtext?: string;
  bannerImage?: string;
  mobileBannerImage?: string;
  galleryImages?: string[];
  benefits?: Array<{ icon: string; title: string; description?: string }>;
  specifications?: Array<{ label: string; value: string }>;
  startsAt: string;
  expiresAt: string;
  showCountdown: boolean;
  onExpiryAction: 'show_expired_page' | 'redirect_product' | 'redirect_home';
  recommendedProducts?: Array<{ _id: string; name: string; basePrice: number; images: string[] }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
  };
  previewToken?: string;
  publishImmediately?: boolean;
  analytics?: { views: number; clicks: number; conversions: number };
  createdAt: string;
  updatedAt: string;
};

export const adminCampaignService = {
  list: (params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    );
    return request<{
      success: boolean;
      data: AdminCampaign[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/admin/campaigns?${query}`);
  },
  get: (id: string) => request<{ success: boolean; data: AdminCampaign }>(`/admin/campaigns/${encodeURIComponent(id)}`),
  create: (payload: Partial<AdminCampaign>) =>
    request<{ success: boolean; message: string; data: AdminCampaign }>('/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Partial<AdminCampaign>) =>
    request<{ success: boolean; message: string; data: AdminCampaign }>(`/admin/campaigns/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  publish: (id: string) =>
    request<{ success: boolean; message: string; data: { status: string; liveStatus: string } }>(
      `/admin/campaigns/${encodeURIComponent(id)}/publish`,
      { method: 'POST' }
    ),
  unpublish: (id: string) =>
    request<{ success: boolean; message: string; data: { status: string } }>(
      `/admin/campaigns/${encodeURIComponent(id)}/unpublish`,
      { method: 'POST' }
    ),
  duplicate: (id: string) =>
    request<{ success: boolean; message: string; data: AdminCampaign }>(
      `/admin/campaigns/${encodeURIComponent(id)}/duplicate`,
      { method: 'POST' }
    ),
  archive: (id: string) =>
    request<{ success: boolean; message: string; data: { status: string } }>(
      `/admin/campaigns/${encodeURIComponent(id)}/archive`,
      { method: 'PUT' }
    ),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/campaigns/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
