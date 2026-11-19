import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { askAI } from "../ai";

const reply = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response);

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_AI_URL", "https://ai.example.test");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("askAI", () => {
  it("keeps only articles we offered", async () => {
    vi.stubGlobal("fetch", reply({ arts: [31, 999, 50], answer: "31-modda boʻyicha…" }));
    expect(await askAI("telefonimni ochishdi", [31, 26])).toEqual({ arts: [31], answer: "31-modda boʻyicha…" });
  });
  it("returns null on errors so the offline result stays", async () => {
    vi.stubGlobal("fetch", reply({}, false));
    expect(await askAI("telefonimni ochishdi", [31])).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await askAI("telefonimni ochishdi", [31])).toBeNull();
  });
  it("does nothing without a configured proxy", async () => {
    vi.stubEnv("VITE_AI_URL", "");
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await askAI("x", [31])).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});

describe("assistant with AI", () => {
  it("shows a labelled AI answer and puts the AI choice first", async () => {
    const f = reply({ arts: [26], answer: "Bu shaʼn va qadr-qimmatga tegishli (26-modda)." });
    vi.stubGlobal("fetch", f);
    const user = userEvent.setup();
    window.location.hash = "#/vaziyatlar";
    render(<HashRouter><App /></HashRouter>);
    await user.type(screen.getByLabelText("Vaziyatingizni yozing"), "Sinfdoshim telefonimni ochib, rasmimni tarqatib masxara qildi{Enter}");
    expect(await screen.findByText(/Bu shaʼn va qadr-qimmatga tegishli/)).toBeInTheDocument();
    expect(screen.getByText("tekshirilmagan")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /-moddani ochish$/ })[0]).toHaveAccessibleName("26-moddani ochish");
    expect(f).toHaveBeenCalledTimes(1); // only on submit, not per keystroke
  });
  it("can be switched off", async () => {
    const f = reply({ arts: [26], answer: "x" });
    vi.stubGlobal("fetch", f);
    const user = userEvent.setup();
    window.location.hash = "#/vaziyatlar";
    render(<HashRouter><App /></HashRouter>);
    await user.click(screen.getByLabelText(/Sunʼiy intellekt javobi/));
    await user.type(screen.getByLabelText("Vaziyatingizni yozing"), "telefonimni ochishdi{Enter}");
    expect(f).not.toHaveBeenCalled();
    expect(screen.getByText(/hech qayerga yuborilmaydi/)).toBeInTheDocument();
  });
});
