import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";

const go = (hash: string) => {
  window.location.hash = hash;
  return render(
    <HashRouter>
      <App />
    </HashRouter>,
  );
};

beforeEach(() => {
  localStorage.clear();
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
});

describe("app", () => {
  it("renders the home page", () => {
    go("#/bosh");
    expect(screen.getByRole("heading", { level: 1, name: /Konstitutsiyam/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /-modda, / })).toHaveLength(155);
  });

  it("opens the article drawer and records progress", async () => {
    const user = userEvent.setup();
    go("#/bosh");
    await user.click(screen.getByRole("button", { name: /^50-modda,/ }));
    const dlg = screen.getByRole("dialog", { name: /50-modda/ });
    expect(within(dlg).getByText(/Rasmiy matn/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("kh_progress")!).read).toContain(50);
  });

  it("deep link #/modda-50 opens the drawer over search", () => {
    go("#/modda-50");
    expect(screen.getByRole("dialog", { name: /50-modda/ })).toBeInTheDocument();
  });

  it("search finds articles by keyword", async () => {
    const user = userEvent.setup();
    go("#/qidiruv");
    await user.type(screen.getByRole("searchbox"), "internet");
    expect(await screen.findByText(/ta modda topildi/)).toBeInTheDocument();
  });

  it("quiz scores a run and stores the best result", async () => {
    const user = userEvent.setup();
    go("#/sinov");
    await user.click(screen.getByRole("button", { name: /1\. Boshlangʻich/ }));
    for (let i = 0; i < 12; i++) {
      const opt = screen.getAllByRole("button").find((b) => b.className.includes("opt"))!;
      await user.click(opt);
      await user.click(screen.getByRole("button", { name: /Keyingi savol|Natijani koʻrish/ }));
    }
    expect(screen.getByText(/\/12$/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("kh_progress")!).quiz["1"]).toBeGreaterThanOrEqual(0);
  });

  it("navigates between pages without crashing", async () => {
    const user = userEvent.setup();
    go("#/bosh");
    for (const name of ["Mening huquqlarim", "Hayotiy vaziyatlar", "Oʻqituvchi paneli", "Bosh sahifa"]) {
      await user.click(screen.getAllByRole("link", { name: new RegExp("^" + name) })[0]);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    }
  });

  it("assistant finds the article for a described situation", async () => {
    const user = userEvent.setup();
    go("#/vaziyatlar");
    await user.type(screen.getByLabelText("Vaziyatingizni yozing"), "Sinfdoshim telefonimni ochib, xabarlarimni tarqatdi{Enter}");
    expect(await screen.findByRole("button", { name: "31-moddani ochish" })).toBeInTheDocument();
  });

  it("switches the interface to Cyrillic and back", async () => {
    const user = userEvent.setup();
    go("#/bosh");
    await user.click(screen.getAllByRole("button", { name: "Кирилл" })[0]);
    expect(await screen.findByRole("heading", { level: 1, name: /Конституциям/ })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Lotin" })[0]);
    expect(await screen.findByRole("heading", { level: 1, name: /Konstitutsiyam/ })).toBeInTheDocument();
  });

  it("toggles dark theme", async () => {
    const user = userEvent.setup();
    go("#/bosh");
    await user.click(screen.getAllByRole("button", { name: "Tungi rejim" })[0]);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
