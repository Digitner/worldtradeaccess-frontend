/* eslint-disable */
/* "My activity": optional click tracking, used to improve match recommendations.
   - A member opts in (or out) from the login/register form, the dashboard or My activity.
   - What is recorded: pages opened, links/buttons selected and member pages viewed. Never what is typed.
   - Events are kept in this browser and, while logged in, sent to POST /api/me/activity (GET reads them back,
     DELETE removes them). If that endpoint is not available yet, the browser copy keeps working on its own. */
import { toast } from '../components/Toasts/toast.js';
import { FOR_T } from '../constant/content.js';
import LocalStorage from '../config/LocalStorage.js';
import ConfigAPIURL from '../config/ConfigAPIURL.js';
import APIRequest from './APIRequest.js';
import { $, esc, fmtShort, load, save } from './helpers.js';
import { curBase, route } from './router.js';
import { state } from './state.js';

export const NOTICE_VERSION = "2026-11b";
export const ACTIVITY_DAYS = 365;
const KEY_ACTIVITY = "wta_activity_v1";
const KEY_CONSENT = "wta_consent_v1";
let SERVER_FAILS = 0, LAST_PULL = 0;
const srvOff = () => { try { return sessionStorage.getItem("wta_act_srv") === "off"; } catch (e) { return false; } };
function markServerOff() { try { sessionStorage.setItem("wta_act_srv", "off"); } catch (e) {} }
const canSync = () => !srvOff() && !!currentUser() && !!(typeof localStorage !== "undefined" && localStorage.getItem("wta_token"));

export const PAGE_NAME = { "": "Home", search: "Find matches", directory: "Directory", funding: "Funding", news: "News", about: "About", contact: "Contact", register: "Membership", login: "Log in", dashboard: "Dashboard", privacy: "Privacy", member: "Member", deal: "Opportunity", edit: "Your listing", admin: "Admin", how: "How it works", for: "Who it's for", sectors: "Sectors", network: "Network", membership: "Membership", faq: "Questions", activity: "My activity" };

let ACTIVITY = load(KEY_ACTIVITY, []).filter(e => Date.now() - e.at < ACTIVITY_DAYS * 864e5);
let TRACK_QUEUE = [];

export function currentUser() { return state.USER || LocalStorage.userDetails || null; }
export function acctId(u) { u = u || currentUser(); return String((u && (u.email || u._id || u.id)) || "").trim().toLowerCase(); }
export function userLabel(u) { u = u || currentUser() || {}; return u.contact_person || u.person || u.company_name || u.name || ""; }
export function userCompany(u) { u = u || currentUser() || {}; return u.company_name || u.name || ""; }

/* ---------- consent ---------- */
function consents() { return load(KEY_CONSENT, {}); }
export function consentOf(u) { const id = acctId(u); return id ? consents()[id] || null : null; }
export function consentState(u) { const c = consentOf(u); if (!c || c.version !== NOTICE_VERSION) return "unset"; return c.status; }
export function trackingOn() { return !!currentUser() && consentState() === "granted"; }

export function setConsent(status, method, u) {
  const id = acctId(u); if (!id) return;
  if (status !== "granted") flushActivity(true);
  const all = consents(); all[id] = { status, at: Date.now(), version: NOTICE_VERSION, method }; save(KEY_CONSENT, all);
  if (canSync()) APIRequest.request("POST", ConfigAPIURL.myActivityConsent, JSON.stringify({ status, version: NOTICE_VERSION, method })).catch(() => {});
}
/* Reads the checkbox from the login/register consent block, once the person is signed in. */
export function applyConsentFromForm(checkboxId, method) {
  const box = $("#" + checkboxId); if (!box) return;
  const was = consentState(), agreed = box.checked;
  if (was !== "granted" && (agreed || was === "unset")) setConsent(agreed ? "granted" : "declined", method);
}
export function dashConsent(status) {
  setConsent(status, "Dashboard");
  toast(status === "granted" ? "Click tracking on" : "Click tracking off", status === "granted" ? "You can stop it at any time." : "Nothing more will be recorded.");
  route(true);
}

export function noticeHTML() {
  return `<dl class="notice">
  <dt>What we record</dt><dd>The pages you open, and the links and buttons you select, with the time and your account. Tracking runs only while you are logged in.</dd>
  <dt>What we don't record</dt><dd>What you type. Passwords, messages and other form entries are never part of click tracking. Forms you choose to submit are stored separately so the chamber can act on them.</dd>
  <dt>Why</dt><dd>To suggest better matches and opportunities for you, and to understand how members use the platform so it can be improved.</dd>
  <dt>Who can see it</dt><dd>You, in My activity. It is saved with your account, so administrators of the BRICS-ASEAN Chamber of Commerce and Digitner Tech Solutions, the platform's technical partner, can also see it.</dd>
  <dt>How long we keep it</dt><dd>Up to ${Math.round(ACTIVITY_DAYS / 30.4)} months, unless you delete it sooner.</dd>
  <dt>Your choices</dt><dd>Tracking is optional, and saying no doesn't limit your account. You can view your activity, stop tracking or delete your activity at any time from your dashboard. For anything else, <a class="linkish" href="#/contact">contact the chamber</a>.</dd>
</dl>`;
}
export function consentBlock(id, note) {
  return `<div class="consent" id="${id}_box">
  <h3>Your activity on this site</h3>
  <div id="${id}_ask"><label class="consent-check" for="${id}"><input type="checkbox" id="${id}"><span>I agree that WorldTradeAccess may record what I click while I'm logged in, to suggest better matches for me.</span></label>
  <p>This is optional. ${note} You can change your choice at any time in your dashboard.</p></div>
  <details><summary>What this means</summary>${noticeHTML()}</details>
</div>`;
}

