import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "@/pages/Landing";

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

describe("LandingPage", () => {
  it("navigates to login from the primary CTA", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /enter airlock/i }));
    expect(navigateSpy).toHaveBeenCalledWith("/login");
  });
});
