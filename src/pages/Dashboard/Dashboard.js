/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { ccChip, pIco } from '../../components/Chips/Chips.js';
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { DEAL_STAGES } from '../../constant/forms.js';
import { ROLE_META, TIERS } from '../../constant/roles.js';
import useServices from './hooks/useServices.js';
import { logout } from '../Login/Login.js';
import { renderChrome } from '../../components/Navbar/navbar.js';
import { esc, fmtShort, ico, initialsOf } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

export async function viewDashboard(app) {
  // Show skeleton while loading
  app.innerHTML = `<section><div class="wrap"><div class="loading-shimmer" style="height:300px;border-radius:12px;margin-top:24px"></div></div></section>`;

  const svc = useServices();
  const [dashboard, intros, myFund, deals, inboundDeals, opportunities] = await Promise.all([
    svc.getDashboard(),
    svc.getMyIntros(),
    svc.getMyFunding(),
    svc.getMyDeals(),
    svc.getInboundDeals(),
    svc.getOpportunities(),
  ]);

  // Merge API data into state.USER for downstream use
  if (dashboard) {
    const u = dashboard.user || state.USER || {};
    const m = dashboard.member || {};
    state.USER = { ...state.USER, ...u, ...m };
    renderChrome();
  }

  const user = state.USER || {};
  const hasListing = user.seek && String(user.seek).trim();
  const potential = dashboard?.potential_matches ?? opportunities.length;
  const complete = [user.company_name || user.name, user.contact_person || user.person, user.email, user.country, user.sector || user.pillar, user.seek, user.website || user.site, user.phone].filter(x => x && String(x).trim()).length;
  const pct = Math.round(complete / 8 * 100);
  const tierKey = user.tier || user.membership_type || "open";

  app.innerHTML = `
  <section><div class="wrap">
    <div class="top">
      <div style="display:flex;gap:16px;align-items:center">
        <div style="width:60px;height:60px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--surface-2);border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:var(--text-soft)">
          ${user.image_url ? `<img src="${esc(user.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover">` : esc(initialsOf(user.company_name || user.contact_person || "?"))}
        </div>
        <div>
          <span class="kicker">Dashboard</span>
          <h1 class="page-h" style="margin-bottom:4px">Welcome, ${esc((user.contact_person || user.person || user.company_name || user.name || "there").split(" ")[0])}.</h1>
          <p class="muted" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${esc(user.company_name || user.name || "")} · ${ccChip(user.country)} ${esc(user.country || "")} <span class="tag ${tierKey === "open" ? "" : "gold"}">${ico((TIERS[tierKey] || TIERS.open).ic)}${(TIERS[tierKey] || TIERS.open).t}</span></p>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-sm" onclick="go('#/edit')">${ico("edit")} Edit profile</button>
        <button class="btn btn-ghost btn-sm" onclick="logout()">${ico("logout")} Log out</button>
      </div>
    </div>
    <div class="kpi-row">
      <div class="kpi"><span class="ki">${ico("sparkle")}</span><div><div class="n" style="color:var(--blue-text)">${potential}</div><div class="l">Potential matches</div></div></div>
      <div class="kpi"><span class="ki" style="background:var(--gold-soft);color:var(--gold-text)">${ico("handshake")}</span><div><div class="n" style="color:var(--gold-text)">${intros.length}</div><div class="l">Introductions sent</div></div></div>
      <div class="kpi"><span class="ki" style="background:var(--green-soft);color:var(--green-text)">${ico("briefcase")}</span><div><div class="n" style="color:var(--green-text)">${deals.length}</div><div class="l">Active deals</div></div></div>
      <div class="kpi"><span class="ki">${ico("user")}</span><div><div class="n">${pct}%</div><div class="l">Profile complete</div></div></div>
    </div>
    ${opportunities.length ? `<div class="section-h"><h2 style="font-size:21px">Opportunities for you</h2><button class="linkish" onclick="go('#/search')">Ask the AI matcher →</button></div>${carousel(opportunities.slice(0, 10).map(m => mktCardHTML({ id: m._id, name: m.company_name, country: m.country, pillar: m.sector, type: m.goal, seek: m.seek, tier: m.tier, image_url: m.image_url || null, cover_url: m.cover_url || null })).join(""), true, "Opportunities for you")}` : ""}
    <div class="split" style="margin-top:22px">
      <div class="main" style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="top" style="margin-bottom:12px"><h2 style="font-size:18px;margin:0">Your listing</h2><button class="btn btn-sm" onclick="go('#/edit')">${ico("edit")} Edit</button></div>
          ${hasListing ? `<div class="roles" style="margin-bottom:10px"><span class="role" aria-pressed="true" style="cursor:default">${ico(ROLE_META[user.goal]?.ic || "compass")} ${ROLE_META[user.goal]?.label || user.goal}</span></div><p style="font-size:15.5px;line-height:1.55;margin:0"><span class="serif" style="color:var(--gold-text);font-size:22px">"</span>${esc(user.seek)}</p><div class="muted" style="margin-top:12px">${pIco(user.sector || user.pillar)} ${esc(user.sector || user.pillar || "")} · ${esc(user.email || "")}${(user.website || user.site) ? " · " + esc(user.website || user.site) : ""}</div>`
    : `<p style="color:var(--text-soft);margin:0">You haven't published an intent yet. <button class="linkish" onclick="go('#/edit')">Add what you seek →</button></p>`}
          <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="go('#/search')">${ico("sparkle")} Find my matches <span class="arrow">→</span></button>
        </div>
        <div class="card">
          <h2 style="font-size:18px;margin:0 0 6px">Introductions you've requested</h2>
          ${intros.length ? intros.map(i => `<button class="list-row" style="width:100%;background:none;border:none;cursor:pointer;text-align:left;color:var(--text)" onclick="go('#/member/${esc(i.to_member_id || i.to_member?._id || "")}')">${ico("handshake")}<div style="flex:1;min-width:0"><b>${esc(i.to_company || i.to_member?.company_name || "Member")}</b><div class="muted">"${esc((i.message || "").slice(0, 110))}${(i.message || "").length > 110 ? "…" : ""}"</div></div><span class="tag green" style="flex-shrink:0">${ico("check")}Sent ${fmtShort(i.createdAt)}</span></button>`).join("") : `<p class="muted" style="margin:8px 0 0">No introductions yet. Run a match and reach out to a counterparty.</p>`}
        </div>
      </div>
      <div class="side" style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <h2 style="font-size:18px;margin:0 0 10px">Quick actions</h2>
          <div style="display:flex;flex-direction:column;gap:9px">
            <button class="btn btn-block" style="justify-content:flex-start" onclick="go('#/search')">${ico("compass")} Run the AI matcher</button>
            <button class="btn btn-block" style="justify-content:flex-start" onclick="go('#/directory')">${ico("grid")} Browse directory</button>
            <button class="btn btn-block" style="justify-content:flex-start" onclick="go('#/funding')">${ico("rocket")} List for funding / JV</button>
            <button class="btn btn-block" style="justify-content:flex-start" onclick="go('#/news')">${ico("bell")} Market news alerts</button>
          </div>
        </div>
        <div class="card">
          <h2 style="font-size:18px;margin:0 0 6px">Your funding listings</h2>
          ${myFund.length ? myFund.map(f => `<div class="list-row"><span class="ic">${ico("rocket")}</span><div style="flex:1"><b>${esc(f.type)}</b><div class="muted">${esc(f.amount || "Undisclosed")} · ${esc(f.sector || "")}</div></div></div>`).join("") : `<p class="muted" style="margin:8px 0 0">None yet. <button class="linkish" onclick="go('#/funding')">Create one →</button></p>`}
        </div>
        <div class="card">
          <h2 style="font-size:18px;margin:0 0 6px">Your active deals</h2>
          ${deals.length ? deals.map(d => `<button class="list-row" style="width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left;color:var(--text)" onclick="go('#/deal/${esc(d.funding_listing_id || d._id)}')"><span class="ic">${ico("briefcase")}</span><span style="flex:1"><b>${esc(d.listing?.company || d.company_name || d.company || "")}</b><span class="muted" style="display:block">${esc(d.listing?.amount || d.amount || "")}</span></span><span class="tag ${d.stage >= 5 ? "green" : ""}">${esc(DEAL_STAGES[d.stage] || "")}</span></button>`).join("") : `<p class="muted" style="margin:8px 0 0">No active deals. <button class="linkish" onclick="go('#/funding')">Explore opportunities →</button></p>`}
        </div>
        <div class="card">
          <div class="top" style="margin-bottom:10px"><h2 style="font-size:18px;margin:0">Deals on my listings</h2><span class="tag">${inboundDeals.length}</span></div>
          ${inboundDeals.length ? inboundDeals.map(d => {
            const member = d.interested_member;
            const listing = d.listing;
            const canAdvance = d.stage < 5;
            return `<div class="list-row" style="flex-wrap:wrap;gap:6px 0">
              <span class="ic">${ico("handshake")}</span>
              <div style="flex:1;min-width:0">
                <b style="font-size:14px">${esc(member?.company_name || member?.contact_person || "Member")}</b>
                <div class="muted" style="font-size:12.5px">${esc(listing?.company || "")} · <span class="tag" style="font-size:11px;padding:1px 6px">${esc(DEAL_STAGES[d.stage] || "")}</span></div>
              </div>
              ${canAdvance ? `<button class="btn btn-sm btn-primary" onclick="advanceDealOwner('${esc(d._id)}','${d.stage + 1}',this)" style="font-size:12px;padding:4px 10px">${ico("arrow")} Move to ${esc(DEAL_STAGES[d.stage + 1] || "")}</button>` : `<span class="tag green">${ico("check")}Closed</span>`}
            </div>`;
          }).join("") : `<p class="muted" style="margin:8px 0 0">No one has expressed interest in your listings yet.</p>`}
        </div>
      </div>
    </div>
  </div></section>`;

  window.advanceDealOwner = async (dealId, toStage, btn) => {
    if (!dealId) return;
    btn.disabled = true; btn.textContent = "Moving…";
    try {
      const { default: APIRequest } = await import('../../utils/APIRequest.js');
      const { default: ConfigAPIURL } = await import('../../config/ConfigAPIURL.js');
      const { toast } = await import('../../components/Toasts/toast.js');
      const response = await APIRequest.request("POST", `${ConfigAPIURL.deals}/${dealId}/advance`, JSON.stringify({ to_stage: Number(toStage) }));
      const d = response?.data;
      if (d?.responseCode === 100) {
        toast("Deal advanced!", `Moved to ${DEAL_STAGES[Number(toStage)] || ""}.`);
        viewDashboard(document.getElementById("app"));
      } else {
        toast("Error", d?.message || "Could not advance deal.", false);
        btn.disabled = false; btn.textContent = "Move →";
      }
    } catch {
      btn.disabled = false; btn.textContent = "Move →";
    }
  };
}
