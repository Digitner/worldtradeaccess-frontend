/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { ccChip, pIco } from '../../components/Chips/Chips.js';
import { fundRailHTML } from '../../components/FundingCard/FundingCard.js';
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { toast } from '../../components/Toasts/toast.js';
import { PILLARS, PILLAR_IMG, PILLAR_SUBS } from '../../constant/pillars.js';
import { TYPE_LABEL } from '../../constant/roles.js';
import { $, $$, esc, ico, img, imgTag, photo } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';
import useServices from './hooks/useServices.js';

const _svc = useServices();
let _topMembers = [];

export function heroSearch(e){if(e)e.preventDefault();let q=$("#heroQ").value.trim();if(!q){toast("Type what you're looking for","For example: halal snacks distributor in Malaysia",false);$("#heroQ").focus();return;}const cat=$("#heroCat").value;if(cat&&cat!=="All categories")q=cat+": "+q;state.HERO.q=q;state.HERO.role="buy";go("#/search");}

export function heroChip(t){$("#heroQ").value=t;heroSearch();}

export function rankTab(p,btn){if(btn)$$("#rankTabs .fbtn").forEach(x=>x.setAttribute("aria-pressed",String(x===btn)));const list=_topMembers.filter(m=>(m.sector||m.pillar)===p).slice(0,5);$("#rankGrid").innerHTML=list.length?list.map((m,i)=>`<button class="rankrow" onclick="go('#/member/${esc(m._id||m.id)}')"><span class="rnk">${i+1}</span>${imgTag(photo(m),"")}<span style="flex:1;min-width:0"><span class="mkt-name" style="display:block;font-size:14.5px">${esc(m.company_name||m.name)}</span><span class="mkt-loc" style="margin:2px 0 0">${ccChip(m.country)} ${esc(m.country)} · ${TYPE_LABEL[m.goal||m.type]||""}</span></span><span class="muted">${ico("arrow")}</span></button>`).join(""):'<p class="muted" style="padding:12px 6px">No members in this category yet.</p>';}

