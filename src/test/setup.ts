import "@testing-library/jest-dom";
import React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, tagName: string) =>
        React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
          (
            {
              animate: _animate,
              children,
              exit: _exit,
              initial: _initial,
              layout: _layout,
              transition: _transition,
              variants: _variants,
              whileHover: _whileHover,
              whileTap: _whileTap,
              ...props
            },
            ref,
          ) => React.createElement(tagName, { ...props, ref }, children),
        ),
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion,
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window.navigator, "clipboard", {
  configurable: true,
  value: {
    writeText: vi.fn(),
  },
});

Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
  writable: true,
  value: vi.fn(),
});

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

afterEach(() => {
  cleanup();
  window.localStorage?.clear?.();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
