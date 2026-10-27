/* eslint-disable */
import { adInlineHTML, adLeaderHTML, adSideHTML } from '../../../components/Ads/Ads.js';
import { carousel } from '../../../components/Carousel/Carousel.js';
import { mktCardHTML } from '../../../components/MarketCard/MarketCard.js';
import { toast } from '../../../components/Toasts/toast.js';
import { PILLARS } from '../../../constant/pillars.js';
import { SEED_MEMBERS } from '../../../constant/seed.js';
import { reqField } from '../../../utils/forms.js';
import { $, $$, esc, ico, img, imgTag, isEmail } from '../../../utils/helpers.js';
import { state } from '../../../utils/state.js';
import { record } from '../../../utils/store.js';

export function viewAdvertise(app){
  let fmt="Leaderboard banner";
  app.innerHTML=`
  <section><div class="wrap">
    <div class="split" style="align-items:center">
      <div class="main">
        <span class="kicker">Advertise</span>
        <h1 class="page-h">Put your brand in front of the corridor.</h1>
        <p class="page-sub">WorldTradeAccess reaches trade decision-makers, buyers, exporters and investors across 20+ BRICS and ASEAN economies. Sponsored placements are always labelled and matched to relevant intent.</p>
      </div>
      <div class="side"><div class="media-hero" style="height:200px;margin:0">${imgTag(img("dashboard"),"Audience analytics")}</div></div>
    </div>
    <div class="kpi-row">
      <div class="kpi"><span class="ki">${ico("users")}</span><div><div class="n">12k+</div><div class="l">Monthly active members (target)</div></div></div>
      <div class="kpi"><span class="ki" style="background:var(--gold-soft);color:var(--gold-text)">${ico("globe")}</span><div><div class="n">20+</div><div class="l">Member nations</div></div></div>
      <div class="kpi"><span class="ki" style="background:var(--green-soft);color:var(--green-text)">${ico("grid")}</span><div><div class="n">6</div><div class="l">Targetable sectors</div></div></div>
    </div>
    <h2 style="font-size:21px;margin:26px 0 4px">Ad formats, as they render</h2>
    <p class="muted" style="margin:0 0 14px">Live samples of each placement inside the product.</p>
    <div class="muted" style="font-weight:600;margin-bottom:8px">1 · Leaderboard banner: top of directory &amp; search</div>${adLeaderHTML(0)}
    <div class="muted" style="font-weight:600;margin:18px 0 8px">2 · Inline sponsored unit: within feeds</div>${adInlineHTML(1)}
    <div class="split" style="margin-top:10px"><div class="main"><div class="muted" style="font-weight:600;margin:8px 0">3 · Sidebar unit: news &amp; funding</div>${adSideHTML(0)}</div><div class="side"><div class="muted" style="font-weight:600;margin:8px 0 16px">4 · Sponsored member listing</div>${mktCardHTML(SEED_MEMBERS.find(m=>m.id==="m08"))}</div></div>
    <h2 style="font-size:21px;margin:30px 0 4px">Placements &amp; indicative pricing</h2>
    <p class="muted" style="margin:0 0 6px">Illustrative demo rates. The final rate card is set with the chamber.</p>
    ${carousel([["Leaderboard banner","Top of Directory & Search","USD 1,200","/ month","mega"],["Inline sponsored unit","Within match & funding feeds","USD 800","/ month","news"],["Sidebar unit","News & Funding right rail","USD 500","/ month","grid"],["Sponsored member listing","Pinned atop relevant matches","USD 350","/ month","star"],["Newsletter placement","The Corridor Weekly, 12k+ inboxes","USD 600","/ issue","mail"],["Sector takeover","Own one pillar for a month","USD 2,500","/ month","trend"]].map(([t,d,p,per,i])=>`<div class="fmt" style="width:244px"><div style="display:flex;gap:8px;align-items:center;font-weight:600;font-size:15px"><span style="color:var(--blue-text);display:inline-flex">${ico(i)}</span>${t}</div><div class="muted" style="margin-top:4px">${d}</div><div class="price">${p}</div><div class="per">${per}</div></div>`).join(""),false,"Pricing")}
    <form class="card" style="margin-top:26px" id="adForm" novalidate>
      <h2 style="font-size:19px;margin:0 0 4px">Book a placement</h2>
      <p class="muted" style="margin:0 0 14px">Tell us what you'd like to run. The chamber's team follows up with the rate card.</p>
      <span class="flabel">${ico("mega")}Format</span>
      <div class="roles" id="adv_fmt" style="margin:6px 0 16px">${["Leaderboard banner","Inline unit","Sidebar unit","Sponsored listing","Newsletter","Sector takeover"].map(t=>`<button type="button" class="role" data-f="${t}" aria-pressed="${t===fmt}">${t}</button>`).join("")}</div>
      <div class="form-grid">
        <div class="field"><label for="adv_co">${ico("building")}Company <span class="req">*</span></label><input id="adv_co" value="${state.USER?esc(state.USER.name):""}"><div class="err-msg">Enter your company name</div></div>
        <div class="field"><label for="adv_email">${ico("mail")}Email <span class="req">*</span></label><input id="adv_email" type="email" value="${state.USER?esc(state.USER.email||""):""}"><div class="err-msg">Enter a valid email</div></div>
        <div class="field"><label for="adv_budget">${ico("coins")}Monthly budget</label><input id="adv_budget" placeholder="e.g. USD 1,500"></div>
        <div class="field"><label for="adv_sector">${ico("grid")}Target sector</label><select id="adv_sector"><option value="">Any</option>${PILLARS.map(p=>`<option>${p}</option>`).join("")}</select></div>
      </div>
      <div class="field full" style="margin-top:14px"><label for="adv_msg">${ico("file")}Message</label><textarea id="adv_msg" maxlength="500" placeholder="What are you promoting?"></textarea></div>
      <button class="btn btn-primary btn-block" type="submit" style="margin-top:16px">${ico("send")} Request this placement</button>
    </form>
  </div></section>`;
  $("#adv_fmt").onclick=e=>{const b=e.target.closest(".role");if(!b)return;fmt=b.dataset.f;$$("#adv_fmt .role").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));};
  $("#adForm").onsubmit=async e=>{
    e.preventDefault();
    if(![reqField("adv_co"),reqField("adv_email",isEmail)].every(Boolean)){toast("Check the form","Company and a valid email are required.",false);return;}
    await record("ad",{format:fmt,company:$("#adv_co").value.trim(),email:$("#adv_email").value.trim(),budget:$("#adv_budget").value.trim(),sector:$("#adv_sector").value||"Any",message:$("#adv_msg").value.trim()});
    toast("Placement requested","The ad team will be in touch with the rate card.");
    $("#adv_msg").value="";$("#adv_budget").value="";
  };
}

/* ================= CONTACT ================= */
