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
  app.innerHTML = `<section><div class="wrap"><div class="loading-shimmer" style="height:340px;border-radius:16px;margin-top:24px"></div></div></section>`;

  const [m, similar] = await Promise.all([
    _svc.getMember(id),
    _svc.getSimilar(id),
  ]);

  if (!m) {
    app.innerHTML = `<section><div class="wrap" style="padding-top:60px;text-align:center">
      <div style="font-size:40px;margin-bottom:16px;opacity:.3">${ico("building")}</div>
      <h2 style="margin:0 0 8px">Listing not found</h2>
      <p class="muted" style="margin:0 0 20px">This member listing isn't available or has been removed.</p>
      <button class="btn btn-primary" onclick="go('#/directory')">${ico("grid")} Browse directory</button>
    </div></section>`;
    return;
  }

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

  const heroImg = member.cover_url || member.image_url || "";
  const gal = [...new Set(member.gallery.filter(Boolean))];
  _galImages = gal;

  const initials = initialsOf(member.name);
  const tierInfo = member.tier && TIERS[member.tier] ? TIERS[member.tier] : null;

  app.innerHTML = `
  <section style="padding-bottom:60px">

    <!-- Back nav -->
    <div class="wrap" style="padding-top:16px;padding-bottom:0">
      <button class="backlink" onclick="history.length>1?history.back():go('#/directory')">${ico("back")} Back to directory</button>
    </div>

    <!-- Cover hero -->
    <div style="position:relative;height:260px;background:linear-gradient(135deg,var(--surface-2) 0%,var(--surface) 100%);overflow:hidden;margin-top:12px">
      ${heroImg
        ? `<img src="${esc(heroImg)}" alt="${esc(member.name)}" style="width:100%;height:100%;object-fit:cover;cursor:pointer" onclick="openVideo('${esc(member.name)}','${esc(heroImg)}')">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;opacity:.06;font-size:120px">${ico("building")}</div>`}
      ${heroImg ? `<button class="play" onclick="openVideo('${esc(member.name)}','${esc(heroImg)}')" aria-label="View cover of ${esc(member.name)}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><span class="pb">${ico("play")}</span></button>` : ""}
      <div style="position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(to top,var(--surface),transparent)"></div>
    </div>

    <!-- Profile header -->
    <div class="wrap">
      <div style="display:flex;gap:20px;align-items:flex-end;margin-top:-32px;position:relative;z-index:2;flex-wrap:wrap">
        <!-- Avatar -->
        <div style="width:72px;height:72px;border-radius:18px;background:var(--blue-soft,rgba(59,130,246,.15));border:3px solid var(--surface);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:var(--blue-text,#3b82f6);flex-shrink:0;overflow:hidden">
          ${member.image_url
            ? `<img src="${esc(member.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover">`
            : esc(initials)}
        </div>
        <div style="flex:1;min-width:0;padding-bottom:4px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
            <h1 style="font-size:26px;font-weight:800;margin:0;line-height:1.2">${esc(member.name)}</h1>
            ${member.spon ? `<span class="spon-badge">Sponsored</span>` : ""}
            ${typeTag(member.type)}
            ${tierInfo ? `<span class="muted" style="font-size:12px">${tierInfo.t}</span>` : ""}
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <span style="display:inline-flex;gap:5px;align-items:center;font-size:13px">${ccChip(member.country)} ${esc(member.country)}</span>
            ${member.pillar ? `<span class="muted" style="font-size:13px">·</span><span style="display:inline-flex;gap:5px;align-items:center;font-size:13px">${pIco(member.pillar)} ${esc(member.pillar)}</span>` : ""}
            ${member.site ? `<span class="muted" style="font-size:13px">·</span><a href="${esc(member.site.startsWith('http') ? member.site : 'https://'+member.site)}" target="_blank" rel="noopener" style="font-size:13px;display:inline-flex;gap:4px;align-items:center">${ico("globe")} ${esc(member.site)}</a>` : ""}
          </div>
        </div>
      </div>

      <!-- Main content grid -->
      <div style="display:grid;grid-template-columns:1fr 360px;gap:28px;margin-top:28px;align-items:start" id="mem_grid">

        <!-- Left column -->
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- What they seek -->
          ${member.seek ? `
          <div style="background:var(--surface-2,var(--surface));border:1px solid var(--line);border-radius:14px;padding:22px 24px">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin-bottom:12px;display:flex;gap:6px;align-items:center">${ico("search")} What they seek</div>
            <p style="margin:0;font-size:16px;line-height:1.65">
              <span style="color:var(--gold-text,#c89a30);font-size:28px;font-family:Georgia,serif;line-height:0;vertical-align:-8px;margin-right:4px">"</span>${esc(member.seek)}<span style="color:var(--gold-text,#c89a30);font-size:28px;font-family:Georgia,serif;line-height:0;vertical-align:-8px;margin-left:4px">"</span>
            </p>
          </div>` : ""}

          <!-- Contact info -->
          ${(member.person || member.role_t || member.site) ? `
          <div style="background:var(--surface-2,var(--surface));border:1px solid var(--line);border-radius:14px;padding:22px 24px">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin-bottom:14px;display:flex;gap:6px;align-items:center">${ico("user")} Contact</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${member.person ? `
              <div style="display:flex;gap:12px;align-items:center">
                <span style="width:36px;height:36px;border-radius:10px;background:var(--blue-soft,rgba(59,130,246,.1));color:var(--blue-text,#3b82f6);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${ico("user")}</span>
                <div>
                  <div style="font-weight:600">${esc(member.person)}</div>
                  ${member.role_t ? `<div class="muted" style="font-size:13px">${esc(member.role_t)}</div>` : ""}
                </div>
              </div>` : ""}
              ${member.site ? `
              <div style="display:flex;gap:12px;align-items:center">
                <span style="width:36px;height:36px;border-radius:10px;background:var(--blue-soft,rgba(59,130,246,.1));color:var(--blue-text,#3b82f6);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${ico("globe")}</span>
                <a href="${esc(member.site.startsWith('http') ? member.site : 'https://'+member.site)}" target="_blank" rel="noopener" style="font-weight:600">${esc(member.site)}</a>
              </div>` : ""}
            </div>
          </div>` : ""}

          <!-- Gallery -->
          ${gal.length ? `
          <div style="background:var(--surface-2,var(--surface));border:1px solid var(--line);border-radius:14px;padding:22px 24px">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin-bottom:14px;display:flex;gap:6px;align-items:center">${ico("image")} Gallery</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">
              ${gal.map((g, i) => `
                <button onclick="openGallery(${i})" aria-label="View image ${i+1}" style="padding:0;border:none;border-radius:10px;overflow:hidden;aspect-ratio:4/3;cursor:pointer;background:var(--surface)">
                  <img src="${esc(g)}" alt="" style="width:100%;height:100%;object-fit:cover;transition:transform .2s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                </button>`).join("")}
            </div>
          </div>` : ""}

        </div>

        <!-- Right column: intro panel -->
        <div style="position:sticky;top:80px">
          ${member.is_own
            ? `<div style="background:var(--surface-2,var(--surface));border:1px solid var(--line);border-radius:14px;padding:24px;text-align:center">
                <div style="font-size:32px;margin-bottom:8px;opacity:.4">${ico("building")}</div>
                <div style="font-weight:600;margin-bottom:6px">This is your listing</div>
                <p class="muted" style="margin:0 0 16px;font-size:13px">Update your profile, add gallery images, and keep your listing fresh.</p>
                <button class="btn btn-primary btn-block" onclick="go('#/edit')">${ico("edit")} Edit listing</button>
              </div>`
            : member.intro_already
              ? `<div style="background:var(--green-soft,rgba(22,163,74,.08));border:1px solid var(--green-text,#16a34a)33;border-radius:14px;padding:24px">
                  <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px">
                    <span style="width:40px;height:40px;border-radius:12px;background:var(--green-soft);color:var(--green-text,#16a34a);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px">${ico("check")}</span>
                    <div>
                      <div style="font-weight:700;font-size:16px;margin-bottom:4px">Introduction requested</div>
                      <div class="muted" style="font-size:13px">You reached out on ${fmtShort(member.intro_date)}. The chamber will facilitate the connection.</div>
                    </div>
                  </div>
                  <button class="btn btn-block" style="font-size:13px" onclick="go('#/dashboard')">${ico("grid")} Track in dashboard →</button>
                </div>`
              : `<div style="background:var(--surface-2,var(--surface));border:1px solid var(--line);border-radius:14px;padding:24px">
                  <div style="display:flex;gap:10px;align-items:center;margin-bottom:4px">
                    <span style="width:36px;height:36px;border-radius:10px;background:var(--blue-soft,rgba(59,130,246,.1));color:var(--blue-text,#3b82f6);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${ico("send")}</span>
                    <h2 style="font-size:17px;font-weight:700;margin:0">Request an introduction</h2>
                  </div>
                  <p class="muted" style="margin:0 0 16px;font-size:13px;padding-left:46px">The chamber facilitates a warm connection between you and ${esc(member.name)}.</p>
                  <form id="introForm" novalidate>
                    <div class="field" style="margin-bottom:12px">
                      <label for="i_msg" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.6">${ico("mail")} Your message <span class="req">*</span></label>
                      <textarea id="i_msg" maxlength="700" rows="5" placeholder="Introduce yourself and explain what you're proposing…" style="resize:vertical"></textarea>
                      <div class="err-msg">Add a short message</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-block" id="draftAI" style="margin-bottom:10px">${ico("sparkle")} Draft with AI</button>
                    <button class="btn btn-primary btn-block" id="introBtn" type="submit">${ico("send")} Send introduction request</button>
                  </form>
                </div>`}
        </div>

      </div>

      <!-- Similar members -->
      ${simMapped.length ? `
      <div style="margin-top:48px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="font-size:20px;font-weight:700;margin:0">Similar members</h2>
          <button class="linkish" onclick="go('#/directory')">Browse all →</button>
        </div>
        ${carousel(simMapped.map(mktCardHTML).join(""), false, "Similar members")}
      </div>` : ""}

    </div>
  </section>

  <style>
    @media (max-width: 780px) {
      #mem_grid { grid-template-columns: 1fr !important; }
    }
  </style>`;

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
