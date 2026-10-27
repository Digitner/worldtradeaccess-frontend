/* eslint-disable */
import { adSideHTML } from '../../../components/Ads/Ads.js';
import { ccChip } from '../../../components/Chips/Chips.js';
import { toast } from '../../../components/Toasts/toast.js';
import { DEAL_STAGES } from '../../../constant/forms.js';
import { PILLARS, PILLAR_IMG } from '../../../constant/pillars.js';
import { reqField } from '../../../utils/forms.js';
import { $, $$, esc, ico, img, imgTag } from '../../../utils/helpers.js';
import { go } from '../../../utils/router.js';
import { state } from '../../../utils/state.js';
import { allFunding, myDealStage, myId, publishFunding, record, shared } from '../../../utils/store.js';

export function viewFunding(app,_a,soft){
  if(soft&&$("#fund_list")){paintFund();return;}
  let ftype="Seeking Investment";
  app.innerHTML=`
  <section><div class="wrap">
    <span class="kicker">Capital &amp; deals</span>
    <h1 class="page-h">Funding &amp; JV marketplace.</h1>
    <p class="page-sub">Members raising capital, seeking JV partners, or listing a business for sale. Express interest, or list your own.</p>
    <div class="split" style="margin-top:18px">
      <div class="main" id="fund_list"></div>
      <div class="side">
        <form class="card" id="fundForm" novalidate>
          <h2 style="font-size:18px;margin:0 0 4px">List your business</h2>
          <p class="muted" style="margin:0 0 14px">Publish a capital, JV or sale opportunity to the network.</p>
          <span class="flabel">${ico("filter")}Listing type</span>
          <div class="roles" id="ftypes" style="margin:6px 0 14px">${[["Seeking Investment","wallet"],["Seeking JV","handshake"],["For Sale","briefcase"]].map(([t,i])=>`<button type="button" class="role" data-t="${t}" aria-pressed="${t===ftype}">${ico(i)}${t}</button>`).join("")}</div>
          <div class="field" style="margin-bottom:12px"><label for="ff_company">${ico("building")}Company <span class="req">*</span></label><input id="ff_company" value="${state.USER?esc(state.USER.name):""}"><div class="err-msg">Enter the company name</div></div>
          <div class="form-grid">
            <div class="field"><label for="ff_amount">${ico("coins")}Amount</label><input id="ff_amount" placeholder="USD 5M"></div>
            <div class="field"><label for="ff_sector">${ico("grid")}Sector</label><select id="ff_sector">${PILLARS.map(p=>`<option ${state.USER&&state.USER.pillar===p?"selected":""}>${p}</option>`).join("")}</select></div>
          </div>
          <div class="field full" style="margin-top:12px"><label for="ff_desc">${ico("file")}Description <span class="req">*</span></label><textarea id="ff_desc" maxlength="400" placeholder="What you're offering and why…">${state.USER&&state.USER.seek?esc(state.USER.seek):""}</textarea><div class="err-msg">Describe the opportunity</div></div>
          <button class="btn btn-primary btn-block" type="submit" style="margin-top:14px">${ico("rocket")} Publish listing</button>
        </form>
        ${adSideHTML(0)}
      </div>
    </div>
  </div></section>`;
  $("#ftypes").onclick=e=>{const b=e.target.closest(".role");if(!b)return;ftype=b.dataset.t;$$("#ftypes .role").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));};
  paintFund();
  $("#fundForm").onsubmit=async e=>{
    e.preventDefault();
    if(![reqField("ff_company"),reqField("ff_desc")].every(Boolean)){toast("Check the form","Company and description are required.",false);return;}
    const item={id:"f"+Date.now(),by:myId(),company:$("#ff_company").value.trim(),country:state.USER?state.USER.country:"India",type:ftype,amount:$("#ff_amount").value.trim()||"Undisclosed",sector:$("#ff_sector").value,desc:$("#ff_desc").value.trim(),img:PILLAR_IMG[$("#ff_sector").value]};
    if(await publishFunding(item)){
      await record("funding",{company:item.company,type:item.type,amount:item.amount,sector:item.sector,description:item.desc});
      toast("Listing published","It's live in the marketplace.");
      if(!shared())viewFunding(app);
    }
  };
}

export function paintFund(){
  const el=$("#fund_list");if(!el)return;
  el.innerHTML=allFunding().map(f=>{const cls=f.type==="For Sale"?"gold":f.type==="Seeking JV"?"":"green";const st=myDealStage(f.id);
    return `<article class="fund-item"><div class="ph">${imgTag(img(f.img)||img(PILLAR_IMG[f.sector]),"")}</div><div class="b"><div class="top"><div><h3 class="serif" style="font-weight:600;font-size:18px;margin:0">${esc(f.company)} ${f.mine?'<span class="tag green">You</span>':""}</h3><div class="muted" style="margin-top:3px;display:flex;gap:6px;align-items:center">${ccChip(f.country)} ${esc(f.country)} · ${esc(f.sector)}</div></div><div style="text-align:right"><span class="tag ${cls}">${esc(f.type)}</span><div class="amt" style="margin-top:6px">${esc(f.amount)}</div></div></div><p style="margin:10px 0 0;color:var(--text-soft);font-size:14px;line-height:1.55">${esc(f.desc)}</p><div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn btn-sm btn-primary" onclick="go('#/deal/${esc(f.id)}')">${ico("eye")} View opportunity</button>${st>=0?`<span class="tag green">${esc(DEAL_STAGES[st])}</span>`:""}</div></div></article>`;}).join("");
}

/* ================= NEWS ================= */
