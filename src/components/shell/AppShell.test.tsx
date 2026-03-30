import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

describe("AppShell", () => {
  it("renders the current user and signs out from the toolbar", async () => {
    const signOut = vi.fn();
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      user: {
        email: "operator@example.com",
        user_metadata: {
          display_name: "Alex Chen",
        },
      },
      signOut,
    });

    render(
      <MemoryRouter initialEntries={["/connect"]}>
        <AppShell>
          <div>Shell content</div>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("Alex Chen")).toBeInTheDocument();
    expect(screen.getByText("Shell content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalled();
  });
});
