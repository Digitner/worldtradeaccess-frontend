/* eslint-disable */
import { carousel } from '../../../components/Carousel/Carousel.js';
import { ccChip, pIco } from '../../../components/Chips/Chips.js';
import { mktCardHTML } from '../../../components/MarketCard/MarketCard.js';
import { DEAL_STAGES } from '../../../constant/forms.js';
import { COMPAT, ROLE_META, TIERS } from '../../../constant/roles.js';
import { logout } from '../Login/Login.js';
import { localMatch } from '../Search/Search.js';
import { esc, fmtShort, ico } from '../../../utils/helpers.js';
import { go } from '../../../utils/router.js';
import { state } from '../../../utils/state.js';
import { allMembers, myDeals, myId, myIntros, shared } from '../../../utils/store.js';

export function viewDashboard(app){
  const hasListing=state.USER.seek&&state.USER.seek.trim();
  const pool=allMembers().filter(m=>COMPAT[state.USER.type]&&COMPAT[state.USER.type].includes(m.type)&&m.id!==state.USER.id);
  const potential=hasListing?localMatch(state.USER.seek,pool,state.USER.type).length:0;
  const intros=myIntros();
  const myFund=shared()?state.MY_FUNDING:state.LOCAL_FUNDING.filter(f=>f.by===myId());
  const deals=myDeals();
  const complete=[state.USER.name,state.USER.person,state.USER.email,state.USER.country,state.USER.pillar,state.USER.seek,state.USER.site,state.USER.phone].filter(x=>x&&String(x).trim()).length;
  const pct=Math.round(complete/8*100);
  app.innerHTML=`
  <section><div class="wrap">
    <div class="top">
      <div>
        <span class="kicker">Dashboard</span>
        <h1 class="page-h" style="margin-bottom:4px">Welcome, ${esc((state.USER.person||state.USER.name||"there").split(" ")[0])}.</h1>
        <p class="muted" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${esc(state.USER.name)} · ${ccChip(state.USER.country)} ${esc(state.USER.country)} <span class="tag ${state.USER.tier==="open"?"":"gold"}">${ico((TIERS[state.USER.tier]||TIERS.open).ic)}${(TIERS[state.USER.tier]||TIERS.open).t}</span></p>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="logout()">${ico("logout")} Log out</button>
    </div>
    <div class="kpi-row">
      <div class="kpi"><span class="ki">${ico("sparkle")}</span><div><div class="n" style="color:var(--blue-text)">${potential}</div><div class="l">Potential matches</div></div></div>
      <div class="kpi"><span class="ki" style="background:var(--gold-soft);color:var(--gold-text)">${ico("handshake")}</span><div><div class="n" style="color:var(--gold-text)">${intros.length}</div><div class="l">Introductions sent</div></div></div>
      <div class="kpi"><span class="ki" style="background:var(--green-soft);color:var(--green-text)">${ico("briefcase")}</span><div><div class="n" style="color:var(--green-text)">${deals.length}</div><div class="l">Active deals</div></div></div>
      <div class="kpi"><span class="ki">${ico("user")}</span><div><div class="n">${pct}%</div><div class="l">Profile complete</div></div></div>
    </div>
    ${pool.length?`<div class="section-h"><h2 style="font-size:21px">Opportunities for you</h2><button class="linkish" onclick="go('#/search')">Ask the AI matcher →</button></div>${carousel(pool.slice(0,10).map(mktCardHTML).join(""),true,"Opportunities for you")}`:""}
    <div class="split" style="margin-top:22px">
      <div class="main" style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="top" style="margin-bottom:12px"><h2 style="font-size:18px;margin:0">Your listing</h2><button class="btn btn-sm" onclick="go('#/edit')">${ico("edit")} Edit</button></div>
          ${hasListing?`<div class="roles" style="margin-bottom:10px"><span class="role" aria-pressed="true" style="cursor:default">${ico(ROLE_META[state.USER.type].ic)} ${ROLE_META[state.USER.type].label}</span></div><p style="font-size:15.5px;line-height:1.55;margin:0"><span class="serif" style="color:var(--gold-text);font-size:22px">“</span>${esc(state.USER.seek)}</p><div class="muted" style="margin-top:12px">${pIco(state.USER.pillar)} ${esc(state.USER.pillar)} · ${esc(state.USER.email||"")}${state.USER.site?" · "+esc(state.USER.site):""}</div>`
          :`<p style="color:var(--text-soft);margin:0">You haven't published an intent yet. <button class="linkish" onclick="go('#/edit')">Add what you seek →</button></p>`}
          <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="go('#/search')">${ico("sparkle")} Find my matches <span class="arrow">→</span></button>
        </div>
        <div class="card">
          <h2 style="font-size:18px;margin:0 0 6px">Introductions you've requested</h2>
          ${intros.length?intros.map(i=>{const m=allMembers().find(x=>x.id===i.data.to);return `<div class="list-row"><span class="ic">${ico("handshake")}</span><div style="flex:1;min-width:0"><b>${esc(m?m.name:i.data.toName||"Member")}</b><div class="muted">“${esc((i.data.message||"").slice(0,110))}${(i.data.message||"").length>110?"…":""}”</div></div><span class="tag green">${ico("check")}Sent ${fmtShort(i.at)}</span></div>`;}).join(""):`<p class="muted" style="margin:8px 0 0">No introductions yet. Run a match and reach out to a counterparty.</p>`}
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
          ${myFund.length?myFund.map(f=>`<div class="list-row"><span class="ic">${ico("rocket")}</span><div style="flex:1"><b>${esc(f.type)}</b><div class="muted">${esc(f.amount)} · ${esc(f.sector)}</div></div></div>`).join(""):`<p class="muted" style="margin:8px 0 0">None yet. <button class="linkish" onclick="go('#/funding')">Create one →</button></p>`}
        </div>
        <div class="card">
          <h2 style="font-size:18px;margin:0 0 6px">Your active deals</h2>
          ${deals.length?deals.map(d=>`<button class="list-row" style="width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left;color:var(--text)" onclick="go('#/deal/${esc(d.fid)}')"><span class="ic">${ico("briefcase")}</span><span style="flex:1"><b>${esc(d.company)}</b><span class="muted" style="display:block">${esc(d.amount)}</span></span><span class="tag ${d.stage>=DEAL_STAGES.length-1?"green":""}">${esc(DEAL_STAGES[d.stage]||"")}</span></button>`).join(""):`<p class="muted" style="margin:8px 0 0">No active deals. <button class="linkish" onclick="go('#/funding')">Explore opportunities →</button></p>`}
        </div>
      </div>
    </div>
  </div></section>`;
}

/* ================= EDIT LISTING ================= */
