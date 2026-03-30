import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { mockSupabase, resetSupabaseMock } from "@/test/mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const { mockSupabase: sharedMockSupabase } = await import("@/test/mocks/supabase");
  return {
    supabase: sharedMockSupabase,
  };
});

describe("useAuth", () => {
  it("hydrates the initial session, reacts to auth changes, and signs out", async () => {
    resetSupabaseMock();
    let authChangeHandler:
      | ((event: string, session: { user: { id: string } } | null) => void)
      | undefined;

    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-001",
          },
        },
      },
    });
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authChangeHandler = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.id).toBe("user-001");

    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();

    act(() => {
      authChangeHandler?.("SIGNED_OUT", null);
    });

    await waitFor(() => expect(result.current.user).toBeNull());
  });
});
