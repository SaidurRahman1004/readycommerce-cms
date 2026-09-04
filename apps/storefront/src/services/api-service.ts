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

export const orderService = {
  create: async (payload: CheckoutPayload) => mockRequest({message: 'order_created', orderId: `RC-${Date.now().toString().slice(-8)}`, payload})
};
