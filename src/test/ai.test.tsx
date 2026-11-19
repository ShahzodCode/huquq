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

describe("floating AI chat", () => {
  it("is announced, answers, and only cites articles we offered", async () => {
    const f = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const offered = body.candidates.map((c: { n: number }) => c.n);
      return { ok: true, json: async () => ({ arts: [offered[0], 999], answer: "Bu haqda Konstitutsiyada aytilgan." }) } as Response;
    });
    vi.stubGlobal("fetch", f);
    const user = userEvent.setup();
    window.location.hash = "#/bosh";
    render(<HashRouter><App /></HashRouter>);
    await user.click(screen.getByRole("button", { name: "AI yordamchi bilan suhbatni ochish" }));
    expect(screen.getByRole("dialog", { name: "AI yordamchi" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Savolingiz"), "Sinfdoshim telefonimni ochib xabarlarimni oʻqidi{Enter}");
    expect(await screen.findByText("Bu haqda Konstitutsiyada aytilgan.")).toBeInTheDocument();
    const body = JSON.parse(String(f.mock.calls[0][1].body));
    expect(body.mode).toBe("chat");
    expect(body.messages).toEqual([{ role: "user", text: "Sinfdoshim telefonimni ochib xabarlarimni oʻqidi" }]);
    const chips = screen.getAllByRole("button", { name: /-moddani ochish$/ }).filter((b) => b.closest(".chat"));
    expect(chips).toHaveLength(1);
    expect(chips[0]).toHaveAccessibleName(`${body.candidates[0].n}-moddani ochish`);
    // Esc first closes the article opened from the chat, then the chat itself
    await user.click(chips[0]);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "AI yordamchi" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "AI yordamchi" })).not.toBeInTheDocument();
  });
  it("sends the conversation history and shows a fallback when the AI fails", async () => {
    let call = 0;
    const f = vi.fn(async () => (++call === 1
      ? ({ ok: true, json: async () => ({ arts: [], answer: "Birinchi javob." }) } as Response)
      : ({ ok: false, json: async () => ({}) } as Response)));
    vi.stubGlobal("fetch", f);
    const user = userEvent.setup();
    window.location.hash = "#/bosh";
    render(<HashRouter><App /></HashRouter>);
    await user.click(screen.getByRole("button", { name: "AI yordamchi bilan suhbatni ochish" }));
    await user.type(screen.getByLabelText("Savolingiz"), "Konstitutsiya nima?{Enter}");
    await screen.findByText("Birinchi javob.");
    await user.type(screen.getByLabelText("Savolingiz"), "Yana tushuntir{Enter}");
    expect(await screen.findByText(/hozir javob bermadi/)).toBeInTheDocument();
    const body = JSON.parse(String((f.mock.calls[1] as unknown as [string, RequestInit])[1].body));
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(["user", "model", "user"]);
  });
  it("is hidden when no AI proxy is configured", () => {
    vi.stubEnv("VITE_AI_URL", "");
    window.location.hash = "#/bosh";
    render(<HashRouter><App /></HashRouter>);
    expect(screen.queryByRole("button", { name: "AI yordamchi bilan suhbatni ochish" })).not.toBeInTheDocument();
  });
});
