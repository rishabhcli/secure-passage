import { render, screen } from "@testing-library/react";
import { EventTimeline } from "@/components/receipts/EventTimeline";
import { makeCrossingEvents } from "@/test/fixtures/airlock";

describe("EventTimeline", () => {
  it("renders known and fallback event colors while keeping connector lines between entries", () => {
    const events = [
      ...makeCrossingEvents(),
      {
        ...makeCrossingEvents()[0],
        id: "evt-unknown",
        event_type: "custom.event",
        message: "Custom event emitted by a local test harness",
      },
    ];

    const { container } = render(<EventTimeline events={events} />);

    expect(screen.getByText("Intent received from local companion")).toBeInTheDocument();
    expect(
      screen.getByText("Custom event emitted by a local test harness"),
    ).toBeInTheDocument();
    expect(screen.getByText("custom.event")).toBeInTheDocument();
    expect(container.querySelectorAll(".w-px")).toHaveLength(2);
  });
});
