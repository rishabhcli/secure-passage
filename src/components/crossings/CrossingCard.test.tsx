import { render, screen } from "@testing-library/react";
import { CrossingCard } from "@/components/crossings/CrossingCard";
import { makeCrossingListItem } from "@/test/fixtures/airlock";

describe("CrossingCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T17:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders time-ago labels across minute, hour, and day buckets", () => {
    render(
      <>
        <CrossingCard
          crossing={makeCrossingListItem({
            id: "cx-now",
            created_at: "2026-03-30T17:00:00.000Z",
          })}
        />
        <CrossingCard
          crossing={makeCrossingListItem({
            id: "cx-minutes",
            created_at: "2026-03-30T16:30:00.000Z",
          })}
        />
        <CrossingCard
          crossing={makeCrossingListItem({
            id: "cx-hours",
            created_at: "2026-03-30T15:00:00.000Z",
          })}
        />
        <CrossingCard
          crossing={makeCrossingListItem({
            id: "cx-days",
            created_at: "2026-03-27T17:00:00.000Z",
          })}
        />
      </>,
    );

    expect(screen.getByText("now")).toBeInTheDocument();
    expect(screen.getByText("30m")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
    expect(screen.getByText("3d")).toBeInTheDocument();
  });

  it("shows blocked policy context and forwards click events", () => {
    const onClick = vi.fn();

    render(
      <CrossingCard
        crossing={makeCrossingListItem({
          status: "blocked_pre_review",
          policy_reason_text: "Destination channel is not allowed",
        })}
        onClick={onClick}
      />,
    );

    screen.getByRole("button", {
      name: /production database connection pool exhausted/i,
    }).click();

    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("Destination channel is not allowed")).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
