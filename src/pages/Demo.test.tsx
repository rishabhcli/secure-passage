import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DemoPage from "@/pages/Demo";
import { makeStatusResponse } from "@/test/fixtures/airlock";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseStatusQuery = vi.hoisted(() => vi.fn());
const mockUseResetDemoMutation = vi.hoisted(() => vi.fn());
const mockUseSeedValidMutation = vi.hoisted(() => vi.fn());
const mockUseSeedBlockedMutation = vi.hoisted(() => vi.fn());
const mockUseSendHeartbeatMutation = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/hooks/use-airlock-api", () => ({
  useStatusQuery: mockUseStatusQuery,
  useResetDemoMutation: mockUseResetDemoMutation,
  useSeedValidMutation: mockUseSeedValidMutation,
  useSeedBlockedMutation: mockUseSeedBlockedMutation,
  useSendHeartbeatMutation: mockUseSendHeartbeatMutation,
}));

describe("DemoPage", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
    });
  });

  it("runs demo actions and shows success feedback", async () => {
    const user = userEvent.setup();

    mockUseStatusQuery.mockReturnValue({
      data: makeStatusResponse(),
    });
    mockUseResetDemoMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn((_args, options) => options?.onSuccess?.()),
    });
    mockUseSeedValidMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn((_args, options) =>
        options?.onSuccess?.({ crossingId: "cx-valid" }),
      ),
    });
    mockUseSeedBlockedMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn((_args, options) =>
        options?.onSuccess?.({ crossingId: "cx-blocked" }),
      ),
    });
    mockUseSendHeartbeatMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn((_args, options) => options?.onSuccess?.()),
    });

    render(
      <MemoryRouter>
        <DemoPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /reset demo state/i }));
    expect(
      await screen.findByText("Demo state reset successfully"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /seed valid crossing/i }));
    expect(
      await screen.findByText("Seeded valid crossing: cx-valid"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /seed blocked crossing/i }));
    expect(
      await screen.findByText("Seeded blocked crossing: cx-blocked"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /send heartbeat/i }));
    expect(
      await screen.findByText("Heartbeat sent successfully"),
    ).toBeInTheDocument();
  });

  it("shows pending labels and offline companion state while mutations are in flight", () => {
    mockUseStatusQuery.mockReturnValue({
      data: makeStatusResponse({
        companion: { online: false },
      }),
    });
    mockUseResetDemoMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    });
    mockUseSeedValidMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    });
    mockUseSeedBlockedMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    });
    mockUseSendHeartbeatMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    });

    render(
      <MemoryRouter>
        <DemoPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /resetting/i })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /seeding/i })).toHaveLength(2);
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.queryByText(/last heartbeat/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^ID:/i)).not.toBeInTheDocument();
  });

  it("shows mutation failure feedback when demo actions fail", async () => {
    const user = userEvent.setup();

    mockUseStatusQuery.mockReturnValue({
      data: makeStatusResponse(),
    });
    mockUseResetDemoMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn((_args, options) => options?.onError?.(new Error("reset failed"))),
    });
    mockUseSeedValidMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn((_args, options) => options?.onError?.(new Error("seed valid failed"))),
    });
    mockUseSeedBlockedMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn((_args, options) => options?.onError?.(new Error("seed blocked failed"))),
    });
    mockUseSendHeartbeatMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn((_args, options) => options?.onError?.(new Error("heartbeat failed"))),
    });

    render(
      <MemoryRouter>
        <DemoPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /reset demo state/i }));
    expect(await screen.findByText("Reset failed: reset failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /seed valid crossing/i }));
    expect(await screen.findByText("Seed failed: seed valid failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /seed blocked crossing/i }));
    expect(await screen.findByText("Seed failed: seed blocked failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /send heartbeat/i }));
    expect(await screen.findByText("Heartbeat failed: heartbeat failed")).toBeInTheDocument();
  });
});
