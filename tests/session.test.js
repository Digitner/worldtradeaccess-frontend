import { describe, test, expect, beforeEach, vi } from "vitest";
import { setSessionExpiry, getSessionExpiry, isSessionExpired, clearAllClientData, expireSession, takeSessionNotice, rememberReturnTo, takeReturnTo, startSessionWatch, SESSION_DAYS } from "../src/utils/session.js";
import { getDeviceId, DEVICE_KEY } from "../src/utils/device.js";

const DAY = 86400000;
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); window.location.hash = ""; });

describe("session expiry", () => {
  test("defaults to the configured number of days", () => {
    const at = setSessionExpiry();
    expect(at - Date.now()).toBeGreaterThan((SESSION_DAYS - 0.01) * DAY);
    expect(getSessionExpiry()).toBe(at);
  });
  test("uses the server value when it is in the future, ignores a past one", () => {
    const future = Date.now() + 5 * DAY;
    expect(setSessionExpiry(future)).toBe(future);
    expect(setSessionExpiry(1)).toBeGreaterThan(Date.now());
  });
  test("isSessionExpired is false without a stamp, false before, true at/after", () => {
    expect(isSessionExpired()).toBe(false);
    setSessionExpiry(Date.now() + 1000);
    expect(isSessionExpired(Date.now())).toBe(false);
    expect(isSessionExpired(Date.now() + 1000)).toBe(true);
  });
});

describe("expiry wipe", () => {
  test("clears local/session storage and cookies but keeps the device id", async () => {
    const dev = getDeviceId();
    localStorage.setItem("wta_token", "t"); localStorage.setItem("wta_user", "{}"); sessionStorage.setItem("k", "v");
    document.cookie = "a=1; path=/";
    await clearAllClientData();
    expect(localStorage.getItem("wta_token")).toBeNull();
    expect(localStorage.getItem("wta_user")).toBeNull();
    expect(sessionStorage.getItem("k")).toBeNull();
    expect(document.cookie).not.toContain("a=1");
    expect(localStorage.getItem(DEVICE_KEY)).toBe(dev);
  });
  test("deletes Cache Storage entries when available", async () => {
    const del = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", { keys: async () => ["c1", "c2"], delete: del });
    await clearAllClientData();
    expect(del).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
  test("expireSession wipes, redirects to login and leaves the 'session expired' notice once", async () => {
    localStorage.setItem("wta_token", "t");
    await expireSession("expired");
    expect(localStorage.getItem("wta_token")).toBeNull();
    expect(window.location.hash).toBe("#/login");
    expect(takeSessionNotice()).toMatch(/session has expired.*log in again/i);
    expect(takeSessionNotice()).toBeNull();
  });
  test("watch logs out an expired session immediately and calls the hook", async () => {
    setSessionExpiry(Date.now() + 5 * DAY);
    localStorage.setItem("wta_session_expires", String(Date.now() - 1));
    const hook = vi.fn();
    const stop = startSessionWatch(hook, 100000);
    await new Promise((r) => setTimeout(r, 10));
    expect(hook).toHaveBeenCalled();
    expect(window.location.hash).toBe("#/login");
    stop();
  });
  test("watch leaves a live session alone", () => {
    setSessionExpiry(Date.now() + DAY);
    const hook = vi.fn(); const stop = startSessionWatch(hook, 100000);
    expect(hook).not.toHaveBeenCalled(); stop();
  });
});

describe("return-to", () => {
  test("remembers a protected page and returns it once", () => {
    rememberReturnTo("#/edit");
    expect(takeReturnTo()).toBe("#/edit");
    expect(takeReturnTo()).toBe("#/dashboard");
  });
  test("never remembers login/register or non-hash values", () => {
    rememberReturnTo("#/login"); rememberReturnTo("#/register?x=1"); rememberReturnTo("https://evil.com");
    expect(takeReturnTo("#/home")).toBe("#/home");
  });
  test("rejects an external redirect even if stored", () => {
    sessionStorage.setItem("wta_return_to", "https://evil.com");
    expect(takeReturnTo()).toBe("#/dashboard");
  });
});

describe("device id", () => {
  test("is generated once and then stable", () => {
    const a = getDeviceId();
    expect(a.length).toBeGreaterThanOrEqual(16);
    expect(getDeviceId()).toBe(a);
  });
  test("replaces a too-short stored id", () => {
    localStorage.setItem(DEVICE_KEY, "short");
    expect(getDeviceId().length).toBeGreaterThanOrEqual(16);
  });
});
