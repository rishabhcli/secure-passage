import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResetPasswordPage from "@/pages/ResetPassword";
import { mockSupabase, resetSupabaseMock } from "@/test/mocks/supabase";

const navigateSpy = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

vi.mock("@/integrations/supabase/client", async () => {
  const { mockSupabase: sharedMockSupabase } = await import("@/test/mocks/supabase");
  return {
    supabase: sharedMockSupabase,
  };
});

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    resetSupabaseMock();
    navigateSpy.mockReset();
    window.location.hash = "";
  });

  it("shows the recovery verification state until the flow is ready", () => {
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Verifying reset link…")).toBeInTheDocument();
  });

  it("updates the password once the recovery link is active", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null });
    window.location.hash = "#type=recovery";

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("New Password"), "OperatorPass123!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: "OperatorPass123!",
    });
    expect(navigateSpy).toHaveBeenCalledWith("/airlock");
  });
});
