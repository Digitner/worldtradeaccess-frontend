/* eslint-disable */
import { AUD, FAQ, FOR_T, SECT_D, STEPS } from '../../constant/content.js';
import { COMPAT, TIERS, TYPE_LABEL } from '../../constant/roles.js';
import { PILLARS, PILLAR_IMG, PILLAR_SUBS } from '../../constant/pillars.js';
import { carousel } from '../../components/Carousel/Carousel.js';
import { mktCardHTML } from '../../components/MarketCard/MarketCard.js';
import { audPanel, closerHTML, countryGo, faqToggle, filmHTML, forTabs, pageHead, pillarGo } from '../../components/Page/Page.js';
import { NOTICE_VERSION, consentOf, consentState, currentUser, noticeHTML, userCompany, userLabel } from '../../utils/activity.js';
import { esc, fmtShort, img, imgTag } from '../../utils/helpers.js';
import useServices from '../Directory/hooks/useServices.js';

const _svc = useServices();

/* Members for the audience and sector pages come from the same members API as the Directory. */
async function loadMembers() {
  const list = await _svc.getMembers({ limit: 100 });
  return list.map(m => ({
    id: m._id || m.id, name: m.company_name || m.name, country: m.country_name || m.country, pillar: m.sector || m.pillar,
    type: m.goal || m.type, seek: m.seek, tier: m.tier, spon: m.is_sponsored || m.spon, person: m.contact_person || m.person,
    image_url: m.image_url || null, cover_url: m.cover_url || null,
  }));
}

export { faqToggle, pillarGo, countryGo };

