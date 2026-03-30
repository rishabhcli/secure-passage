import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "@/pages/NotFound";

describe("NotFound", () => {
  it("logs the missing route and renders recovery navigation", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(
      "404 Error: User attempted to access non-existent route:",
      "/does-not-exist",
    );
  });
});
