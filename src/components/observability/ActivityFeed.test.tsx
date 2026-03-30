import { act, render, screen, waitFor } from "@testing-library/react";
import { ActivityFeed } from "@/components/observability/ActivityFeed";
import { makeCrossingEvents } from "@/test/fixtures/airlock";
import {
  createChannelMock,
  createQueryBuilder,
  mockSupabase,
  resetSupabaseMock,
} from "@/test/mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const { mockSupabase: sharedMockSupabase } = await import("@/test/mocks/supabase");
  return {
    supabase: sharedMockSupabase,
  };
});

describe("ActivityFeed", () => {
  it("renders an empty state when there are no events", async () => {
    resetSupabaseMock();
    mockSupabase.from.mockReturnValue(
      createQueryBuilder({ data: [], error: null }),
    );
    mockSupabase.channel.mockReturnValue(createChannelMock());

    render(<ActivityFeed />);

    await waitFor(() =>
      expect(screen.getByText("No activity yet")).toBeInTheDocument(),
    );
  });

  it("renders fetched events and prepends new realtime entries", async () => {
    resetSupabaseMock();
    const events = makeCrossingEvents();
    const channel = createChannelMock();
    let insertHandler:
      | ((payload: { new: { id: string; event_type: string; message: string; created_at: string; crossing_id: string } }) => void)
      | undefined;

    channel.on.mockImplementation((_event, _filter, callback) => {
      insertHandler = callback;
      return channel;
    });
    mockSupabase.channel.mockReturnValue(channel);
    mockSupabase.from.mockReturnValue(
      createQueryBuilder({
        data: events.map((event) => ({
          id: event.id,
          event_type: event.event_type,
          message: event.message,
          created_at: event.created_at,
          crossing_id: event.crossing_id,
        })),
        error: null,
      }),
    );

    render(<ActivityFeed />);

    await waitFor(() =>
      expect(screen.getByText(events[0].message)).toBeInTheDocument(),
    );

    act(() => {
      insertHandler?.({
        new: {
          id: "evt-3",
          event_type: "send.succeeded",
          message: "Message sent to Slack through connected account",
          created_at: "2026-03-30T17:01:00.000Z",
          crossing_id: "cx-001",
        },
      });
    });

    await waitFor(() =>
      expect(
        screen.getByText("Message sent to Slack through connected account"),
      ).toBeInTheDocument(),
    );
  });
});
