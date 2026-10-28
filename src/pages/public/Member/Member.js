/* eslint-disable */
import { adSideHTML } from '../../../components/Ads/Ads.js';
import { carousel } from '../../../components/Carousel/Carousel.js';
import { ccChip, pIco, typeTag } from '../../../components/Chips/Chips.js';
import { mktCardHTML } from '../../../components/MarketCard/MarketCard.js';
import { toast } from '../../../components/Toasts/toast.js';
import { PILLAR_IMG } from '../../../constant/pillars.js';
import { ROLE_META, TIERS } from '../../../constant/roles.js';
import { reqField } from '../../../utils/forms.js';
import { $, esc, fmtShort, ico, img, imgTag, initialsOf, photo } from '../../../utils/helpers.js';
import { go, route } from '../../../utils/router.js';
import { STORE, state } from '../../../utils/state.js';
import { allMembers, myIntros, record } from '../../../utils/store.js';

export function viewMember(app,id){
  const m=allMembers().find(x=>x.id===id);
  if(!m){app.innerHTML=`<section><div class="wrap"><div class="empty">This member listing isn't available. <button class="linkish" onclick="go('#/directory')">Browse the directory</button></div></div></section>`;return;}
  const already=myIntros().find(i=>i.data&&i.data.to===m.id);
  const draftVal=($("#i_msg")&&$("#i_msg").value)||"";
  const p=photo(m);
  const gal=[m.img||PILLAR_IMG[m.pillar],PILLAR_IMG[m.pillar],m.pillar==="Trade"?"handshake":"port"].filter((v,i,a)=>v&&a.indexOf(v)===i);
  app.innerHTML=`
  <section><div class="wrap"><div class="split">
    <div class="main">
      <button class="backlink" onclick="history.length>1?history.back():go('#/directory')">${ico("back")} Back</button>
      <div class="card">
        <div class="media-hero">${imgTag(p,`${m.name}, ${m.pillar}`)}<button class="play" onclick="openVideo('${esc(m.id)}')" aria-label="Play overview of ${esc(m.name)}"><span class="pb">${ico("play")}</span></button><div class="cap">${ccChip(m.country,"on-photo")} ${esc(m.country)}</div></div>
        <div class="top" style="gap:16px">
          <div style="display:flex;gap:14px;align-items:center;min-width:0"><span class="avatar" style="width:56px;height:56px;border-radius:14px;font-size:20px;cursor:default">${esc(initialsOf(m.name))}</span><div style="min-width:0"><h1 style="font-size:27px;margin:0">${esc(m.name)}</h1><div class="muted" style="margin-top:4px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">${ccChip(m.country)} ${esc(m.country)} · ${pIco(m.pillar)} ${esc(m.pillar)}${m.tier&&TIERS[m.tier]?` · ${TIERS[m.tier].t}`:""}</div></div></div>
          <div style="display:flex;gap:8px;align-items:center">${m.spon?'<span class="spon-badge">Sponsored</span>':""}${typeTag(m.type)}</div>
        </div>
        ${gal.length>1?`<div class="gallery">${gal.map(g=>`<button class="gthumb" onclick="openVideo('${esc(m.id)}','${g}')" aria-label="Open photo">${imgTag(img(g),"")}</button>`).join("")}</div>`:""}
        <div style="margin-top:18px;padding:16px;background:var(--surface-2);border-radius:var(--r-sm);border:1px solid var(--line-soft)">
          <div class="flabel" style="margin-bottom:6px">${ico("search")}What they seek</div>
          <p style="margin:0;font-size:16px;line-height:1.55"><span class="serif" style="color:var(--gold-text);font-size:22px">“</span>${esc(m.seek)}</p>
        </div>
        <div class="form-grid" style="margin-top:18px">
          ${m.person?`<div><div class="muted" style="display:flex;gap:6px;align-items:center">${ico("user")}Contact</div><b>${esc(m.person)}</b>${m.role_t?` · ${esc(m.role_t)}`:""}</div>`:""}
          ${m.site?`<div><div class="muted" style="display:flex;gap:6px;align-items:center">${ico("globe")}Website</div><b>${esc(m.site)}</b></div>`:""}
        </div>
      </div>
    </div>
    <div class="side" style="margin-top:38px">
      ${m.mine?`<div class="card" style="text-align:center"><p class="muted" style="margin:0">This is your own listing. <button class="linkish" onclick="go('#/edit')">Edit it →</button></p></div>`
      :already?`<div class="card" style="display:flex;gap:12px;align-items:flex-start;background:var(--green-soft)"><span style="color:var(--green-text);font-size:20px;display:inline-flex">${ico("check")}</span><div><b>Introduction requested</b><div class="muted">You reached out on ${fmtShort(already.at)}. The chamber will facilitate the connection.</div><button class="linkish" style="margin-top:8px" onclick="go('#/dashboard')">Track it in your dashboard →</button></div></div>`
      :`<form class="card" id="introForm" novalidate>
          <h2 style="font-size:18px;margin:0 0 4px">Request an introduction</h2>
          <p class="muted" style="margin:0 0 14px">The chamber facilitates a warm connection between you and ${esc(m.name)}.</p>
          <div class="field"><label for="i_msg">${ico("mail")}Your message <span class="req">*</span></label><textarea id="i_msg" maxlength="700" rows="6" placeholder="Introduce yourself and what you're proposing…">${esc(draftVal)}</textarea><div class="err-msg">Add a short message</div></div>
          ${STORE.sample?`<button type="button" class="btn btn-sm btn-block" style="margin-top:10px" id="draftAI">${ico("sparkle")} Draft with AI</button>`:""}
          <button class="btn btn-primary btn-block" id="introBtn" type="submit" style="margin-top:10px">${ico("send")} Send introduction request</button>
        </form>`}
      ${adSideHTML(0)}
    </div>
  </div>
  ${(()=>{const sim=allMembers().filter(x=>x.pillar===m.pillar&&x.id!==m.id).slice(0,10);return sim.length?`<div class="section-h" style="margin-top:26px"><h2 style="font-size:21px">Similar members</h2><button class="linkish" onclick="go('#/directory')">Browse all →</button></div>${carousel(sim.map(mktCardHTML).join(""),false,"Similar members")}`:"";})()}
  </div></section>`;
  const f=$("#introForm");
  if(f)f.onsubmit=async e=>{
    e.preventDefault();
    if(!state.USER){toast("Create an account first","Register to request introductions.",false);go("#/register");return;}
    if(!reqField("i_msg"))return;
    await record("intro",{to:m.id,toName:m.name,toCountry:m.country,message:$("#i_msg").value.trim(),fromCompany:state.USER.name});
    toast("Introduction sent",`Your request to ${m.name} is in.`);route();
  };
  const d=$("#draftAI");
  if(d)d.onclick=async()=>{
    d.disabled=true;d.innerHTML=ico("sparkle")+" Drafting…";
    const ta=$("#i_msg");
    try{
      const me=state.USER?`${state.USER.person||"the member"} of ${state.USER.name} (${state.USER.country}), whose goal is "${ROLE_META[state.USER.type]?ROLE_META[state.USER.type].label:""}" and who seeks: "${state.USER.seek||""}"`:"a corridor business";
      const {text}=await STORE.sample(`Write a short, warm, specific introduction request (90-130 words, plain text, no subject line) from ${me} to ${m.person||"the team"} at ${m.name} (${m.country}), who seeks: "${m.seek}". Propose one concrete next step. Sign off with the sender's name.`,{modelTier:"quick",cache:false,onText:({text})=>{ta.value=text;}});
      ta.value=text;
    }catch(e){if(e&&e.text)ta.value=e.text;toast("Draft unavailable","Claude couldn't write a draft just now.",false);}
    d.disabled=false;d.innerHTML=ico("sparkle")+" Draft again with AI";
  };
}

export function openVideo(id,key){
  const m=allMembers().find(x=>x.id===id);const name=m?m.name:"WorldTradeAccess";const src=key?img(key):photo(m);
  const el=document.createElement("div");el.className="vmodal";el.id="vmodal";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label",name+" overview");
  el.innerHTML=`<div class="vbox"><div class="vstage">${imgTag(src,name)}<div class="cap">${esc(m?m.seek:"")}</div></div><div class="vbar"><div><b class="serif">${esc(name)}</b><div class="muted">Corridor overview (demo)</div></div><button class="icon-btn" onclick="closeVideo()" aria-label="Close">${ico("x")}</button></div></div>`;
  el.onclick=e=>{if(e.target===el)closeVideo();};
  document.body.appendChild(el);el.querySelector(".icon-btn").focus();
  el.addEventListener("keydown",e=>{if(e.key==="Escape")closeVideo();});
}

export function closeVideo(){const m=$("#vmodal");if(m)m.remove();}

/* ================= DEAL ================= */
