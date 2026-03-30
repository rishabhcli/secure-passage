import { render, screen } from "@testing-library/react";
import { ReadinessStrip } from "@/components/status/ReadinessStrip";
import { makeStatusResponse } from "@/test/fixtures/airlock";

describe("ReadinessStrip", () => {
  it("renders a loading skeleton while readiness data is unavailable", () => {
    const { container } = render(<ReadinessStrip status={null} isLoading />);

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
    expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
  });

  it("renders connected account details when providers are available", () => {
    render(<ReadinessStrip status={makeStatusResponse()} />);

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("operator-dev")).toBeInTheDocument();
    expect(screen.getByText("AcmeCorp")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("renders disconnected and offline states when providers are unavailable", () => {
    render(
      <ReadinessStrip
        status={makeStatusResponse({
          github: { connected: false },
          slack: { connected: false },
          companion: { online: false },
        })}
      />,
    );

    expect(screen.getAllByText("Not connected")).toHaveLength(2);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});
