import { vi } from "vitest";

export function createChannelMock() {
  return {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  };
}

export function createQueryBuilder<T>(response: T) {
  const builder = {
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => response),
    order: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => response),
    then: (onFulfilled: (value: T) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(response).then(onFulfilled, onRejected),
    update: vi.fn(() => builder),
    upsert: vi.fn(async () => response),
  };

  return builder;
}

const authSubscription = { unsubscribe: vi.fn() };

export const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: authSubscription } })),
    resetPasswordForEmail: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    updateUser: vi.fn(),
  },
  channel: vi.fn(() => createChannelMock()),
  from: vi.fn(),
  removeChannel: vi.fn(),
};

export function resetSupabaseMock() {
  authSubscription.unsubscribe.mockReset();
  mockSupabase.auth.getSession.mockReset();
  mockSupabase.auth.onAuthStateChange.mockReset();
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: authSubscription },
  });
  mockSupabase.auth.resetPasswordForEmail.mockReset();
  mockSupabase.auth.signInWithPassword.mockReset();
  mockSupabase.auth.signOut.mockReset();
  mockSupabase.auth.signUp.mockReset();
  mockSupabase.auth.updateUser.mockReset();
  mockSupabase.channel.mockReset();
  mockSupabase.channel.mockImplementation(() => createChannelMock());
  mockSupabase.from.mockReset();
  mockSupabase.removeChannel.mockReset();
}
