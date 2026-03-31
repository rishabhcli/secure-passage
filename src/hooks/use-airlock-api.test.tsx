import { act, renderHook, waitFor } from "@testing-library/react";
import {
  useApproveSendMutation,
  useCrossingDetailQuery,
  useCrossingsQuery,
  useDenyCrossingMutation,
  useResetDemoMutation,
  useSeedBlockedMutation,
  useSeedValidMutation,
  useSendHeartbeatMutation,
  useStatusQuery,
} from "@/hooks/use-airlock-api";
import { makeCrossingDetail, makeCrossingListItem, makeStatusResponse } from "@/test/fixtures/airlock";
import { createTestWrapper } from "@/test/render";
import { mockSupabase, resetSupabaseMock } from "@/test/mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const { mockSupabase: sharedMockSupabase } = await import("@/test/mocks/supabase");
  return {
    supabase: sharedMockSupabase,
  };
});

describe("use-airlock-api", () => {
  beforeEach(() => {
    resetSupabaseMock();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "session-token" } },
    });
  });

  it("loads status data through the edge function API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeStatusResponse(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useStatusQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data?.user.id).toBe("user-001"));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/functions/v1/status"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer session-token",
        }),
      }),
    );
  });

  it("omits the authorization header when no session token is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeStatusResponse(),
    });
    vi.stubGlobal("fetch", fetchMock);
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useStatusQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data?.user.id).toBe("user-001"));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      }),
    );
  });

  it("passes list mode filters to the crossings query", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [makeCrossingListItem()],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useCrossingsQuery("pending"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/functions/v1/crossings?mode=pending"),
      expect.any(Object),
    );
  });

  it("keeps detail queries disabled when no crossing id is provided", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useCrossingDetailQuery(null), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits approve-send mutations and invalidates cached crossing queries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          crossing: makeCrossingDetail(),
          events: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "sent" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper, queryClient } = createTestWrapper();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useApproveSendMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        crossingId: "cx-001",
        approvedPayloadHash: "sha256:deadbeef",
      });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("action=approve-send&id=cx-001"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ approvedPayloadHash: "sha256:deadbeef" }),
      }),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossings"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossing"] });
  });

  it("submits deny mutations and invalidates cached crossing queries", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "denied" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper, queryClient } = createTestWrapper();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDenyCrossingMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("cx-002");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("action=deny&id=cx-002"),
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossings"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossing"] });
  });

  it.each([
    {
      action: "reset",
      useMutationHook: useResetDemoMutation,
    },
    {
      action: "seed-valid",
      useMutationHook: useSeedValidMutation,
    },
    {
      action: "seed-blocked",
      useMutationHook: useSeedBlockedMutation,
    },
  ])("runs the %s demo mutation and refreshes status data", async ({ action, useMutationHook }) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper, queryClient } = createTestWrapper();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMutationHook(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/functions/v1/demo?action=${action}`),
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["crossings"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["status"] });
  });

  it("uses the default companion id when sending a heartbeat without options", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSendHeartbeatMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({});
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/functions/v1/heartbeat"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          companionId: "demo-companion",
          originType: "demo",
        }),
      }),
    );
  });

  it("passes through a custom companion id when sending a heartbeat", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSendHeartbeatMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ companionId: "companion-special-9" });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          companionId: "companion-special-9",
          originType: "demo",
        }),
      }),
    );
  });

  it("surfaces edge-function errors even when the response body is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: vi.fn().mockRejectedValue(new Error("invalid json")),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSendHeartbeatMutation(), {
      wrapper: Wrapper,
    });

    await expect(result.current.mutateAsync({})).rejects.toThrow("Service Unavailable");
  });
});
