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
      <div class="field" style="margin-bottom:16px">
        <label for="l_email">${ico("mail")}Email <span class="req">*</span></label>
        <input id="l_email" type="email" placeholder="you@company.com" value="${esc(state.USER ? state.USER.email || "" : "")}">
        <div class="err-msg">Enter your email, like name@company.com</div>
      </div>
      <div class="field">
        <label for="l_pass">${ico("lock")}Password <span class="req">*</span></label>
        <input id="l_pass" type="password" placeholder="Your password">
        <div class="err-msg">Enter your password</div>
      </div>
      <p style="text-align:right;margin:6px 0 0">
        <button type="button" class="linkish" onclick="go('#/forgot-password')">Forgot password?</button>
      </p>
      <button class="btn btn-primary btn-block" id="loginBtn" type="submit" style="margin-top:20px">${ico("login")} Log in</button>
      <p class="muted" style="text-align:center;margin-top:12px">No account yet? <button type="button" class="linkish" onclick="go('#/register')">Become a member</button></p>
    </form>
  </div></section>`;

  const { login } = useServices();

  $("#loginForm").onsubmit = async (e) => {
    e.preventDefault();
    if (!reqField("l_email", isEmail)) return;
    if (!reqField("l_pass")) return;

    const email = $("#l_email").value.trim();
    const password = $("#l_pass").value;
    const btn = $("#loginBtn");
    btn.disabled = true;
    btn.textContent = "Logging in…";

    const user = await login({ email, password });
    if (user) {
      state.USER = user;
      toast("Logged in", "Welcome back.");
      go("#/dashboard");
    } else {
      btn.disabled = false;
      btn.innerHTML = `${ico("login")} Log in`;
    }
  };
}

export function logout() {
  import('./hooks/useServices.js').then(({ default: svc }) => {
    const { publishNotification } = { publishNotification: () => {} };
  });
  // Fire logout API (best-effort, don't block UI)
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
