/* eslint-disable */
/**
 * @file Browser device identity used by the "same device = no OTP" rule.
 * The id is a random UUID kept in localStorage. It is NOT a credential: the server only trusts it after an OTP
 * and only for a limited time, and stores just its hash.
 */

/** localStorage key. Survives session expiry/logout on purpose (see session.js clearAllClientData). */
export const DEVICE_KEY = "wta_device_id";

/**
 * Get this browser's device id, creating and storing one on first use.
 * @returns {string} 16+ char id
 */
export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || id.length < 16) {
      id = (globalThis.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("-");
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode): a throwaway id means the server will simply ask for an OTP every time.
    return "ephemeral-" + Math.random().toString(36).slice(2, 12) + Date.now();
  }
}
