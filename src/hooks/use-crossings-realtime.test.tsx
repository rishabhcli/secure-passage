import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { useCrossingsRealtime } from "@/hooks/use-crossings-realtime";
import { createTestQueryClient } from "@/test/render";
import { createChannelMock, mockSupabase, resetSupabaseMock } from "@/test/mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const { mockSupabase: sharedMockSupabase } = await import("@/test/mocks/supabase");
  return {
    supabase: sharedMockSupabase,
  };
});

describe("useCrossingsRealtime", () => {
  it("subscribes to crossings and crossing events and invalidates related queries", () => {
    resetSupabaseMock();
    const channel = createChannelMock();
    const callbacks: Array<(payload: Record<string, unknown>) => void> = [];

    channel.on.mockImplementation((_event, _filter, callback) => {
      callbacks.push(callback);
      return channel;
    });
    mockSupabase.channel.mockReturnValue(channel);

    const queryClient = createTestQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { unmount } = renderHook(() => useCrossingsRealtime(), { wrapper });

    callbacks[0]?.({
      new: { id: "cx-new" },
      old: { id: "cx-old" },
    });
    callbacks[1]?.({
      new: { crossing_id: "cx-events" },
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith("crossings-realtime");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossings"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["status"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossing", "cx-new"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossing", "cx-old"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossing", "cx-events"] });

    unmount();
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(
      channel.subscribe.mock.results[0]?.value,
    );
  });
});
