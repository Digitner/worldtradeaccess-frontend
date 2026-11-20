/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import useServices from './hooks/useServices.js';
import { COUNTRIES } from '../../constant/countries.js';
import { PILLARS } from '../../constant/pillars.js';
import { ROLE_META, TIERS } from '../../constant/roles.js';
import { decorateForm, validators, validateField, setAutoValue, FIELD_KIND } from '../../utils/fields.js';
import { registerSendOtp, registerVerifyOtp, registerComplete, resendOtp } from '../../utils/authApi.js';
import { rememberReturnTo, takeReturnTo } from '../../utils/session.js';
import { $, $$, ico, wc } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';
import { applyConsentFromForm, consentBlock } from '../../utils/activity.js';

/**
 * Render the sign-up page: email -> emailed code -> profile + password.
 * No account exists in the database until the code is verified AND the profile step is submitted; afterwards
 * the person lands on the page they came from (or the dashboard).
 * @param {HTMLElement} app mount node
 * @returns {void}
 */
export function viewRegister(app) {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const preEmail = params.get("email") || "";
  rememberReturnTo(params.get("next") || ""); // optional ?next=#/page

  let tier = "bacc", goal = "sell", _imageFile = null, _imageUrl = null;
  let step = "email"; // "email" | "otp" | "profile"

  app.innerHTML = `
  <section><div class="wrap narrow auth">
    <span class="kicker">Membership</span>
    <h1 class="page-h">Create your account.</h1>
    <p class="page-sub">Join the WorldTradeAccess network. Fields marked <span class="req">*</span> are required.</p>
    <form class="card" style="margin-top:20px" id="regForm" novalidate>

      <!-- Step 1: email -->
      <div id="step_email_wrap">
        <div class="field">
          <label for="r_email">${ico("mail")}Email</label>
          <input id="r_email" type="email" placeholder="you@company.com" autocomplete="email" value="${preEmail}">
          <div class="err-msg">Enter a valid email, like name@company.com</div>
          <div class="err-msg" id="r_emailTaken" role="alert">This email is already registered. <button type="button" class="linkish" onclick="go('#/login')">Log in</button> instead.</div>
        </div>
        <div class="field" style="margin-top:14px">
          <label for="r_password">${ico("lock")}Password</label>
          <input id="r_password" type="password" autocomplete="new-password" placeholder="8+ characters, a letter and a number">
          <div class="err-msg">Use 8+ characters with at least one letter and one number</div>
        </div>
        <div class="field" style="margin-top:14px">
          <label for="r_password2">${ico("lock")}Confirm password</label>
          <input id="r_password2" type="password" autocomplete="new-password" placeholder="Repeat password">
          <div class="err-msg">Passwords do not match</div>
        </div>
      </div>

      <!-- Step 2: OTP -->
      <div id="step_otp_wrap" style="display:none">
        <div class="field" style="margin-bottom:8px">
          <label for="r_otp">${ico("lock")}One-time code</label>
          <input id="r_otp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="6-digit code" autocomplete="one-time-code">
          <div class="err-msg">Enter the 6-digit code sent to your email</div>
        </div>
        <p style="font-size:13px;color:var(--text-soft);margin:0 0 8px">
          Check your inbox for a 6-digit code. Valid for 5 minutes.
          <button type="button" class="linkish" id="resendOtpBtn" style="font-size:13px">Resend</button>
        </p>
      </div>

      <!-- Step 3: profile -->
      <div id="step_profile_wrap" style="display:none">
        <div class="field full" style="margin-bottom:20px">
          <span class="flabel">${ico("user")}Profile image </span>
          <div style="display:flex;gap:16px;align-items:center;margin-top:8px">
            <div id="reg_img_preview" style="width:64px;height:64px;border-radius:50%;background:var(--surface-2);border:2px solid var(--line);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text-soft)">${ico("user")}</div>
            <div>
              <label for="reg_img_file" class="btn btn-sm btn-ghost" style="cursor:pointer;display:inline-flex;gap:6px;align-items:center">${ico("file")} Choose image</label>
              <input id="reg_img_file" type="file" accept="image/*" style="display:none">
              <div id="reg_img_status" class="muted" style="margin-top:5px;font-size:13px">JPG, PNG or WebP · max 5 MB</div>
            </div>
          </div>
        </div>
        <div class="flabel" style="margin-bottom:10px">${ico("shield")}Membership type</div>
        <div class="choice-cards" id="tiers">${Object.entries(TIERS).map(([k, v]) => `<button type="button" class="choice" data-tier="${k}" aria-pressed="${k === tier}"><span class="t">${ico(v.ic)}${v.t}</span><span class="d" style="display:block">${v.d}</span></button>`).join("")}</div>
        <div class="form-grid" style="margin-top:22px">
          <div class="field"><label for="f_email">${ico("mail")}Verified email</label><input id="f_email" type="email" tabindex="-1"></div>
          <div class="field"><label for="f_name">${ico("building")}Company name</label><input id="f_name" placeholder="e.g. Malabar Spice Exports"><div class="err-msg">Enter your company name</div><div class="err-msg" id="f_name_dup" role="alert">This company name is already registered.</div></div>
          <div class="field"><label for="f_site">${ico("globe")}Website</label><input id="f_site" placeholder="company.com"><div class="err-msg">Enter a valid website, like company.com</div><div class="err-msg" id="f_site_dup" role="alert">This website is already registered.</div></div>
          <div class="field"><label for="f_person">${ico("user")}Contact person</label><input id="f_person" placeholder="Full name"><div class="err-msg">Enter a contact name</div></div>
          <div class="field"><label for="f_role">${ico("briefcase")}Designation</label><input id="f_role" placeholder="e.g. Export Director"></div>
          <div class="field"><label for="f_phone">${ico("phone")}Phone</label><input id="f_phone" placeholder="+60 12 345 6789"><div class="err-msg">Enter a valid phone number, like +60 12 345 6789</div><div class="err-msg" id="f_phone_dup" role="alert">This phone number is already registered.</div></div>
          <div class="field"><label for="f_country">${ico("pin")}Country</label><select id="f_country">${COUNTRIES.map(([c]) => `<option value="${c}">${c}</option>`).join("")}</select></div>
          <div class="field"><label for="f_pillar">${ico("grid")}Sector</label><select id="f_pillar">${PILLARS.map(p => `<option>${p}</option>`).join("")}</select></div>
        </div>
        <div class="field full" style="margin-top:20px">
          <span class="flabel">${ico("compass")}Primary goal</span>
          <div class="roles" id="goals" style="margin-top:4px">${Object.entries(ROLE_META).map(([k, v]) => `<button type="button" class="role" data-goal="${k}" aria-pressed="${k === goal}">${ico(v.ic)}${v.label}</button>`).join("")}</div>
        </div>
        <div class="field full" style="margin-top:16px">
          <label for="f_seek">${ico("search")}What you seek, in 25 words</label>
          <textarea id="f_seek" maxlength="320" placeholder="e.g. Mid-size food-processing SME in Kerala seeking a halal-certified snacks distributor in Malaysia and Indonesia for long-term supply."></textarea>
          <div style="display:flex;justify-content:space-between;gap:10px"><span class="hint">The matcher reads this intent line.</span><span class="wordcount" id="seekwc">0 words</span></div>
          <div class="err-msg">Describe what you're looking for</div>
        </div>
        <div class="err-msg" id="dupCompanyAlert" role="alert" style="margin-top:14px;font-size:13.5px"><span id="dupAlertText">Already registered.</span> <button type="button" class="linkish" style="font-size:13.5px" onclick="go('#/login')">Log in</button> if this is your business.</div>
      </div>

      ${consentBlock("r_consent", "If you leave it unticked your membership is unaffected.")}
      <button class="btn btn-primary btn-block" id="regBtn" type="submit" style="margin-top:20px">${ico("mail")} Send code</button>
      <p class="muted" style="text-align:center;margin-top:12px">Already a member? <button type="button" class="linkish" onclick="go('#/login')">Log in</button></p>
    </form>
  </div></section>`;

  const { uploadImage, checkDuplicate } = useServices();

  // Colour-coding + validation spec (SOP). Red = required, green = optional (validated only if filled),
  // blue = auto-filled from the verified email and locked.
  const spec = {
    r_email:     { kind: FIELD_KIND.MANDATORY, rule: validators.email, msg: "Enter a valid email, like name@company.com" },
    r_otp:       { kind: FIELD_KIND.MANDATORY, rule: validators.otp, msg: "Enter the 6-digit code sent to your email" },
    f_email:     { kind: FIELD_KIND.AUTO, autoValue: preEmail },
    r_password:  { kind: FIELD_KIND.MANDATORY, rule: validators.password, msg: "Use 8+ characters with at least one letter and one number" },
    r_password2: { kind: FIELD_KIND.MANDATORY, rule: (v) => v === $("#r_password").value, msg: "Passwords do not match" },
    f_name:      { kind: FIELD_KIND.MANDATORY, msg: "Enter your company name" },
    f_person:    { kind: FIELD_KIND.MANDATORY, msg: "Enter a contact name" },
    f_country:   { kind: FIELD_KIND.MANDATORY },
    f_pillar:    { kind: FIELD_KIND.MANDATORY },
    f_seek:      { kind: FIELD_KIND.MANDATORY, msg: "Describe what you're looking for" },
    f_site:      { kind: FIELD_KIND.OPTIONAL, rule: validators.url, msg: "Enter a valid website, like company.com" },
    f_role:      { kind: FIELD_KIND.OPTIONAL },
    f_phone:     { kind: FIELD_KIND.OPTIONAL, rule: validators.phone, msg: "Enter a valid phone number, like +60 12 345 6789" },
  };
  decorateForm(spec);
  /** Validate a list of field ids against the spec. @param {string[]} ids @returns {boolean} */
  const check = (ids) => ids.map((id) => validateField(id, spec[id].kind, spec[id].rule, spec[id].msg)).every(Boolean);
  let pendingEmail = preEmail;
  let pendingPassword = ""; // held in memory only until the account is created after the OTP

  const setStep = (s) => {
    step = s;
    $("#step_email_wrap").style.display   = s === "email"   ? "" : "none";
    $("#step_otp_wrap").style.display     = s === "otp"     ? "" : "none";
    $("#step_profile_wrap").style.display = s === "profile" ? "" : "none";
    const btn = $("#regBtn");
    if (s === "email")   btn.innerHTML = `${ico("mail")} Send code`;
    if (s === "otp")     btn.innerHTML = `${ico("arrow-right")} Continue`;
    if (s === "profile") btn.innerHTML = `${ico("check")} Create account &amp; publish listing`;
  };

  // Wire tier + goal pickers
  $("#tiers").onclick = e => {
    const c = e.target.closest(".choice");
    if (!c) return;
    tier = c.dataset.tier;
    $$("#tiers .choice").forEach(x => x.setAttribute("aria-pressed", String(x === c)));
  };

  // goals wired after profile step shows
  const wireGoals = () => {
    const goalsEl = $("#goals");
    if (goalsEl) {
      goalsEl.onclick = e => {
        const b = e.target.closest(".role");
        if (!b) return;
        goal = b.dataset.goal;
        $$("#goals .role").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      };
    }
    const seek = $("#f_seek");
    if (seek) {
      seek.oninput = () => {
        const n = wc(seek.value);
        const el = $("#seekwc");
        el.textContent = n + " word" + (n === 1 ? "" : "s");
        el.classList.toggle("warn", n > 25);
      };
    }
    const imgFile = $("#reg_img_file");
    if (imgFile) {
      imgFile.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast("File too large", "Maximum image size is 5 MB.", false); e.target.value = ""; return; }
        _imageFile = file;
        const url = URL.createObjectURL(file);
        $("#reg_img_preview").innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
        $("#reg_img_status").textContent = file.name;
      };
    }
  };

  // "Already registered" flags (any membership type). Company name, website and phone are checked live on the
  // profile step, each on its own; email is checked at step 1, before any code is sent. Every taken field gets
  // a red border and its own message, plus a summary line below the intent hint. Stale replies are dropped.
  const DUP_FIELDS = { company: ["f_name", "Company name"], website: ["f_site", "Website"], phone: ["f_phone", "Phone"] };
  let dupSeq = 0, dupTimer = null;
  const setDupAlert = (taken) => {
    const list = Object.keys(DUP_FIELDS).filter((k) => taken.includes(k));
    for (const [k, [id]] of Object.entries(DUP_FIELDS)) {
      const on = list.includes(k);
      $("#" + id)?.classList.toggle("err", on);
      $("#" + id + "_dup")?.classList.toggle("show", on);
    }
    const labels = list.map((k) => DUP_FIELDS[k][1]);
    $("#dupAlertText").textContent = labels.length
      ? labels.join(", ") + (labels.length > 1 ? " are" : " is") + " already registered by another member."
      : "";
    $("#dupCompanyAlert")?.classList.toggle("show", labels.length > 0);
  };
  const dupMessage = (taken) => taken.map((k) => (DUP_FIELDS[k] || [0, "Email"])[1]).join(", ") + " already registered.";
  const setEmailTaken = (on) => {
    $("#r_emailTaken")?.classList.toggle("show", !!on);
    $("#r_email")?.classList.toggle("err", !!on);
  };
  const runDupCheck = async () => {
    const seq = ++dupSeq;
    const r = await checkDuplicate({ name: $("#f_name").value, website: $("#f_site").value, phone: $("#f_phone").value });
    const taken = Object.keys(DUP_FIELDS).filter((k) => r[k]);
    if (seq === dupSeq) setDupAlert(taken);
    return taken;
  };
  const wireDupCheck = () => {
    Object.values(DUP_FIELDS).forEach(([id]) => {
      const el = $("#" + id);
      if (!el) return;
      el.oninput = () => {
        clearTimeout(dupTimer);
        el.classList.remove("err");
        $("#" + id + "_dup")?.classList.remove("show");
        dupTimer = setTimeout(runDupCheck, 450);
      };
      el.onblur = () => { clearTimeout(dupTimer); runDupCheck(); };
    });
  };
  $("#r_email").oninput = () => setEmailTaken(false);

  $("#resendOtpBtn").onclick = async () => {
    const btn = $("#resendOtpBtn");
    btn.disabled = true;
    btn.textContent = "Sending…";
    const r = await resendOtp(pendingEmail, "register");
    toast(r.ok ? "Code sent" : "Please wait", r.ok ? "A new code has been sent to your email." : (r.message || "Could not resend."), r.ok);
    btn.disabled = false;
    btn.textContent = "Resend";
  };

  $("#regForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("#regBtn");

    // Step 1: email -> the server emails a code. NO account is created here.
    if (step === "email") {
      if (!check(["r_email", "r_password", "r_password2"])) return;
      pendingEmail = $("#r_email").value.trim().toLowerCase();
      pendingPassword = $("#r_password").value;
      btn.disabled = true;
      btn.textContent = "Sending code…";
      const res = await registerSendOtp(pendingEmail);
      btn.disabled = false;
      if (res.duplicate) { setEmailTaken(true); btn.innerHTML = `${ico("mail")} Send code`; return; }
      if (!res.ok) { toast("Failed", res.message || "Could not send the code.", false); btn.innerHTML = `${ico("mail")} Send code`; return; }
      setStep("otp");
      setTimeout(() => $("#r_otp")?.focus(), 50);
      return;
    }

    // Step 2: code -> email is proven; still no account.
    if (step === "otp") {
      if (!check(["r_otp"])) return;
      btn.disabled = true;
      btn.textContent = "Verifying…";
      const res = await registerVerifyOtp(pendingEmail, $("#r_otp").value.trim());
      btn.disabled = false;
      if (!res.ok) { toast("Invalid code", res.message || "Wrong or expired code.", false); btn.innerHTML = `${ico("arrow-right")} Continue`; return; }
      setAutoValue("f_email", pendingEmail); // system-filled, locked
      setStep("profile");
      wireGoals();
      wireDupCheck();
      return;
    }

    // Step 3: profile + password -> account is created now.
    if (!check(["f_name", "f_person", "f_country", "f_pillar", "f_seek", "f_site", "f_role", "f_phone"])) {
      toast("Check the form", "A few fields need attention.", false);
      return;
    }
    btn.disabled = true;
    btn.textContent = "Checking details…";
    clearTimeout(dupTimer);
    const takenNow = await runDupCheck();
    if (takenNow.length) {
      btn.disabled = false;
      btn.innerHTML = `${ico("check")} Create account &amp; publish listing`;
      $("#" + DUP_FIELDS[takenNow[0]][0]).focus();
      toast("Already registered", dupMessage(takenNow), false);
      return;
    }
    btn.textContent = "Creating account…";

    const result = await registerComplete({
      tier,
      email: pendingEmail,
      password: pendingPassword,
      company_name: $("#f_name").value.trim(),
      website: $("#f_site").value.trim(),
      contact_person: $("#f_person").value.trim(),
      designation: $("#f_role").value.trim(),
      phone: $("#f_phone").value.trim(),
      country: $("#f_country").value,
      sector: $("#f_pillar").value,
      goal,
      seek: $("#f_seek").value.trim(),
    });
    if (result.ok) {
      state.USER = result.user;
      if (_imageFile) {
        btn.textContent = "Uploading image…";
        _imageUrl = await uploadImage(_imageFile);
        if (_imageUrl) {
          try {
            const { default: APIRequest } = await import('../../utils/APIRequest.js');
            const { default: ConfigAPIURL } = await import('../../config/ConfigAPIURL.js');
            await APIRequest.request("PUT", ConfigAPIURL.myListing, JSON.stringify({ image_url: _imageUrl }));
            if (state.USER) state.USER.image_url = _imageUrl;
          } catch {}
        }
      }
      applyConsentFromForm("r_consent", "Registration form");
      toast("Welcome to WorldTradeAccess", "Your listing is live in the network.");
      go(takeReturnTo("#/dashboard")); // straight back to the page they were on
      return;
    }
    btn.disabled = false;
    btn.innerHTML = `${ico("check")} Create account &amp; publish listing`;
    if (result.duplicate) {
      const taken = result.duplicate.filter((k) => DUP_FIELDS[k]);
      setDupAlert(taken);
      if (taken.length) $("#" + DUP_FIELDS[taken[0]][0]).focus();
      toast("Already registered", dupMessage(result.duplicate), false);
    } else {
      toast("Failed", result.message || "Could not create the account.", false);
    }
  };
}
