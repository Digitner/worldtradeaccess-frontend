/* eslint-disable */
/* My activity (browser only). Pages opened and clicks are kept in this browser (utils/activity.js);
   "recently viewed", introductions and deals come from the existing member APIs. */
import { NOTICE_VERSION, consentOf, consentState, currentUser, interests, myActivity, pageTitle, pullActivity, userCompany } from '../../utils/activity.js';
import { esc, fmtDate, fmtShort, ico } from '../../utils/helpers.js';
import { pageHead } from '../../components/Page/Page.js';
import { route } from '../../utils/router.js';
import useServices from '../Dashboard/hooks/useServices.js';

const _svc = useServices();
let ACT_FILTER="all";
export function barList(rows){const max=Math.max(1,...rows.map(r=>r[1]));return rows.length?`<div class="barl">${rows.map(([l,n])=>`<div class="barr" title="${esc(l)}: ${n}"><span class="bl">${esc(l)}</span><span class="bt"><i style="--w:${(n/max*100).toFixed(1)}%"></i></span><span class="bn">${n}</span></div>`).join("")}</div>`:`<p class="muted" style="margin:0">Nothing recorded yet.</p>`;}
export function countBy(list,fn){const m=new Map();list.forEach(e=>{const k=fn(e);if(k)m.set(k,(m.get(k)||0)+1);});return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,7);}
export function downloadActivity(){const rows=[["Time","Type","What","Page"],...myActivity().map(e=>[new Date(e.at).toISOString(),e.type,e.label,pageTitle(e.page)])];const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="my-worldtradeaccess-activity.csv";a.setAttribute("data-no-track","");document.body.appendChild(a);a.click();a.remove();}
let ACT_PAGE=1;const ACT_SIZE=15;
export function pagerHTML(page,pages,total,size,fn){
  if(pages<=1)return `<div class="pager"><span>${total} item${total===1?"":"s"}</span></div>`;
  const nums=[];for(let i=1;i<=pages;i++){if(i===1||i===pages||Math.abs(i-page)<=1)nums.push(i);else if(nums[nums.length-1]!=="…")nums.push("…");}
  return `<nav class="pager" data-no-track aria-label="Pages"><span>Showing ${(page-1)*size+1}-${Math.min(page*size,total)} of ${total}</span><span class="pg"><button class="pgb" ${page<=1?"disabled":""} onclick="${fn}(${page-1})" aria-label="Previous page">&larr;</button>${nums.map(n=>n==="…"?`<span class="gap">…</span>`:`<button class="pgb" ${n===page?'aria-current="page"':""} onclick="${fn}(${n})">${n}</button>`).join("")}<button class="pgb" ${page>=pages?"disabled":""} onclick="${fn}(${page+1})" aria-label="Next page">&rarr;</button></span></nav>`;
}
function actCardHTML(){
  const act=myActivity(),pages=act.filter(e=>e.type==="Page"),clicks=act.filter(e=>e.type==="Link"||e.type==="Button");
  const list=ACT_FILTER==="pages"?pages:ACT_FILTER==="clicks"?clicks:act;
  const np=Math.max(1,Math.ceil(list.length/ACT_SIZE));if(ACT_PAGE>np)ACT_PAGE=np;if(ACT_PAGE<1)ACT_PAGE=1;
  const rows=list.slice((ACT_PAGE-1)*ACT_SIZE,ACT_PAGE*ACT_SIZE);
  return `<div class="dh"><h2>Recent activity</h2><div class="roles" data-no-track>${[["all","All",act.length],["pages","Pages",pages.length],["clicks","Clicks",clicks.length]].map(([k,l,n])=>`<button class="fbtn" aria-pressed="${ACT_FILTER===k}" onclick="setActFilter('${k}')">${l}<span class="n">${n}</span></button>`).join("")}</div></div>
      <div class="atbl-wrap" style="border:none"><table class="atbl" style="min-width:0"><thead><tr><th>When</th><th>What</th><th>Page</th></tr></thead><tbody>${rows.map(e=>`<tr style="cursor:default"><td class="when">${fmtDate(e.at)}</td><td>${esc(e.label||e.type)}</td><td>${esc(pageTitle(e.page))}</td></tr>`).join("")||`<tr><td colspan="3" class="muted">Nothing here yet.</td></tr>`}</tbody></table></div>
      ${pagerHTML(ACT_PAGE,np,list.length,ACT_SIZE,"setActPage")}`;
}
function paintActCard(){const c=document.getElementById("act_card");if(c)c.innerHTML=actCardHTML();}
export function setActFilter(k){ACT_FILTER=k;ACT_PAGE=1;paintActCard();}
export function setActPage(n){ACT_PAGE=n;paintActCard();const c=document.getElementById("act_card");if(c)c.scrollIntoView({block:"nearest",behavior:"smooth"});}
export async function viewActivity(app){
  app.innerHTML=`<section><div class="wrap"><div class="loading-shimmer" style="height:260px;border-radius:12px;margin-top:24px"></div></div></section>`;
  const [intros,deals,viewed]=await Promise.all([_svc.getMyIntros(),_svc.getMyDeals(),_svc.getRecentlyViewed(),pullActivity(true)]);
  const USER=currentUser()||{};
  const cs=consentState(USER),act=myActivity(),pages=act.filter(e=>e.type==="Page"),clicks=act.filter(e=>e.type==="Link"||e.type==="Button");
  const days=[];const now=new Date();now.setHours(0,0,0,0);for(let i=13;i>=0;i--){const d=new Date(now.getTime()-i*864e5);days.push({d,n:act.filter(e=>{const x=new Date(e.at);x.setHours(0,0,0,0);return x.getTime()===d.getTime();}).length});}
  const maxD=Math.max(1,...days.map(d=>d.n));const active=new Set(act.map(e=>new Date(e.at).toDateString())).size;
  const INT=interests();ACT_PAGE=1;
  app.innerHTML=`${pageHead(esc(userCompany(USER)),"My activity.","What you have done on WorldTradeAccess. It is saved with your account and used to improve the matches we suggest for you.")}
  <section><div class="wrap">
    <div class="act-state ${cs==="granted"?"on":""}" data-no-track><span class="pstate ${cs==="granted"?"on":""}"><i></i>${cs==="granted"?`Click tracking is on, since ${fmtShort(consentOf(USER).at)}`:"Click tracking is off"}</span>
      <span class="act-btns">${cs==="granted"?`<button class="btn btn-sm" onclick="dashConsent('withdrawn')">Stop tracking</button>`:`<button class="btn btn-sm btn-primary" onclick="dashConsent('granted')">Agree to click tracking</button>`}${act.length?`<button class="btn btn-sm" onclick="downloadActivity()">Download</button><button class="btn btn-sm" onclick="deleteMyActivity()">Delete my activity</button>`:""}<a class="linkish" href="#/privacy">Read the notice</a></span></div>
    <div class="kpi-row">
      ${[["eye","Pages opened",pages.length],["compass","Clicks",clicks.length],["bell","Active days",active],["sparkle","Companies viewed",viewed.length],["handshake","Introductions sent",intros.length],["briefcase","Active deals",deals.length]].map(([i,l,n])=>`<div class="kpi"><span class="ki">${ico(i)}</span><div><div class="n">${n}</div><div class="l">${l}</div></div></div>`).join("")}
    </div>
    ${act.length?`
    <div class="card" style="margin-bottom:16px"><h2 class="dt">Activity over the last 14 days</h2>
      <div class="cols" role="img" aria-label="Actions per day for the last 14 days. ${days.map(d=>`${d.d.getDate()}/${d.d.getMonth()+1}: ${d.n}`).join(", ")}">${days.map(d=>`<div class="col" data-tip="${fmtShort(d.d.getTime())}: ${d.n} action${d.n===1?"":"s"}"><span class="colv">${d.n||""}</span><i style="--h:${(d.n/maxD*100).toFixed(1)}%"></i><small>${d.d.getDate()}</small></div>`).join("")}</div></div>
    <div class="two" style="gap:16px;margin-bottom:16px">
      <div class="card"><h2 class="dt">Pages you open most</h2>${barList(countBy(pages,e=>pageTitle(e.page)))}</div>
      <div class="card"><h2 class="dt">What you click most</h2>${barList(countBy(clicks,e=>e.label))}</div>
    </div>
    <div class="card" style="margin-bottom:16px"><div class="dh"><h2>What we think you are interested in</h2><button class="linkish" onclick="go('#/dashboard')">See your matches</button></div>${INT.total?`<div class="two" style="gap:16px"><div><h3 class="dt" style="font-size:16px">Sectors</h3>${barList(INT.sectors.slice(0,5))}</div><div><h3 class="dt" style="font-size:16px">Countries</h3>${barList(INT.countries.slice(0,5))}</div></div>`:`<p class="muted" style="margin:0">Open a few member pages and your favourite sectors and countries will show here. They are used to rank your best matches.</p>`}</div>
    ${viewed.length?`<div class="card" style="margin-bottom:16px"><div class="dh"><h2>Companies you recently viewed</h2><button class="linkish" onclick="go('#/directory')">Browse directory</button></div>${viewed.slice(0,8).map(m=>`<button class="list-row" style="width:100%;background:none;border:none;cursor:pointer;text-align:left;color:var(--text)" onclick="go('#/member/${esc(m._id||m.id)}')"><span class="ic">${ico("eye")}</span><div style="flex:1;min-width:0"><b>${esc(m.company_name||m.name)}</b><div class="muted">${esc(m.country_name||m.country||"")} · ${esc(m.sector||"")}</div></div></button>`).join("")}</div>`:""}
    <div class="card" id="act_card">${actCardHTML()}</div>
`:`<div class="empty">${cs==="granted"?"Nothing recorded yet. Your activity will appear here as you use the site.":"Agree to click tracking to see the pages you open and what you click here. The companies you view, your introductions and your deals are counted above either way."}</div>`}
  </div></section>`;
}

