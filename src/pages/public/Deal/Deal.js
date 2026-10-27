/* eslint-disable */
import { ccChip, pIco } from '../../../components/Chips/Chips.js';
import { toast } from '../../../components/Toasts/toast.js';
import { DEAL_STAGES } from '../../../constant/forms.js';
import { PILLAR_IMG } from '../../../constant/pillars.js';
import { esc, ico, img, imgTag, photo } from '../../../utils/helpers.js';
import { go, route } from '../../../utils/router.js';
import { state } from '../../../utils/state.js';
import { allFunding, myDealStage, record, shared } from '../../../utils/store.js';

export async function dealAct(fid,toStage){
  if(!state.USER){toast("Create an account first","Register to express interest in opportunities.",false);go("#/register");return;}
  const f=allFunding().find(x=>x.id===fid);
  await record("deal",{fid,company:f?f.company:"",amount:f?f.amount:"",stage:toStage,stageName:DEAL_STAGES[toStage]});
  if(!shared())route();
  toast(DEAL_STAGES[toStage],"Your deal has moved forward.");
}

export function viewDeal(app,id){
  const f=allFunding().find(x=>x.id===id);
  if(!f){app.innerHTML=`<section><div class="wrap"><div class="empty">This opportunity isn't available. <button class="linkish" onclick="go('#/funding')">Back to funding</button></div></div></section>`;return;}
  const cur=myDealStage(f.id);const last=DEAL_STAGES.length-1;
  const cls=f.type==="For Sale"?"gold":f.type==="Seeking JV"?"":"green";
  const roomOpen=cur>=1;
  const action=cur<0?`<button class="btn btn-primary btn-block" onclick="dealAct('${esc(f.id)}',0)">${ico("star")} Express interest</button>`
    :cur>=last?`<div class="card" style="text-align:center;background:var(--green-soft)"><b>Deal closed</b><div class="muted">This opportunity has completed the pipeline.</div></div>`
    :`<button class="btn btn-primary btn-block" onclick="dealAct('${esc(f.id)}',${cur+1})">Continue to ${esc(DEAL_STAGES[cur+1])} <span class="arrow">→</span></button>`;
  app.innerHTML=`
  <section><div class="wrap narrow">
    <button class="backlink" onclick="go('#/funding')">${ico("back")} Back to funding</button>
    <div class="card" style="padding:0;overflow:hidden">
      <div class="media-hero" style="border-radius:0;margin:0;height:220px">${imgTag(img(f.img)||img(PILLAR_IMG[f.sector]),f.company)}<div class="cap">${ccChip(f.country,"on-photo")} ${esc(f.country)}</div></div>
      <div style="padding:20px">
        <div class="top"><div><h1 style="font-size:27px;margin:0">${esc(f.company)}</h1><div class="muted" style="margin-top:4px">${pIco(f.sector)} ${esc(f.sector)}</div></div><div style="text-align:right"><span class="tag ${cls}">${esc(f.type)}</span><div class="amt" style="font-size:24px;margin-top:6px">${esc(f.amount)}</div></div></div>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:var(--text-soft)">${esc(f.desc)}</p>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2 style="font-size:18px;margin:0 0 4px">Deal pipeline</h2>
      <p class="muted" style="margin:0 0 10px">The chamber facilitates each stage after you express interest.</p>
      <ol class="stepper">${DEAL_STAGES.map((st,i)=>{const done=i<cur||(cur===last);const act=i===cur&&cur!==last;return `<li class="stp ${done?"done":act?"active":""}"><div class="dot">${done?ico("check"):i+1}</div><div class="lbl">${st}</div></li>`;}).join("")}</ol>
      <div style="margin-top:14px">${action}</div>
      ${cur>=0&&cur<last?`<p class="muted" style="margin:10px 0 0;text-align:center">Current stage: <b style="color:var(--text)">${esc(DEAL_STAGES[cur])}</b></p>`:""}
    </div>
    <div class="card" style="margin-top:16px">
      <div class="top" style="align-items:center"><h2 style="font-size:18px;margin:0">Data room</h2>${roomOpen?`<span class="tag green">${ico("unlock")}Access granted</span>`:`<span class="lock-pill">${ico("lock")}Unlocks at Data room stage</span>`}</div>
      <div style="margin-top:8px">${["Investment teaser","Financials & projections","Cap table","Legal & compliance"].map(t=>`<div class="doc-row"><span class="di">${ico("file")}</span><div style="flex:1"><b style="font-size:14px">${t}</b><div class="muted">${roomOpen?"PDF · available":"Request access to unlock"}</div></div>${roomOpen?`<button class="btn btn-sm" onclick="toast('Demo document','In production this opens the ${t}.')">${ico("eye")} Open</button>`:`<span class="lock-pill">${ico("lock")}</span>`}</div>`).join("")}</div>
      ${!roomOpen&&cur>=0?`<button class="btn btn-block" style="margin-top:12px" onclick="dealAct('${esc(f.id)}',1)">${ico("unlock")} Request data-room access</button>`:""}
    </div>
  </div></section>`;
}

/* ================= FUNDING ================= */
