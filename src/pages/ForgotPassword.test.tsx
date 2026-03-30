import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import { mockSupabase, resetSupabaseMock } from "@/test/mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const { mockSupabase: sharedMockSupabase } = await import("@/test/mocks/supabase");
  return {
    supabase: sharedMockSupabase,
  };
});

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  it("sends a password reset email", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "operator@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "operator@example.com",
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
    expect(
      await screen.findByText("Check your email for a password reset link."),
    ).toBeInTheDocument();
  });

  it("renders reset errors", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      error: new Error("Unable to send email"),
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "operator@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText("Unable to send email")).toBeInTheDocument();
  });
});
