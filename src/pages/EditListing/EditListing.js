/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import { COUNTRIES } from '../../constant/countries.js';
import { PILLARS } from '../../constant/pillars.js';
import { ROLE_META, TIERS } from '../../constant/roles.js';
import { reqField } from '../../utils/forms.js';
import useServices from './hooks/useServices.js';
import { $, $$, esc, ico, isEmail, wc } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

const _svc = useServices();

export async function viewEditListing(app) {
  // Fetch fresh data from API
  const fresh = await _svc.getMe();
  if (fresh) state.USER = { ...state.USER, ...fresh };

  const user = state.USER || {};
  let goal = user.goal || user.type || "sell";
  let tier = user.tier || user.membership_type || "bacc";
  let _imageUrl = user.image_url || null;
  let _coverUrl = user.cover_url || null;
  let _gallery = Array.isArray(user.gallery) ? [...user.gallery] : [];

  const galleryThumbsHTML = () => _gallery.length
    ? _gallery.map((u, i) => `<div style="position:relative;width:80px;height:60px;border-radius:6px;overflow:hidden;flex-shrink:0"><img src="${esc(u)}" style="width:100%;height:100%;object-fit:cover"><button type="button" data-gi="${i}" class="gal-rm" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center">×</button></div>`).join("")
    : `<span class="muted" style="font-size:13px">No images yet</span>`;

  app.innerHTML = `
  <section><div class="wrap narrow">
    <button class="backlink" onclick="go('#/dashboard')">${ico("back")} Back to dashboard</button>
    <h1 class="page-h">Edit your listing.</h1>
    <form class="card" style="margin-top:16px" id="editForm" novalidate>

      <div class="field full" style="margin-bottom:18px">
        <span class="flabel">${ico("user")}Profile image</span>
        <div style="display:flex;gap:16px;align-items:center;margin-top:8px">
          <div id="img_preview" style="width:72px;height:72px;border-radius:50%;background:var(--surface-2);border:2px solid var(--line);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text-soft)">
            ${user.image_url ? `<img src="${esc(user.image_url)}" style="width:100%;height:100%;object-fit:cover">` : ico("user")}
          </div>
          <div style="flex:1">
            <label for="img_file" class="btn btn-sm btn-ghost" style="cursor:pointer;display:inline-flex;gap:6px;align-items:center">${ico("file")} Choose image</label>
            <input id="img_file" type="file" accept="image/*" style="display:none">
            <div id="img_status" class="muted" style="margin-top:6px;font-size:13px">${user.image_url ? "Image uploaded" : "JPG, PNG or WebP · max 5 MB"}</div>
          </div>
        </div>
      </div>

      <div class="field full" style="margin-bottom:18px">
        <span class="flabel">${ico("image")}Cover / banner image</span>
        <div id="cover_preview" style="width:100%;height:140px;border-radius:10px;background:var(--surface-2);border:2px dashed var(--line);overflow:hidden;margin-top:8px;display:flex;align-items:center;justify-content:center;color:var(--text-soft);position:relative">
          ${user.cover_url ? `<img src="${esc(user.cover_url)}" style="width:100%;height:100%;object-fit:cover">` : `<div style="text-align:center">${ico("image")}<div style="font-size:13px;margin-top:4px">No cover image</div></div>`}
        </div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:8px">
          <label for="cover_file" class="btn btn-sm btn-ghost" style="cursor:pointer;display:inline-flex;gap:6px;align-items:center">${ico("file")} Choose cover</label>
          <input id="cover_file" type="file" accept="image/*" style="display:none">
          <span id="cover_status" class="muted" style="font-size:13px">${user.cover_url ? "Cover uploaded" : "Landscape · JPG, PNG or WebP · max 5 MB"}</span>
        </div>
      </div>

      <div class="field full" style="margin-bottom:18px">
        <span class="flabel">${ico("grid")}Gallery images <span class="muted" style="font-weight:400">(up to 6)</span></span>
        <div id="gal_thumbs" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;align-items:center">${galleryThumbsHTML()}</div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:10px">
          <label for="gal_file" class="btn btn-sm btn-ghost" style="cursor:pointer;display:inline-flex;gap:6px;align-items:center">${ico("file")} Add image</label>
          <input id="gal_file" type="file" accept="image/*" style="display:none">
          <span id="gal_status" class="muted" style="font-size:13px">JPG, PNG or WebP · max 5 MB each</span>
        </div>
      </div>
      <div class="form-grid">
        <div class="field"><label for="e_name">${ico("building")}Company name</label><input id="e_name" value="${esc(user.company_name || user.name || "")}"></div>
        <div class="field"><label for="e_site">${ico("globe")}Website</label><input id="e_site" value="${esc(user.website || user.site || "")}"></div>
        <div class="field"><label for="e_person">${ico("user")}Contact person</label><input id="e_person" value="${esc(user.contact_person || user.person || "")}"></div>
        <div class="field"><label for="e_role">${ico("briefcase")}Designation</label><input id="e_role" value="${esc(user.designation || user.role_t || "")}"></div>
        <div class="field"><label for="e_email">${ico("mail")}Email</label><input id="e_email" type="email" value="${esc(user.email || "")}"><div class="err-msg">Enter a valid email</div></div>
        <div class="field"><label for="e_phone">${ico("phone")}Phone</label><input id="e_phone" value="${esc(user.phone || "")}"></div>
        <div class="field"><label for="e_country">${ico("pin")}Country</label><select id="e_country">${COUNTRIES.map(([c]) => `<option ${c === (user.country) ? "selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label for="e_pillar">${ico("grid")}Sector</label><select id="e_pillar">${PILLARS.map(p => `<option ${p === (user.sector || user.pillar) ? "selected" : ""}>${p}</option>`).join("")}</select></div>
      </div>
      <div class="field full" style="margin-top:18px">
        <span class="flabel">${ico("shield")}Membership type</span>
        <div class="choice-cards" id="e_tiers" style="margin-top:8px">${Object.entries(TIERS).map(([k, v]) => `<button type="button" class="choice" data-tier="${k}" aria-pressed="${k === tier}"><span class="t">${ico(v.ic)}${v.t}</span><span class="d" style="display:block">${v.d}</span></button>`).join("")}</div>
      </div>
      <div class="field full" style="margin-top:18px"><span class="flabel">${ico("compass")}Primary goal</span><div class="roles" id="e_goals" style="margin-top:4px">${Object.entries(ROLE_META).map(([k, v]) => `<button type="button" class="role" data-goal="${k}" aria-pressed="${k === goal}">${ico(v.ic)}${v.label}</button>`).join("")}</div></div>
      <div class="field full" style="margin-top:16px"><label for="e_seek">${ico("search")}What you seek</label><textarea id="e_seek" maxlength="320">${esc(user.seek || "")}</textarea><div style="display:flex;justify-content:flex-end"><span class="wordcount" id="e_wc">0 words</span></div></div>
      <button class="btn btn-primary btn-block" id="saveBtn" type="submit" style="margin-top:18px">${ico("check")} Save changes</button>
      <button type="button" class="btn btn-ghost btn-block" style="margin-top:8px" onclick="go('#/dashboard')">Back to dashboard</button>
    </form>

    <div class="card" style="margin-top:16px">
      <h2 style="font-size:18px;margin:0 0 14px">${ico("lock")} Change password</h2>
      <form id="pwForm" novalidate>
        <div class="form-grid">
          <div class="field"><label for="pw_cur">${ico("lock")}Current password</label><input id="pw_cur" type="password" placeholder="Your current password"><div class="err-msg">Enter your current password</div></div>
          <div class="field"><label for="pw_new">${ico("lock")}New password</label><input id="pw_new" type="password" placeholder="At least 6 characters"><div class="err-msg">Enter a new password (min 6 chars)</div></div>
          <div class="field"><label for="pw_conf">${ico("lock")}Confirm new password</label><input id="pw_conf" type="password" placeholder="Repeat new password"><div class="err-msg">Passwords do not match</div></div>
        </div>
        <button class="btn btn-block" id="pwBtn" type="submit" style="margin-top:12px">${ico("check")} Update password</button>
      </form>
    </div>
  </div></section>`;

  $("#e_tiers").onclick = e => { const c = e.target.closest(".choice"); if (!c) return; tier = c.dataset.tier; $$("#e_tiers .choice").forEach(x => x.setAttribute("aria-pressed", String(x === c))); };
  $("#e_goals").onclick = e => { const b = e.target.closest(".role"); if (!b) return; goal = b.dataset.goal; $$("#e_goals .role").forEach(x => x.setAttribute("aria-pressed", String(x === b))); };
  const s = $("#e_seek"); const upd = () => { const n = wc(s.value); $("#e_wc").textContent = n + " words"; $("#e_wc").classList.toggle("warn", n > 25); }; s.oninput = upd; upd();

  // Cover upload handler
  $("#cover_file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("File too large", "Maximum image size is 5 MB.", false); return; }
    $("#cover_status").textContent = "Uploading…";
    const url = await _svc.uploadImage(file);
    if (url) {
      _coverUrl = url;
      $("#cover_preview").innerHTML = `<img src="${esc(url)}" style="width:100%;height:100%;object-fit:cover">`;
      $("#cover_status").textContent = "Cover uploaded successfully";
    } else {
      $("#cover_status").textContent = "Upload failed. Try again.";
    }
  };

  // Gallery upload handler
  const refreshGalThumbs = () => {
    $("#gal_thumbs").innerHTML = _gallery.length
      ? _gallery.map((u, i) => `<div style="position:relative;width:80px;height:60px;border-radius:6px;overflow:hidden;flex-shrink:0"><img src="${esc(u)}" style="width:100%;height:100%;object-fit:cover"><button type="button" data-gi="${i}" class="gal-rm" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center">×</button></div>`).join("")
      : `<span class="muted" style="font-size:13px">No images yet</span>`;
    // re-bind remove buttons
    document.querySelectorAll(".gal-rm").forEach(btn => {
      btn.onclick = () => { _gallery.splice(Number(btn.dataset.gi), 1); refreshGalThumbs(); };
    });
  };
  refreshGalThumbs();

  $("#gal_file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    if (_gallery.length >= 6) { toast("Gallery full", "Maximum 6 images allowed.", false); return; }
    if (file.size > 5 * 1024 * 1024) { toast("File too large", "Maximum image size is 5 MB.", false); return; }
    $("#gal_status").textContent = "Uploading…";
    const url = await _svc.uploadImage(file);
    if (url) {
      _gallery.push(url);
      refreshGalThumbs();
      $("#gal_status").textContent = `${_gallery.length} / 6 images`;
    } else {
      $("#gal_status").textContent = "Upload failed. Try again.";
    }
  };

  // Profile image upload handler
  $("#img_file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast("File too large", "Maximum image size is 5 MB.", false); return; }
    $("#img_status").textContent = "Uploading…";
    const url = await _svc.uploadImage(file);
    if (url) {
      _imageUrl = url;
      $("#img_preview").innerHTML = `<img src="${esc(url)}" style="width:100%;height:100%;object-fit:cover">`;
      $("#img_status").textContent = "Image uploaded successfully";
    } else {
      $("#img_status").textContent = "Upload failed. Try again.";
    }
  };

  $("#editForm").onsubmit = async (e) => {
    e.preventDefault();
    if ($("#e_email").value.trim() && !reqField("e_email", isEmail)) return;
    const btn = $("#saveBtn"); btn.disabled = true; btn.textContent = "Saving…";

    const formData = {
      company_name: $("#e_name").value.trim(),
      website: $("#e_site").value.trim(),
      contact_person: $("#e_person").value.trim(),
      designation: $("#e_role").value.trim(),
      email: $("#e_email").value.trim(),
      phone: $("#e_phone").value.trim(),
      country: $("#e_country").value,
      sector: $("#e_pillar").value,
      goal,
      tier,
      seek: s.value.trim(),
      image_url: _imageUrl,
      cover_url: _coverUrl,
      gallery: _gallery,
    };

    const result = await _svc.saveListing(formData);
    if (result) {
      if (typeof result === "object") state.USER = { ...state.USER, ...result };
      toast("Listing saved", "Your profile has been updated.");
      go("#/dashboard");
    } else {
      btn.disabled = false;
      btn.innerHTML = `${ico("check")} Save changes`;
    }
  };

  $("#pwForm").onsubmit = async (e) => {
    e.preventDefault();
    const cur = $("#pw_cur").value;
    const nw  = $("#pw_new").value;
    const cf  = $("#pw_conf").value;
    let ok = true;
    if (!cur) { $("#pw_cur").closest(".field").classList.add("invalid"); ok = false; } else { $("#pw_cur").closest(".field").classList.remove("invalid"); }
    if (nw.length < 6) { $("#pw_new").closest(".field").classList.add("invalid"); ok = false; } else { $("#pw_new").closest(".field").classList.remove("invalid"); }
    if (nw !== cf) { $("#pw_conf").closest(".field").classList.add("invalid"); ok = false; } else { $("#pw_conf").closest(".field").classList.remove("invalid"); }
    if (!ok) return;
    const btn = $("#pwBtn"); btn.disabled = true; btn.textContent = "Updating…";
    const success = await _svc.changePassword({ current_password: cur, new_password: nw });
    if (success) {
      $("#pw_cur").value = ""; $("#pw_new").value = ""; $("#pw_conf").value = "";
      toast("Password updated", "Your new password is active.");
    }
    btn.disabled = false;
    btn.innerHTML = `${ico("check")} Update password`;
  };
}
