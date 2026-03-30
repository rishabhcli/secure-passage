import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ConnectPage from "@/pages/Connect";
import { MOCK_STATUS } from "@/lib/mock-data";

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

describe("ConnectPage", () => {
  const originalGithub = { ...MOCK_STATUS.github };
  const originalSlack = { ...MOCK_STATUS.slack };

  afterEach(() => {
    Object.assign(MOCK_STATUS.github, originalGithub);
    Object.assign(MOCK_STATUS.slack, originalSlack);
  });

  it("shows connected integrations and operational copy", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ConnectPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Connected as operator-dev/i)).toBeInTheDocument();
    expect(screen.getByText(/Connected to AcmeCorp/i)).toBeInTheDocument();
  });

  it("shows disconnected integration states when mock providers are unavailable", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
    });
    Object.assign(MOCK_STATUS.github, { connected: false, username: undefined });
    Object.assign(MOCK_STATUS.slack, { connected: false, workspace: undefined });

    render(
      <MemoryRouter>
        <ConnectPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Disconnected")).toHaveLength(2);
  });
});
