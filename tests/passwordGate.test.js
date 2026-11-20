import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../src/utils/authApi.js", () => ({ setFirstPassword: vi.fn() }));
import { setFirstPassword } from "../src/utils/authApi.js";
import { needsPassword, enforcePasswordGate } from "../src/utils/passwordGate.js";

const tick = () => new Promise((r) => setTimeout(r, 0));
const submit = () => document.getElementById("pwGateForm").dispatchEvent(new Event("submit", { cancelable: true }));
const fill = (a, b) => { document.getElementById("pg_pw").value = a; document.getElementById("pg_pw2").value = b; };
beforeEach(() => { document.body.innerHTML = ""; setFirstPassword.mockReset(); });

describe("needsPassword", () => {
  test.each([
    [null, false],
    [{ role: "member", password_set: true }, false],
    [{ role: "member", password_set: false }, true],
    [{ role: "member" }, true],
    [{ role: "admin", password_set: false }, false],
  ])("%j -> %s", (u, out) => expect(needsPassword(u)).toBe(out));
});

describe("blocking popup", () => {
  test("is shown for a member without a password, only once", () => {
    const u = { role: "member" };
    enforcePasswordGate(u); enforcePasswordGate(u);
    expect(document.querySelectorAll("#pwGate").length).toBe(1);
    expect(document.querySelector("#pwGate").getAttribute("aria-modal")).toBe("true");
  });
  test("is not shown (and is removed) once a password exists", () => {
    enforcePasswordGate({ role: "member" });
    enforcePasswordGate({ role: "member", password_set: true });
    expect(document.getElementById("pwGate")).toBeNull();
  });
  test("Escape cannot close it", () => {
    enforcePasswordGate({ role: "member" });
    const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.getElementById("pwGate").dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(document.getElementById("pwGate")).not.toBeNull();
  });
  test("weak or mismatched passwords are rejected without calling the server", async () => {
    enforcePasswordGate({ role: "member" });
    fill("short", "short"); submit(); await tick();
    expect(document.getElementById("pg_pw").classList.contains("err")).toBe(true);
    fill("Goodpass1", "Different1"); submit(); await tick();
    expect(document.getElementById("pg_pw2").classList.contains("err")).toBe(true);
    expect(setFirstPassword).not.toHaveBeenCalled();
    expect(document.getElementById("pwGate")).not.toBeNull();
  });
  test("a valid password is saved, the popup closes and the user is marked", async () => {
    setFirstPassword.mockResolvedValue({ ok: true });
    const user = { role: "member" }; const done = vi.fn();
    enforcePasswordGate(user, { onDone: done });
    fill("Goodpass1", "Goodpass1"); submit(); await tick(); await tick();
    expect(setFirstPassword).toHaveBeenCalledWith("Goodpass1");
    expect(user.password_set).toBe(true);
    expect(document.getElementById("pwGate")).toBeNull();
    expect(done).toHaveBeenCalled();
  });
  test("a server failure keeps the popup open and shows the message", async () => {
    setFirstPassword.mockResolvedValue({ ok: false, message: "Nope" });
    enforcePasswordGate({ role: "member" });
    fill("Goodpass1", "Goodpass1"); submit(); await tick(); await tick();
    expect(document.getElementById("pwGate")).not.toBeNull();
    expect(document.querySelector("#pg_pw").parentElement.querySelector(".err-msg").textContent).toBe("Nope");
  });
  test("'Log out instead' calls the logout hook", () => {
    const out = vi.fn();
    enforcePasswordGate({ role: "member" }, { onLogout: out });
    document.getElementById("pg_logout").click();
    expect(out).toHaveBeenCalled();
  });
});
