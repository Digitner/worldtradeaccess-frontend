import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("../src/utils/APIRequest.js", () => ({ default: { request: vi.fn() } }));
vi.mock("../src/config/ConfigAPIURL.js", () => ({ default: new Proxy({}, { get: (_, k) => `/api/${String(k)}` }) }));

import APIRequest from "../src/utils/APIRequest.js";
import { loginWithPassword, verifyLoginOtp, registerSendOtp, registerVerifyOtp, registerComplete, resendOtp, storeSession } from "../src/utils/authApi.js";
import { getDeviceId } from "../src/utils/device.js";

const reply = (data) => APIRequest.request.mockResolvedValueOnce({ data });
const lastBody = () => JSON.parse(APIRequest.request.mock.calls.at(-1)[2]);
beforeEach(() => { localStorage.clear(); APIRequest.request.mockReset(); });

describe("login", () => {
  test("always sends the device id", async () => {
    reply({ responseCode: 100, otp_required: true });
    await loginWithPassword("a@b.co", "pw");
    expect(lastBody()).toEqual({ email: "a@b.co", password: "pw", device_id: getDeviceId() });
  });
  test("unknown device -> otpRequired and nothing stored", async () => {
    reply({ responseCode: 100, otp_required: true, cooldown: 60 });
    const r = await loginWithPassword("a@b.co", "pw");
    expect(r.otpRequired).toBe(true);
    expect(localStorage.getItem("wta_token")).toBeNull();
  });
  test("trusted device -> tokens, user and expiry stored", async () => {
    reply({ responseCode: 100, accessToken: "AT", refreshToken: "RT", user: { email: "a@b.co" }, member: { company_name: "Co" }, session_expires_at: Date.now() + 1e9 });
    const r = await loginWithPassword("a@b.co", "pw");
    expect(r.user.company_name).toBe("Co");
    expect(localStorage.getItem("wta_token")).toBe("AT");
    expect(localStorage.getItem("wta_refresh")).toBe("RT");
    expect(Number(localStorage.getItem("wta_session_expires"))).toBeGreaterThan(Date.now());
  });
  test("wrong password returns the server message", async () => {
    reply({ responseCode: 118, message: "Invalid email or password" });
    const r = await loginWithPassword("a@b.co", "bad");
    expect(r).toMatchObject({ ok: false, message: "Invalid email or password" });
  });
  test("network failure does not throw", async () => {
    APIRequest.request.mockRejectedValueOnce(new Error("x"));
    expect((await loginWithPassword("a@b.co", "pw")).ok).toBe(false);
  });
  test("verifyLoginOtp stores the session", async () => {
    reply({ responseCode: 100, accessToken: "AT2", user: {}, session_expires_at: Date.now() + 1e9 });
    expect((await verifyLoginOtp("a@b.co", "123456")).ok).toBe(true);
    expect(lastBody()).toMatchObject({ otp: "123456", device_id: getDeviceId() });
    expect(localStorage.getItem("wta_token")).toBe("AT2");
  });
});

describe("register", () => {
  test("send-otp reports a duplicate email", async () => {
    reply({ responseCode: 120, message: "This email is already registered. Please log in." });
    expect((await registerSendOtp("a@b.co")).duplicate).toBe(true);
  });
  test("send-otp ok exposes the cooldown", async () => {
    reply({ responseCode: 100, cooldown: 60 });
    expect(await registerSendOtp("a@b.co")).toMatchObject({ ok: true, cooldown: 60 });
  });
  test("verify-otp stores nothing (no account yet)", async () => {
    reply({ responseCode: 100, verified: true });
    expect((await registerVerifyOtp("a@b.co", "123456")).ok).toBe(true);
    expect(localStorage.getItem("wta_token")).toBeNull();
  });
  test("complete stores the session; duplicates come back as a list", async () => {
    reply({ responseCode: 100, accessToken: "AT", user: { email: "a@b.co" }, member: {}, session_expires_at: Date.now() + 1e9 });
    expect((await registerComplete({ email: "a@b.co", password: "x" })).ok).toBe(true);
    expect(lastBody().device_id).toBe(getDeviceId());
    reply({ responseCode: 120, message: "Company name already registered", duplicate_fields: ["company"] });
    expect((await registerComplete({})).duplicate).toEqual(["company"]);
  });
  test("resend reports the retry-after seconds", async () => {
    reply({ responseCode: 429, message: "wait", retry_after: 42 });
    expect(await resendOtp("a@b.co", "login")).toMatchObject({ ok: false, retryAfter: 42 });
  });
});

test("storeSession falls back to a default expiry when the server sends none", () => {
  storeSession({ accessToken: "t", user: {} });
  expect(Number(localStorage.getItem("wta_session_expires"))).toBeGreaterThan(Date.now());
});

import { forgotPasswordSend, forgotPasswordReset, setFirstPassword } from "../src/utils/authApi.js";
describe("forgot / first password", () => {
  test("forgot send posts the email", async () => {
    reply({ responseCode: 100 });
    expect((await forgotPasswordSend("a@b.co")).ok).toBe(true);
    expect(lastBody()).toEqual({ email: "a@b.co" });
  });
  test("reset sends code, password and device id, and stores the session", async () => {
    reply({ responseCode: 100, accessToken: "AT", user: {}, session_expires_at: Date.now() + 1e9 });
    const r = await forgotPasswordReset("a@b.co", "123456", "Newpass123");
    expect(r.ok).toBe(true);
    expect(lastBody()).toMatchObject({ otp: "123456", password: "Newpass123", device_id: getDeviceId() });
    expect(localStorage.getItem("wta_token")).toBe("AT");
  });
  test("reset failure returns the message and stores nothing", async () => {
    reply({ responseCode: 118, message: "Incorrect code. Please try again." });
    const r = await forgotPasswordReset("a@b.co", "000000", "Newpass123");
    expect(r).toMatchObject({ ok: false, message: "Incorrect code. Please try again." });
    expect(localStorage.getItem("wta_token")).toBeNull();
  });
  test("setFirstPassword posts only the password", async () => {
    reply({ responseCode: 100 });
    expect((await setFirstPassword("Newpass123")).ok).toBe(true);
    expect(lastBody()).toEqual({ password: "Newpass123" });
  });
});

import { loginStart } from "../src/utils/authApi.js";
describe("loginStart", () => {
  test.each(["password", "code", "new"])("passes through status %s", async (status) => {
    reply({ responseCode: 100, status });
    expect(await loginStart("a@b.co")).toMatchObject({ ok: true, status });
    expect(lastBody()).toEqual({ email: "a@b.co" });
  });
  test("network failure is not ok", async () => {
    APIRequest.request.mockRejectedValueOnce(new Error("x"));
    expect((await loginStart("a@b.co")).ok).toBe(false);
  });
});
