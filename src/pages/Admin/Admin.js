/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import { FORM_KINDS } from '../../constant/forms.js';
import { $, $$, esc, fmtDate, ico } from '../../utils/helpers.js';
import { curBase, route } from '../../utils/router.js';
import { STORE, state } from '../../utils/state.js';
import { forms, record, shared } from '../../utils/store.js';

export async function loadAdmin(){
  if(!shared()||!STORE.canAdmin||state.ADMIN.loading)return;
  state.ADMIN.loading=true;
  try{
    const subs=await STORE.db.collection("subs").get();
    const all=[];
    await Promise.all(subs.docs.map(async d=>{
      try{const fs=await STORE.db.collection(`subs/${d.id}/forms`).orderBy("at","desc").limit(500).get();fs.docs.forEach(x=>all.push({id:x.id,uid:d.id,...x.data()}));}catch(e){}
    }));
    all.sort((a,b)=>(b.at||0)-(a.at||0));
    state.ADMIN.rows=all;state.ADMIN.loaded=true;state.ADMIN.err="";
    const real=[...new Set(all.map(r=>r.uid).filter(u=>!String(u).startsWith("sample-")))];
    if(real.length&&STORE.user){try{const ps=await STORE.user.profiles(real);real.forEach(u=>{state.ADMIN.names[u]=(ps[u]&&ps[u].name)||"";});}catch(e){}}
  }catch(e){state.ADMIN.err="The shared record couldn't be read. Try Refresh in a moment.";}
  state.ADMIN.loading=false;
  if(curBase()==="admin")paintAdmin();
}

export function adminRows(){
  if(shared()&&STORE.canAdmin)return state.ADMIN.rows;
  return state.LOCAL_FORMS.map(r=>({...r,uid:"this-device"}));
}

export function summarize(r){const d=r.data||{};const pick={register:["company","country","goal","seeking"],login:["email","company"],edit:["company","goal","seeking"],search:["goal","intent","engine"],intro:["toName","message"],funding:["company","type","amount"],deal:["company","stageName","amount"],ad:["format","company","budget"],alerts:["email","topics"],newsletter:["email"],contact:["subject","message"]}[r.kind]||Object.keys(d).slice(0,3);return pick.map(k=>d[k]).filter(Boolean).map(v=>String(v)).join(" · ").slice(0,160);}

export function viewAdmin(app){
  if(!STORE.checked){app.innerHTML=`<section><div class="wrap narrow"><div class="thinking" role="status"><div class="radar"><svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Checking your access…</b></div></div></div></section>`;return;}
  if(shared()&&!STORE.canAdmin){
    app.innerHTML=`<section><div class="wrap narrow"><span class="kicker">Admin console</span><h1 class="page-h">Chamber admins only.</h1><div class="card" style="display:flex;gap:14px;align-items:flex-start"><span style="font-size:22px;color:var(--gold-text);display:inline-flex">${ico("lock")}</span><div><b>Submissions are visible to chamber staff with edit access to this page.</b><p class="muted" style="margin:6px 0 0">If you manage this platform, ask the page owner to share it with you with edit access, then reload.</p></div></div></div></section>`;return;
  }
  if(!shared()&&!state.ADMIN.pw){
    app.innerHTML=`<section><div class="wrap narrow"><span class="kicker">Admin console</span><h1 class="page-h">Chamber admin.</h1><p class="page-sub">The shared record isn't available in this view, so the console shows submissions made on this device only.</p><form class="card" style="margin-top:20px" id="admForm" novalidate><div class="field"><label for="adm_pass">${ico("lock")}Admin password <span class="req">*</span></label><input id="adm_pass" type="password" placeholder="••••••"><div class="err-msg" id="adm_err">That password isn't right. The demo password is “admin”.</div><div class="hint">Demo password: <b>admin</b></div></div><button class="btn btn-primary btn-block" type="submit" style="margin-top:16px">${ico("shield")} Enter console</button></form></div></section>`;
    $("#admForm").onsubmit=e=>{e.preventDefault();if($("#adm_pass").value.trim()!=="admin"){$("#adm_pass").classList.add("err");$("#adm_err").classList.add("show");return;}state.ADMIN.pw=true;route();};
    return;
  }
  app.innerHTML=`
  <section><div class="wrap">
    <div class="top">
      <div><span class="kicker">Admin console</span><h1 class="page-h" style="margin-bottom:2px">Form submissions.</h1><p class="muted">Every form on the site, from every visitor, newest first. Select a row to see all fields.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" onclick="state.ADMIN.loaded=false;loadAdmin();paintAdmin()">${ico("refresh")} Refresh</button>${STORE.downloads?`<button class="btn btn-sm btn-primary" onclick="exportCSV()">${ico("download")} Export CSV</button>`:""}</div>
    </div>
    <div class="admin-banner">${shared()?`<span class="live-dot"></span><span><b style="color:var(--text)">Live shared record.</b> New submissions appear automatically. Rows marked Sample are demonstration data.</span>`:`<span style="color:var(--gold-text);display:inline-flex">${ico("lock")}</span><span>Showing submissions made on this device only.</span>`}</div>
    <div id="adm_body"></div>
  </div></section>`;
  if(shared()&&!state.ADMIN.loaded)loadAdmin();
  paintAdmin();
}

