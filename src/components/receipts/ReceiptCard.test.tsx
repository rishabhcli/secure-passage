import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { ReceiptCard } from "@/components/receipts/ReceiptCard";
import { makeCrossingListItem } from "@/test/fixtures/airlock";

describe("ReceiptCard", () => {
  it.each([
    { status: "sent", label: "Sent" },
    { status: "blocked_pre_review", label: "Blocked" },
    { status: "denied", label: "Denied" },
    { status: "failed", label: "Failed" },
  ] as const)("renders the %s receipt outcome", ({ status, label }) => {
    render(
      <ReceiptCard
        crossing={makeCrossingListItem({
          status,
          write_check_status:
            status === "sent"
              ? "sent"
              : status === "blocked_pre_review"
                ? "blocked"
                : status === "denied"
                  ? "denied"
                  : "failed",
          policy_reason_text:
            status === "blocked_pre_review" ? "Destination channel blocked" : null,
        })}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    if (status === "blocked_pre_review") {
      expect(screen.getByText("Destination channel blocked")).toBeInTheDocument();
    }
  });

  it("forwards receipt click actions", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ReceiptCard
        crossing={makeCrossingListItem({
          status: "sent",
          write_check_status: "sent",
        })}
        onClick={onClick}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /production database connection pool exhausted/i,
      }),
    );

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
