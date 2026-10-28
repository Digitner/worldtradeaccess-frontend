/* eslint-disable */
import { ccChip } from '../../components/Chips/Chips.js';
import { toast } from '../../components/Toasts/toast.js';
import { DEAL_STAGES } from '../../constant/forms.js';
import { PILLARS } from '../../constant/pillars.js';
import { reqField } from '../../utils/forms.js';
import useServices from './hooks/useServices.js';
import { $, $$, esc, ico, img, imgTag } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

const _svc = useServices();
let _listings = [];
let _inboundMap = {}; // listingId → investor count

export async function viewFunding(app, _a, soft) {
  if (soft && $("#fund_list")) { paintFund(); return; }
  let ftype = "Seeking Investment";

  app.innerHTML = `
  <section><div class="wrap">
    <span class="kicker">Capital &amp; deals</span>
    <h1 class="page-h">Funding &amp; JV marketplace.</h1>
    <p class="page-sub">Members raising capital, seeking JV partners, or listing a business for sale. Express interest, or list your own.</p>
    <div class="split" style="margin-top:18px">
      <div class="main" id="fund_list"><div class="loading-shimmer" style="height:200px;border-radius:12px"></div></div>
      <div class="side">
        <form class="card" id="fundForm" novalidate>
          <h2 style="font-size:18px;margin:0 0 4px">List your business</h2>
          <p class="muted" style="margin:0 0 14px">Publish a capital, JV or sale opportunity to the network.</p>
          <span class="flabel">${ico("filter")}Listing type</span>
          <div class="roles" id="ftypes" style="margin:6px 0 14px">${[["Seeking Investment", "wallet"], ["Seeking JV", "handshake"], ["For Sale", "briefcase"]].map(([t, i]) => `<button type="button" class="role" data-t="${t}" aria-pressed="${t === ftype}">${ico(i)}${t}</button>`).join("")}</div>
          <div class="field" style="margin-bottom:12px"><label for="ff_company">${ico("building")}Company <span class="req">*</span></label><input id="ff_company" value="${state.USER ? esc(state.USER.company_name || state.USER.name || "") : ""}"><div class="err-msg">Enter the company name</div></div>
          <div class="form-grid">
            <div class="field"><label for="ff_amount">${ico("coins")}Amount</label><input id="ff_amount" placeholder="USD 5M"></div>
            <div class="field"><label for="ff_sector">${ico("grid")}Sector</label><select id="ff_sector">${PILLARS.map(p => `<option ${state.USER && (state.USER.sector || state.USER.pillar) === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
          </div>
          <div class="field full" style="margin-top:12px"><label for="ff_desc">${ico("file")}Description <span class="req">*</span></label><textarea id="ff_desc" maxlength="400" placeholder="What you're offering and why…"></textarea><div class="err-msg">Describe the opportunity</div></div>
          <div class="field full" style="margin-top:12px">
            <label style="display:flex;align-items:center;gap:6px;margin-bottom:8px">${ico("image")}Listing image <span class="muted" style="font-weight:400">(optional)</span></label>
            <div id="ff_img_preview" style="display:none;margin-bottom:8px;position:relative;width:100%;height:120px;border-radius:10px;overflow:hidden;background:var(--surface-2)"><img id="ff_img_thumb" src="" alt="" style="width:100%;height:100%;object-fit:cover"><button type="button" onclick="document.getElementById('ff_img_preview').style.display='none';document.getElementById('ff_img_drop').style.display='flex';document.getElementById('ff_img').value='';window._fundImgUrl=null" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;color:#fff;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:15px;line-height:1.1">×</button></div>
            <label for="ff_img" id="ff_img_drop" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:2px dashed var(--line);border-radius:10px;padding:18px 12px;cursor:pointer;transition:border-color .15s;text-align:center" onmouseover="this.style.borderColor='var(--blue-bright)'" onmouseout="this.style.borderColor='var(--line)'">
              <span style="color:var(--blue-text);display:inline-flex;font-size:26px">${ico("image")}</span>
              <span style="font-size:13.5px;font-weight:600">Click to upload image</span>
              <span class="muted" style="font-size:12px">JPG, PNG or WEBP · shows on your listing card</span>
            </label>
            <input id="ff_img" type="file" accept="image/*" style="display:none">
          </div>
          <button class="btn btn-primary btn-block" id="publishBtn" type="submit" style="margin-top:14px">${ico("rocket")} Publish listing</button>
        </form>
      </div>
    </div>
  </div></section>`;

  window._fundImgUrl = null;
  window._fundImgUploading = false;
  $("#ftypes").onclick = e => { const b = e.target.closest(".role"); if (!b) return; ftype = b.dataset.t; $$("#ftypes .role").forEach(x => x.setAttribute("aria-pressed", String(x === b))); };

  // Image preview + upload handler — disable publish while uploading
  document.getElementById("ff_img").onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const prev = document.getElementById("ff_img_preview");
    const drop = document.getElementById("ff_img_drop");
    const thumb = document.getElementById("ff_img_thumb");
    const btn = document.getElementById("publishBtn");
    thumb.src = URL.createObjectURL(file);
    prev.style.display = "block";
    if (drop) drop.style.display = "none";
    // Block submit until upload finishes
    window._fundImgUploading = true;
    if (btn) { btn.disabled = true; btn.textContent = "Uploading image…"; }
    const url = await _svc.uploadImage(file);
    window._fundImgUploading = false;
    if (btn) { btn.disabled = false; btn.innerHTML = `${ico("rocket")} Publish listing`; }
    if (url) { window._fundImgUrl = url; }
    else { prev.style.display = "none"; if (drop) drop.style.display = "flex"; e.target.value = ""; window._fundImgUrl = null; }
  };

  // Load listings + inbound deals (for owner investor count)
  const [fetchedListings, inbound] = await Promise.all([
    _svc.getFunding(),
    state.USER ? _svc.getInboundDeals() : Promise.resolve([]),
  ]);
  _listings = fetchedListings;
  _inboundMap = {};
  for (const d of inbound) {
    const lid = d.funding_listing_id?.toString?.() || String(d.funding_listing_id || "");
    _inboundMap[lid] = (_inboundMap[lid] || 0) + 1;
  }
  paintFund();

  $("#fundForm").onsubmit = async (e) => {
    e.preventDefault();
    if (window._fundImgUploading) { toast("Please wait", "Image is still uploading…", false); return; }
    if (!state.USER) { toast("Create an account first", "Log in to publish a listing.", false); go("#/login"); return; }
    if (![reqField("ff_company"), reqField("ff_desc")].every(Boolean)) { toast("Check the form", "Company and description are required.", false); return; }
    const btn = $("#publishBtn"); btn.disabled = true; btn.textContent = "Publishing…";
    const formData = {
      type: ftype,
      company: $("#ff_company").value.trim(),
      amount: $("#ff_amount").value.trim() || "Undisclosed",
      sector: $("#ff_sector").value,
      description: $("#ff_desc").value.trim(),
      image_url: window._fundImgUrl || null,
    };
    const result = await _svc.publishListing(formData);
    if (result) {
      toast("Listing published", "It's live in the marketplace.");
      window._fundImgUrl = null;
      _listings = await _svc.getFunding();
      paintFund();
      $("#fundForm").reset();
      document.getElementById("ff_img_preview").style.display = "none";
      document.getElementById("ff_img_drop").style.display = "flex";
    }
    btn.disabled = false; btn.innerHTML = `${ico("rocket")} Publish listing`;
  };
}

export function paintFund() {
  const el = $("#fund_list"); if (!el) return;
  if (!_listings.length) { el.innerHTML = `<div class="empty">No listings yet. Be the first to publish one.</div>`; return; }
  el.innerHTML = _listings.map(f => {
    const company = f.company_name || f.company;
    const country = f.country || (state.USER && state.USER.country) || "";
    const cls = f.type === "For Sale" ? "gold" : f.type === "Seeking JV" ? "" : "green";
    const fundImg = f.cover_url || f.image_url || "";
    const lid = (f._id || f.id || "").toString();
    const isOwn = state.USER && (f.owner_user_id?.toString?.() === (state.USER._id || state.USER.id)?.toString?.());
    const investorCount = isOwn ? (_inboundMap[lid] || 0) : 0;
    const investorBadge = isOwn ? `<span class="tag ${investorCount > 0 ? "green" : ""}" style="font-size:12px">${ico("users")} ${investorCount} investor${investorCount !== 1 ? "s" : ""} interested</span>` : "";
    return `<article class="fund-item"><div class="ph">${fundImg ? imgTag(fundImg, "") : ""}</div><div class="b"><div class="top"><div><h3 class="serif" style="font-weight:600;font-size:18px;margin:0">${esc(company)}</h3><div class="muted" style="margin-top:3px;display:flex;gap:6px;align-items:center">${ccChip(country)} ${esc(country)} · ${esc(f.sector || "")}</div></div><div style="text-align:right"><span class="tag ${cls}">${esc(f.type)}</span><div class="amt" style="margin-top:6px">${esc(f.amount || "Undisclosed")}</div></div></div><p style="margin:10px 0 0;color:var(--text-soft);font-size:14px;line-height:1.55">${esc(f.description || f.desc || "")}</p><div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn btn-sm btn-primary" onclick="go('#/deal/${esc(f._id || f.id)}')">${ico("eye")} View opportunity</button>${investorBadge}</div></div></article>`;
  }).join("");
}
