/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import useServices from './hooks/useServices.js';
import { $, esc, ico } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';
import { applyConsentFromForm, consentBlock } from '../../utils/activity.js';
import { decorateForm, validators, validateField, FIELD_KIND } from '../../utils/fields.js';
import { loginStart, loginWithPassword, verifyLoginOtp, resendOtp } from '../../utils/authApi.js';
import { rememberReturnTo, takeReturnTo, takeSessionNotice } from '../../utils/session.js';

/**
 * Finish a successful login: load the full profile, apply consent, and send the person back to the page they
 * were on (or their dashboard / admin console).
 * @param {object} user user returned by the API
 * @param {Function} getMe loader for the full profile
 * @returns {Promise<void>}
 */
async function finishLogin(user, getMe) {
  state.USER = user;
  const full = await getMe();
  if (full) state.USER = full;
  applyConsentFromForm("l_consent", "Login form");
  toast("Logged in", "Welcome back.");
  go(takeReturnTo(state.USER?.role === "admin" ? "#/admin" : "#/dashboard"));
}

/**
 * Render the login page. It asks for the email first, then adapts:
 *  - account has a password  -> password box (a new device then gets an emailed code first)
 *  - account has NO password -> password box stays hidden, a code is emailed, and after the code the app shows
 *                               the blocking "set your password" popup (utils/passwordGate.js)
 *  - no account              -> offer to register
 * Admins (opts.admin) keep the email -> one-time code login.
 * @param {HTMLElement} app mount node
 * @param {string} [note] subtitle override (e.g. "Log in to view your dashboard.")
 * @param {{admin?:boolean}} [opts]
 * @returns {void}
 */
