import userEvent from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { CrossingReviewDrawer } from "@/components/review/CrossingReviewDrawer";
import { makeCrossingDetail } from "@/test/fixtures/airlock";

const mockUseCrossingDetailQuery = vi.hoisted(() => vi.fn());
const mockUseApproveSendMutation = vi.hoisted(() => vi.fn());
const mockUseDenyCrossingMutation = vi.hoisted(() => vi.fn());
const mockUseToast = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-airlock-api", () => ({
  useCrossingDetailQuery: mockUseCrossingDetailQuery,
  useApproveSendMutation: mockUseApproveSendMutation,
  useDenyCrossingMutation: mockUseDenyCrossingMutation,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: mockUseToast,
}));

describe("CrossingReviewDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there is no selected crossing", () => {
    mockUseToast.mockReturnValue({ toast: vi.fn() });
    mockUseCrossingDetailQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    mockUseApproveSendMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });
    mockUseDenyCrossingMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });

    const { container } = render(
      <CrossingReviewDrawer crossingId={null} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a loading shell while the crossing detail request is in flight", () => {
    mockUseToast.mockReturnValue({ toast: vi.fn() });
    mockUseCrossingDetailQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockUseApproveSendMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });
    mockUseDenyCrossingMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });

    const { container } = render(
      <CrossingReviewDrawer crossingId="cx-001" onClose={vi.fn()} />,
    );

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });

  it("copies payload text and closes on escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const writeText = vi.fn();

    mockUseToast.mockReturnValue({ toast: vi.fn() });
    mockUseCrossingDetailQuery.mockReturnValue({
      data: { crossing: makeCrossingDetail(), events: [] },
      isLoading: false,
    });
    mockUseApproveSendMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });
    mockUseDenyCrossingMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <CrossingReviewDrawer crossingId="cx-001" onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: "Copy payload" }));
    expect(writeText).toHaveBeenCalledWith(
      "Escalate issue to #incidents immediately.",
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("approves and denies reviewable crossings through mouse and keyboard actions", async () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    const toast = vi.fn();
    const approveMutate = vi.fn((_payload, options) => options?.onSuccess?.());
    const denyMutate = vi.fn((_id, options) => options?.onSuccess?.());
    const user = userEvent.setup();

    mockUseToast.mockReturnValue({ toast });
    mockUseCrossingDetailQuery.mockReturnValue({
      data: { crossing: makeCrossingDetail(), events: [] },
      isLoading: false,
    });
    mockUseApproveSendMutation.mockReturnValue({
      isPending: false,
      mutate: approveMutate,
    });
    mockUseDenyCrossingMutation.mockReturnValue({
      isPending: false,
      mutate: denyMutate,
    });

    render(
      <CrossingReviewDrawer
        crossingId="cx-001"
        onClose={vi.fn()}
        onApprove={onApprove}
        onDeny={onDeny}
      />,
    );

    await user.click(screen.getByRole("button", { name: /approve & send/i }));
    expect(approveMutate).toHaveBeenCalledWith(
      {
        crossingId: "cx-001",
        approvedPayloadHash: "sha256:deadbeef",
      },
      expect.any(Object),
    );
    expect(onApprove).toHaveBeenCalledWith("cx-001");

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Backspace",
          ctrlKey: true,
        }),
      );
    });

    expect(denyMutate).toHaveBeenCalledWith("cx-001", expect.any(Object));
    expect(onDeny).toHaveBeenCalledWith("cx-001");
    expect(toast).toHaveBeenCalled();
  });

  it("supports the approve keyboard shortcut for reviewable crossings", () => {
    const approveMutate = vi.fn((_payload, options) => options?.onSuccess?.());

    mockUseToast.mockReturnValue({ toast: vi.fn() });
    mockUseCrossingDetailQuery.mockReturnValue({
      data: { crossing: makeCrossingDetail(), events: [] },
      isLoading: false,
    });
    mockUseApproveSendMutation.mockReturnValue({
      isPending: false,
      mutate: approveMutate,
    });
    mockUseDenyCrossingMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });

    render(
      <CrossingReviewDrawer crossingId="cx-001" onClose={vi.fn()} />,
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          metaKey: true,
        }),
      );
    });

    expect(approveMutate).toHaveBeenCalledWith(
      {
        crossingId: "cx-001",
        approvedPayloadHash: "sha256:deadbeef",
      },
      expect.any(Object),
    );
  });

  it("renders blocked crossings without review actions", () => {
    mockUseToast.mockReturnValue({ toast: vi.fn() });
    mockUseCrossingDetailQuery.mockReturnValue({
      data: {
        crossing: makeCrossingDetail({
          status: "blocked_pre_review",
          write_check_status: "blocked",
          policy_reason_text: "Destination channel is not allowed",
        }),
        events: [],
      },
      isLoading: false,
    });
    mockUseApproveSendMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });
    mockUseDenyCrossingMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });

    render(
      <CrossingReviewDrawer crossingId="cx-001" onClose={vi.fn()} />,
    );

    expect(screen.getByText("Policy Blocked")).toBeInTheDocument();
    expect(screen.getByText("Destination channel is not allowed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve & send/i })).not.toBeInTheDocument();
  });

  it("renders sent provenance details when a crossing has already been delivered", () => {
    mockUseToast.mockReturnValue({ toast: vi.fn() });
    mockUseCrossingDetailQuery.mockReturnValue({
      data: {
        crossing: makeCrossingDetail({
          status: "sent",
          write_check_status: "sent",
          slack_message_ts: "1234567890.123456",
        }),
        events: [],
      },
      isLoading: false,
    });
    mockUseApproveSendMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });
    mockUseDenyCrossingMutation.mockReturnValue({ isPending: false, mutate: vi.fn() });

    render(
      <CrossingReviewDrawer crossingId="cx-001" onClose={vi.fn()} />,
    );

    expect(screen.getByText(/source verified via github/i)).toBeInTheDocument();
    expect(screen.getByText(/sent via slack/i)).toBeInTheDocument();
    expect(screen.getByText(/ts: 1234567890\.123456/i)).toBeInTheDocument();
  });

  it("shows destructive toast feedback when review actions fail", async () => {
    const user = userEvent.setup();
    const toast = vi.fn();
    const approveMutate = vi.fn((_payload, options) =>
      options?.onError?.(new Error("approve failed")),
    );
    const denyMutate = vi.fn((_id, options) =>
      options?.onError?.(new Error("deny failed")),
    );

    mockUseToast.mockReturnValue({ toast });
    mockUseCrossingDetailQuery.mockReturnValue({
      data: { crossing: makeCrossingDetail(), events: [] },
      isLoading: false,
    });
    mockUseApproveSendMutation.mockReturnValue({
      isPending: false,
      mutate: approveMutate,
    });
    mockUseDenyCrossingMutation.mockReturnValue({
      isPending: false,
      mutate: denyMutate,
    });

    render(
      <CrossingReviewDrawer crossingId="cx-001" onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /approve & send/i }));
    await user.click(screen.getByRole("button", { name: /deny/i }));

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Send failed",
        description: "approve failed",
        variant: "destructive",
      }),
    );
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Deny failed",
        description: "deny failed",
        variant: "destructive",
      }),
    );
  });
});
