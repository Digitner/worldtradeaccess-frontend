/* eslint-disable */
/**
 * @file Client-side session lifetime: expiry stamp, full wipe on expiry, and "return to where you were".
 * The server enforces the same length in the JWT (SESSION_DAYS); this is the user-facing half.
 */
import { DEVICE_KEY } from "./device.js";

const EXP_KEY = "wta_session_expires";
const NOTICE_KEY = "wta_session_notice";
const RETURN_KEY = "wta_return_to";
const DAY_MS = 86400000;
/** Default session length in days (the server clamps its own to 5-7). */
export const SESSION_DAYS = 7;

/**
 * Record when this login stops being valid.
 * @param {number} [expiresAtMs] absolute ms timestamp from the server; defaults to now + SESSION_DAYS
 * @returns {number} the stored expiry (ms)
 */
export function setSessionExpiry(expiresAtMs) {
  const at = Number(expiresAtMs) > Date.now() ? Number(expiresAtMs) : Date.now() + SESSION_DAYS * DAY_MS;
  localStorage.setItem(EXP_KEY, String(at));
  return at;
}

/** @returns {number|null} stored expiry in ms, or null when none */
export function getSessionExpiry() {
  const n = Number(localStorage.getItem(EXP_KEY));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param {number} [now] ms, injectable for tests
 * @returns {boolean} true when a session was recorded and its time is up
 */
export function isSessionExpired(now = Date.now()) {
  const exp = getSessionExpiry();
  return exp !== null && now >= exp;
}

/**
 * Remove everything this app stored in the browser: localStorage, sessionStorage, Cache Storage and
 * script-visible cookies. The device id is kept so that "same device" still means something after a
 * forced logout; it is useless without the password and is time-limited server-side.
 * @returns {Promise<void>}
 */
export async function clearAllClientData() {
  let device = null;
  try { device = localStorage.getItem(DEVICE_KEY); } catch {}
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
  try {
    if (globalThis.caches) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
  } catch {}
  try {
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  } catch {}
  try { if (device) localStorage.setItem(DEVICE_KEY, device); } catch {}
}

/**
 * End the session: wipe client data, leave a one-shot notice for the login page, and go to login.
 * @param {"expired"|"invalid"} [reason] controls the message shown
 * @returns {Promise<void>}
 */
export async function expireSession(reason = "expired") {
  await clearAllClientData();
  try { sessionStorage.setItem(NOTICE_KEY, reason); } catch {}
  window.location.hash = "#/login";
}

/**
 * Read-and-clear the notice left by expireSession.
 * @returns {string|null} user-facing message, or null
 */
export function takeSessionNotice() {
  let r = null;
  try { r = sessionStorage.getItem(NOTICE_KEY); sessionStorage.removeItem(NOTICE_KEY); } catch {}
  if (!r) return null;
  return r === "expired" ? "Your session has expired. Please log in again." : "Please log in again.";
}

/**
 * Check the clock now and on a timer, so a tab left open is logged out at the exact moment, not at the next click.
 * @param {()=>void} [onExpire] extra work (e.g. reset in-memory user)
 * @param {number} [everyMs] poll interval
 * @returns {()=>void} stop function
 */
export function startSessionWatch(onExpire, everyMs = 30000) {
  const check = () => { if (isSessionExpired()) { onExpire && onExpire(); expireSession("expired"); } };
  check();
  const t = setInterval(check, everyMs);
  const vis = () => { if (document.visibilityState === "visible") check(); };
  document.addEventListener("visibilitychange", vis);
  return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
}

/** Remember the page a visitor wanted, so login/sign-up can send them straight back to it. @param {string} hash e.g. "#/edit" */
export function rememberReturnTo(hash) {
  if (!hash || /^#\/(login|register)/.test(hash)) return;
  try { sessionStorage.setItem(RETURN_KEY, hash); } catch {}
}

/** @param {string} [fallback] used when nothing was remembered @returns {string} hash to navigate to (one-shot) */
export function takeReturnTo(fallback = "#/dashboard") {
  let h = null;
  try { h = sessionStorage.getItem(RETURN_KEY); sessionStorage.removeItem(RETURN_KEY); } catch {}
  return h && h.startsWith("#/") ? h : fallback;
}