export function viewLogin(app, note, opts) {
  const admin = !!(opts && opts.admin);
  if (admin) return viewCodeLogin(app, note, true);
  rememberReturnTo(location.hash); // lets a successful login land back on the page that asked for it
  const expiredNote = takeSessionNotice();
  app.innerHTML = `
  <section><div class="wrap narrow auth">
    <span class="kicker">Member access</span>
    <h1 class="page-h">Log in.</h1>
    <p class="page-sub">${esc(expiredNote || note || "Access your dashboard, listings and matches.")}</p>
    ${expiredNote ? `<div class="notice-expired" role="alert">${esc(expiredNote)}</div>` : ""}
    <form class="card" style="margin-top:20px" id="loginForm" novalidate>
      <div class="field">
        <label for="l_email">${ico("mail")}Email</label>
        <input id="l_email" type="email" placeholder="you@company.com" autocomplete="email" value="${esc(state.USER ? state.USER.email || "" : "")}">
        <div class="err-msg">Enter your email, like name@company.com</div>
      </div>
      <div class="field" id="pw_wrap" style="margin-top:14px;display:none">
        <label for="l_password">${ico("lock")}Password</label>
        <input id="l_password" type="password" placeholder="Your password" autocomplete="current-password">
        <div class="err-msg">Enter your password</div>
        <button type="button" class="linkish" id="forgotLink" style="font-size:13px;align-self:flex-start">Forgot password?</button>
      </div>
      <div id="step_otp_wrap" style="display:none;margin-top:14px">
        <div class="field" style="margin-bottom:8px">
          <label for="l_otp">${ico("lock")}One-time code</label>
          <input id="l_otp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="6-digit code" autocomplete="one-time-code">
          <div class="err-msg">Enter the 6-digit code sent to your email</div>
        </div>
        <p id="otpHelp" style="font-size:13px;color:var(--text-soft);margin:0 0 8px">
          We emailed you a 6-digit code. Valid for 5 minutes.
          <button type="button" class="linkish" id="resendOtpBtn" style="font-size:13px">Resend</button>
        </p>
      </div>
      ${consentBlock("l_consent", "If you leave it unticked you can still log in as normal.")}
      <button class="btn btn-primary btn-block" id="loginBtn" type="submit" style="margin-top:20px">${ico("arrow-right")} Continue</button>
      <p class="muted" style="text-align:center;margin-top:12px"><button type="button" class="linkish" id="changeEmail" style="display:none">Use a different email</button></p>
      <p class="muted" style="text-align:center;margin-top:6px">No account yet? <button type="button" class="linkish" onclick="go('#/register')">Become a member</button></p>
    </form>
  </div></section>`;

  const { getMe } = useServices();
  let step = "email"; // "email" | "password" | "otp"
  let pendingEmail = "";

  // All three inputs are mandatory when visible; each step validates only what is on screen.
  const spec = {
    l_email: { kind: FIELD_KIND.MANDATORY, rule: validators.email, msg: "Enter your email, like name@company.com" },
    l_password: { kind: FIELD_KIND.MANDATORY, msg: "Enter your password" },
    l_otp: { kind: FIELD_KIND.MANDATORY, rule: validators.otp, msg: "Enter the 6-digit code sent to your email" },
  };
  decorateForm(spec);

  /**
   * Switch the visible step and relabel the button.
   * @param {"email"|"password"|"otp"} s
   */
  const setStep = (s) => {
    step = s;
    $("#pw_wrap").style.display = s === "password" ? "" : "none";
    $("#step_otp_wrap").style.display = s === "otp" ? "" : "none";
    $("#l_email").readOnly = s !== "email"; // email is fixed once the next step is showing
    $("#changeEmail").style.display = s === "email" ? "none" : "";
    $("#loginBtn").innerHTML = s === "email" ? `${ico("arrow-right")} Continue` : s === "password" ? `${ico("lock")} Log in` : `${ico("check")} Verify &amp; log in`;
    if (s === "password") setTimeout(() => $("#l_password")?.focus(), 50);
    if (s === "otp") setTimeout(() => $("#l_otp")?.focus(), 50);
  };

  $("#forgotLink").onclick = () => go("#/forgot");
  $("#changeEmail").onclick = () => { $("#l_password").value = ""; $("#l_otp").value = ""; setStep("email"); $("#l_email").focus(); };

  $("#resendOtpBtn").onclick = async () => {
    const btn = $("#resendOtpBtn");
    btn.disabled = true;
    const r = await resendOtp(pendingEmail, "login");
    toast(r.ok ? "Code sent" : "Please wait", r.ok ? "A new code is on its way." : (r.message || "Could not resend."), r.ok);
    btn.disabled = false;
  };

  $("#loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("#loginBtn");

    // Step 1: which kind of account is this?
    if (step === "email") {
      if (!validateField("l_email", spec.l_email.kind, spec.l_email.rule, spec.l_email.msg)) return;
      pendingEmail = $("#l_email").value.trim().toLowerCase();
      btn.disabled = true; btn.textContent = "Checking…";
      const r = await loginStart(pendingEmail);
      btn.disabled = false;
      if (!r.ok) { setStep("email"); toast("Error", r.message || "Could not check this email.", false); return; }
      if (r.status === "new") { setStep("email"); toast("No account found", "Please create an account first.", false); go(`#/register?email=${encodeURIComponent(pendingEmail)}`); return; }
      if (r.status === "code") {
        // Old account without a password: no password box. A code was just emailed; the "set password" popup follows the login.
        $("#otpHelp").firstChild.textContent = "We emailed you a 6-digit code. After logging in you will be asked to set a password. ";
        setStep("otp");
        toast("Check your email", "Enter the 6-digit code we sent.");
        return;
      }
      setStep("password");
      return;
    }

    // Step 2a: password (a new device is then sent a code)
    if (step === "password") {
      if (!validateField("l_password", spec.l_password.kind, undefined, spec.l_password.msg)) return;
      btn.disabled = true; btn.textContent = "Checking…";
      const r = await loginWithPassword(pendingEmail, $("#l_password").value);
      btn.disabled = false;
      if (!r.ok) { setStep("password"); toast("Login failed", r.message || "Invalid email or password.", false); return; }
      if (r.otpRequired) {
        $("#otpHelp").firstChild.textContent = "New device: we emailed you a 6-digit code. Valid for 5 minutes. ";
        setStep("otp"); toast("Check your email", "New device: enter the 6-digit code we sent."); return;
      }
      return finishLogin(r.user, getMe);
    }

    // Step 2b: code
    if (!validateField("l_otp", spec.l_otp.kind, spec.l_otp.rule, spec.l_otp.msg)) return;
    btn.disabled = true; btn.textContent = "Verifying…";
    const r = await verifyLoginOtp(pendingEmail, $("#l_otp").value.trim());
    btn.disabled = false;
    if (!r.ok) { setStep("otp"); toast("Invalid code", r.message || "Wrong or expired code.", false); return; }
    return finishLogin(r.user, getMe);
  };
}

