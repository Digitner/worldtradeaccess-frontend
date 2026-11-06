/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { ccChip, pIco } from '../../components/Chips/Chips.js';
import { fundRailHTML } from '../../components/FundingCard/FundingCard.js';
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { toast } from '../../components/Toasts/toast.js';
import { PILLARS } from '../../constant/pillars.js';
import { SITE_MAP } from '../../constant/content.js';
import { bgVideo, closerHTML, filmHTML } from '../../components/Page/Page.js';
import { TYPE_LABEL } from '../../constant/roles.js';
import { $, $$, esc, ico, img, imgTag, photo } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';
import useServices from './hooks/useServices.js';

const _svc = useServices();
let _topMembers = [];

export function heroSearch(e){if(e)e.preventDefault();const q=$("#heroQ").value.trim();if(!q){toast("Enter what you seek","For example: halal snacks distributor in Malaysia",false);$("#heroQ").focus();return;}state.HERO.q=q;state.HERO.role=$("#heroRole").value;go("#/search");}

export function heroChip(t){$("#heroQ").value=t;heroSearch();}

export function rankTab(p,btn){if(btn)$$("#rankTabs .fbtn").forEach(x=>x.setAttribute("aria-pressed",String(x===btn)));const list=_topMembers.filter(m=>(m.sector||m.pillar)===p).slice(0,5);$("#rankGrid").innerHTML=list.length?list.map((m,i)=>`<button class="rankrow" onclick="go('#/member/${esc(m._id||m.id)}')"><span class="rnk">${i+1}</span>${imgTag(photo(m),"")}<span style="flex:1;min-width:0"><span class="mkt-name" style="display:block;font-size:14.5px">${esc(m.company_name||m.name)}</span><span class="mkt-loc" style="margin:2px 0 0">${ccChip(m.country_name||m.country)} ${esc(m.country_name||m.country)} · ${TYPE_LABEL[m.goal||m.type]||""}</span></span><span class="muted">${ico("arrow")}</span></button>`).join(""):'<p class="muted" style="padding:12px 6px">No members in this category yet.</p>';}

const FALLBACK_TRENDING = ["halal packaged foods","wheat & edible oils","logistics JV partner","solar EPC","Islamic trade finance","IoT devices OEM"];
const FALLBACK_PARTNERS = ["Asian Institute of Management","China Construction Bank","Asian Development Bank","BRICS+ Universities Association","SHIELD Group"];
const FALLBACK_TESTIMONIALS = [
  { quote: "A supermarket group in KL found three qualified halal suppliers in a week. Intent matching did what months of trade-fair cards never could.", name: "Farah Aziz", company: "KL Prime Grocers, Malaysia", initials: "FA" },
  { quote: "We listed a USD 6M raise and were introduced to two corridor funds within days. The reasoning attached to each match saved us hours of screening.", name: "Dewi Pratama", company: "Garuda Logistics Tech, Indonesia", initials: "DP" },
  { quote: "As a fund, inbound quality is the whole game. WorldTradeAccess sends us deals that fit our thesis and geography.", name: "Omar Rashid", company: "Gulf Bridge Capital, UAE", initials: "OR" },
];

