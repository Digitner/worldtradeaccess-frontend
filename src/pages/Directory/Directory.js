/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { pIco } from '../../components/Chips/Chips.js';
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { PILLARS } from '../../constant/pillars.js';
import { TYPE_LABEL } from '../../constant/roles.js';
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
    <div class="dfilters" id="d_more">
      <div class="df"><label for="d_country">Country</label><select id="d_country"><option value="all">All countries</option></select></div>
      <div class="df"><label for="d_type">Looking to</label><select id="d_type"><option value="all">Any</option>${Object.keys(TYPE_LABEL).filter(k => k !== "export").map(k => `<option value="${k}" ${state.DIR.type === k ? "selected" : ""}>${TYPE_LABEL[k]}</option>`).join("")}</select></div>
      <div class="df"><label for="d_sort">Sort by</label><select id="d_sort"><option value="name" ${state.DIR.sort === "name" ? "selected" : ""}>Name, A to Z</option><option value="country" ${state.DIR.sort === "country" ? "selected" : ""}>Country</option><option value="sector" ${state.DIR.sort === "sector" ? "selected" : ""}>Sector</option></select></div>
      <div class="df-end"><span id="d_count" role="status"></span><button type="button" class="linkish" id="d_clear">Clear filters</button></div>
    </div>
    <div class="mkt-grid" id="d_grid"><div class="loading-shimmer" style="height:200px;border-radius:12px;grid-column:1/-1"></div></div>
  </div></section>`;

  $("#d_filters").onclick = e => { const b = e.target.closest(".fbtn"); if (!b) return; state.DIR.pillar = b.dataset.p; $$("#d_filters .fbtn").forEach(x => x.setAttribute("aria-pressed", String(x === b))); paintDir(); };
  $("#d_q").oninput = e => { state.DIR.q = e.target.value; paintDir(); };
  $("#d_country").onchange = e => { state.DIR.country = e.target.value; paintDir(); };
  $("#d_type").onchange = e => { state.DIR.type = e.target.value; paintDir(); };
  $("#d_sort").onchange = e => { state.DIR.sort = e.target.value; paintDir(); };
  $("#d_clear").onclick = () => {
    Object.assign(state.DIR, { pillar: "all", q: "", country: "all", type: "all", sort: "name" });
    $("#d_q").value = ""; $("#d_country").value = "all"; $("#d_type").value = "all"; $("#d_sort").value = "name";
    $$("#d_filters .fbtn").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.p === "all")));
    paintDir();
  };

  // Load data in parallel
  const [members, featured] = await Promise.all([
    _svc.getMembers({ limit: 100 }),
    _svc.getFeatured(),
  ]);

  _allMembers = members.map(m => ({
    id: m._id || m.id,
    name: m.company_name || m.name,
    country: m.country_name || m.country,
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
    country: m.country_name || m.country,
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

  const cs = $("#d_country");
  if (cs) cs.innerHTML = `<option value="all">All countries</option>` + [...new Set(_allMembers.map(m => m.country).filter(Boolean))].sort().map(c => `<option value="${esc(c)}" ${state.DIR.country === c ? "selected" : ""}>${esc(c)}</option>`).join("");

  paintDir();
}

export function paintDir() {
  const D = state.DIR || {};
  const q = (D.q || "").trim().toLowerCase();
  let list = [..._allMembers];
  if (D.pillar && D.pillar !== "all") list = list.filter(m => m.pillar === D.pillar);
  if (q) list = list.filter(m => (m.name + " " + m.country + " " + m.pillar + " " + m.seek).toLowerCase().includes(q));
  if (D.country && D.country !== "all") list = list.filter(m => m.country === D.country);
  if (D.type && D.type !== "all") list = list.filter(m => m.type === D.type);
  const sk = D.sort === "country" ? (m => m.country + m.name) : D.sort === "sector" ? (m => m.pillar + m.name) : (m => m.name);
  list.sort((a, b) => (b.spon ? 1 : 0) - (a.spon ? 1 : 0) || String(sk(a)).localeCompare(String(sk(b))));
  const dc = $("#d_count"); if (dc) dc.textContent = list.length + (list.length === 1 ? " member" : " members");
  const dx = $("#d_clear"); if (dx) dx.hidden = D.pillar === "all" && !q && D.country === "all" && D.type === "all" && D.sort === "name";
  const g = $("#d_grid"); if (!g) return;
  g.innerHTML = list.length
    ? list.map(mktCardHTML).join("")
    : `<div class="empty" style="grid-column:1/-1">No members match these filters. Clear a filter or try another search.</div>`;
}
