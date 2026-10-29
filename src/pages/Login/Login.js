/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import useServices from './hooks/useServices.js';
import { reqField } from '../../utils/forms.js';
import { $, esc, ico, isEmail } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

export function viewLogin(app, note) {
  app.innerHTML = `
  <section><div class="wrap narrow">
    <span class="kicker">Member access</span>
    <h1 class="page-h">Log in.</h1>
    <p class="page-sub" ${note ? 'style="color:var(--gold-text)"' : ""}>${esc(note || "Access your dashboard, listings and matches.")}</p>
    <form class="card" style="margin-top:20px" id="loginForm" novalidate>
      <div class="field" id="step_email_wrap">
        <label for="l_email">${ico("mail")}Email <span class="req">*</span></label>
        <input id="l_email" type="email" placeholder="you@company.com" autocomplete="email" value="${esc(state.USER ? state.USER.email || "" : "")}">
        <div class="err-msg">Enter your email, like name@company.com</div>
      </div>
      <div id="step_otp_wrap" style="display:none">
        <div class="field" style="margin-bottom:8px">
          <label for="l_otp">${ico("lock")}One-time code <span class="req">*</span></label>
          <input id="l_otp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="6-digit code" autocomplete="one-time-code">
          <div class="err-msg">Enter the 6-digit code sent to your email</div>
        </div>
        <p style="font-size:13px;color:var(--text-soft);margin:0 0 8px">
          Check your inbox for a 6-digit code. Valid for 10 minutes.
          <button type="button" class="linkish" id="resendOtpBtn" style="font-size:13px">Resend</button>
        </p>
      </div>
      <button class="btn btn-primary btn-block" id="loginBtn" type="submit" style="margin-top:20px">${ico("mail")} Send code</button>
      <p class="muted" style="text-align:center;margin-top:12px">No account yet? <button type="button" class="linkish" onclick="go('#/register')">Become a member</button></p>
    </form>
  </div></section>`;

  const { sendOtp, verifyOtp, getMe } = useServices();
  let step = "email"; // "email" | "otp"
  let pendingEmail = "";

  const setStep = (s) => {
    step = s;
    const isOtp = s === "otp";
    $("#step_otp_wrap").style.display = isOtp ? "" : "none";
    const btn = $("#loginBtn");
    btn.innerHTML = isOtp ? `${ico("check")} Verify &amp; log in` : `${ico("mail")} Send code`;
  };

  const showDevHint = () => {}; // hint visible in server console only

  $("#resendOtpBtn").onclick = async () => {
    const btn = $("#resendOtpBtn");
    btn.disabled = true;
    btn.textContent = "Sending…";
    const res = await sendOtp(pendingEmail);
    if (res) {
      toast("Code sent", "A new OTP has been sent to your email.");
      showDevHint(res.dev_hint);
    }
    btn.disabled = false;
    btn.textContent = "Resend";
  };

  $("#loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("#loginBtn");

    if (step === "email") {
      if (!reqField("l_email", isEmail)) return;
      pendingEmail = $("#l_email").value.trim();
      btn.disabled = true;
      btn.textContent = "Sending code…";
      const res = await sendOtp(pendingEmail);
      if (res) {
        showDevHint(res.dev_hint);
        setStep("otp");
        setTimeout(() => $("#l_otp")?.focus(), 50);
      }
      btn.disabled = false;
      btn.innerHTML = `${ico("check")} Verify &amp; log in`;
      return;
    }

    // step === "otp"
    if (!reqField("l_otp")) return;
    const otp = $("#l_otp").value.trim();
    btn.disabled = true;
    btn.textContent = "Verifying…";

    const result = await verifyOtp(pendingEmail, otp);
    if (result?.needs_profile) {
      // New user — send them to register to fill in profile
      toast("Almost there", "Please complete your profile to finish signing up.");
      go(`#/register?email=${encodeURIComponent(pendingEmail)}&otp=${encodeURIComponent(otp)}`);
      return;
    }
    if (result?.user) {
      state.USER = result.user;
      const full = await getMe();
      if (full) state.USER = full;
      toast("Logged in", "Welcome back.");
      go("#/dashboard");
    } else {
      btn.disabled = false;
      btn.innerHTML = `${ico("check")} Verify &amp; log in`;
    }
  };
}

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
