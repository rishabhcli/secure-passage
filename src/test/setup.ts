import "@testing-library/jest-dom";
import React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, tagName: string) =>
        React.forwardRef<HTMLElement, Record<string, unknown>>(
          (props, ref) => {
            const {
              animate: _a,
              children,
              exit: _e,
              initial: _i,
              layout: _l,
              transition: _t,
              variants: _v,
              whileHover: _wh,
              whileTap: _wt,
              whileInView: _wiv,
              dragConstraints: _dc,
              onDragEnd: _ode,
              ...rest
            } = props as any;
            return React.createElement(tagName, { ...rest, ref }, children as React.ReactNode);
          },
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
