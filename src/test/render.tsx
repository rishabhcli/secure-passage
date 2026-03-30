import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import {
  createElement,
  type PropsWithChildren,
  type ReactElement,
} from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createAppQueryClient } from "@/App";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  path?: string;
  queryClient?: ReturnType<typeof createAppQueryClient>;
  route?: string;
}

export function createTestQueryClient() {
  return createAppQueryClient();
}

export function createTestWrapper({
  path,
  queryClient = createTestQueryClient(),
  route = "/",
}: Omit<RenderWithProvidersOptions, "queries"> = {}) {
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={[route]}>
            {path ? (
              <Routes>
                <Route path={path} element={children} />
              </Routes>
            ) : (
              children
            )}
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { queryClient, Wrapper } = createTestWrapper(options);
  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export function renderRoute(
  path: string,
  element: ReactElement,
  route = path,
) {
  return renderWithProviders(createElement(Routes, null, createElement(Route, { path, element })), {
    route,
  });
}
