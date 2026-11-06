/* eslint-disable */
import { FILM_CH, AUD, FOR_T } from '../../constant/content.js';
import { POSTER } from '../../constant/images.js';
import { esc, ico, img, imgTag } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

/* Shared fragments for the static pages and the home explorer. */
export function bgVideo(){return `<video data-bg muted loop playsinline preload="auto" poster="${POSTER.hero}" aria-hidden="true"></video>`;}

export function pageHead(k,h,s){return `<section><div class="wrap"><span class="kicker">${k}</span><h1 class="page-h">${h}</h1><p class="page-sub">${s}</p></div></section>`;}

export function closerHTML(){return `<div class="cv">${bgVideo()}<div class="wrap"><h2 class="rvh">List what you seek. Let the right partners find you.</h2><p>Start with a free listing. It takes one short statement.</p><div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center"><button class="btn" onclick="go('#/register')">Create your listing</button><button class="btn ghost" onclick="go('#/contact')">Contact the chamber</button></div></div></div>`;}

export function forTabs(cur){return `<div class="tabs" id="audTabs">${AUD.map(a=>`<a href="#/for/${a.k}" class="${a.k===cur?"cur":""}" ${a.k===cur?'aria-current="page"':""}>${FOR_T[a.k]}</a>`).join("")}<span class="tab-ind" id="tabInd"></span></div>`;}

export function audPanel(i){const a=AUD[i];return `<div class="panel" role="tabpanel"><div><h3>${a.h}</h3><p>${a.p}</p><ul>${a.b.map(x=>`<li>${x}</li>`).join("")}</ul><button class="btn btn-primary linebtn" onclick="quickSearch('${a.q}','${a.k}')">${a.c}</button></div><div class="figimg">${imgTag(img(a.img),"")}</div></div>`;}

export function faqToggle(b){const i=b.parentElement,o=i.classList.toggle("open");b.setAttribute("aria-expanded",String(o));}

export function scrollFilm(){const f=document.querySelector("#film");if(f)f.scrollIntoView({behavior:"smooth",block:"start"});}

export function filmHTML(){const R=["Interest sent","Data room","Intro call","Due diligence","Term sheet","Closed"];
return `<div class="film-g"><div><div class="player" id="player" role="img" aria-label="Animated explainer of how WorldTradeAccess works. The text beside it describes each part."><div class="st-stage" id="stStage">
  <div class="st-s" data-s="s1"><canvas id="stGlobe" style="position:absolute;left:0;top:0"></canvas><div class="st-a-w" style="position:absolute;left:72px;top:248px;width:560px"><div class="st-h st-a">More than twenty economies.</div><div class="st-h st-b" style="color:#E2BE73;margin-top:10px">One trade corridor.</div></div></div>
  <div class="st-s lt" data-s="s2"><div class="st-top"><div class="st-l">Step 1</div><div class="st-h m">Say what you seek, in 25 words</div></div><div class="st-text"></div><div class="st-ticks">${"<i></i>".repeat(25)}</div><div class="st-count"></div></div>
  <div class="st-s gr" data-s="s3"><div class="st-top"><div class="st-l">Step 2</div><div class="st-h m">See who fits, and why</div></div><div style="position:absolute;left:72px;right:72px;top:206px">${[["Nusantara Halal Distribution","Indonesia, sourcing. Sources halal-certified spice blends from South Asian manufacturers."],["KL Prime Grocers Group","Malaysia, sourcing. Needs reliable halal suppliers with export documentation."]].map((m,i)=>`<div class="st-m"><b>${i+1}</b><div><strong>${m[0]}</strong><span>${m[1]}</span></div></div>`).join("")}</div><div style="position:absolute;left:72px;bottom:30px;font:400 19px var(--sans);color:#44576D">Sample listings</div></div>
  <div class="st-s" data-s="s4"><div class="st-top"><div class="st-l" style="color:#E2BE73">Step 3</div><div class="st-h m">Move from first interest to a closed deal</div></div><div class="st-route"><u></u><div class="st-fill"></div><svg class="st-ship" viewBox="0 0 64 26" fill="currentColor" aria-hidden="true"><path d="M2 16h60l-6 9H9z"/><path d="M47 5h8v10h-8z"/><path d="M50 1h3v4h-3z"/><path d="M6 10h8v5H6zM15 10h8v5h-8zM24 10h8v5h-8zM33 10h8v5h-8z" opacity=".82"/><path d="M15 5h8v4h-8zM24 5h8v4h-8zM33 5h8v4h-8z" opacity=".55"/></svg>${R.map((r,i)=>`<div class="st-stop ${i===0?"fs":i===5?"ls":""} ${i%2?"up":""}" style="left:${i*20}%"><em></em><b>${r}</b></div>`).join("")}</div></div>
  <div class="st-s" data-s="s5"><div class="st-photos">${["market","spices","towers","finance","port"].map(p=>`<div class="st-ph" style="background-image:url('${esc(img(p))}')"></div>`).join("")}</div><div class="st-shade"></div><div class="st-for">Built for</div><div class="st-h st-who"></div></div>
  <div class="st-s lt st-end" data-s="s6"><div class="st-h">WorldTradeAccess</div><p>List what you seek. Find who fits.</p><small>BRICS-ASEAN Chamber of Commerce. Sample data shown.</small></div>
  <div class="st-fade"></div></div>
  <button class="st-toggle" id="stToggle" type="button" aria-label="Pause animation"></button></div></div><div><ol class="chap" id="chap">${FILM_CH.map(([t,l],i)=>`<li><button data-t="${t}" class="${i?"":"on"}">${l}</button></li>`).join("")}</ol><details class="transcript"><summary>Read the text</summary><p>More than twenty economies. One trade corridor. Step 1: say what you seek, in 25 words. Step 2: see who fits, and why. Step 3: move from first interest to a closed deal, through interest sent, data room, intro call, due diligence, term sheet and closed. Built for buyers, sellers, investors, funders and JV partners. List what you seek. Find who fits.</p></details></div></div>`;}

export function pillarGo(p){Object.assign(state.DIR,{pillar:p,q:"",country:"all",type:"all"});go("#/directory");}

export function countryGo(c){Object.assign(state.DIR,{pillar:"all",q:"",country:c,type:"all"});go("#/directory");}
