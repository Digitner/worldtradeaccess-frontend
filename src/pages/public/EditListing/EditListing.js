/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import { KEY } from '../../../config/index.js';
import { COUNTRIES } from '../../../constant/countries.js';
import { PILLARS } from '../../../constant/pillars.js';
import { ROLE_META } from '../../../constant/roles.js';
import { reqField } from '../../../utils/forms.js';
import { $, $$, esc, ico, isEmail, save, wc } from '../../../utils/helpers.js';
import { go } from '../../../utils/router.js';
import { state } from '../../../utils/state.js';
import { publishListing, record } from '../../../utils/store.js';

export function viewEditListing(app){
  let goal=state.USER.type||"sell";
  app.innerHTML=`
  <section><div class="wrap narrow">
    <button class="backlink" onclick="go('#/dashboard')">${ico("back")} Back to dashboard</button>
    <h1 class="page-h">Edit your listing.</h1>
    <form class="card" style="margin-top:16px" id="editForm" novalidate>
      <div class="form-grid">
        <div class="field"><label for="e_name">${ico("building")}Company name</label><input id="e_name" value="${esc(state.USER.name||"")}"></div>
        <div class="field"><label for="e_site">${ico("globe")}Website</label><input id="e_site" value="${esc(state.USER.site||"")}"></div>
        <div class="field"><label for="e_person">${ico("user")}Contact person</label><input id="e_person" value="${esc(state.USER.person||"")}"></div>
        <div class="field"><label for="e_role">${ico("briefcase")}Designation</label><input id="e_role" value="${esc(state.USER.role_t||"")}"></div>
        <div class="field"><label for="e_email">${ico("mail")}Email</label><input id="e_email" type="email" value="${esc(state.USER.email||"")}"><div class="err-msg">Enter a valid email</div></div>
        <div class="field"><label for="e_phone">${ico("phone")}Phone</label><input id="e_phone" value="${esc(state.USER.phone||"")}"></div>
        <div class="field"><label for="e_country">${ico("pin")}Country</label><select id="e_country">${COUNTRIES.map(([c])=>`<option ${c===state.USER.country?"selected":""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label for="e_pillar">${ico("grid")}Sector</label><select id="e_pillar">${PILLARS.map(p=>`<option ${p===state.USER.pillar?"selected":""}>${p}</option>`).join("")}</select></div>
      </div>
      <div class="field full" style="margin-top:18px"><span class="flabel">${ico("compass")}Primary goal</span><div class="roles" id="e_goals" style="margin-top:4px">${Object.entries(ROLE_META).map(([k,v])=>`<button type="button" class="role" data-goal="${k}" aria-pressed="${k===goal}">${ico(v.ic)}${v.label}</button>`).join("")}</div></div>
      <div class="field full" style="margin-top:16px"><label for="e_seek">${ico("search")}What you seek</label><textarea id="e_seek" maxlength="320">${esc(state.USER.seek||"")}</textarea><div style="display:flex;justify-content:flex-end"><span class="wordcount" id="e_wc">0 words</span></div></div>
      <button class="btn btn-primary btn-block" type="submit" style="margin-top:18px">${ico("check")} Save listing</button>
    </form>
  </div></section>`;
  $("#e_goals").onclick=e=>{const b=e.target.closest(".role");if(!b)return;goal=b.dataset.goal;$$("#e_goals .role").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));};
  const s=$("#e_seek");const upd=()=>{const n=wc(s.value);$("#e_wc").textContent=n+" words";$("#e_wc").classList.toggle("warn",n>25);};s.oninput=upd;upd();
  $("#editForm").onsubmit=async e=>{
    e.preventDefault();
    if($("#e_email").value.trim()&&!reqField("e_email",isEmail))return;
    Object.assign(state.USER,{name:$("#e_name").value.trim(),site:$("#e_site").value.trim(),person:$("#e_person").value.trim(),role_t:$("#e_role").value.trim(),email:$("#e_email").value.trim(),phone:$("#e_phone").value.trim(),country:$("#e_country").value,pillar:$("#e_pillar").value,type:goal,seek:s.value.trim()});
    save(KEY.user,state.USER);
    await record("edit",{company:state.USER.name,person:state.USER.person,email:state.USER.email,country:state.USER.country,sector:state.USER.pillar,goal:ROLE_META[goal].label,seeking:state.USER.seek});
    await publishListing({id:state.USER.id,name:state.USER.name,person:state.USER.person,role_t:state.USER.role_t,site:state.USER.site,country:state.USER.country,pillar:state.USER.pillar,type:state.USER.type,seek:state.USER.seek,tier:state.USER.tier||"open"});
    toast("Listing saved","Your intent is updated.");go("#/dashboard");
  };
}

/* ================= FIND MATCHES (AI) ================= */