export function paintAdmin(){
  const body=$("#adm_body");if(!body)return;
  if(shared()&&!state.ADMIN.loaded){body.innerHTML=`<div class="thinking" style="margin-top:16px" role="status"><div class="radar"><svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading submissions…</b>${state.ADMIN.err?`<div class="muted">${esc(state.ADMIN.err)}</div>`:""}</div></div>`;return;}
  const rows=adminRows();
  const counts={};rows.forEach(r=>counts[r.kind]=(counts[r.kind]||0)+1);
  const people=new Set(rows.map(r=>(r.who&&r.who.email)||r.uid)).size;
  const q=state.ADMIN.q.trim().toLowerCase();
  let list=state.ADMIN.tab==="all"?rows:rows.filter(r=>r.kind===state.ADMIN.tab);
  if(q)list=list.filter(r=>JSON.stringify([r.who,r.data,FORM_KINDS[r.kind]&&FORM_KINDS[r.kind].label]).toLowerCase().includes(q));
  const sel=state.ADMIN.sel&&rows.find(r=>r.id===state.ADMIN.sel&&r.uid===state.ADMIN.selU);
  const kinds=Object.keys(FORM_KINDS);
  body.innerHTML=`
    <div class="astat">
      <button class="kpi" aria-pressed="${state.ADMIN.tab==="all"}" onclick="admTab('all')"><span class="ki">${ico("inbox")}</span><div><div class="n">${rows.length}</div><div class="l">All submissions</div></div></button>
      <div class="kpi"><span class="ki" style="background:var(--gold-soft);color:var(--gold-text)">${ico("users")}</span><div><div class="n">${people}</div><div class="l">Distinct submitters</div></div></div>
      <button class="kpi" aria-pressed="${state.ADMIN.tab==="register"}" onclick="admTab('register')"><span class="ki" style="background:var(--green-soft);color:var(--green-text)">${ico("user")}</span><div><div class="n">${counts.register||0}</div><div class="l">Registrations</div></div></button>
      <button class="kpi" aria-pressed="${state.ADMIN.tab==="intro"}" onclick="admTab('intro')"><span class="ki">${ico("handshake")}</span><div><div class="n">${counts.intro||0}</div><div class="l">Introduction requests</div></div></button>
      <button class="kpi" aria-pressed="${state.ADMIN.tab==="search"}" onclick="admTab('search')"><span class="ki">${ico("sparkle")}</span><div><div class="n">${counts.search||0}</div><div class="l">AI match searches</div></div></button>
    </div>
    <div class="toolbar">
      <div class="search"><span class="si">${ico("search")}</span><label class="vh" for="adm_q">Search submissions</label><input id="adm_q" placeholder="Search names, emails, companies, messages…" value="${esc(state.ADMIN.q)}"></div>
    </div>
    <div class="toolbar" style="margin-top:0">${[["all","All",rows.length,"inbox"],...kinds.map(k=>[k,FORM_KINDS[k].label,counts[k]||0,FORM_KINDS[k].ic])].map(([k,l,n,i])=>`<button class="fbtn" aria-pressed="${state.ADMIN.tab===k}" onclick="admTab('${k}')">${ico(i)}${l}<span class="n">${n}</span></button>`).join("")}</div>
    <div class="split">
      <div class="main">
        <div class="atbl-wrap">${list.length?`<table class="atbl"><thead><tr><th>When</th><th>Form</th><th>From</th><th>Details</th><th>Account</th></tr></thead><tbody>${list.slice(0,400).map(r=>{const k=FORM_KINDS[r.kind]||{label:r.kind,ic:"file"};const sample=String(r.uid).startsWith("sample-");const acct=sample?'<span class="tag plain">Sample</span>':r.uid==="this-device"?'<span class="tag plain">This device</span>':esc(state.ADMIN.names[r.uid]||"Signed-in viewer");return `<tr tabindex="0" aria-selected="${sel===r}" data-id="${esc(r.id)}" data-u="${esc(r.uid)}"><td class="when">${esc(fmtDate(r.at))}</td><td><span class="tag" style="white-space:nowrap">${ico(k.ic)}${esc(k.label)}</span></td><td><b>${esc((r.who&&r.who.name)||"—")}</b><div class="muted">${esc([(r.who&&r.who.company),(r.who&&r.who.email)].filter(Boolean).join(" · "))}</div></td><td class="sum">${esc(summarize(r))}</td><td>${acct}</td></tr>`;}).join("")}</tbody></table>`:`<div class="empty-c">${ico("inbox")} ${rows.length?"No submissions match this filter.":"No submissions yet. They appear here as visitors register, search, request introductions or send forms."}</div>`}</div>
      </div>
      <div class="side">${sel?adminDetail(sel):`<div class="drawer"><div class="muted" style="display:flex;gap:8px;align-items:center">${ico("eye")} Select a submission to see every field.</div></div>`}</div>
    </div>`;
  const qi=$("#adm_q");qi.oninput=e=>{state.ADMIN.q=e.target.value;const pos=e.target.selectionStart;paintAdmin();const n=$("#adm_q");n.focus();n.setSelectionRange(pos,pos);};
  $$(".atbl tbody tr").forEach(tr=>{const pick=()=>{state.ADMIN.sel=tr.dataset.id;state.ADMIN.selU=tr.dataset.u;paintAdmin();};tr.onclick=pick;tr.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick();}};});
}

