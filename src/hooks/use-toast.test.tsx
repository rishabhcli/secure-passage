import { act, renderHook, waitFor } from "@testing-library/react";
import { reducer, useToast } from "@/hooks/use-toast";

describe("useToast", () => {
  it("adds, updates, and dismisses a toast through the hook API", async () => {
    const { result } = renderHook(() => useToast());

    let created: ReturnType<typeof result.current.toast> | undefined;

    act(() => {
      created = result.current.toast({
        title: "Initial",
        description: "Created",
      });
    });

    await waitFor(() => expect(result.current.toasts).toHaveLength(1));
    expect(result.current.toasts[0]?.title).toBe("Initial");

    act(() => {
      created?.update({
        id: created!.id,
        title: "Updated",
        description: "Updated description",
      });
    });

    await waitFor(() =>
      expect(result.current.toasts[0]?.title).toBe("Updated"),
    );

    act(() => {
      created?.dismiss();
    });

    await waitFor(() => expect(result.current.toasts[0]?.open).toBe(false));
  });

  it("removes all toasts when the reducer receives a global remove action", () => {
    const state = reducer(
      {
        toasts: [
          {
            id: "toast-1",
            open: true,
          },
        ],
      },
      {
        type: "REMOVE_TOAST",
      },
    );

    expect(state.toasts).toEqual([]);
  });
});
