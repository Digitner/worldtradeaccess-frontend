/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { pIco } from '../../components/Chips/Chips.js';
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { PILLARS } from '../../constant/pillars.js';
import useServices from './hooks/useServices.js';
import { $, $$, esc, ico } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

const _svc = useServices();
let _allMembers = [];

export async function viewDirectory(app, _a, soft) {
  if (soft && $("#d_grid")) { paintDir(); return; }

  app.innerHTML = `
  <section><div class="wrap">
    <span class="kicker">The network</span>
    <h1 class="page-h">Member directory.</h1>
    <p class="page-sub">Every member registers who they are and what they seek. Browse or search the intent layer that powers the matcher.</p>
    <div class="section-h" style="margin-top:14px"><h2 style="font-size:20px">Featured this week</h2><button class="linkish" onclick="go('#/search')">Ask the AI matcher →</button></div>
    <div id="d_featured"><div class="loading-shimmer" style="height:180px;border-radius:12px"></div></div>
    <div class="toolbar" style="margin-top:18px"><div class="search"><span class="si">${ico("search")}</span><label class="vh" for="d_q">Search members</label><input id="d_q" placeholder="Search members, sectors, needs…" value="${esc(state.DIR.q)}"></div></div>
    <div class="toolbar" id="d_filters" style="margin-top:0">${["all", ...PILLARS].map(p => `<button class="fbtn" data-p="${p}" aria-pressed="${p === state.DIR.pillar}">${p === "all" ? ico("grid") + " All members" : pIco(p) + " " + p}</button>`).join("")}</div>
    <div class="mkt-grid" id="d_grid"><div class="loading-shimmer" style="height:200px;border-radius:12px;grid-column:1/-1"></div></div>
  </div></section>`;

  $("#d_filters").onclick = e => { const b = e.target.closest(".fbtn"); if (!b) return; state.DIR.pillar = b.dataset.p; $$("#d_filters .fbtn").forEach(x => x.setAttribute("aria-pressed", String(x === b))); paintDir(); };
  $("#d_q").oninput = e => { state.DIR.q = e.target.value; paintDir(); };

  // Load data in parallel
  const [members, featured] = await Promise.all([
    _svc.getMembers({ limit: 100 }),
    _svc.getFeatured(),
  ]);

  _allMembers = members.map(m => ({
    id: m._id || m.id,
    name: m.company_name || m.name,
    country: m.country,
    pillar: m.sector || m.pillar,
    type: m.goal || m.type,
    seek: m.seek,
    tier: m.tier,
    spon: m.is_sponsored || m.spon,
    person: m.contact_person || m.person,
    image_url: m.image_url || null,
    cover_url: m.cover_url || null,
  }));

  const featuredMapped = (featured.length ? featured : _allMembers.filter(m => m.spon)).slice(0, 10).map(m => ({
    id: m._id || m.id,
    name: m.company_name || m.name,
    country: m.country,
    pillar: m.sector || m.pillar,
    type: m.goal || m.type,
    seek: m.seek,
    tier: m.tier,
    spon: m.is_sponsored || m.spon,
    image_url: m.image_url || null,
    cover_url: m.cover_url || null,
  }));

  const featEl = $("#d_featured");
  if (featEl) featEl.innerHTML = featuredMapped.length ? carousel(featuredMapped.map(mktCardHTML).join(""), true, "Featured members") : "";

  paintDir();
}

export function paintDir() {
  const q = (state.DIR?.q || "").trim().toLowerCase();
  let list = [..._allMembers];
  if (state.DIR?.pillar && state.DIR.pillar !== "all") list = list.filter(m => m.pillar === state.DIR.pillar);
  if (q) list = list.filter(m => (m.name + " " + m.country + " " + m.pillar + " " + m.seek).toLowerCase().includes(q));
  list.sort((a, b) => (b.spon ? 1 : 0) - (a.spon ? 1 : 0));
  const g = $("#d_grid"); if (!g) return;
  g.innerHTML = list.length
    ? list.map(mktCardHTML).join("")
    : `<div class="empty" style="grid-column:1/-1">No members match "${esc(state.DIR?.q || "")}". Try a country, sector or product.</div>`;
}