/* ---------- recording ---------- */
export function logActivity(type, label, extra) {
  const u = currentUser();
  if (!u || !trackingOn() || curBase() === "admin") return;
  const ev = { at: Date.now(), type, label: String(label || "").replace(/\s+/g, " ").trim().slice(0, 90), page: location.hash || "#/", acct: acctId(u), email: u.email, name: userLabel(u), company: userCompany(u), ...extra };
  ACTIVITY.unshift(ev); ACTIVITY = ACTIVITY.slice(0, 3000); save(KEY_ACTIVITY, ACTIVITY); TRACK_QUEUE.push(ev);
}
export function myActivity() { const id = acctId(); return id ? ACTIVITY.filter(e => e.acct === id).sort((x, y) => y.at - x.at) : []; }
export function flushActivity(leaving) {
  if (!TRACK_QUEUE.length) return;
  const batch = TRACK_QUEUE; TRACK_QUEUE = [];
  if (!canSync() || !trackingOn()) return;
  const c = consentOf();
  const body = JSON.stringify({ notice: NOTICE_VERSION, consent: c ? { status: c.status, at: c.at, version: c.version } : null, events: batch });
  if (leaving) {
    try { fetch(ConfigAPIURL.myActivity, { method: "POST", keepalive: true, credentials: "include", headers: { "Content-Type": "application/json", authtoken: localStorage.getItem("wta_token") || "" }, body }); } catch (e) {}
    return;
  }
  APIRequest.request("POST", ConfigAPIURL.myActivity, body).then(r => {
    if (r && r.data && r.data.responseCode === 100) { SERVER_FAILS = 0; return; }
    TRACK_QUEUE = batch.concat(TRACK_QUEUE).slice(0, 500);
    if (++SERVER_FAILS >= 3) markServerOff();
  }).catch(() => {});
}
/* Reads this account's saved activity from the server and merges it with the browser copy. */
export async function pullActivity(force) {
  if (!canSync() || !trackingOn()) return;
  if (!force && Date.now() - LAST_PULL < 60000) return;
  LAST_PULL = Date.now();
  try {
    const r = await APIRequest.request("GET", ConfigAPIURL.myActivity, "");
    const d = r && r.data;
    if (!d || d.responseCode !== 100) { if (++SERVER_FAILS >= 3) markServerOff(); return; }
    SERVER_FAILS = 0;
    const rows = d.events || d.result || d.activity || [];
    const seen = new Set(ACTIVITY.map(e => e.at + "|" + e.type + "|" + e.label));
    const id = acctId();
    rows.forEach(x => {
      const at = typeof x.at === "number" ? x.at : Date.parse(x.at || x.createdAt);
      if (!at || seen.has(at + "|" + x.type + "|" + x.label)) return;
      ACTIVITY.push({ ...x, at, acct: x.acct || id });
    });
    ACTIVITY.sort((p, q) => q.at - p.at); ACTIVITY = ACTIVITY.slice(0, 3000); save(KEY_ACTIVITY, ACTIVITY);
  } catch (e) {}
}
/* What this member looks at: sectors, countries and goals of the member pages they opened. */
export function interests() {
  const sec = new Map(), cty = new Map(), goal = new Map();
  myActivity().filter(e => e.type === "View").forEach(e => {
    if (e.sector) sec.set(e.sector, (sec.get(e.sector) || 0) + 1);
    if (e.country) cty.set(e.country, (cty.get(e.country) || 0) + 1);
    if (e.goal) goal.set(e.goal, (goal.get(e.goal) || 0) + 1);
  });
  const top = m => [...m.entries()].sort((a, b) => b[1] - a[1]);
  return { sectors: top(sec), countries: top(cty), goals: top(goal), sec, cty, goal, total: [...sec.values()].reduce((a, b) => a + b, 0) };
}
export function deleteMyActivity() {
  const mine = acctId();
  TRACK_QUEUE = TRACK_QUEUE.filter(e => e.acct !== mine);
  ACTIVITY = ACTIVITY.filter(e => e.acct !== mine); save(KEY_ACTIVITY, ACTIVITY);
  if (canSync()) APIRequest.request("DELETE", ConfigAPIURL.myActivity, "").catch(() => {});
  toast("Activity deleted", "Your recorded clicks have been removed."); route(true);
}
export function initTracking() {
  setInterval(flushActivity, 15000);
  addEventListener("pagehide", () => flushActivity(true));
  setTimeout(() => pullActivity(true), 1500);
  document.addEventListener("click", e => {
    if (!trackingOn()) return;
    const t = e.target.closest && e.target.closest("a,button,summary,[role=tab],[role=button],tr[tabindex]"); if (!t || t.closest("[data-no-track]")) return;
    const named = t.querySelector("b,h3,.mkt-name"); const label = t.getAttribute("aria-label") || (named && named.textContent) || t.textContent;
    logActivity(t.tagName === "A" ? "Link" : "Button", label);
  }, true);
}

/* ---------- display helpers ---------- */
export function pageTitle(hash) {
  const [b, a] = String(hash || "").slice(2).split("/");
  if (b === "member") return "Member";
  if (b === "deal") return "Opportunity";
  if (b === "for" && FOR_T[a]) return FOR_T[a];
  return PAGE_NAME[b || ""] || b || "Home";
}
export function consentLine(u) {
  const c = consentOf(u); return c && c.status === "granted" ? `Click tracking is on, since ${fmtShort(c.at)}` : "Click tracking is off";
}
