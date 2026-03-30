import { act, renderHook, waitFor } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile", () => {
  it("tracks viewport changes across the mobile breakpoint", async () => {
    let changeHandler: (() => void) | undefined;

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      addEventListener: vi.fn((_event, callback) => {
        changeHandler = callback;
      }),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => expect(result.current).toBe(true));

    window.innerWidth = 1200;
    act(() => {
      changeHandler?.();
    });

    await waitFor(() => expect(result.current).toBe(false));
  });
});
