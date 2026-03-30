import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/Login";
import { mockSupabase, resetSupabaseMock } from "@/test/mocks/supabase";

const navigateSpy = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/integrations/supabase/client", async () => {
  const { mockSupabase: sharedMockSupabase } = await import("@/test/mocks/supabase");
  return {
    supabase: sharedMockSupabase,
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    resetSupabaseMock();
    navigateSpy.mockReset();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });
  });

  it("signs in existing users and navigates to the dashboard", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "operator@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2!");
    await user.click(screen.getByRole("button", { name: /enter airlock/i }));

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "operator@example.com",
      password: "hunter2!",
    });
    expect(navigateSpy).toHaveBeenCalledWith("/airlock");
  });

  it("shows authentication errors and toggles password visibility", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: new Error("Invalid login credentials"),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.type(screen.getByLabelText("Email"), "operator@example.com");
    await user.type(passwordInput, "wrong-password");
    await user.click(screen.getByRole("button", { name: /enter airlock/i }));

    expect(
      await screen.findByText("Invalid login credentials"),
    ).toBeInTheDocument();
  });

  it("supports the sign-up flow", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signUp.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /don't have an account\? sign up/i }),
    );
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "OperatorPass123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "OperatorPass123!",
      options: { emailRedirectTo: window.location.origin },
    });
    expect(
      await screen.findByText(
        "Check your email to confirm your account before signing in.",
      ),
    ).toBeInTheDocument();
  });

  it("redirects authenticated users away from the login page", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-001" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/airlock" element={<div>Control Panel</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText("Control Panel")).toBeInTheDocument(),
    );
  });
});
