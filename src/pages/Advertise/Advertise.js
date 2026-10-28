/* eslint-disable */
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { toast } from '../../components/Toasts/toast.js';
import { PILLARS } from '../../constant/pillars.js';
import { reqField } from '../../utils/forms.js';
import { $, $$, esc, ico, img, imgTag, isEmail } from '../../utils/helpers.js';
import ConfigAPIURL from '../../config/ConfigAPIURL.js';
import { state } from '../../utils/state.js';
import useServices from './hooks/useServices.js';

const _svc = useServices();

const FMT_ICON = {
  "Leaderboard banner": "mega",
  "Leaderboard Banner": "mega",
  "Inline unit": "news",
  "Inline Unit": "news",
  "Sidebar unit": "grid",
  "Sidebar Unit": "grid",
  "Sponsored listing": "star",
  "Sponsored Listing": "star",
  "Newsletter": "mail",
  "Newsletter Placement": "mail",
  "Sector takeover": "trend",
  "Sector Takeover": "trend",
};

const FMT_DESC = {
  "Leaderboard banner": "Full-width banner at the top of Directory and Search results",
  "Leaderboard Banner": "Full-width banner at the top of Directory and Search results",
  "Inline unit": "Native sponsored card within member and funding feeds",
  "Inline Unit": "Native sponsored card within member and funding feeds",
  "Sidebar unit": "Right-rail placement on News and Funding pages",
  "Sidebar Unit": "Right-rail placement on News and Funding pages",
  "Sponsored listing": "Pinned member card at the top of relevant search results",
  "Sponsored Listing": "Pinned member card at the top of relevant search results",
  "Newsletter": "Featured ad in The Corridor Weekly newsletter (12k+ inboxes)",
  "Newsletter Placement": "Featured ad in The Corridor Weekly newsletter (12k+ inboxes)",
  "Sector takeover": "Exclusive brand presence across one sector for a full month",
  "Sector Takeover": "Exclusive brand presence across one sector for a full month",
};

const FALLBACK_PRODUCTS = [
  { name: "Leaderboard Banner", description: "Full-width banner at the top of Directory and Search results", price_usd: 1200, period: "month" },
  { name: "Inline Unit",        description: "Native sponsored card within member and funding feeds",       price_usd: 800,  period: "month" },
  { name: "Sidebar Unit",       description: "Right-rail placement on News and Funding pages",             price_usd: 500,  period: "month" },
  { name: "Sponsored Listing",  description: "Pinned member card at the top of relevant search results",   price_usd: 350,  period: "month" },
  { name: "Newsletter Placement", description: "Featured ad in The Corridor Weekly newsletter (12k+ inboxes)", price_usd: 600, period: "issue" },
  { name: "Sector Takeover",    description: "Exclusive brand presence across one sector for a full month", price_usd: 2500, period: "month" },
];

const POPULAR = "Leaderboard Banner";

function fmtPrice(n) {
  return "USD " + Number(n).toLocaleString("en-US");
}

// Ad preview tabs content
const PREVIEW_TABS = [
  {
    key: "leaderboard",
    label: "Leaderboard",
    placement: "leaderboard",
    desc: "Top of Directory & Search — maximum visibility",
  },
  {
    key: "inline",
    label: "Inline Unit",
    placement: "inline",
    desc: "Within match results and funding feeds",
  },
  {
    key: "sidebar",
    label: "Sidebar",
    placement: "sidebar",
    desc: "Right rail on News & Funding pages",
  },
  {
    key: "sponsored",
    label: "Sponsored Listing",
    placement: "sponsored",
    desc: "Pinned member card in directory search",
  },
];

