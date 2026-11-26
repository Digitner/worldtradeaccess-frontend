/* eslint-disable */
import { logActivity } from '../../utils/activity.js';
import { ccChip, pIco, typeTag } from '../../components/Chips/Chips.js';
import { toast } from '../../components/Toasts/toast.js';
import { ROLE_META, TIERS } from '../../constant/roles.js';
import { reqField } from '../../utils/forms.js';
import useServices from './hooks/useServices.js';
import { $, esc, fmtShort, ico, img, imgTag, initialsOf, photo } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

const _svc = useServices();

/* ================= ABOUT THE BUSINESS =================
   What the member's own business domain says about them, read server-side when they sign up or log in
   (backend: api/controller/services/businessProfile.js -> the AI service's /v1/profile/draft, which fetches
   the site through the SSRF-safe fetcher). Every value here is the website's own wording - nothing is
   inferred - so a short section is a truthful one, and a domain that couldn't be read shows nothing at all
   rather than an empty shell that reads like the company has nothing to show. */

/**
 * The member's website as a link that looks like one.
 *
 * It was previously an <a> carrying nothing but `font-weight:600`, so it inherited the body colour and read
 * as plain text - people had no way to tell it could be opened. The `.weblink` class supplies the colour,
 * the underline and the "opens elsewhere" arrow.
 *
 * Also the one place the scheme is added: members type "campusshoes.com", and an href without a scheme is
 * resolved against this app's own origin, which would navigate into the directory instead of out to them.
 *
 * @param {string} site the website as the member entered it
 * @param {string} [style] extra inline style for the context it sits in
 * @returns {string} HTML, or "" when there is no website
 */
function websiteLink(site, style) {
  const raw = String(site || "").trim();
  if (!raw) return "";
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return `<a class="weblink" href="${esc(href)}" target="_blank" rel="noopener"` +
    `${style ? ` style="${style}"` : ""} title="Opens ${esc(hostOf(raw))} in a new tab">${esc(raw)}</a>`;
}

/** The host a profile was read from, for the "Read from <domain>" line. */
function hostOf(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

/** One labelled row of chips, or nothing when the site named none of them. */
function factRow(label, items, icon) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return "";
  return `<div style="margin-top:16px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;opacity:.5;margin-bottom:7px;display:flex;gap:6px;align-items:center">${ico(icon)} ${esc(label)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${list.map(v => `<span class="tag plain">${esc(String(v))}</span>`).join("")}</div>
  </div>`;
}

/**
 * One product tile: its image, name, SKU and the price the member's own site publishes.
 *
 * Deliberately NOT a link. This is a directory listing of what a member sells, not a storefront - the action
 * here is to request an introduction through the chamber, and sending a buyer off to the member's own
 * checkout would quietly route the relationship around it.
 *
 * A product with no published price says so plainly rather than being hidden - a buyer still wants to know
 * the member makes it, and "ask them" is a real answer. Nothing here is ever a made-up figure.
 *
 * @param {object} p product from the API
 * @returns {string} HTML
 */
