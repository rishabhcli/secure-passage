import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CrossingDetailPage from "@/pages/CrossingDetail";
import {
  makeCrossingDetail,
  makeCrossingEvents,
  makeStatusResponse,
} from "@/test/fixtures/airlock";

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseStatusQuery = vi.hoisted(() => vi.fn());
const mockUseCrossingDetailQuery = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/hooks/use-airlock-api", () => ({
  useStatusQuery: mockUseStatusQuery,
  useCrossingDetailQuery: mockUseCrossingDetailQuery,
}));

describe("CrossingDetailPage", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
    });
    mockUseStatusQuery.mockReturnValue({
      data: makeStatusResponse(),
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/airlock/crossings/cx-001"]}>
        <Routes>
          <Route
            path="/airlock/crossings/:id"
            element={<CrossingDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renders the loading state", () => {
    mockUseCrossingDetailQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderPage();

    expect(screen.getAllByRole("link", { name: /back to dashboard/i })[0]).toBeInTheDocument();
  });

  it("renders the not found state", () => {
    mockUseCrossingDetailQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Missing"),
    });

    renderPage();

    expect(screen.getByText("Crossing Not Found")).toBeInTheDocument();
  });

  it("renders detail content, timeline events, and policy blocks", () => {
    mockUseCrossingDetailQuery.mockReturnValue({
      data: {
        crossing: makeCrossingDetail({
          status: "blocked_pre_review",
          write_check_status: "blocked",
          policy_reason_text: "Blocked by policy",
        }),
        events: makeCrossingEvents(),
      },
      isLoading: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText("Source Evidence")).toBeInTheDocument();
    expect(screen.getByText("Event Timeline")).toBeInTheDocument();
    expect(screen.getByText("Blocked by policy")).toBeInTheDocument();
    expect(
      screen.getByText("Policy evaluation passed. Crossing ready for human review."),
    ).toBeInTheDocument();
  });
});
