import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

describe("NavLink", () => {
  it("merges active classes from the current route", () => {
    render(
      <MemoryRouter initialEntries={["/airlock"]}>
        <NavLink
          to="/airlock"
          className="base-link"
          activeClassName="active-link"
        >
          Dashboard
        </NavLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass(
      "base-link",
      "active-link",
    );
  });
});
