/* eslint-disable */
/**
 * @file Blocking "set your password" popup for accounts created before passwords existed.
 * It cannot be dismissed: the only ways out are setting a password or logging out. Admins are exempt
 * because they sign in with a one-time code.
 */
import { setFirstPassword } from "./authApi.js";
import { validators } from "./fields.js";
import LocalStorage from "../config/LocalStorage.js";

const GATE_ID = "pwGate";

/**
 * Does this user still have to choose a password?
 * @param {object|null} user logged-in user (from state.USER)
 * @returns {boolean}
 */
export function needsPassword(user) {
  return !!user && user.role !== "admin" && user.password_set !== true;
}

/**
 * Show the gate when needed, or remove it when not. Safe to call on every route change.
 * @param {object|null} user logged-in user
 * @param {{onDone?:()=>void, onLogout?:()=>void}} [hooks] callbacks for success and for "Log out"
 * @returns {HTMLElement|null} the overlay when shown
 */
export function enforcePasswordGate(user, hooks = {}) {
  const existing = document.getElementById(GATE_ID);
  if (!needsPassword(user)) { existing?.remove(); return null; }
  if (existing) { existing.__hooks = { ...existing.__hooks, ...hooks }; return existing; }

  const el = document.createElement("div");
  el.__hooks = hooks;
  el.id = GATE_ID;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(7,24,49,.82);display:grid;place-items:center;padding:20px";
  el.innerHTML = `
    <form class="card" id="pwGateForm" novalidate style="max-width:420px;width:100%">
      <span class="kicker">New update</span>
      <h2 style="margin:6px 0 8px">Set your password</h2>
      <p class="muted" style="margin:0 0 16px">We have upgraded sign-in. Please set a password to keep using WorldTradeAccess. You can use the site again as soon as it is saved.</p>
      <div class="field field--mandatory"><label for="pg_pw">Password</label>
        <input id="pg_pw" type="password" autocomplete="new-password" placeholder="8+ characters, a letter and a number">
        <div class="err-msg">Use 8+ characters with at least one letter and one number</div></div>
      <div class="field field--mandatory" style="margin-top:12px"><label for="pg_pw2">Confirm password</label>
        <input id="pg_pw2" type="password" autocomplete="new-password" placeholder="Repeat password">
        <div class="err-msg">Passwords do not match</div></div>
      <button class="btn btn-primary btn-block" id="pg_save" type="submit" style="margin-top:16px">Save password</button>
      <button class="linkish" id="pg_logout" type="button" style="display:block;margin:12px auto 0">Log out instead</button>
    </form>`;
  document.body.appendChild(el);

  const pw = el.querySelector("#pg_pw"), pw2 = el.querySelector("#pg_pw2");
  /** Toggle the error state of one input. @param {HTMLInputElement} i @param {boolean} bad */
  const mark = (i, bad) => { i.classList.toggle("err", bad); i.closest(".field").querySelector(".err-msg").classList.toggle("show", bad); };
  // Esc / outside clicks must not close it.
  el.addEventListener("keydown", (e) => { if (e.key === "Escape") e.preventDefault(); });

  el.querySelector("#pwGateForm").onsubmit = async (e) => {
    e.preventDefault();
    const okA = validators.password(pw.value), okB = pw2.value === pw.value && pw2.value !== "";
    mark(pw, !okA); mark(pw2, !okB);
    if (!okA || !okB) return;
    const btn = el.querySelector("#pg_save");
    btn.disabled = true; btn.textContent = "Saving…";
    const r = await setFirstPassword(pw.value);
    if (!r.ok) {
      btn.disabled = false; btn.textContent = "Save password";
      pw.closest(".field").querySelector(".err-msg").textContent = r.message || "Could not save the password.";
      mark(pw, true);
      return;
    }
    user.password_set = true;
    LocalStorage.setUser(user, LocalStorage.memberDetails);
    el.remove();
    el.__hooks.onDone && el.__hooks.onDone();
  };
  el.querySelector("#pg_logout").onclick = () => {
    if (el.__hooks.onLogout) return el.__hooks.onLogout();
    import("../pages/Login/Login.js").then((m) => m.logout());
  };
  setTimeout(() => pw.focus(), 30);
  return el;
}
