/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import useServices from './hooks/useServices.js';
import { COUNTRIES } from '../../constant/countries.js';
import { PILLARS } from '../../constant/pillars.js';
import { ROLE_META, TIERS } from '../../constant/roles.js';
import { reqField } from '../../utils/forms.js';
import { $, $$, ico, isEmail, wc } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

export function viewRegister(app) {
  let tier = "bacc", goal = "sell", _imageFile = null, _imageUrl = null;
  app.innerHTML = `
  <section><div class="wrap narrow">
    <span class="kicker">Membership</span>
    <h1 class="page-h">Register your business.</h1>
    <p class="page-sub">Join the WorldTradeAccess network and publish what you seek. Fields marked <span class="req">*</span> are required.</p>
    <form class="card" style="margin-top:20px" id="regForm" novalidate>
      <div class="field full" style="margin-bottom:20px">
        <span class="flabel">${ico("user")}Profile image <span class="muted" style="font-weight:400">(optional)</span></span>
        <div style="display:flex;gap:16px;align-items:center;margin-top:8px">
          <div id="reg_img_preview" style="width:64px;height:64px;border-radius:50%;background:var(--surface-2);border:2px solid var(--line);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text-soft)">${ico("user")}</div>
          <div>
            <label for="reg_img_file" class="btn btn-sm btn-ghost" style="cursor:pointer;display:inline-flex;gap:6px;align-items:center">${ico("file")} Choose image</label>
            <input id="reg_img_file" type="file" accept="image/*" style="display:none">
            <div id="reg_img_status" class="muted" style="margin-top:5px;font-size:13px">JPG, PNG or WebP · max 5 MB</div>
          </div>
        </div>
      </div>
      <div class="flabel" style="margin-bottom:10px">${ico("shield")}Membership type <span class="req">*</span></div>
      <div class="choice-cards" id="tiers">${Object.entries(TIERS).map(([k, v]) => `<button type="button" class="choice" data-tier="${k}" aria-pressed="${k === tier}"><span class="t">${ico(v.ic)}${v.t}</span><span class="d" style="display:block">${v.d}</span></button>`).join("")}</div>
      <div class="form-grid" style="margin-top:22px">
        <div class="field"><label for="f_name">${ico("building")}Company name <span class="req">*</span></label><input id="f_name" placeholder="e.g. Malabar Spice Exports"><div class="err-msg">Enter your company name</div></div>
        <div class="field"><label for="f_site">${ico("globe")}Website</label><input id="f_site" placeholder="company.com"></div>
        <div class="field"><label for="f_person">${ico("user")}Contact person <span class="req">*</span></label><input id="f_person" placeholder="Full name"><div class="err-msg">Enter a contact name</div></div>
        <div class="field"><label for="f_role">${ico("briefcase")}Designation</label><input id="f_role" placeholder="e.g. Export Director"></div>
        <div class="field"><label for="f_email">${ico("mail")}Email <span class="req">*</span></label><input id="f_email" type="email" placeholder="you@company.com"><div class="err-msg">Enter a valid email, like name@company.com</div></div>
        <div class="field"><label for="f_phone">${ico("phone")}Phone</label><input id="f_phone" placeholder="+60 12 345 6789"></div>
        <div class="field"><label for="f_pass">${ico("lock")}Password <span class="req">*</span></label><input id="f_pass" type="password" placeholder="Create a password"><div class="err-msg">Enter a password</div></div>
        <div class="field"><label for="f_country">${ico("pin")}Country <span class="req">*</span></label><select id="f_country">${COUNTRIES.map(([c]) => `<option value="${c}">${c}</option>`).join("")}</select></div>
        <div class="field"><label for="f_pillar">${ico("grid")}Sector <span class="req">*</span></label><select id="f_pillar">${PILLARS.map(p => `<option>${p}</option>`).join("")}</select></div>
      </div>
      <div class="field full" style="margin-top:20px">
        <span class="flabel">${ico("compass")}Primary goal <span class="req">*</span></span>
        <div class="roles" id="goals" style="margin-top:4px">${Object.entries(ROLE_META).map(([k, v]) => `<button type="button" class="role" data-goal="${k}" aria-pressed="${k === goal}">${ico(v.ic)}${v.label}</button>`).join("")}</div>
      </div>
      <div class="field full" style="margin-top:16px">
        <label for="f_seek">${ico("search")}What you seek, in 25 words <span class="req">*</span></label>
        <textarea id="f_seek" maxlength="320" placeholder="e.g. Mid-size food-processing SME in Kerala seeking a halal-certified snacks distributor in Malaysia and Indonesia for long-term supply."></textarea>
        <div style="display:flex;justify-content:space-between;gap:10px"><span class="hint">The matcher reads this intent line.</span><span class="wordcount" id="seekwc">0 words</span></div>
        <div class="err-msg">Describe what you're looking for</div>
      </div>
      <button class="btn btn-primary btn-block" id="regBtn" type="submit" style="margin-top:22px">${ico("check")} Create account &amp; publish listing</button>
      <p class="muted" style="text-align:center;margin-top:12px">Already a member? <button type="button" class="linkish" onclick="go('#/login')">Log in</button></p>
    </form>
  </div></section>`;

  const { register, uploadImage } = useServices();

  $("#tiers").onclick = e => { const c = e.target.closest(".choice"); if (!c) return; tier = c.dataset.tier; $$("#tiers .choice").forEach(x => x.setAttribute("aria-pressed", String(x === c))); };
  $("#goals").onclick = e => { const b = e.target.closest(".role"); if (!b) return; goal = b.dataset.goal; $$("#goals .role").forEach(x => x.setAttribute("aria-pressed", String(x === b))); };
  const seek = $("#f_seek");
  seek.oninput = () => { const n = wc(seek.value); const el = $("#seekwc"); el.textContent = n + " word" + (n === 1 ? "" : "s"); el.classList.toggle("warn", n > 25); };

  $("#reg_img_file").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("File too large", "Maximum image size is 5 MB.", false); e.target.value = ""; return; }
    _imageFile = file;
    const url = URL.createObjectURL(file);
    $("#reg_img_preview").innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
    $("#reg_img_status").textContent = file.name;
  };

  $("#regForm").onsubmit = async (e) => {
    e.preventDefault();
    const ok = [reqField("f_name"), reqField("f_person"), reqField("f_email", isEmail), reqField("f_pass"), reqField("f_seek")].every(Boolean);
    if (!ok) { toast("Check the form", "A few required fields need attention.", false); return; }

    const btn = $("#regBtn");
    btn.disabled = true;
    btn.textContent = "Creating account…";

    const formData = {
      membership_type: tier,
      company_name: $("#f_name").value.trim(),
      website: $("#f_site").value.trim(),
      contact_person: $("#f_person").value.trim(),
      designation: $("#f_role").value.trim(),
      email: $("#f_email").value.trim(),
      phone: $("#f_phone").value.trim(),
      password: $("#f_pass").value,
      country: $("#f_country").value,
      sector: $("#f_pillar").value,
      goal,
      seek: seek.value.trim(),
    };

    const result = await register(formData);
    if (result) {
      if (result && typeof result === "object") state.USER = result;
      // Upload profile image if one was selected (token is now set in localStorage)
      if (_imageFile) {
        btn.textContent = "Uploading image…";
        _imageUrl = await uploadImage(_imageFile);
        if (_imageUrl) {
          // Save image_url to the member listing
          try {
            const { default: APIRequest } = await import('../../utils/APIRequest.js');
            const { default: ConfigAPIURL } = await import('../../config/ConfigAPIURL.js');
            await APIRequest.request("PUT", ConfigAPIURL.myListing, JSON.stringify({ image_url: _imageUrl }));
            if (state.USER) state.USER.image_url = _imageUrl;
          } catch {}
        }
      }
      toast("Welcome to WorldTradeAccess", "Your listing is live in the network.");
      go("#/dashboard");
    } else {
      btn.disabled = false;
      btn.innerHTML = `${ico("check")} Create account &amp; publish listing`;
    }
  };
}