export async function viewHome(app){
  // Load API data in parallel
  const [feat, topMembers, funding] = await Promise.all([
    _svc.getFeaturedMembers(),
    _svc.getTopMembers(),
    _svc.getFundingHighlights(),
  ]);
  _topMembers = topMembers;
  // Normalize field names for card components
  const featNorm = feat.map(m => ({ ...m, id: m._id || m.id, name: m.company_name || m.name, type: m.goal || m.type, pillar: m.sector || m.pillar }));
  const fundNorm = funding.map(f => ({ ...f, id: f._id || f.id, img: f.image_url || f.img, company: f.company_name || f.company, country: f.country || "", desc: f.description || f.desc || "" }));
  app.innerHTML=`
  <div class="hero" style="${img("kl")?`background-image:url('${esc(img("kl"))}')`:""}">
    <div class="wrap inner">
      <div class="hero2">
        <div>
          <span class="eyebrow"><span class="dot"></span>BRICS-ASEAN Chamber of Commerce</span>
          <h1>The global trade platform for the <em>BRICS × ASEAN</em> corridor.</h1>
          <p class="lede">Source suppliers, find buyers, raise capital and strike JVs across 20+ economies, matched by AI to exactly what you seek.</p>
          <form class="hsearch" onsubmit="heroSearch(event)" role="search">
            <label class="vh" for="heroCat">Category</label>
            <select id="heroCat"><option>All categories</option>${PILLARS.map(p=>`<option>${p}</option>`).join("")}</select>
            <label class="vh" for="heroQ">What are you looking for?</label>
            <input id="heroQ" placeholder="e.g. halal snacks distributor in Malaysia">
            <button type="submit">${ico("sparkle")} Ask AI</button>
          </form>
          <div class="trend"><span style="color:#a9b8cf;font-size:12.5px">Trending:</span>${["halal packaged foods","wheat & edible oils","logistics JV partner","solar EPC","Islamic trade finance","IoT devices OEM"].map(t=>`<button class="tc" onclick="heroChip('${t}')">${t}</button>`).join("")}</div>
        </div>
        <div class="getcard">
          <div class="serif" style="font-weight:600;font-size:20px">Get started free</div>
          <p class="muted" style="margin:6px 0 14px">List what you seek in 25 words and let the corridor come to you.</p>
          <button class="btn btn-primary btn-block" onclick="go('#/register')">${ico("user")} Join as a member <span class="arrow">→</span></button>
          <button class="btn btn-block" style="margin-top:9px" onclick="go('#/search')">${ico("sparkle")} Try the AI matcher</button>
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:9px">
            ${[["shield","Verified chamber members"],["compass","AI intent-matching"],["lock","Facilitated, escrow-ready deals"]].map(([i,t])=>`<div style="display:flex;gap:9px;align-items:center;font-size:13px;color:var(--text-soft)"><span style="color:var(--blue-text);display:inline-flex">${ico(i)}</span>${t}</div>`).join("")}
          </div>
        </div>
      </div>
      <div class="trustbar">
        ${[["globe","20+ nations","One connected corridor"],["shield","Verified members","Chamber-registered"],["sparkle","Intent-matched","AI-ranked counterparties"],["handshake","Deal facilitation","Warm introductions"]].map(([i,b,s])=>`<div class="ti2"><span class="ic">${ico(i)}</span><div><b>${b}</b><span>${s}</span></div></div>`).join("")}
      </div>
    </div>
  </div>

  <section><div class="wrap">
    <div class="section-h"><h2>Browse by category</h2><button class="linkish" onclick="go('#/directory')">All members →</button></div>
    <div class="cat-grid">${PILLARS.map(p=>`<button class="cat" onclick="state.DIR.pillar='${p}';go('#/directory')"><span class="ph" style="${img(PILLAR_IMG[p])?`background-image:url('${esc(img(PILLAR_IMG[p]))}')`:""}"><span class="ic">${pIco(p)}</span></span><span class="b"><span class="t" style="display:block">${p}</span><span class="subs" style="display:block">${PILLAR_SUBS[p]}</span></span></button>`).join("")}</div>
  </div></section>

  <section style="padding-top:14px"><div class="wrap">
    <div class="section-h"><h2>Featured members &amp; opportunities</h2><button class="linkish" onclick="go('#/directory')">See all →</button></div>
    ${carousel(featNorm.map(mktCardHTML).join(""),true,"Featured members")}
  </div></section>

  <section><div class="wrap"><div class="split">
    <div class="main">
      <div class="section-h"><h2>Top ranking</h2></div>
      <div class="rank-wrap">
        <div class="toolbar" id="rankTabs" style="margin:0 0 6px">${PILLARS.map((p,i)=>`<button class="fbtn" aria-pressed="${i===0}" onclick="rankTab('${p}',this)">${pIco(p)} ${p}</button>`).join("")}</div>
        <div id="rankGrid"></div>
      </div>
    </div>
    <div class="side">
      <div class="section-h"><h2>Raising capital now</h2><button class="linkish" onclick="go('#/funding')">View all →</button></div>
      ${carousel(fundNorm.map(fundRailHTML).join(""),true,"Funding opportunities")}
    </div>
  </div></div></section>

  <section style="padding-top:8px"><div class="wrap">
    <div class="section-h"><h2>Trusted network</h2></div>
    <div class="partners">${["Asian Institute of Management","China Construction Bank","Asian Development Bank","BRICS+ Universities Association","SHIELD Group"].map(p=>`<span class="partner"><span class="pd"></span>${p}</span>`).join("")}</div>
  </div></section>

  <section style="padding-top:14px"><div class="wrap">
    <div class="section-h"><h2>Matches that turned into deals</h2><span class="muted">Sample stories</span></div>
    <div class="feature-row">
      ${[["A supermarket group in KL found three qualified halal suppliers in a week. Intent matching did what months of trade-fair cards never could.","FA","Farah Aziz","KL Prime Grocers, Malaysia"],
         ["We listed a USD 6M raise and were introduced to two corridor funds within days. The reasoning attached to each match saved us hours of screening.","DP","Dewi Pratama","Garuda Logistics Tech, Indonesia"],
         ["As a fund, inbound quality is the whole game. WorldTradeAccess sends us deals that fit our thesis and geography.","OR","Omar Rashid","Gulf Bridge Capital, UAE"]]
        .map(([q,ini,n,r])=>`<figure class="quote"><blockquote>"${q}"</blockquote><figcaption class="who"><span class="av">${ini}</span><span><b style="font-size:14px;display:block">${n}</b><span class="muted">${r}</span></span></figcaption></figure>`).join("")}
    </div>
  </div></section>

  <section style="padding-top:14px"><div class="wrap">
    <div class="band">
      <span class="kicker" style="color:#e2bf72">The model</span>
      <h2 class="page-h">How it sustains itself.</h2>
      <p style="max-width:60ch">The matcher is the wedge. Around it, layered revenue, each switched on once the network has liquidity.</p>
      <div class="rev-grid">
        ${[["data","Verified data access","Tiered subscriptions for enriched, verified member & intent data."],["mega","Advertising","Sponsored placements, banner & newsletter slots for corridor brands."],["star","Priority placement","Members pay to rank higher in relevant intent matches."],["handshake","Deal commission","A small success fee on facilitated buy/sell & sourcing deals."],["rocket","Capital listings","Curated fundraising & JV listings, a later-stage crowdfunding rail."]].map(([i,t,d])=>`<div class="rev"><div class="ic">${ico(i)}</div><div class="t">${t}</div><div class="d">${d}</div></div>`).join("")}
      </div>
      <div style="margin-top:20px"><button class="btn btn-gold" style="background:#d9b262;border-color:#d9b262;color:#2e2206" onclick="go('#/advertise')">See advertising options <span class="arrow">→</span></button></div>
    </div>
  </div></section>

  <section><div class="wrap">
    <div class="band" style="${img("handshake")?`background:linear-gradient(105deg,rgba(7,24,49,.95),rgba(10,31,61,.8)),url('${esc(img("handshake"))}') center/cover`:""}">
      <span class="kicker" style="color:#e2bf72">Join the bridge</span>
      <h2 class="page-h" style="max-width:20ch">List what you seek. Let the corridor come to you.</h2>
      <p style="max-width:56ch">Free open listings available. BACC &amp; BAICT&amp;E members unlock verified matching and priority placement.</p>
      <div style="margin-top:18px;display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-gold" style="background:#d9b262;border-color:#d9b262;color:#2e2206" onclick="go('#/register')">${ico("user")} Create your listing <span class="arrow">→</span></button><button class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.3)" onclick="go('#/directory')">${ico("grid")} Browse members</button></div>
    </div>
  </div></section>`;
  rankTab(PILLARS[0]);
}

/* ================= REGISTER ================= */

