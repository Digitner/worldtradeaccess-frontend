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
import { consentLine, consentState, pullActivity } from '../../utils/activity.js';
import { getRecommendations } from '../../utils/recommend.js';
import { ringHTML } from '../../components/ScoreRing/ScoreRing.js';
import { state } from '../../utils/state.js';

export async function viewDashboard(app) {
  // Show skeleton while loading
  app.innerHTML = `<section><div class="wrap"><div class="loading-shimmer" style="height:300px;border-radius:12px;margin-top:24px"></div></div></section>`;

  const svc = useServices();
  const [dashboard, intros, myFund, deals, inboundDeals, opportunities, recentlyViewed] = await Promise.all([
    svc.getDashboard(),
    svc.getMyIntros(),
    svc.getMyFunding(),
    svc.getMyDeals(),
    svc.getInboundDeals(),
    svc.getOpportunities(),
    svc.getRecentlyViewed(),
  ]);

  // Merge API data into state.USER for downstream use
  if (dashboard) {
    const u = dashboard.user || state.USER || {};
    const m = dashboard.member || {};
    state.USER = { ...state.USER, ...u, ...m };
    renderChrome();
  }

  await pullActivity();
  const user = state.USER || {};
  const hasListing = user.seek && String(user.seek).trim();
  const potential = dashboard?.kpis?.potential_matches ?? dashboard?.potential_matches ?? opportunities.length;
  const complete = [user.company_name || user.name, user.contact_person || user.person, user.email, user.country, user.sector || user.pillar, user.seek, user.website || user.site, user.phone].filter(x => x && String(x).trim()).length;
  const pct = Math.round(complete / 8 * 100);
  const tierKey = user.tier || user.membership_type || "open";

  const cs = consentState(user), cname = user.country_name || user.country || "";
  const fields = [["Company", user.company_name || user.name], ["Contact", user.contact_person || user.person], ["Designation", user.designation], ["Email", user.email], ["Phone", user.phone], ["Website", user.website || user.site], ["Country", cname], ["Sector", user.sector || user.pillar]];
  const tier = TIERS[tierKey] || TIERS.open;
  const mCard = m => ({ id: m._id, name: m.company_name, country: m.country_name || m.country, pillar: m.sector, type: m.goal });
  const rec = await getRecommendations(user, opportunities, 5);
  const best = rec.list;
  const recNote = rec.source === "activity" ? "Ranked using your listing and the pages you view." : rec.source === "server" ? "Ranked for you by the matcher." : cs === "granted" ? "Ranked using your listing. Browse a few members and it will learn what you like." : "Ranked using your listing. Turn on click tracking to improve it with what you view.";
  app.innerHTML = `
  <section><div class="wrap">
    <span class="kicker">${esc(user.company_name || user.name || "Dashboard")}</span>
    <h1 class="page-h">Welcome, ${esc((user.contact_person || user.person || user.company_name || user.name || "there").split(" ")[0])}.</h1>
    <p class="page-sub">${esc(cname)}${cname ? ", " : ""}${esc(tier.t)}</p>
    <div class="kpi-row">
      <div class="kpi"><span class="ki">${ico("sparkle")}</span><div><div class="n">${potential}</div><div class="l">Potential matches</div></div></div>
      <div class="kpi"><span class="ki">${ico("handshake")}</span><div><div class="n">${intros.length}</div><div class="l">Introductions sent</div></div></div>
      <div class="kpi"><span class="ki">${ico("briefcase")}</span><div><div class="n">${deals.length}</div><div class="l">Active deals</div></div></div>
      <div class="kpi"><span class="ki">${ico("user")}</span><div><div class="n">${pct}%</div><div class="l">Profile complete</div></div></div>
    </div>
    <div class="dash">
      <div class="dash-main">
        <div class="card">
          <div class="dh"><h2>Your listing</h2><button class="btn btn-sm" onclick="go('#/edit')">${ico("edit")} Edit listing</button></div>
          ${hasListing ? `<span class="tag">${ico(ROLE_META[user.goal]?.ic || "compass")} ${esc(ROLE_META[user.goal]?.label || user.goal || "")}</span><p class="seekline">${esc(user.seek)}</p>${user._id ? `<button class="linkish" onclick="go('#/member/${esc(user._id)}')">View your public listing</button>` : ""}`
            : `<p class="muted" style="margin:0 0 12px">You haven't said what you seek yet. Add it to start getting matches.</p><button class="btn btn-primary" onclick="go('#/edit')">Add what you seek</button>`}
        </div>
        <div class="card">
          <div class="dh"><h2>Your best matches</h2><button class="btn btn-sm" onclick="go('#/search')">${ico("sparkle")} Run the matcher</button></div>
          ${best.length ? `<p class="muted" style="margin:-4px 0 6px;font-size:13.5px">${esc(recNote)}</p>` + best.map(({ m, score, reasons }) => `<button class="dm" onclick="go('#/member/${esc(m._id)}')">${ringHTML(score)}<span><b>${esc(m.company_name)}</b><small>${esc(m.country_name || m.country || "")}, ${esc((ROLE_META[m.goal]?.label || m.goal || "").toLowerCase())}</small><span class="muted">${reasons.length ? `<b>${esc(reasons.slice(0, 2).join(" · "))}</b> · ` : ""}${esc((m.seek || "").slice(0, 90))}${(m.seek || "").length > 90 ? "…" : ""}</span></span></button>`).join("") : `<p class="muted" style="margin:0">${hasListing ? "No matches yet. Try adding your product and target countries to your listing." : "Your matches will appear here once your listing says what you seek."}</p>`}
        </div>
        <div class="card">
          <h2 class="dt">Introductions you've requested</h2>
          ${intros.length ? intros.map(i => `<button class="list-row dbtn" onclick="go('#/member/${esc(i.to_member_id || i.to_member?._id || "")}')"><span class="ic">${ico("handshake")}</span><div style="flex:1;min-width:0"><b>${esc(i.to_company || i.to_member?.company_name || "Member")}</b><div class="muted">${esc((i.message || "").slice(0, 110))}${(i.message || "").length > 110 ? "…" : ""}</div></div><span class="tag green" style="flex-shrink:0">Sent ${fmtShort(i.createdAt)}</span></button>`).join("") : `<p class="muted" style="margin:0">None yet. Open a match and request an introduction.</p>`}
        </div>
        ${opportunities.length > 5 ? `<div><div class="dh"><h2>More opportunities for you</h2><button class="linkish" onclick="go('#/search')">Ask the AI matcher →</button></div>${carousel(opportunities.slice(5, 15).map(m => mktCardHTML({ ...mCard(m), seek: m.seek, tier: m.tier, image_url: m.image_url || null, cover_url: m.cover_url || null })).join(""), true, "More opportunities for you")}</div>` : ""}
        ${recentlyViewed.length ? `<div><div class="dh"><h2>Recently viewed</h2><button class="linkish" onclick="go('#/directory')">Browse directory →</button></div>${carousel(recentlyViewed.slice(0, 10).map(m => mktCardHTML({ ...mCard(m), seek: m.seek, tier: m.tier, image_url: m.image_url || null, cover_url: m.cover_url || null })).join(""), true, "Recently viewed")}</div>` : ""}
      </div>
      <div class="dash-side">
        <div class="card">
          <div class="dh"><h2>Your details</h2><button class="linkish" onclick="go('#/edit')">Edit</button></div>
          <dl class="kv" style="margin-top:0">${fields.filter(([, v]) => v && String(v).trim()).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}<dt>Membership</dt><dd>${esc(tier.t)}</dd></dl>
        </div>
        <div class="card">
          <h2 class="dt">Your active deals</h2>
          ${deals.length ? deals.map(d => `<button class="list-row dbtn" onclick="go('#/deal/${esc(d.funding_listing_id || d._id)}')"><span class="ic">${ico("briefcase")}</span><span style="flex:1"><b>${esc(d.listing?.company || d.company_name || d.company || "")}</b><span class="muted" style="display:block">${esc(d.listing?.amount || d.amount || "")}</span></span><span class="tag ${d.stage >= 5 ? "green" : ""}">${esc(DEAL_STAGES[d.stage] || "")}</span></button>`).join("") : `<p class="muted" style="margin:0">None yet. <button class="linkish" onclick="go('#/funding')">See opportunities</button></p>`}
        </div>
        <div class="card">
          <div class="dh"><h2>Deals on my listings</h2><span class="tag">${inboundDeals.length}</span></div>
          ${inboundDeals.length ? inboundDeals.map(d => {
            const member = d.interested_member, listing = d.listing, canAdvance = d.stage < 5;
            return `<div class="list-row" style="flex-wrap:wrap;gap:6px 0">
              <span class="ic">${ico("handshake")}</span>
              <div style="flex:1;min-width:0"><b style="font-size:14px">${esc(member?.company_name || member?.contact_person || "Member")}</b>
                <div class="muted" style="font-size:12.5px">${esc(listing?.company || "")} · <span class="tag" style="font-size:11px;padding:1px 6px">${esc(DEAL_STAGES[d.stage] || "")}</span></div></div>
              ${canAdvance ? `<button class="btn btn-sm btn-primary" onclick="advanceDealOwner('${esc(d._id)}','${d.stage + 1}',this)" style="font-size:12px;padding:4px 10px">${ico("arrow")} Move to ${esc(DEAL_STAGES[d.stage + 1] || "")}</button>` : `<span class="tag green">${ico("check")}Closed</span>`}
            </div>`;
          }).join("") : `<p class="muted" style="margin:0">No one has expressed interest in your listings yet.</p>`}
        </div>
        <div class="card">
          <h2 class="dt">Your funding listings</h2>
          ${myFund.length ? myFund.map(f => `<div class="list-row"><span class="ic">${ico("rocket")}</span><div style="flex:1"><b>${esc(f.company || f.type)}</b><div class="muted">${esc(f.type)}, ${esc(f.amount || "Undisclosed")}, ${esc(f.sector || "")}</div></div></div>`).join("") : `<p class="muted" style="margin:0">None yet. <button class="linkish" onclick="go('#/funding')">Create a listing</button></p>`}
        </div>
        <div class="card" id="privacyCard">
          <h2 class="dt">Privacy and activity</h2>
          <p class="pstate ${cs === "granted" ? "on" : ""}"><i></i>${esc(consentLine(user))}</p>
          <p class="muted" style="margin:6px 0 12px">${cs === "granted" ? "We record the pages you open and what you click while logged in. We never record what you type." : "Nothing you click is recorded. You can agree to tracking if you'd like to help improve the platform."}</p>
          ${cs === "granted" ? `<button class="btn btn-sm btn-block" data-no-track onclick="dashConsent('withdrawn')">Stop tracking</button>` : `<button class="btn btn-sm btn-block" data-no-track onclick="dashConsent('granted')">Agree to click tracking</button>`}
          <p style="margin:12px 0 0"><button class="btn btn-sm btn-block" data-no-track onclick="go('#/activity')">${ico("eye")} Open My activity</button></p>
          <p style="margin:12px 0 0"><a class="linkish" href="#/privacy" data-no-track>Read the tracking notice</a></p>
        </div>
        <button class="btn btn-block" onclick="logout()">${ico("logout")} Log out</button>
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
