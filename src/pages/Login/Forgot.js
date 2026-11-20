/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import { $, ico } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';
import { decorateForm, validators, validateField, FIELD_KIND } from '../../utils/fields.js';
import { forgotPasswordSend, forgotPasswordReset } from '../../utils/authApi.js';
import { takeReturnTo } from '../../utils/session.js';
import useServices from './hooks/useServices.js';

/**
 * Forgot-password page: email -> emailed code -> choose a new password. On success the person is signed in.
 * The server answers identically for unknown emails, so this page never reveals whether an account exists.
 * @param {HTMLElement} app mount node
 * @returns {void}
 */
export function viewForgot(app) {
  app.innerHTML = `
  <section><div class="wrap narrow auth">
    <span class="kicker">Member access</span>
    <h1 class="page-h">Forgot password.</h1>
    <p class="page-sub">Enter your email and we will send a 6-digit code to reset it.</p>
    <form class="card" style="margin-top:20px" id="forgotForm" novalidate>
      <div class="field"><label for="fp_email">${ico("mail")}Email</label>
        <input id="fp_email" type="email" placeholder="you@company.com" autocomplete="email">
        <div class="err-msg">Enter your email, like name@company.com</div></div>
      <div id="fp_step2" style="display:none">
        <div class="field" style="margin-top:14px"><label for="fp_otp">${ico("lock")}One-time code</label>
          <input id="fp_otp" type="text" inputmode="numeric" maxlength="6" placeholder="6-digit code" autocomplete="one-time-code">
          <div class="err-msg">Enter the 6-digit code sent to your email</div></div>
        <div class="field" style="margin-top:14px"><label for="fp_pw">${ico("lock")}New password</label>
          <input id="fp_pw" type="password" autocomplete="new-password" placeholder="8+ characters, a letter and a number">
          <div class="err-msg">Use 8+ characters with at least one letter and one number</div></div>
        <div class="field" style="margin-top:14px"><label for="fp_pw2">${ico("lock")}Confirm new password</label>
          <input id="fp_pw2" type="password" autocomplete="new-password" placeholder="Repeat password">
          <div class="err-msg">Passwords do not match</div></div>
      </div>
      <button class="btn btn-primary btn-block" id="fp_btn" type="submit" style="margin-top:20px">${ico("mail")} Send code</button>
      <p class="muted" style="text-align:center;margin-top:12px"><button type="button" class="linkish" onclick="go('#/login')">Back to log in</button></p>
    </form>
  </div></section>`;

  const spec = {
    fp_email: { kind: FIELD_KIND.MANDATORY, rule: validators.email, msg: "Enter your email, like name@company.com" },
    fp_otp: { kind: FIELD_KIND.MANDATORY, rule: validators.otp, msg: "Enter the 6-digit code sent to your email" },
    fp_pw: { kind: FIELD_KIND.MANDATORY, rule: validators.password, msg: "Use 8+ characters with at least one letter and one number" },
    fp_pw2: { kind: FIELD_KIND.MANDATORY, rule: (v) => v === $("#fp_pw").value, msg: "Passwords do not match" },
  };
  decorateForm(spec);
  const check = (ids) => ids.map((id) => validateField(id, spec[id].kind, spec[id].rule, spec[id].msg)).every(Boolean);
  const { getMe } = useServices();
  let step = 1;

  $("#forgotForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("#fp_btn");
    const email = $("#fp_email").value.trim().toLowerCase();
    if (step === 1) {
      if (!check(["fp_email"])) return;
      btn.disabled = true; btn.textContent = "Sending…";
      const r = await forgotPasswordSend(email);
      btn.disabled = false;
      if (!r.ok) { btn.innerHTML = `${ico("mail")} Send code`; toast("Please wait", r.message || "Could not send the code.", false); return; }
      step = 2; $("#fp_step2").style.display = ""; $("#fp_email").readOnly = true;
      btn.innerHTML = `${ico("check")} Reset password`;
      toast("Check your email", "If this email has an account, a code is on its way.");
      setTimeout(() => $("#fp_otp")?.focus(), 50);
      return;
    }
    if (!check(["fp_otp", "fp_pw", "fp_pw2"])) return;
    btn.disabled = true; btn.textContent = "Saving…";
    const r = await forgotPasswordReset(email, $("#fp_otp").value.trim(), $("#fp_pw").value);
    btn.disabled = false;
    if (!r.ok) { btn.innerHTML = `${ico("check")} Reset password`; toast("Could not reset", r.message || "Wrong or expired code.", false); return; }
    state.USER = r.user;
    const full = await getMe();
    if (full) state.USER = full;
    toast("Password updated", "You are now logged in.");
    go(takeReturnTo("#/dashboard"));
  };
}
