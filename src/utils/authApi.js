/* eslint-disable */
/**
 * @file API calls for OTP sign-up and password login with new-device OTP. Every call attaches the device id.
 * Each function resolves to a small result object and never throws; user-facing errors are returned in `message`.
 */
import APIRequest from "./APIRequest.js";
import ConfigAPIURL from "../config/ConfigAPIURL.js";
import LocalStorage from "../config/LocalStorage.js";
import { getDeviceId } from "./device.js";
import { setSessionExpiry } from "./session.js";

/**
 * POST helper: JSON body in, `{ok, d}` out. `ok` means responseCode 100.
 * @param {string} url
 * @param {object} body
 * @returns {Promise<{ok:boolean, d:object}>}
 */
async function post(url, body) {
  try {
    const r = await APIRequest.request("POST", url, JSON.stringify(body));
    const d = r?.data && typeof r.data === "object" ? r.data : {};
    return { ok: d.responseCode === 100, d };
  } catch {
    return { ok: false, d: { message: "Network error. Please try again." } };
  }
}

/**
 * Persist a successful login/sign-up response: tokens, user, and the session expiry used for auto-logout.
 * @param {object} d server `data` payload ({accessToken, refreshToken, user, member, session_expires_at})
 * @returns {object} merged user object (member + user fields)
 */
export function storeSession(d) {
  if (d.accessToken) localStorage.setItem("wta_token", d.accessToken);
  if (d.refreshToken) localStorage.setItem("wta_refresh", d.refreshToken);
  setSessionExpiry(d.session_expires_at);
  const user = { ...(d.member || {}), ...(d.user || {}) };
  LocalStorage.setUser(user, d.member);
  return user;
}

/** @param {string} email @returns {Promise<{ok:boolean,message?:string,retryAfter?:number,cooldown?:number}>} */
export async function registerSendOtp(email) {
  const { ok, d } = await post(ConfigAPIURL.registerSendOtp, { email });
  return { ok, message: d.message, retryAfter: d.retry_after, cooldown: d.cooldown, duplicate: d.responseCode !== 100 && /already registered/i.test(d.message || "") };
}

/** @param {string} email @param {string} otp @returns {Promise<{ok:boolean,message?:string}>} */
export async function registerVerifyOtp(email, otp) {
  const { ok, d } = await post(ConfigAPIURL.registerVerifyOtp, { email, otp });
  return { ok, message: d.message };
}

/**
 * Create the account (server requires the OTP above to have been verified).
 * @param {object} profile email, password and profile fields
 * @returns {Promise<{ok:boolean,user?:object,message?:string,duplicate?:string[]}>}
 */
export async function registerComplete(profile) {
  const { ok, d } = await post(ConfigAPIURL.registerComplete, { ...profile, device_id: getDeviceId() });
  if (ok) return { ok, user: storeSession(d) };
  return { ok, message: d.message, duplicate: Array.isArray(d.duplicate_fields) ? d.duplicate_fields : undefined };
}

/**
 * Email + password login. Returns `{otpRequired:true}` on an unknown device (server has emailed a code).
 * @param {string} email @param {string} password
 * @returns {Promise<{ok:boolean,otpRequired?:boolean,user?:object,message?:string,cooldown?:number}>}
 */
export async function loginWithPassword(email, password) {
  const { ok, d } = await post(ConfigAPIURL.login, { email, password, device_id: getDeviceId() });
  if (ok && d.otp_required) return { ok: true, otpRequired: true, cooldown: d.cooldown, message: d.message };
  if (ok) return { ok, user: storeSession(d) };
  return { ok, message: d.message };
}

/** @param {string} email @param {string} otp @returns {Promise<{ok:boolean,user?:object,message?:string}>} */
export async function verifyLoginOtp(email, otp) {
  const { ok, d } = await post(ConfigAPIURL.loginVerifyOtp, { email, otp, device_id: getDeviceId() });
  if (ok) return { ok, user: storeSession(d) };
  return { ok, message: d.message };
}

/** @param {string} email @param {"register"|"login"} purpose @returns {Promise<{ok:boolean,message?:string,retryAfter?:number}>} */
export async function resendOtp(email, purpose) {
  const { ok, d } = await post(ConfigAPIURL.resendOtp, { email, purpose });
  return { ok, message: d.message, retryAfter: d.retry_after };
}

/** Forgot password step 1: email a reset code (reply is identical for unknown emails). @param {string} email @returns {Promise<{ok:boolean,message?:string,retryAfter?:number}>} */
export async function forgotPasswordSend(email) {
  const { ok, d } = await post(ConfigAPIURL.forgotPasswordOtp, { email });
  return { ok, message: d.message, retryAfter: d.retry_after };
}

/**
 * Forgot password step 2: code + new password. On success the person is signed in.
 * @param {string} email @param {string} otp @param {string} password
 * @returns {Promise<{ok:boolean,user?:object,message?:string}>}
 */
export async function forgotPasswordReset(email, otp, password) {
  const { ok, d } = await post(ConfigAPIURL.resetPasswordOtp, { email, otp, password, device_id: getDeviceId() });
  if (ok) return { ok, user: storeSession(d) };
  return { ok, message: d.message };
}

/**
 * First-time password for accounts made before passwords existed (signed-in call).
 * @param {string} password
 * @returns {Promise<{ok:boolean,message?:string}>}
 */
export async function setFirstPassword(password) {
  const { ok, d } = await post(ConfigAPIURL.setPassword, { password });
  return { ok, message: d.message };
}

/**
 * Login step 1: ask the server what this email needs. For an account with no password the server also emails a code.
 * @param {string} email
 * @returns {Promise<{ok:boolean,status?:"password"|"code"|"new",message?:string}>}
 */
export async function loginStart(email) {
  const { ok, d } = await post(ConfigAPIURL.loginStart, { email });
  return { ok, status: d.status, message: d.message };
}
