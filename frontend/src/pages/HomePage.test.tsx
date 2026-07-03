import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import HomePage from "./HomePage";
import type { User } from "../lib/types";

function renderHomePage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    </MemoryRouter>
  );
}

const MOCK_USER: User = {
  id: "1",
  email: "student@example.com",
  name: "Test Student",
  role: "student",
  is_master: false,
  created_at: new Date().toISOString(),
};

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("shows guest CTAs when not authenticated", () => {
    renderHomePage();

    expect(screen.getByRole("link", { name: /get started free/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /sign in/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /try as guest/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /go to dashboard/i })).not.toBeInTheDocument();
  });

  it("shows the dashboard CTA instead of guest CTAs when authenticated", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify(MOCK_USER));

    renderHomePage();

    expect(screen.getAllByRole("link", { name: /go to dashboard|browse courses/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /get started free/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try as guest/i })).not.toBeInTheDocument();
  });

  it("advertises the AI Tutor Chat and Detailed Results Review features", () => {
    renderHomePage();

    expect(screen.getAllByText("AI Tutor Chat").length).toBeGreaterThan(0);
    expect(screen.getByText("Detailed Results Review")).toBeInTheDocument();
  });

  it("renders the AI tutor showcase section", () => {
    renderHomePage();

    expect(
      screen.getByRole("heading", { name: /understand it/i })
    ).toBeInTheDocument();
  });
});
