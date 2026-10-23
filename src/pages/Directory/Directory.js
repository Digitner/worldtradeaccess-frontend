/* eslint-disable */
import { adLeaderHTML } from '../../components/Ads/Ads.js';
import { carousel } from '../../components/Carousel/Carousel.js';
import { pIco } from '../../components/Chips/Chips.js';
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { PILLARS } from '../../constant/pillars.js';
import { $, $$, esc, ico } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';
import { allMembers } from '../../utils/store.js';

export function viewDirectory(app,_a,soft){
  if(soft&&$("#d_grid")){paintDir();return;}
  const featured=[...allMembers()].sort((a,b)=>(b.spon?1:0)-(a.spon?1:0)).slice(0,10);
  app.innerHTML=`
  <section><div class="wrap">
    <span class="kicker">The network</span>
    <h1 class="page-h">Member directory.</h1>
    <p class="page-sub">Every member registers who they are and what they seek. Browse or search the intent layer that powers the matcher.</p>
    <div class="section-h" style="margin-top:14px"><h2 style="font-size:20px">Featured this week</h2><button class="linkish" onclick="go('#/search')">Ask the AI matcher →</button></div>
    ${carousel(featured.map(mktCardHTML).join(""),true,"Featured members")}
    <div class="toolbar" style="margin-top:18px"><div class="search"><span class="si">${ico("search")}</span><label class="vh" for="d_q">Search members</label><input id="d_q" placeholder="Search members, sectors, needs…" value="${esc(state.DIR.q)}"></div></div>
    <div class="toolbar" id="d_filters" style="margin-top:0">${["all",...PILLARS].map(p=>`<button class="fbtn" data-p="${p}" aria-pressed="${p===state.DIR.pillar}">${p==="all"?ico("grid")+" All members":pIco(p)+" "+p}</button>`).join("")}</div>
    <div class="mkt-grid" id="d_grid"></div>
  </div></section>`;
  $("#d_filters").onclick=e=>{const b=e.target.closest(".fbtn");if(!b)return;state.DIR.pillar=b.dataset.p;$$("#d_filters .fbtn").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));paintDir();};
  $("#d_q").oninput=e=>{state.DIR.q=e.target.value;paintDir();};
  paintDir();
}

export function paintDir(){
  const q=state.DIR.q.trim().toLowerCase();
  let list=allMembers();
  if(state.DIR.pillar!=="all")list=list.filter(m=>m.pillar===state.DIR.pillar);
  if(q)list=list.filter(m=>(m.name+" "+m.country+" "+m.pillar+" "+m.seek).toLowerCase().includes(q));
  list=[...list].sort((a,b)=>(b.spon?1:0)-(a.spon?1:0));
  const g=$("#d_grid");if(!g)return;
  g.innerHTML=list.length?`<div style="grid-column:1/-1">${adLeaderHTML(0)}</div>`+list.map(mktCardHTML).join(""):`<div class="empty" style="grid-column:1/-1">No members match “${esc(state.DIR.q)}”. Try a country, sector or product.</div>`;
}

/* ================= MEMBER ================= */
