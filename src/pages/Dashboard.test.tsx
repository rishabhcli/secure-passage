import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "@/pages/Dashboard";
import { makeCrossingListItem, makeStatusResponse } from "@/test/fixtures/airlock";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseStatusQuery = vi.hoisted(() => vi.fn());
const mockUseCrossingsQuery = vi.hoisted(() => vi.fn());
const mockUseCrossingsRealtime = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/hooks/use-airlock-api", () => ({
  useStatusQuery: mockUseStatusQuery,
  useCrossingsQuery: mockUseCrossingsQuery,
}));

vi.mock("@/hooks/use-crossings-realtime", () => ({
  useCrossingsRealtime: mockUseCrossingsRealtime,
}));

vi.mock("@/components/observability/ActivityFeed", () => ({
  ActivityFeed: () => <div>Mocked activity feed</div>,
}));

vi.mock("@/components/review/CrossingReviewDrawer", () => ({
  CrossingReviewDrawer: ({ crossingId }: { crossingId: string }) => (
    <div>Drawer for {crossingId}</div>
  ),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("DashboardPage", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
    });
    mockUseStatusQuery.mockReturnValue({
      data: makeStatusResponse(),
      isLoading: false,
    });
  });

  it("renders pending crossings, receipts, and opens the review drawer", async () => {
    const user = userEvent.setup();
    mockUseCrossingsQuery.mockReturnValue({
      data: [
        makeCrossingListItem(),
        makeCrossingListItem({
          id: "cx-002",
          status: "blocked_pre_review",
          write_check_status: "blocked",
          policy_reason_text: "Channel not allowed",
        }),
        makeCrossingListItem({
          id: "cx-003",
          status: "sent",
          write_check_status: "sent",
        }),
      ],
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Pending Crossings")).toBeInTheDocument();
    expect(screen.getByText("Receipts")).toBeInTheDocument();
    expect(screen.getByText("Mocked activity feed")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", {
        name: /production database connection pool exhausted/i,
      })[0],
    );

    expect(screen.getByText("Drawer for cx-001")).toBeInTheDocument();
  });

  it("shows the empty pending state when there are no crossings", () => {
    mockUseCrossingsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("No pending crossings")).toBeInTheDocument();
    expect(screen.getByText("No receipts yet")).toBeInTheDocument();
  });

  it("shows loading placeholders while crossings are being fetched", () => {
    mockUseCrossingsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(container.querySelectorAll(".animate-pulse")).not.toHaveLength(0);
    expect(screen.queryByText("No pending crossings")).not.toBeInTheDocument();
  });

  it("navigates to receipt detail pages when a receipt card is opened", async () => {
    const user = userEvent.setup();

    mockUseCrossingsQuery.mockReturnValue({
      data: [
        makeCrossingListItem({
          id: "cx-003",
          status: "sent",
          write_check_status: "sent",
        }),
      ],
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /production database connection pool exhausted/i,
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("/airlock/crossings/cx-003");
  });
});
