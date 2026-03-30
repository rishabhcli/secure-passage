import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

describe("ProtectedRoute", () => {
  it("shows the loading state while auth is resolving", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    render(
      <MemoryRouter initialEntries={["/airlock"]}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("VERIFYING IDENTITY…")).toBeInTheDocument();
  });

  it("redirects anonymous users to login", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/airlock"]}>
        <Routes>
          <Route
            path="/airlock"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-001" },
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
