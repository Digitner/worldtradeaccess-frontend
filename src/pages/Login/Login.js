/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import { KEY } from '../../config/index.js';
import { reqField } from '../../utils/forms.js';
import { $, esc, ico, isEmail, save } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { STORE, state } from '../../utils/state.js';
import { allMembers, record, shared } from '../../utils/store.js';

export function viewLogin(app,note){
  app.innerHTML=`
  <section><div class="wrap narrow">
    <span class="kicker">Member access</span>
    <h1 class="page-h">Log in.</h1>
    <p class="page-sub" ${note?'style="color:var(--gold-text)"':""}>${esc(note||"Access your dashboard, listings and matches.")}</p>
    <form class="card" style="margin-top:20px" id="loginForm" novalidate>
      <div class="field" style="margin-bottom:16px"><label for="l_email">${ico("mail")}Email <span class="req">*</span></label><input id="l_email" type="email" placeholder="you@company.com" value="${esc(state.USER?state.USER.email||"":"")}"><div class="err-msg">Enter your email, like name@company.com</div></div>
      <div class="field"><label for="l_pass">${ico("lock")}Password <span class="req">*</span></label><input id="l_pass" type="password" value="demo"><div class="hint">Demo mode: any password works.</div></div>
      <button class="btn btn-primary btn-block" type="submit" style="margin-top:20px">${ico("login")} Log in</button>
      <p class="muted" style="text-align:center;margin-top:12px">No account yet? <button type="button" class="linkish" onclick="go('#/register')">Become a member</button></p>
    </form>
  </div></section>`;
  $("#loginForm").onsubmit=async e=>{
    e.preventDefault();
    if(!reqField("l_email",isEmail))return;
    const email=$("#l_email").value.trim();
    const found=(state.USER&&state.USER.email&&state.USER.email.toLowerCase()===email.toLowerCase())?state.USER:allMembers().find(m=>m.mine&&m.email&&m.email.toLowerCase()===email.toLowerCase());
    state.USER=found||{id:shared()?"u-"+STORE.uid:"guest"+Date.now(),name:email.split("@")[0]+" Co.",person:email.split("@")[0],email,type:"buy",pillar:"Trade",country:"India",seek:"",tier:"open",mine:true,guest:true};
    save(KEY.user,state.USER);
    await record("login",{email,company:state.USER.name,returning:!!found});
    toast("Logged in","Welcome back.");go("#/dashboard");
  };
}

export function logout(){state.USER=null;try{localStorage.removeItem(KEY.user);}catch(e){}toast("Logged out","");go("#/");}

/* ================= DASHBOARD ================= */