function buildPreviewHTML(ads, sampleCards) {
  const byPlacement = {};
  (ads || []).forEach(a => { if (!byPlacement[a.placement]) byPlacement[a.placement] = a; });

  const leader = byPlacement["leaderboard"];
  const inline = byPlacement["inline"];
  const sidebar = byPlacement["sidebar"];

  const panels = {
    leaderboard: leader
      ? `<aside class="ad ad-leader" aria-label="Advertisement" style="margin:0">
          <span class="ad-label">Advertisement</span>
          <div class="logo">${ico(leader.icon || "building")}</div>
          <div style="flex:1 1 280px;min-width:0"><h4 style="margin:0 0 4px">${esc(leader.title)}</h4><p style="margin:0;font-size:14px;opacity:.7">${esc(leader.body || "")}</p></div>
          <a href="${esc(leader.target_url)}" target="_blank" rel="noopener" class="btn btn-gold btn-sm" onclick="trackAdClick('${esc(leader._id || "")}')">${esc(leader.cta_label || "Learn more")}</a>
        </aside>`
      : `<aside class="ad ad-leader" aria-label="Advertisement" style="margin:0">
          <span class="ad-label">Advertisement</span>
          <div class="logo">${ico("building")}</div>
          <div style="flex:1 1 280px;min-width:0"><h4 style="margin:0 0 4px">Your brand here</h4><p style="margin:0;font-size:14px;opacity:.7">Reach 12,000+ trade decision-makers across BRICS-ASEAN economies.</p></div>
          <button class="btn btn-gold btn-sm" onclick="document.getElementById('adForm').scrollIntoView({behavior:'smooth'})">Book now</button>
        </aside>`,

    inline: inline
      ? `<aside class="ad ad-inline" aria-label="Advertisement" style="margin:0">
          <span class="ad-label">Sponsored</span>
          <div class="logo">${ico(inline.icon || "building")}</div>
          <div style="flex:1;min-width:0"><h4 style="margin:0 0 4px">${esc(inline.title)}</h4><p style="margin:0;font-size:14px;opacity:.7">${esc(inline.body || "")}</p></div>
          <a href="${esc(inline.target_url)}" target="_blank" rel="noopener" class="btn btn-sm" onclick="trackAdClick('${esc(inline._id || "")}')">Visit</a>
        </aside>`
      : `<aside class="ad ad-inline" aria-label="Advertisement" style="margin:0">
          <span class="ad-label">Sponsored</span>
          <div class="logo">${ico("building")}</div>
          <div style="flex:1;min-width:0"><h4 style="margin:0 0 4px">Inline sponsored slot available</h4><p style="margin:0;font-size:14px;opacity:.7">Appears within match results and funding feeds — blends naturally with content.</p></div>
          <button class="btn btn-sm" onclick="document.getElementById('adForm').scrollIntoView({behavior:'smooth'})">Book</button>
        </aside>`,

    sidebar: sidebar
      ? `<div style="max-width:320px">
          <aside class="ad ad-side" aria-label="Advertisement" style="margin:0">
            <span class="ad-label">Ad</span>
            <div class="logo">${ico(sidebar.icon || "building")}</div>
            <h4 style="margin:0 0 4px">${esc(sidebar.title)}</h4>
            <p style="margin:0;font-size:14px;opacity:.7">${esc(sidebar.body || "")}</p>
            <a href="${esc(sidebar.target_url)}" target="_blank" rel="noopener" class="btn btn-sm btn-block" style="margin-top:12px" onclick="trackAdClick('${esc(sidebar._id || "")}')">Visit sponsor</a>
          </aside>
        </div>`
      : `<div style="max-width:320px">
          <aside class="ad ad-side" aria-label="Advertisement" style="margin:0">
            <span class="ad-label">Ad</span>
            <div class="logo">${ico("building")}</div>
            <h4 style="margin:0 0 4px">Sidebar slot available</h4>
            <p style="margin:0;font-size:14px;opacity:.7">Right rail in News & Funding pages — seen by readers browsing content.</p>
            <button class="btn btn-sm btn-block" style="margin-top:12px" onclick="document.getElementById('adForm').scrollIntoView({behavior:'smooth'})">Book</button>
          </aside>
        </div>`,

    sponsored: sampleCards && sampleCards.length
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
          ${sampleCards.map(c => mktCardHTML({ ...c, spon: true })).join("")}
        </div>`
      : `<div class="card" style="padding:32px;text-align:center">
          <div style="font-size:32px;margin-bottom:8px;opacity:.3">${ico("star")}</div>
          <div style="font-weight:600;margin-bottom:4px">Sponsored listing slot available</div>
          <div class="muted" style="font-size:13px">Your member card pinned at the top of search results.</div>
        </div>`,
  };

  return panels;
}

export async function viewAdvertise(app) {
  app.innerHTML = `
  <section>
    <!-- Hero -->
    <div style="background:linear-gradient(135deg,var(--surface-2,var(--surface)) 0%,var(--surface) 100%);border-bottom:1px solid var(--line);padding:56px 0 40px">
      <div class="wrap">
        <div class="split" style="align-items:center;gap:40px">
          <div class="main">
            <span class="kicker" style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-text);font-weight:700">Advertise</span>
            <h1 style="font-size:clamp(28px,4vw,44px);font-weight:800;line-height:1.15;margin:10px 0 16px">Put your brand in front<br>of the corridor.</h1>
            <p style="font-size:16px;line-height:1.65;opacity:.7;max-width:500px;margin:0 0 28px">WorldTradeAccess reaches trade decision-makers, buyers, exporters and investors across 20+ BRICS-ASEAN economies. Sponsorships are always labelled and matched to relevant intent.</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="document.getElementById('adForm').scrollIntoView({behavior:'smooth'})">${ico("send")} Book a placement</button>
              <button class="btn" onclick="document.getElementById('adv_pricing').scrollIntoView({behavior:'smooth'})">${ico("coins")} View pricing</button>
            </div>
          </div>
          <div class="side" style="display:flex;gap:16px;flex-direction:column">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div style="background:var(--blue-soft,rgba(59,130,246,.1));border:1px solid var(--blue-text,#3b82f6)22;border-radius:12px;padding:18px 16px;text-align:center">
                <div style="font-size:28px;font-weight:800;color:var(--blue-text,#3b82f6)">12k+</div>
                <div class="muted" style="font-size:12px;margin-top:2px">Monthly active members</div>
              </div>
              <div style="background:var(--gold-soft,rgba(200,154,48,.1));border:1px solid var(--gold-text,#c89a30)22;border-radius:12px;padding:18px 16px;text-align:center">
                <div style="font-size:28px;font-weight:800;color:var(--gold-text,#c89a30)">20+</div>
                <div class="muted" style="font-size:12px;margin-top:2px">Member nations</div>
              </div>
              <div style="background:var(--green-soft,rgba(22,163,74,.1));border:1px solid var(--green-text,#16a34a)22;border-radius:12px;padding:18px 16px;text-align:center">
                <div style="font-size:28px;font-weight:800;color:var(--green-text,#16a34a)">6</div>
                <div class="muted" style="font-size:12px;margin-top:2px">Targetable sectors</div>
              </div>
              <div style="background:var(--surface-2,var(--surface));border:1px solid var(--line);border-radius:12px;padding:18px 16px;text-align:center">
                <div style="font-size:28px;font-weight:800">B2B</div>
                <div class="muted" style="font-size:12px;margin-top:2px">Trade-intent audience</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="wrap" style="padding-top:40px;padding-bottom:60px">

      <!-- Ad Format Previews -->
      <div style="margin-bottom:48px">
        <div style="margin-bottom:20px">
          <h2 style="font-size:20px;font-weight:700;margin:0 0 4px">Ad formats, live in the product</h2>
          <p class="muted" style="margin:0;font-size:14px">Click each tab to preview how your ad renders across placements.</p>
        </div>

        <!-- Tab bar -->
        <div style="display:flex;gap:4px;border-bottom:2px solid var(--line);margin-bottom:20px;overflow-x:auto" id="adv_tab_bar">
          ${PREVIEW_TABS.map((t, i) => `
            <button id="adv_tab_${t.key}" onclick="advTab('${t.key}')" type="button"
              style="padding:10px 18px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;white-space:nowrap;border-bottom:2px solid ${i === 0 ? 'var(--blue-text,#3b82f6)' : 'transparent'};margin-bottom:-2px;color:${i === 0 ? 'var(--blue-text,#3b82f6)' : 'inherit'};opacity:${i === 0 ? '1' : '.6'};transition:all .15s">
              ${esc(t.label)}
            </button>`).join("")}
        </div>

        <!-- Tab panels -->
        <div id="adv_previews">
          <div class="loading-shimmer" style="height:120px;border-radius:10px"></div>
        </div>
      </div>

      <!-- Pricing -->
      <div style="margin-bottom:48px" id="adv_pricing_wrap">
        <div style="margin-bottom:20px">
          <h2 style="font-size:20px;font-weight:700;margin:0 0 4px">Placements &amp; indicative pricing</h2>
          <p class="muted" style="margin:0;font-size:14px">Illustrative demo rates — the final rate card is confirmed with the chamber team.</p>
        </div>
        <div id="adv_pricing"><div class="loading-shimmer" style="height:180px;border-radius:10px"></div></div>
      </div>

      <!-- Booking form -->
      <div style="display:grid;grid-template-columns:1fr minmax(0,420px);gap:32px;align-items:start" id="adv_booking_wrap">
        <!-- Left: why advertise -->
        <div>
          <h2 style="font-size:20px;font-weight:700;margin:0 0 16px">Why advertise with us?</h2>
          <div style="display:flex;flex-direction:column;gap:14px">
            ${[
              ["globe",  "BRICS-ASEAN reach",     "Your brand seen by decision-makers across 20+ high-growth trade economies — buyers, exporters, investors."],
              ["target", "Intent-matched audience","Members are actively searching for trade partners, funding, and market entry — not passive scrollers."],
              ["shield", "Always labelled",        "Sponsored placements are clearly marked. No deceptive ads — which means higher trust and click quality."],
              ["trend",  "Real-time reporting",    "Track impressions and clicks from your admin dashboard. Data-driven campaigns only."],
            ].map(([icon, title, body]) => `
              <div style="display:flex;gap:14px;align-items:flex-start">
                <span style="width:38px;height:38px;border-radius:10px;background:var(--blue-soft,rgba(59,130,246,.1));color:var(--blue-text,#3b82f6);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${ico(icon)}</span>
                <div>
                  <div style="font-weight:600;font-size:15px;margin-bottom:2px">${title}</div>
                  <div class="muted" style="font-size:13px;line-height:1.55">${body}</div>
                </div>
              </div>`).join("")}
          </div>
        </div>

        <!-- Right: form -->
        <form class="card" style="padding:28px" id="adForm" novalidate>
          <h2 style="font-size:18px;font-weight:700;margin:0 0 4px">Book a placement</h2>
          <p class="muted" style="margin:0 0 20px;font-size:13px">The chamber team will follow up with the confirmed rate card.</p>

          <div style="margin-bottom:16px">
            <label style="display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;opacity:.6">${ico("mega")} Format</label>
            <div class="roles" id="adv_fmt" style="flex-wrap:wrap">
              <div class="loading-shimmer" style="height:36px;border-radius:8px;width:100%"></div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div class="field" style="margin:0">
              <label for="adv_co">${ico("building")} Company <span class="req">*</span></label>
              <input id="adv_co" placeholder="Your company" value="${state.USER ? esc(state.USER.company_name || state.USER.name || "") : ""}">
              <div class="err-msg">Enter your company name</div>
            </div>
            <div class="field" style="margin:0">
              <label for="adv_email">${ico("mail")} Email <span class="req">*</span></label>
              <input id="adv_email" type="email" placeholder="you@company.com" value="${state.USER ? esc(state.USER.email || "") : ""}">
              <div class="err-msg">Enter a valid email</div>
            </div>
            <div class="field" style="margin:0">
              <label for="adv_budget">${ico("coins")} Monthly budget</label>
              <input id="adv_budget" placeholder="e.g. USD 1,500">
            </div>
            <div class="field" style="margin:0">
              <label for="adv_sector">${ico("grid")} Target sector</label>
              <select id="adv_sector"><option value="">Any sector</option>${PILLARS.map(p => `<option>${p}</option>`).join("")}</select>
            </div>
          </div>

          <div class="field" style="margin:0 0 16px">
            <label for="adv_msg">${ico("file")} Message</label>
            <textarea id="adv_msg" maxlength="500" rows="3" placeholder="What are you promoting? Any specific sectors or target audience?" style="resize:vertical"></textarea>
          </div>

          <button class="btn btn-primary btn-block" type="submit" id="adv_submit">${ico("send")} Request this placement</button>
        </form>
      </div>

    </div>
  </section>

  <style>
    @media (max-width: 700px) {
      #adv_booking_wrap { grid-template-columns: 1fr !important; }
    }
  </style>`;

  // Load data in parallel
  const [products, ads, sampleCards] = await Promise.all([
    _svc.getAdProducts(),
    _svc.getLiveAds(),
    _svc.getSponsoredMember(),
  ]);

  const finalProducts = (products || []).length ? products : FALLBACK_PRODUCTS;
  const previewPanels = buildPreviewHTML(ads, sampleCards);
  let activeTab = "leaderboard";

  // Tab switcher
  window.advTab = (key) => {
    activeTab = key;
    PREVIEW_TABS.forEach(t => {
      const btn = $(`#adv_tab_${t.key}`);
      if (!btn) return;
      const active = t.key === key;
      btn.style.borderBottomColor = active ? "var(--blue-text,#3b82f6)" : "transparent";
      btn.style.color = active ? "var(--blue-text,#3b82f6)" : "inherit";
      btn.style.opacity = active ? "1" : ".6";
    });
    const tab = PREVIEW_TABS.find(t => t.key === key);
    const previewEl = $("#adv_previews");
    if (previewEl && tab) {
      previewEl.innerHTML = `
        <div class="muted" style="font-size:13px;margin-bottom:14px">${esc(tab.desc)}</div>
        ${previewPanels[key] || ""}`;
    }
  };

  // Render first tab
  window.advTab("leaderboard");

  // Render pricing cards
  const pricingEl = $("#adv_pricing");
  if (pricingEl) pricingEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px">
      ${finalProducts.map(p => {
        const isPopular = p.name === POPULAR;
        return `
        <div style="position:relative;background:var(--surface-2,var(--surface));border:${isPopular ? "2px solid var(--blue-text,#3b82f6)" : "1px solid var(--line)"};border-radius:14px;padding:20px 18px;display:flex;flex-direction:column;gap:4px${isPopular ? ";box-shadow:0 0 0 4px var(--blue-soft,rgba(59,130,246,.08))" : ""}">
          ${isPopular ? `<span style="position:absolute;top:-11px;left:16px;background:var(--blue-text,#3b82f6);color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;letter-spacing:.05em">MOST POPULAR</span>` : ""}
          <div style="display:flex;gap:8px;align-items:center;font-weight:700;font-size:15px">
            <span style="width:32px;height:32px;border-radius:8px;background:${isPopular ? "var(--blue-soft,rgba(59,130,246,.12))" : "var(--surface)"};color:var(--blue-text,#3b82f6);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${ico(FMT_ICON[p.name] || "star")}</span>
            ${esc(p.name)}
          </div>
          <div class="muted" style="font-size:12px;line-height:1.5;margin-top:4px;min-height:36px">${esc(p.description || FMT_DESC[p.name] || "")}</div>
          <div style="margin-top:auto;padding-top:12px;border-top:1px solid var(--line);margin-bottom:4px">
            <div style="font-size:24px;font-weight:800;color:var(--gold-text,#c89a30)">${fmtPrice(p.price_usd)}</div>
            <div class="muted" style="font-size:12px">per ${esc(p.period || "month")}${p.active === false ? ' · <span style="color:var(--red,#e55)">unavailable</span>' : ""}</div>
          </div>
          <button class="btn${isPopular ? " btn-primary" : ""} btn-sm btn-block" style="margin-top:8px" onclick="advPickFormat('${esc(p.name)}')">${ico("send")} Book this</button>
        </div>`;
      }).join("")}
    </div>`;

  // Render format buttons in form
  let fmt = finalProducts[0]?.name || "Leaderboard Banner";
  const fmtEl = $("#adv_fmt");
  const renderFmtBtns = () => {
    if (!fmtEl) return;
    fmtEl.innerHTML = finalProducts.map(p =>
      `<button type="button" class="role" data-f="${esc(p.name)}" aria-pressed="${p.name === fmt}" style="font-size:13px">${esc(p.name)}</button>`
    ).join("");
    fmtEl.onclick = e => {
      const b = e.target.closest(".role"); if (!b) return;
      fmt = b.dataset.f;
      $$(".role", fmtEl).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    };
  };
  renderFmtBtns();

  // "Book this" from pricing card → scroll + pick format
  window.advPickFormat = (name) => {
    fmt = name;
    renderFmtBtns();
    document.getElementById("adForm").scrollIntoView({ behavior: "smooth" });
  };

  // Track ad clicks
  window.trackAdClick = (id) => {
    if (!id) return;
    fetch(`${ConfigAPIURL.ads}/${id}/click`, { method: "POST" }).catch(() => {});
  };

  // Form submit
  $("#adForm").onsubmit = async e => {
    e.preventDefault();
    if (![reqField("adv_co"), reqField("adv_email", isEmail)].every(Boolean)) {
      toast("Check the form", "Company and a valid email are required.", false); return;
    }
    const btn = $("#adv_submit"); btn.disabled = true; btn.textContent = "Sending…";
    const ok = await _svc.submitAdRequest({
      format: fmt,
      company: $("#adv_co").value.trim(),
      email: $("#adv_email").value.trim(),
      budget: $("#adv_budget").value.trim() || null,
      target_sector: $("#adv_sector").value || "Any",
      message: $("#adv_msg").value.trim() || null,
    });
    if (ok) {
      $("#adv_msg").value = "";
      $("#adv_budget").value = "";
      btn.innerHTML = `${ico("check")} Sent! We'll be in touch.`;
      btn.style.background = "var(--green-text,#16a34a)";
    } else {
      btn.disabled = false;
      btn.innerHTML = `${ico("send")} Request this placement`;
    }
  };
}