export function viewHow(app){
  app.innerHTML=`${pageHead("How it works","From first listing to closed deal.","Five steps take you from registering your business to moving a deal forward.")}
  <section><div class="wrap"><div class="steps"><div class="steps-art" id="stepsArt" aria-hidden="true">${STEPS.map((s,i)=>imgTag(img(s[2]),"",i?"":"on")).join("")}</div><div id="stepsT">${STEPS.map((s,i)=>`<div class="step ${i?"":"on"}" role="button" tabindex="0" aria-expanded="${!i}"><small>Step ${i+1}</small><h3>${s[0]}</h3><div class="step-b"><div><p>${s[1]}</p>${imgTag(img(s[2]),"")}</div></div></div>`).join("")}</div></div></div></section>
  <section class="film" id="film"><svg class="lanes" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 420 C 240 120, 480 460, 760 180 S 1120 90, 1230 240"/><path d="M-20 90 C 300 300, 520 40, 820 300 S 1100 440, 1230 360"/></svg><div class="wrap"><div class="section-h"><h2 class="rvh">See it in action</h2></div>${filmHTML()}</div></section>
  ${closerHTML()}`;
}
export async function viewFor(app,arg){
  const i=AUD.findIndex(a=>a.k===arg);
  if(i<0){app.innerHTML=`${pageHead("Who it's for","Built around what you want to do.","Choose the page that fits your business.")}
    <section><div class="wrap"><div class="sitemap for-grid">${AUD.map(a=>`<a class="smap spot" href="#/for/${a.k}"><span class="im">${imgTag(img(a.img),"")}</span><b>${FOR_T[a.k]}</b><small>${a.h}</small></a>`).join("")}</div></div></section>${closerHTML()}`;return;}
  const a=AUD[i],pool=(await loadMembers()).filter(m=>COMPAT[a.k]&&COMPAT[a.k].includes(m.type)).slice(0,10);
  app.innerHTML=`${pageHead("Who it's for",FOR_T[a.k],a.h+".")}
  <section class="aud"><svg class="lanes" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 420 C 240 120, 480 460, 760 180 S 1120 90, 1230 240"/><path d="M-20 90 C 300 300, 520 40, 820 300 S 1100 440, 1230 360"/></svg><div class="wrap">${forTabs(a.k)}<div id="audPanel">${audPanel(i)}</div></div></section>
  ${pool.length?`<section><div class="wrap"><div class="section-h"><h2 class="rvh">Who you could meet</h2><button class="linkish" onclick="go('#/directory')">See all members</button></div>${carousel(pool.map(mktCardHTML).join(""),false,"Members you could meet")}</div></section>`:""}
  ${closerHTML()}`;
}
export async function viewSectors(app){
  const all=await loadMembers();
  app.innerHTML=`${pageHead("Sectors","Six sectors, one network.","Choose a sector to see the members and listings in it.")}
  <section id="sectSec"><div class="wrap"><div class="section-h"><h2 class="rvh">Browse by sector</h2></div>
    <div class="sects">${PILLARS.map(p=>`<button class="sect" onclick="pillarGo('${p}')"><div class="im">${imgTag(img(PILLAR_IMG[p]),"")}</div><h3>${p}<small>${all.filter(m=>m.pillar===p).length} listings</small></h3><p>${SECT_D[p]}</p><span class="sb">${PILLAR_SUBS[p]}</span></button>`).join("")}</div>
  </div></section>${closerHTML()}`;
}
export function viewNetwork(app){
  app.innerHTML=`${pageHead("Network","A network that spans the corridor.","The platform links BRICS economies, their partners and ASEAN markets.")}
  <section class="reach"><div class="wrap two">
    <canvas id="globe" aria-hidden="true"></canvas>
    <div class="prose"><h2 class="rvh">Find members by country</h2><p>Drag the globe to follow the trade lanes, or choose a country to see its members.</p>
      <div class="ctry">${[["BRICS and partners",["India","China","Brazil","Russia","South Africa","Egypt","Ethiopia","Iran","UAE","Saudi Arabia"]],["ASEAN",["Indonesia","Malaysia","Thailand","Vietnam","Philippines","Singapore","Myanmar","Cambodia","Laos","Brunei"]],["South Asia",["Sri Lanka","Bangladesh","Nepal"]]].map(([h,c])=>`<h3>${h}</h3><div>${c.map(n=>`<button onclick="countryGo('${n}')">${n}</button>`).join("")}</div>`).join("")}</div>
    </div>
  </div></section>${closerHTML()}`;
}
export function viewMembership(app){
  app.innerHTML=`${pageHead("Membership","Choose how you join.","Start with a free open listing, or join as a member for verified matching.")}
  <section><div class="wrap"><div class="tiers">
    <div class="tier pri"><h3>BACC member</h3><p>Full membership of the BRICS-ASEAN Chamber of Commerce.</p><ul><li>Your business listing</li><li>AI matching</li><li>Verified matching</li><li>Priority placement</li></ul><button class="btn btn-primary" onclick="go('#/register')">Join as a BACC member</button></div>
    <div class="tier"><h3>BAICT&amp;E member</h3><p>Membership through the Independent Commission for Trade &amp; Economy.</p><ul><li>Your business listing</li><li>AI matching</li><li>Verified matching</li><li>Priority placement</li></ul><button class="btn" onclick="go('#/register')">Join as a BAICT&amp;E member</button></div>
    <div class="tier"><h3>Open listing</h3><p>A free public listing for any business that wants to be found.</p><ul><li>Your business listing</li><li>AI matching</li></ul><button class="btn" onclick="go('#/register')">Create a free listing</button></div>
  </div></div></section>`;
}
export function viewFaq(app){
  app.innerHTML=`${pageHead("Questions","Common questions.","Answers about joining, matching and introductions.")}
  <section><div class="wrap narrow"><div class="faq">${FAQ.map(([q,a],i)=>`<div class="faq-i ${i?"":"open"}"><button class="faq-q" aria-expanded="${!i}" onclick="faqToggle(this)">${q}<b aria-hidden="true"></b></button><div class="faq-a"><div><p>${a}</p></div></div></div>`).join("")}</div></div></section>`;
}
/* ================= ABOUT ================= */
export function viewAbout(app){
  const U=currentUser();
  app.innerHTML=`${pageHead("About","A trade network for the BRICS-ASEAN corridor.","WorldTradeAccess gives the chamber's members one place to find partners, capital and trade information.")}
  <section><div class="wrap two">
    <div class="prose"><h2 class="rvh">The platform</h2><p class="lead-f">Members list their business and state what they seek in 25 words. AI search then matches buyers, sellers, investors, funders and joint-venture partners.</p><p>The aim is simple: make it faster to find the right counterparty, and easier to understand why they fit. Around that sit a member directory, a funding marketplace with a six-stage deal process, and trade news with personal alerts.</p></div>
    <div class="figimg wipe" style="height:clamp(260px,32vw,440px)">${imgTag(img("port"),"Container port")}</div>
  </div></section>
  <section id="aboutLogin" style="background:var(--bg-2)"><div class="wrap">
    <div class="section-h"><h2 class="rvh">${U?"Your account":"Your account and login"}</h2></div>
    ${U?(()=>{const cs=consentState(U),t=TIERS[U.tier||U.membership_type]||TIERS.open;return `<div class="acct-g"><div class="prose"><p class="lead-f">You're logged in as ${esc(userLabel(U))}, for ${esc(userCompany(U))}.</p><p>Your dashboard holds your listing, matches, introductions, deals and funding listings. My activity shows what has been recorded in this browser while you're logged in.</p><div class="acct-btns"><button class="btn btn-primary" onclick="go('#/dashboard')">Open your dashboard</button><button class="btn" onclick="go('#/activity')">Open My activity</button></div></div>
      <dl class="acct-kv"><dt>Email</dt><dd>${esc(U.email||"")}</dd><dt>Membership</dt><dd>${esc(t.t)}</dd><dt>Click tracking</dt><dd>${cs==="granted"?`On, since ${fmtShort(consentOf(U).at)}`:"Off"}</dd></dl></div>`;})():`<div class="prose"><p class="lead-f">Log in with the email you registered with to open your own account. New businesses can register first.</p></div>
      <div class="acct-items">
        <div><h3>Your dashboard</h3><p>Your listing, best matches, introductions, deals and funding listings.</p></div>
        <div><h3>Your listing</h3><p>Edit your business details and what you seek at any time.</p></div>
        <div><h3>My activity</h3><p>If you agree to click tracking, see the pages you opened and what you clicked.</p></div>
        <div><h3>Your privacy choice</h3><p>Click tracking is optional. You choose when you log in, and can stop it or delete your activity later.</p></div>
      </div>
      <div class="acct-btns"><button class="btn btn-primary" onclick="go('#/login')">Log in</button><button class="btn" onclick="go('#/register')">Become a member</button><a class="linkish" href="#/privacy">Read the tracking notice</a></div>`}
    <p class="muted" style="margin:16px 0 0">Accounts use a one-time code sent to your email, so there is no password to remember.</p>
  </div></section>
  <section><div class="wrap"><div class="section-h"><h2 class="rvh">Trade support, in one place</h2></div>
    <div class="idx">
      <div><h3>Trade bodies <em>Planned</em></h3><p>An index of chambers and associations that support cross-border business.</p></div>
      <div><h3>UN agencies <em>Planned</em></h3><p>Where to find the agencies and programmes relevant to trade and development.</p></div>
      <div><h3>Banks <em>Planned</em></h3><p>Banks that offer trade finance and cross-border services.</p></div>
      <div><h3>Non-bank funders</h3><p>Investors and funders listed on the network. <button class="linkish" onclick="go('#/funding')">See funding</button></p></div>
      <div><h3>Trade news alerts</h3><p>Choose your topics and get the news that affects your trade. <button class="linkish" onclick="go('#/news')">Set up alerts</button></p></div>
    </div></div></section>
  <section><div class="wrap two">
    <div class="prose"><h2 class="rvh">The chamber</h2><p>WorldTradeAccess is the trade platform of the BRICS-ASEAN Chamber of Commerce (BACC), based in Kuala Lumpur, Malaysia. Its registration number is PPM-009-10-22052020.</p><p>Membership is also available through BAICT&amp;E, the Independent Commission for Trade &amp; Economy. Digitner Tech Solutions is the platform's technical partner.</p><button class="btn linebtn" onclick="go('#/contact')">Contact the chamber</button></div>
    <div class="prose"><h2 class="rvh">How the platform sustains itself</h2><div class="idx" style="grid-template-columns:1fr 1fr">
      <div><h3>Database sales</h3><p>Verified member and trade data for businesses that need it.</p></div>
      <div><h3>Member product commission</h3><p>A commission on member products sold at factory price.</p></div>
      <div><h3>Crowd-funding listing fees</h3><p>Planned for a later phase.</p></div>
      <div><h3>Our own services</h3><p>Services offered to members already trading here.</p></div>
    </div></div>
  </div></section>`;
}
/* ================= MY ACTIVITY ================= */
let ACT_FILTER="all";
export function viewPrivacy(app){
  app.innerHTML=`<section><div class="wrap narrow">
    <span class="kicker">Privacy</span>
    <h1 class="page-h">Activity tracking notice.</h1>
    <p class="page-sub">How WorldTradeAccess records what logged-in members click, when they agree to it.</p>
    <div class="card" style="margin-top:20px">${noticeHTML()}<p class="muted" style="margin:16px 0 0">Notice version ${NOTICE_VERSION}</p></div>
  </div></section>`;
}

/* ================= DASHBOARD ================= */
