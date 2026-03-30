import { render, screen } from "@testing-library/react";
import App from "@/App";
import { mockSupabase, resetSupabaseMock } from "@/test/mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const { mockSupabase: sharedMockSupabase } = await import("@/test/mocks/supabase");
  return {
    supabase: sharedMockSupabase,
  };
});

describe("App", () => {
  beforeEach(() => {
    resetSupabaseMock();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
  });

  it("renders the public login route through the app router", async () => {
    window.history.pushState({}, "", "/login");

    render(<App />);

    expect(
      await screen.findByRole("button", { name: /enter airlock/i }),
    ).toBeInTheDocument();
  });
});