export function adminDetail(r){
  const k=FORM_KINDS[r.kind]||{label:r.kind,ic:"file"};const d=r.data||{};
  const label=s=>s.replace(/_/g," ").replace(/([a-z])([A-Z])/g,"$1 $2");
  return `<div class="drawer"><div class="top" style="align-items:center"><span class="tag">${ico(k.ic)}${esc(k.label)}</span><button class="icon-btn" style="width:34px;height:34px" onclick="state.ADMIN.sel=null;paintAdmin()" aria-label="Close details">${ico("x")}</button></div>
    <h3 style="margin:12px 0 2px;font-size:19px">${esc((r.who&&r.who.name)||"Unnamed visitor")}</h3>
    <div class="muted">${esc(fmtDate(r.at))}</div>
    <dl class="kv">
      ${r.who&&r.who.company?`<dt>Company</dt><dd>${esc(r.who.company)}</dd>`:""}
      ${r.who&&r.who.email?`<dt>Email</dt><dd style="user-select:all">${esc(r.who.email)}</dd>`:""}
      ${Object.entries(d).filter(([kk])=>kk!=="fid"&&kk!=="to"&&kk!=="stage").map(([kk,v])=>`<dt>${esc(label(kk))}</dt><dd>${esc(typeof v==="object"?JSON.stringify(v):String(v))}</dd>`).join("")}
      <dt>Account</dt><dd>${String(r.uid).startsWith("sample-")?"Sample data":r.uid==="this-device"?"This device":esc(state.ADMIN.names[r.uid]||"Signed-in viewer")}</dd>
    </dl></div>`;
}

export function admTab(k){state.ADMIN.tab=k;state.ADMIN.sel=null;paintAdmin();}

export async function exportCSV(){
  const rows=adminRows();const keys=new Set();rows.forEach(r=>Object.keys(r.data||{}).forEach(k=>keys.add(k)));
  const cols=["submitted_at","form","name","company","email","account",...keys];
  const cell=v=>{const s=v==null?"":String(typeof v==="object"?JSON.stringify(v):v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
  const lines=[cols.join(",")].concat(rows.map(r=>[new Date(r.at).toISOString(),(FORM_KINDS[r.kind]||{}).label||r.kind,r.who&&r.who.name,r.who&&r.who.company,r.who&&r.who.email,String(r.uid).startsWith("sample-")?"Sample":(state.ADMIN.names[r.uid]||r.uid),...[...keys].map(k=>(r.data||{})[k])].map(cell).join(",")));
  try{const blob=new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`worldtradeaccess-submissions-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  catch(e){toast("Export didn't start","The download couldn't be created.",false);}
}


/* inline handlers in the markup call these by name */