export async function viewHome(app){
  // Load API data in parallel
  const [feat, topMembers, funding, partners, testimonials, trendingKws] = await Promise.all([
    _svc.getFeaturedMembers(),
    _svc.getTopMembers(),
    _svc.getFundingHighlights(),
    _svc.getPartners(),
    _svc.getTestimonials(),
    _svc.getTrending(),
  ]);

  const finalTrending = trendingKws.length ? trendingKws.map(k => k.keyword) : FALLBACK_TRENDING;
  const finalPartners = partners.length ? partners : FALLBACK_PARTNERS.map(name => ({ name }));
  const finalTestimonials = testimonials.length ? testimonials : FALLBACK_TESTIMONIALS;
  _topMembers = topMembers;
  // Normalize field names for card components
  const featNorm = feat.map(m => ({ ...m, id: m._id || m.id, name: m.company_name || m.name, country: m.country_name || m.country, type: m.goal || m.type, pillar: m.sector || m.pillar, spon: m.is_sponsored || m.spon }));
  const fundNorm = funding.map(f => ({ ...f, id: f._id || f.id, img: f.image_url || f.img, company: f.company_name || f.company, country: f.country_name || f.country || "", desc: f.description || f.desc || "" }));
  app.innerHTML=`
  <div class="hv anim" id="hv">${bgVideo()}
    <div class="wrap hv-c" id="hvc">
      <div class="hv-att fadein" style="--i:0">BRICS-ASEAN Chamber of Commerce</div>
      <h1 aria-label="Trade across the BRICS-ASEAN corridor with the right partner"><span aria-hidden="true"><span class="hl" data-ch>Trade across the</span> <span class="hl" data-ch>BRICS-ASEAN corridor</span> <span class="hl"><span data-ch>with the right</span> <span class="rot" id="rot"><b>partner</b></span></span></span></h1>
      <p class="lede" data-wf>Find buyers, suppliers, investors, funders and joint-venture partners across more than 20 economies. Say what you seek in 25 words, and AI shows you who fits and why.</p>
      <form class="hsr fadein" style="--i:12" onsubmit="heroSearch(event)" role="search"><label class="vh" for="heroRole">What you want to do</label><select id="heroRole">${[["buy","I want to source"],["sell","I want to sell"],["capital","I want to raise capital"],["invest","I want to invest"],["jv","I want a JV partner"]].map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select><label class="vh" for="heroQ">What you seek</label><input id="heroQ" placeholder="e.g. halal snacks distributor in Malaysia"><button type="submit">${ico("sparkle")} Find matches</button></form>
      <div class="trend fadein" style="--i:13;justify-content:center"><span style="color:#a9b8cf;font-size:12.5px">Trending:</span>${finalTrending.map(t=>`<button class="tc" onclick="heroChip('${esc(t)}')">${esc(t)}</button>`).join("")}</div>
      <div class="hv-cta fadein" style="--i:14"><button onclick="go('#/register')">Create your listing</button></div>
    </div>
    <div class="cue" aria-hidden="true"></div>
    <button class="vtoggle" id="vtoggle" aria-label="Pause background video">Pause video</button>
  </div>
  <div class="stats"><div class="wrap"><div class="stats-g">${[[20,"+","economies across the corridor"],[6,"","sectors, from finance to resources"],[5,"","ways to trade: sell, source, raise, invest or partner"],[25,"","words is all it takes to list what you seek"]].map(([n,s,l])=>`<div class="stat"><b data-count="${n}" data-suf="${s}">${n}${s}</b><span>${l}</span></div>`).join("")}</div></div></div>
  <div class="mq" aria-hidden="true"><div class="mq-r" id="mq1">${Array(4).fill(["Buyers","Sellers","Investors","Funders","JV partners"].map(x=>`<span>${x}</span>`).join("")).join("")}</div><div class="mq-r" id="mq2">${Array(4).fill(PILLARS.map(x=>`<span>${x}</span>`).join("")).join("")}</div></div>

  <section><div class="wrap">
    <div class="section-h"><h2 class="rvh">Explore WorldTradeAccess</h2></div>
    <nav class="sitemap" aria-label="Pages">${SITE_MAP.map(([h,t,d,im],i)=>`<a class="smap spot" href="${h}" style="--d:${i%4*70}"><span class="im">${imgTag(img(im),"")}</span><b>${t}</b><small>${d}</small></a>`).join("")}</nav>
  </div></section>

  ${featNorm.length?`<section style="padding-top:14px"><div class="wrap">
    <div class="section-h"><h2>Featured members &amp; opportunities</h2><button class="linkish" onclick="go('#/directory')">See all</button></div>
    ${carousel(featNorm.map(mktCardHTML).join(""),true,"Featured members")}
  </div></section>`:""}

  <section><div class="wrap"><div class="split">
    <div class="main">
      <div class="section-h"><h2>Top ranking</h2></div>
      <div class="rank-wrap">
        <div class="toolbar" id="rankTabs" style="margin:0 0 6px">${PILLARS.map((p,i)=>`<button class="fbtn" aria-pressed="${i===0}" onclick="rankTab('${p}',this)">${pIco(p)} ${p}</button>`).join("")}</div>
        <div id="rankGrid"></div>
      </div>
    </div>
    <div class="side">
      <div class="section-h"><h2>Raising capital now</h2><button class="linkish" onclick="go('#/funding')">View all</button></div>
      ${carousel(fundNorm.map(fundRailHTML).join(""),true,"Funding opportunities")}
    </div>
  </div></div></section>

  <section style="padding-top:8px"><div class="wrap">
    <div class="section-h"><h2>Trusted network</h2></div>
    <div class="partners">${finalPartners.map(p=>`<span class="partner">${p.logo_url?`<img src="${esc(p.logo_url)}" alt="${esc(p.name)}" style="height:22px;object-fit:contain;vertical-align:middle;margin-right:6px">`:`<span class="pd"></span>`}${p.website?`<a href="${esc(p.website.startsWith('http')?p.website:'https://'+p.website)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;display:inline">${esc(p.name)}</a>`:esc(p.name)}</span>`).join("")}</div>
  </div></section>

  <section style="padding-top:14px"><div class="wrap">
    <div class="section-h"><h2>Matches that turned into deals</h2><span class="muted">Sample stories</span></div>
    <div class="feature-row">
      ${finalTestimonials.map(t=>{
        const ini = t.initials || (t.name||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
        return `<figure class="quote"><blockquote>"${esc(t.quote)}"</blockquote><figcaption class="who">${t.avatar_url?`<img src="${esc(t.avatar_url)}" alt="${esc(t.name)}" class="av" style="object-fit:cover">`:`<span class="av">${esc(ini)}</span>`}<span><b style="font-size:14px;display:block">${esc(t.name)}</b><span class="muted">${esc(t.company)}</span></span></figcaption></figure>`;
      }).join("")}
    </div>
  </div></section>

  <section class="film" id="film"><svg class="lanes" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 420 C 240 120, 480 460, 760 180 S 1120 90, 1230 240"/><path d="M-20 90 C 300 300, 520 40, 820 300 S 1100 440, 1230 360"/></svg><div class="wrap">
    <div class="section-h"><h2 class="rvh">See how it works</h2><button class="linkish" onclick="go('#/how')">Read the five steps</button></div>
    ${filmHTML()}
  </div></section>
  ${closerHTML()}`;
  rankTab(PILLARS[0]);
}

/* ================= REGISTER ================= */

