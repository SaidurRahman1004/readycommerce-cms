const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export type AuthPayload = {name?: string; email: string; password: string};
export type CheckoutPayload = {name: string; email: string; phone: string; address: string; city: string; postal: string; payment: string; txid: string; items: unknown[]};

async function mockRequest<T>(result: T): Promise<T> {
  await wait(1000);
  return result;
}

export const authService = {
  login: async (payload: AuthPayload) => mockRequest({message: 'login_success', user: {email: payload.email}}),
  register: async (payload: AuthPayload) => mockRequest({message: 'register_success', user: {email: payload.email, name: payload.name}}),
  forgotPassword: async (email: string) => mockRequest({message: 'reset_sent', email}),
  resetPassword: async (password: string) => mockRequest({message: 'password_reset', passwordChanged: Boolean(password)}),
  changePassword: async (currentPassword: string, newPassword: string) => mockRequest({message: 'password_changed', valid: Boolean(currentPassword && newPassword)}),
  logout: async () => mockRequest({message: 'logout_success'})
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