/**
 * Email -> one-time code login, no password. Used by admins and by members who have not set a password yet
 * (they are made to set one right after, see utils/passwordGate.js).
 * @param {HTMLElement} app mount node
 * @param {string} [note] subtitle override
 * @param {boolean} admin true for the staff variant
 * @returns {void}
 */
function viewCodeLogin(app, note, admin) {
  app.innerHTML = `
  <section><div class="wrap narrow auth">
    <span class="kicker">${admin ? "Admin access" : "Member access"}</span>
    <h1 class="page-h">${admin ? "Admin log in." : "Log in with a code."}</h1>
    <p class="page-sub">${esc(note || "Chamber staff only. Enter your admin email to get a one-time code.")}</p>
    <form class="card" style="margin-top:20px" id="loginForm" novalidate>
      <div class="field"><label for="l_email">${ico("mail")}Email</label>
        <input id="l_email" type="email" placeholder="you@company.com" autocomplete="email">
        <div class="err-msg">Enter your email, like name@company.com</div></div>
      <div id="step_otp_wrap" style="display:none;margin-top:14px"><div class="field">
        <label for="l_otp">${ico("lock")}One-time code</label>
        <input id="l_otp" type="text" inputmode="numeric" maxlength="6" placeholder="6-digit code" autocomplete="one-time-code">
        <div class="err-msg">Enter the 6-digit code sent to your email</div></div></div>
      <button class="btn btn-primary btn-block" id="loginBtn" type="submit" style="margin-top:20px">${ico("mail")} Send code</button>
      ${admin ? "" : `<p class="muted" style="text-align:center;margin-top:12px"><button type="button" class="linkish" id="pwLink">Use my password instead</button></p>`}
    </form>
  </div></section>`;
  const spec = {
    l_email: { kind: FIELD_KIND.MANDATORY, rule: validators.email },
    l_otp: { kind: FIELD_KIND.MANDATORY, rule: validators.otp },
  };
  decorateForm(spec);
  if (!admin) $("#pwLink").onclick = () => viewLogin(app);
  const { sendOtp, verifyOtp, getMe } = useServices();
  let step = "email", email = "";
  $("#loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("#loginBtn");
    if (step === "email") {
      if (!validateField("l_email", spec.l_email.kind, spec.l_email.rule)) return;
      email = $("#l_email").value.trim();
      btn.disabled = true;
      if (await sendOtp(email)) {
        step = "otp"; $("#step_otp_wrap").style.display = "";
        btn.innerHTML = `${ico("check")} Verify &amp; log in`;
        toast("Check your email", "If this email has an account, a code is on its way.");
      }
      btn.disabled = false;
      return;
    }
    if (!validateField("l_otp", spec.l_otp.kind, spec.l_otp.rule)) return;
    btn.disabled = true;
    const r = await verifyOtp(email, $("#l_otp").value.trim());
    btn.disabled = false;
    if (r?.needs_profile) { toast("No account found", "Please create an account first.", false); go("#/register"); return; }
    if (r?.user) return finishLogin(r.user, getMe);
  };
}

/**
 * Log out: tell the server to blacklist the tokens, then wipe local session data and go home.
 * The device id is kept on purpose, so logging back in on this device needs no OTP.
 * @returns {void}
 */
export function logout() {
  import('../../utils/APIRequest.js').then(({ default: APIRequest }) => {
    import('../../config/ConfigAPIURL.js').then(({ default: ConfigAPIURL }) => {
      APIRequest.request("POST", ConfigAPIURL.logout, "").catch(() => {});
    });
  });
  import('../../config/LocalStorage.js').then(({ default: LocalStorage }) => {
    LocalStorage.clear();
  });
  state.USER = null;
  toast("Logged out", "");
  go("#/");
}
