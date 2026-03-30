import { act, render, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/hooks/useTheme";

describe("ThemeProvider", () => {
  it("applies and updates the resolved theme class from matchMedia", async () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;

    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn((_event, callback) => {
        changeHandler = callback;
      }),
      removeEventListener: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(document.documentElement.classList.contains("dark")).toBe(true),
    );

    act(() => {
      changeHandler?.({ matches: false } as MediaQueryListEvent);
    });

    await waitFor(() =>
      expect(document.documentElement.classList.contains("light")).toBe(true),
    );
  });
});
