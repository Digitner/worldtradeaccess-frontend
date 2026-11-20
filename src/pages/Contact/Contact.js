/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import { decorateForm, validators, FIELD_KIND } from '../../utils/fields.js';
import { $, esc, ico, img, imgTag, isEmail } from '../../utils/helpers.js';
import { state } from '../../utils/state.js';
import useServices from './hooks/useServices.js';

const _svc = useServices();

/**
 * Render the contact page into the app container.
 * @param {HTMLElement} app mount node (#app)
 */
export function viewContact(app){
  app.innerHTML=`
  <section><div class="wrap"><div class="split">
    <div class="main">
      <span class="kicker">Get in touch</span>
      <h1 class="page-h">Contact the chamber.</h1>
      <p class="page-sub">Questions about membership, matching or partnerships? Send a note and the team will respond.</p>
      <form class="card" style="margin-top:20px" id="contactForm" novalidate>
        <div class="form-grid">
          <div class="field"><label for="c_name">${ico("user")}Name</label><input id="c_name" value="${state.USER?esc(state.USER.person||""):""}"><div class="err-msg">Enter your name</div></div>
          <div class="field"><label for="c_email">${ico("mail")}Email</label><input id="c_email" type="email" value="${state.USER?esc(state.USER.email||""):""}"><div class="err-msg">Enter a valid email</div></div>
        </div>
        <div class="field full" style="margin-top:16px"><label for="c_subj">${ico("file")}Subject</label><input id="c_subj" placeholder="How can we help?"></div>
        <div class="field full" style="margin-top:16px"><label for="c_msg">${ico("inbox")}Message</label><textarea id="c_msg" maxlength="800" placeholder="Your message…"></textarea><div class="err-msg">Write a short message</div></div>
        <button class="btn btn-primary btn-block" type="submit" style="margin-top:18px">${ico("send")} Send message</button>
      </form>
    </div>
    <div class="side" style="margin-top:38px">
      <div class="card" style="padding:0;overflow:hidden"><div class="media-hero" style="border-radius:0;margin:0;height:180px">${imgTag(img("kl"),"Kuala Lumpur skyline")}<div class="cap">Kuala Lumpur</div></div>
        <div style="padding:18px;display:flex;flex-direction:column;gap:12px;font-size:14px;color:var(--text-soft)">
          <span style="display:flex;gap:10px;align-items:flex-start"><span style="color:var(--blue-text);display:inline-flex">${ico("pin")}</span>T2A-23-10, Menara 3, Jalan Ampang, 50450 Kuala Lumpur, Malaysia</span>
          <span style="display:flex;gap:10px;align-items:center"><span style="color:var(--blue-text);display:inline-flex">${ico("phone")}</span><span style="user-select:all">+6 017-880 9454</span></span>
          <span style="display:flex;gap:10px;align-items:center"><span style="color:var(--blue-text);display:inline-flex">${ico("mail")}</span><span style="user-select:all">info@bricsasean.org</span></span>
        </div>
      </div>
    </div>
  </div></div></section>`;
  // Colour-coding + validation (SOP): red = required, green = optional.
  const contactForm=decorateForm({
    c_name:{kind:FIELD_KIND.MANDATORY,msg:"Enter your name"},
    c_email:{kind:FIELD_KIND.MANDATORY,rule:validators.email,msg:"Enter a valid email"},
    c_msg:{kind:FIELD_KIND.MANDATORY,msg:"Enter a message"},
    c_subj:{kind:FIELD_KIND.OPTIONAL},
  });
  $("#contactForm").onsubmit=async e=>{
    e.preventDefault();
    if(!contactForm.validate())return;
    const btn=e.target.querySelector("[type=submit]");btn.disabled=true;btn.textContent="Sending…";
    const ok=await _svc.sendMessage({name:$("#c_name").value.trim(),email:$("#c_email").value.trim(),subject:$("#c_subj").value.trim(),message:$("#c_msg").value.trim()});
    if(ok){$("#c_subj").value="";$("#c_msg").value="";}
    btn.disabled=false;btn.innerHTML=`${ico("send")} Send message`;
  };
}
