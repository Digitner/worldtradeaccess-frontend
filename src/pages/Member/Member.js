/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { ccChip, pIco, typeTag } from '../../components/Chips/Chips.js';
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { toast } from '../../components/Toasts/toast.js';
import { ROLE_META, TIERS } from '../../constant/roles.js';
import { reqField } from '../../utils/forms.js';
import useServices from './hooks/useServices.js';
import { $, esc, fmtShort, ico, img, imgTag, initialsOf, photo } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

const _svc = useServices();

export async function viewMember(app, id) {
  app.innerHTML = `<section><div class="wrap"><div class="loading-shimmer" style="height:300px;border-radius:12px;margin-top:24px"></div></div></section>`;

  const [m, similar] = await Promise.all([
    _svc.getMember(id),
    _svc.getSimilar(id),
  ]);

  if (!m) {
    app.innerHTML = `<section><div class="wrap"><div class="empty">This member listing isn't available. <button class="linkish" onclick="go('#/directory')">Browse the directory</button></div></div></section>`;
    return;
  }

  // Normalize fields
  const member = {
    id: m._id || m.id,
    name: m.company_name || m.name,
    country: m.country,
    pillar: m.sector || m.pillar,
    type: m.goal || m.type,
    seek: m.seek,
    tier: m.tier,
    spon: m.is_sponsored || m.spon,
    person: m.contact_person || m.person,
    role_t: m.designation || m.role_t,
    site: m.website || m.site,
    intro_already: m.intro_already || m.already_introduced,
    intro_date: m.intro_date,
    is_own: m.is_own || false,
    image_url: m.image_url || m.photo || null,
    cover_url: m.cover_url || null,
    gallery: Array.isArray(m.gallery) ? m.gallery : [],
    img: m.photo || m.img,
  };

  const simMapped = similar.map(s => ({
    id: s._id || s.id,
    name: s.company_name || s.name,
    country: s.country,
    pillar: s.sector || s.pillar,
    type: s.goal || s.type,
    seek: s.seek,
    tier: s.tier,
  }));

  // Hero = cover_url → profile image (no stock photo fallback)
  const heroImg = member.cover_url || member.image_url || "";
  // Gallery = uploaded gallery images (deduplicated)
  const gal = [...new Set(member.gallery.filter(Boolean))];
  // Set global for lightbox navigation
  _galImages = gal;

  app.innerHTML = `
  <section><div class="wrap"><div class="split">
    <div class="main">
      <button class="backlink" onclick="history.length>1?history.back():go('#/directory')">${ico("back")} Back</button>
      <div class="card">
        <div class="media-hero">${heroImg ? `<img src="${esc(heroImg)}" alt="${esc(member.name)}" style="width:100%;height:100%;object-fit:cover">` : ""}${heroImg ? `<button class="play" onclick="openVideo('${esc(member.name)}','${esc(heroImg)}')" aria-label="View cover of ${esc(member.name)}"><span class="pb">${ico("play")}</span></button>` : ""}<div class="cap">${ccChip(member.country, "on-photo")} ${esc(member.country)}</div></div>
        <div class="top" style="gap:16px">
          <div style="display:flex;gap:14px;align-items:center;min-width:0"><span class="avatar" style="width:56px;height:56px;border-radius:14px;font-size:20px;cursor:default">${esc(initialsOf(member.name))}</span><div style="min-width:0"><h1 style="font-size:27px;margin:0">${esc(member.name)}</h1><div class="muted" style="margin-top:4px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">${ccChip(member.country)} ${esc(member.country)} · ${pIco(member.pillar)} ${esc(member.pillar)}${member.tier && TIERS[member.tier] ? ` · ${TIERS[member.tier].t}` : ""}</div></div></div>
          <div style="display:flex;gap:8px;align-items:center">${member.spon ? '<span class="spon-badge">Sponsored</span>' : ""}${typeTag(member.type)}</div>
        </div>
        ${gal.length ? `<div class="gallery">${gal.map((g, i) => `<button class="gthumb" onclick="openGallery(${i})" aria-label="View image ${i+1}"style="background:var(--surface-2);border-radius:8px;overflow:hidden;width:90px;height:68px;border:none;cursor:pointer;padding:0"><img src="${esc(g)}" alt="" style="width:100%;height:100%;object-fit:cover"></button>`).join("")}</div>` : ""}
        <div style="margin-top:18px;padding:16px;background:var(--surface-2);border-radius:var(--r-sm);border:1px solid var(--line-soft)">
          <div class="flabel" style="margin-bottom:6px">${ico("search")}What they seek</div>
          <p style="margin:0;font-size:16px;line-height:1.55"><span class="serif" style="color:var(--gold-text);font-size:22px">"</span>${esc(member.seek)}</p>
        </div>
        <div class="form-grid" style="margin-top:18px">
          ${member.person ? `<div><div class="muted" style="display:flex;gap:6px;align-items:center">${ico("user")}Contact</div><b>${esc(member.person)}</b>${member.role_t ? ` · ${esc(member.role_t)}` : ""}</div>` : ""}
          ${member.site ? `<div><div class="muted" style="display:flex;gap:6px;align-items:center">${ico("globe")}Website</div><b>${esc(member.site)}</b></div>` : ""}
        </div>
      </div>
    </div>
    <div class="side" style="margin-top:38px">
      ${member.is_own
        ? `<div class="card" style="text-align:center"><p class="muted" style="margin:0">This is your own listing. <button class="linkish" onclick="go('#/edit')">Edit it →</button></p></div>`
        : member.intro_already
          ? `<div class="card" style="display:flex;gap:12px;align-items:flex-start;background:var(--green-soft)"><span style="color:var(--green-text);font-size:20px;display:inline-flex">${ico("check")}</span><div><b>Introduction requested</b><div class="muted">You reached out on ${fmtShort(member.intro_date)}. The chamber will facilitate the connection.</div><button class="linkish" style="margin-top:8px" onclick="go('#/dashboard')">Track it in your dashboard →</button></div></div>`
          : `<form class="card" id="introForm" novalidate>
              <h2 style="font-size:18px;margin:0 0 4px">Request an introduction</h2>
              <p class="muted" style="margin:0 0 14px">The chamber facilitates a warm connection between you and ${esc(member.name)}.</p>
              <div class="field"><label for="i_msg">${ico("mail")}Your message <span class="req">*</span></label><textarea id="i_msg" maxlength="700" rows="6" placeholder="Introduce yourself and what you're proposing…"></textarea><div class="err-msg">Add a short message</div></div>
              <button type="button" class="btn btn-sm btn-block" style="margin-top:10px" id="draftAI">${ico("sparkle")} Draft with AI</button>
              <button class="btn btn-primary btn-block" id="introBtn" type="submit" style="margin-top:10px">${ico("send")} Send introduction request</button>
            </form>`}
    </div>
  </div>
  ${simMapped.length ? `<div class="section-h" style="margin-top:26px"><h2 style="font-size:21px">Similar members</h2><button class="linkish" onclick="go('#/directory')">Browse all →</button></div>${carousel(simMapped.map(mktCardHTML).join(""), false, "Similar members")}` : ""}
  </div></section>`;

  const f = $("#introForm");
  if (f) {
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!state.USER) { toast("Create an account first", "Register to request introductions.", false); go("#/register"); return; }
      if (!reqField("i_msg")) return;
      const btn = $("#introBtn");
      btn.disabled = true; btn.textContent = "Sending…";
      const result = await _svc.sendIntro({ toMemberId: member.id, message: $("#i_msg").value.trim() });
      if (result === "guest") { toast("Create an account first", "Register to request introductions.", false); go("#/register"); return; }
      if (result === "sent") { toast("Introduction sent", `Your request to ${member.name} is in.`); go("#/dashboard"); }
      else { btn.disabled = false; btn.innerHTML = `${ico("send")} Send introduction request`; }
    };

    const dBtn = $("#draftAI");
    if (dBtn) dBtn.onclick = async () => {
      dBtn.disabled = true; dBtn.innerHTML = ico("sparkle") + " Drafting…";
      const msg = await _svc.draftIntro({ toMemberId: member.id });
      if (msg) $("#i_msg").value = msg;
      dBtn.disabled = false; dBtn.innerHTML = ico("sparkle") + " Draft again with AI";
    };
  }
}