function productCard(p) {
  const price = p.price_text
    ? `<span class="pc-price">${esc(p.price_text)}${p.price_unit ? `<span class="pc-unit">/${esc(p.price_unit)}</span>` : ""}</span>`
    : `<span class="pc-price pc-price--none">On enquiry</span>`;
  return `<article class="pcard">
    <div class="pcard-img">${p.image_url
      ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" decoding="async" onerror="this.closest('.pcard-img').classList.add('is-empty');this.remove()">`
      : ""}<span class="pcard-img-none">${ico("box")}</span></div>
    <div class="pcard-body">
      <h3 class="pcard-name" title="${esc(p.name)}">${esc(p.name)}</h3>
      ${p.sku ? `<div class="pcard-sku">${esc(p.sku)}</div>` : ""}
      <div class="pcard-foot">${price}</div>
    </div>
  </article>`;
}

/**
 * The product catalogue read from the member's website.
 * @param {object} member view model (needs `catalog`, `business`)
 * @returns {string} HTML, or "" when their site publishes no catalogue
 */
function catalogHTML(member) {
  const list = member.catalog || [];
  if (!list.length) return "";
  const host = hostOf((member.business && member.business.source_url) || member.site);
  const priced = list.filter((p) => p.price_text);
  // Priced items first: a buyer scanning a shop front is looking for the figure, and a wall of "on enquiry"
  // at the top makes a catalogue that does publish prices look like one that doesn't.
  const ordered = [...priced, ...list.filter((p) => !p.price_text)];
  // Long catalogues are collapsed rather than truncated - hiding stock entirely would misrepresent the
  // member's range, but 60 tiles would bury everything below this card.
  const FOLD = 8;
  const rest = ordered.slice(FOLD);

  return `
    <div style="background:var(--surface-2,var(--surface));border:1px solid var(--line);border-radius:14px;padding:22px 24px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5;display:flex;gap:6px;align-items:center">${ico("box")} Products &amp; prices</div>
        <span class="muted" style="font-size:11.5px">${list.length} listed${priced.length ? ` · ${priced.length} priced` : ""}</span>
      </div>
      <p class="muted" style="margin:6px 0 16px;font-size:12px">Listed on ${host ? `<b>${esc(host)}</b>` : "their website"}. Prices are as their site publishes them and may have changed &mdash; confirm before ordering.</p>
      <div class="pgrid">${ordered.slice(0, FOLD).map(productCard).join("")}</div>
      ${rest.length ? `
        <div class="pgrid" id="pgridMore" hidden>${rest.map(productCard).join("")}</div>
        <button type="button" class="btn btn-sm btn-block" id="pgridToggle" style="margin-top:12px">
          ${ico("grid")} Show all ${list.length} products
        </button>` : ""}
    </div>`;
}


/**
 * The "About the business" card shown under Contact.
 * @param {object} member view model (needs `business`, `site`, `name`)
 * @returns {string} HTML, or "" when there is nothing truthful to show
 */
function aboutBusinessHTML(member) {
  const b = member.business;
  if (!b) return "";

  const shell = (body, note) => `
    <div style="background:var(--surface-2,var(--surface));border:1px solid var(--line);border-radius:14px;padding:22px 24px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5;display:flex;gap:6px;align-items:center">${ico("building")} About the business</div>
        ${note}
      </div>
      ${body}
    </div>`;

  // Still being read (a member who just signed up). Say so plainly instead of showing a blank card.
  if (b.status === "pending") {
    const host = hostOf(b.source_url || member.site);
    if (!host) return "";
    return shell(
      `<p class="muted" style="margin:0;font-size:14px">Reading <b>${esc(host)}</b> now. The business details from their website appear here once it has been read.</p>`,
      ""
    );
  }

  // The domain couldn't be read, or said nothing concrete - show nothing rather than an empty section.
  if (b.status !== "ready") return "";

  const host = hostOf(b.source_url || member.site);
  const facts =
    factRow("Products & services", b.products, "box") +
    factRow("Certifications & standards", b.certifications, "shield") +
    factRow("Target markets", b.target_markets, "pin") +
    factRow("HS codes", b.hs_codes, "file");

  const body = `
    ${b.trading_name && b.trading_name.toLowerCase() !== (member.name || "").toLowerCase()
      ? `<div style="font-weight:600;margin-bottom:6px">${esc(b.trading_name)}</div>` : ""}
    ${b.description ? `<p style="margin:0;font-size:15px;line-height:1.65">${esc(b.description)}</p>` : ""}
    ${b.seeking_summary && b.seeking_summary !== member.seek
      ? `<p class="muted" style="margin:12px 0 0;font-size:14px;line-height:1.6">${ico("search")} ${esc(b.seeking_summary)}</p>` : ""}
    ${facts}`;

  if (!body.trim()) return "";

  const note = host
    ? `<span class="muted" style="font-size:11.5px;display:inline-flex;gap:5px;align-items:center">${ico("globe")} Read from ${esc(host)}</span>`
    : "";
  return shell(body, note);
}

/**
 * Render the member page into the app container.
 * @param {HTMLElement} app mount node (#app)
 * @param {string} id record id
 */
export async function viewMember(app, id) {
  app.innerHTML = `<section><div class="wrap"><div class="loading-shimmer" style="height:340px;border-radius:16px;margin-top:24px"></div></div></section>`;

  const m = await _svc.getMember(id);

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
    country: m.country_name || m.country,
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
    // Read from the member's own business domain at sign-up/login (backend:
    // api/controller/services/businessProfile.js). Everything in here is the website's own wording.
    business: m.business_profile || null,
    // What they list for sale on that website, with the price their own page displays.
    catalog: Array.isArray(m.products) ? m.products : [],
  };

  logActivity("View", member.name, { member_id: member.id, sector: member.pillar, country: member.country, goal: member.type });

  const realHero = member.cover_url || member.image_url || "";
  const heroImg = realHero || photo(member) || "";
  const gal = [...new Set(member.gallery.filter(Boolean))];
  _galImages = gal;

  const initials = initialsOf(member.name);
  const tierInfo = member.tier && TIERS[member.tier] ? TIERS[member.tier] : null;

  app.innerHTML = `
  <section style="padding-top:14px;padding-bottom:60px">

    <!-- Back nav -->
    <div class="wrap" style="padding-top:16px;padding-bottom:0">
      <button class="backlink" onclick="history.length>1?history.back():go('#/directory')">${ico("back")} Back to directory</button>
    </div>

    <!-- Cover hero: a rounded banner inside the page width. An uploaded cover is shown whole (contained, on a
         blurred copy of itself) so logos and portraits are never cut off; the stock sector photo fills it. -->
    <div class="wrap" style="padding-top:0;padding-bottom:0">
      <div style="position:relative;height:clamp(240px,38vh,460px);border-radius:16px;overflow:hidden;margin-top:8px;background:var(--surface-2)">
        ${heroImg
          ? (realHero
            ? `<img src="${esc(heroImg)}" alt="" aria-hidden="true" style="position:absolute;inset:-20px;width:calc(100% + 40px);height:calc(100% + 40px);object-fit:cover;filter:blur(22px) saturate(1.1);opacity:.55">
               <img src="${esc(heroImg)}" alt="${esc(member.name)}" style="position:relative;width:100%;height:100%;object-fit:contain;cursor:pointer" onclick="openVideo('${esc(member.name)}','${esc(heroImg)}')">`
            : `<img src="${esc(heroImg)}" alt="" style="width:100%;height:100%;object-fit:cover">`)
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;opacity:.06;font-size:120px">${ico("building")}</div>`}
        ${realHero ? `<button class="play" onclick="openVideo('${esc(member.name)}','${esc(heroImg)}')" aria-label="View cover of ${esc(member.name)}" style="position:absolute;right:14px;bottom:14px"><span class="pb">${ico("play")}</span></button>` : ""}
      </div>
    </div>

    <!-- Profile header -->
    <div class="wrap">
      <div style="display:flex;gap:20px;align-items:flex-start;margin-top:0;padding-left:18px;position:relative;z-index:2;flex-wrap:wrap">
        <!-- Avatar -->
        <div style="margin-top:-36px;flex:0 0 auto;width:72px;height:72px;border-radius:18px;background:var(--blue-soft,rgba(59,130,246,.15));border:3px solid var(--surface);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:var(--blue-text,#3b82f6);flex-shrink:0;overflow:hidden">
          ${member.image_url
            ? `<img src="${esc(member.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover">`
            : esc(initials)}
        </div>
        <div style="flex:1;min-width:0;padding:12px 0 4px">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
            <h1 style="font-size:26px;font-weight:800;margin:0;line-height:1.2">${esc(member.name)}</h1>
            ${member.spon ? `<span class="spon-badge">Sponsored</span>` : ""}
            ${typeTag(member.type)}
            ${tierInfo ? `<span class="muted" style="font-size:12px">${tierInfo.t}</span>` : ""}
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <span style="display:inline-flex;gap:5px;align-items:center;font-size:13px">${ccChip(member.country)} ${esc(member.country)}</span>
            ${member.pillar ? `<span class="muted" style="font-size:13px">·</span><span style="display:inline-flex;gap:5px;align-items:center;font-size:13px">${pIco(member.pillar)} ${esc(member.pillar)}</span>` : ""}
            ${member.site ? `<span class="muted" style="font-size:13px">·</span><span style="display:inline-flex;gap:4px;align-items:center;font-size:13px">${ico("globe")}${websiteLink(member.site)}</span>` : ""}
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
                ${websiteLink(member.site, "font-size:15px")}
              </div>` : ""}
            </div>
          </div>` : ""}

          <!-- About the business: extracted from the member's own domain -->
          ${aboutBusinessHTML(member)}

          <!-- What they sell, read from that same website -->
          ${catalogHTML(member)}

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
                ${member.site ? `<button class="btn btn-sm btn-block" id="rescanSite" style="margin-top:8px">${ico("refresh")} Re-read my website</button>
                <p class="muted" style="margin:8px 0 0;font-size:11.5px">Pulls your About details and product prices from ${esc(hostOf(member.site))} again.</p>` : ""}
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

    </div>
  </section>

  <style>
    @media (max-width: 780px) {
      #mem_grid { grid-template-columns: 1fr !important; }
    }
  </style>`;

  // Reveal the rest of a long catalogue in place, rather than paging or truncating it.
  const pToggle = $("#pgridToggle");
  if (pToggle) pToggle.onclick = () => {
    const more = $("#pgridMore");
    if (!more) return;
    const showing = !more.hidden;
    more.hidden = showing;
    pToggle.innerHTML = showing
      ? `${ico("grid")} Show all ${(member.catalog || []).length} products`
      : `${ico("grid")} Show fewer`;
  };

  // Owner-only: read my own site again, then re-render the page so the new About text and prices are the
  // ones on screen. Disabled while it runs, because a crawl takes seconds and a second click would start a
  // second one.
  const rescan = $("#rescanSite");
  if (rescan) rescan.onclick = async () => {
    rescan.disabled = true;
    rescan.innerHTML = ico("refresh") + " Reading your website…";
    const r = await _svc.refreshWebsite();
    if (r) {
      // Say how many carried a price, not just how many were found: "12 products, 0 with prices" tells the
      // member their site quotes on request (or renders prices in JavaScript), which "12 products" does not.
      const n = r.products_found, priced = r.prices_found || 0;
      toast("Website read", !n
        ? `Read ${r.domain}. No product listings were found on it.`
        : priced
          ? `Found ${n} product${n === 1 ? "" : "s"} on ${r.domain}, ${priced} with prices.`
          : `Found ${n} product${n === 1 ? "" : "s"} on ${r.domain}, but no prices - your site may quote on request, or show prices only after the page loads.`);
      viewMember(app, id);
      return;
    }
    rescan.disabled = false;
    rescan.innerHTML = ico("refresh") + " Re-read my website";
  };

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
      if (!state.USER) { toast("Create an account first", "Register to draft an introduction.", false); go("#/register"); return; }
      dBtn.disabled = true; dBtn.innerHTML = ico("sparkle") + " Drafting…";
      const msg = await _svc.draftIntro({ toMemberId: member.id });
      if (msg) $("#i_msg").value = msg;
      dBtn.disabled = false; dBtn.innerHTML = ico("sparkle") + " Draft again with AI";
    };
  }
}

let _galImages = [], _galIdx = 0;

/**
 * Open the member gallery lightbox at an index.
 * @param {number} idx index
 */
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

/**
 * Open the member video modal.
 * @param {string} name name
 * @param {string} src media URL
 */
export function openVideo(name, src) {
  const imgSrc = src && !src.startsWith("undefined") ? src : "";
  const el = document.createElement("div"); el.className = "vmodal"; el.id = "vmodal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", name + " overview");
  el.innerHTML = `<div class="vbox"><div class="vstage">${imgSrc ? `<img src="${esc(imgSrc)}" alt="${esc(name)}" style="width:100%;height:100%;object-fit:contain">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-soft)">${ico("image")} No image available</div>`}</div><div class="vbar"><div><b class="serif">${esc(name)}</b></div><button class="icon-btn" onclick="closeVideo()" aria-label="Close">${ico("x")}</button></div></div>`;
  el.onclick = e => { if (e.target === el) closeVideo(); };
  document.body.appendChild(el); el.querySelector(".icon-btn").focus();
  el.addEventListener("keydown", e => { if (e.key === "Escape") closeVideo(); });
}

/**
 * Close the video modal.
 */
export function closeVideo() { const m = $("#vmodal"); if (m) m.remove(); }