let _galImages = [], _galIdx = 0;

export function openGallery(idx) {
  _galIdx = idx;
  const src = _galImages[_galIdx] || "";
  const el = document.getElementById("vmodal");
  if (el) el.remove();
  const total = _galImages.length;
  const modal = document.createElement("div");
  modal.className = "vmodal"; modal.id = "vmodal";
  modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `<div class="vbox">
    <div class="vstage" style="position:relative">
      <img src="${esc(src)}" alt="" style="width:100%;height:100%;object-fit:contain">
      ${total > 1 ? `<button onclick="openGallery((_galIdx-1+${total})%${total})" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:18px">‹</button><button onclick="openGallery((_galIdx+1)%${total})" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:18px">›</button>` : ""}
    </div>
    <div class="vbar"><div><b class="serif">${total > 1 ? `Image ${_galIdx+1} of ${total}` : "Image"}</b></div><button class="icon-btn" onclick="closeVideo()" aria-label="Close">${ico("x")}</button></div>
  </div>`;
  modal.onclick = e => { if (e.target === modal) closeVideo(); };
  document.body.appendChild(modal); modal.querySelector(".icon-btn").focus();
  modal.addEventListener("keydown", e => {
    if (e.key === "Escape") closeVideo();
    if (e.key === "ArrowRight") openGallery((_galIdx+1) % total);
    if (e.key === "ArrowLeft") openGallery((_galIdx-1+total) % total);
  });
}

export function openVideo(name, src) {
  const imgSrc = src && !src.startsWith("undefined") ? src : "";
  const el = document.createElement("div"); el.className = "vmodal"; el.id = "vmodal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", name + " overview");
  el.innerHTML = `<div class="vbox"><div class="vstage">${imgSrc ? `<img src="${esc(imgSrc)}" alt="${esc(name)}" style="width:100%;height:100%;object-fit:contain">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-soft)">${ico("image")} No image available</div>`}</div><div class="vbar"><div><b class="serif">${esc(name)}</b></div><button class="icon-btn" onclick="closeVideo()" aria-label="Close">${ico("x")}</button></div></div>`;
  el.onclick = e => { if (e.target === el) closeVideo(); };
  document.body.appendChild(el); el.querySelector(".icon-btn").focus();
  el.addEventListener("keydown", e => { if (e.key === "Escape") closeVideo(); });
}

export function closeVideo() { const m = $("#vmodal"); if (m) m.remove(); }
