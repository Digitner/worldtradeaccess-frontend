﻿/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import { FORM_KINDS } from '../../constant/forms.js';
import { $, $$, esc, fmtDate, ico } from '../../utils/helpers.js';
import { curBase, route } from '../../utils/router.js';
import { STORE, state } from '../../utils/state.js';
import LocalStorage from '../../config/LocalStorage.js';
import useServices from './hooks/useServices.js';

const _svc = useServices();

export async function loadAdmin(){
  if(!LocalStorage.isAdmin()||state.ADMIN.loading)return;
  state.ADMIN.loading=true;
  state.ADMIN.err="";
  try{
    const rows=await _svc.getSubmissions({kind:state.ADMIN.tab==="all"?null:state.ADMIN.tab});
    rows.sort((a,b)=>(b.at||0)-(a.at||0));
    state.ADMIN.rows=rows;state.ADMIN.loaded=true;
  }catch(e){state.ADMIN.err="Could not load submissions. Try Refresh in a moment.";}
  state.ADMIN.loading=false;
  if(curBase()==="admin")paintAdmin();
}

export function adminRows(){
  return state.ADMIN.rows||[];
}

export function summarize(r){const d=r.data||{};const pick={register:["company","country","goal","seeking"],login:["email","company"],edit:["company","goal","seeking"],search:["goal","intent","engine"],intro:["toName","message"],funding:["company","type","amount"],deal:["company","stageName","amount"],ad:["format","company","budget"],alerts:["email","topics"],newsletter:["email"],contact:["subject","message"]}[r.kind]||Object.keys(d).slice(0,3);return pick.map(k=>d[k]).filter(Boolean).map(v=>String(v)).join(" · ").slice(0,160);}

export function viewAdmin(app){
  if(!LocalStorage.isLoggedIn()){
    app.innerHTML=`<section><div class="wrap narrow"><span class="kicker">Admin console</span><h1 class="page-h">Sign in required.</h1><div class="card"><p class="muted">You need to be signed in as an admin to access this page.</p><button class="btn btn-primary" onclick="go('#/login')">Log in</button></div></div></section>`;return;
  }
  if(!LocalStorage.isAdmin()){
    app.innerHTML=`<section><div class="wrap narrow"><span class="kicker">Admin console</span><h1 class="page-h">Chamber admins only.</h1><div class="card" style="display:flex;gap:14px;align-items:flex-start"><span style="font-size:22px;color:var(--gold-text);display:inline-flex">${ico("lock")}</span><div><b>This area is restricted to chamber staff.</b><p class="muted" style="margin:6px 0 0">Contact the chamber if you believe you should have access.</p></div></div></div></section>`;return;
  }
  app.innerHTML=`
  <section><div class="wrap">
    <div class="top">
      <div><span class="kicker">Admin console</span><h1 class="page-h" style="margin-bottom:2px">Admin console.</h1><p class="muted">Manage submissions, members and news content.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" onclick="state.ADMIN.loaded=false;loadAdmin();paintAdmin()">${ico("refresh")} Refresh</button><button class="btn btn-sm btn-primary" onclick="exportCSV()">${ico("download")} Export CSV</button></div>
    </div>
    <div class="toolbar" style="margin-bottom:0">
      <button class="fbtn" aria-pressed="${state.ADMIN.section==='submissions'||!state.ADMIN.section}" onclick="admSection('submissions')">${ico("inbox")} Submissions</button>
      <button class="fbtn" aria-pressed="${state.ADMIN.section==='news'}" onclick="admSection('news')">${ico("news")} News</button>
    </div>
    <div id="adm_body"></div>
  </div></section>`;
  if(!state.ADMIN.loaded)loadAdmin();
  paintAdmin();
}

export function admSection(s){
  state.ADMIN.section = s;
  if(s==='news') paintNewsAdmin();
  else paintAdmin();
}

export function paintAdmin(){
  if(state.ADMIN.section==='news'){paintNewsAdmin();return;}
  const body=$("#adm_body");if(!body)return;
  if(!state.ADMIN.loaded&&state.ADMIN.loading){body.innerHTML=`<div class="thinking" style="margin-top:16px" role="status"><div class="radar"><svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading submissions…</b>${state.ADMIN.err?`<div class="muted">${esc(state.ADMIN.err)}</div>`:""}</div></div>`;return;}
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
        <div class="atbl-wrap">${list.length?`<table class="atbl"><thead><tr><th>When</th><th>Form</th><th>From</th><th>Details</th><th>Account</th></tr></thead><tbody>${list.slice(0,400).map(r=>{const k=FORM_KINDS[r.kind]||{label:r.kind,ic:"file"};const sample=String(r.uid).startsWith("sample-");const acct=sample?'<span class="tag plain">Sample</span>':r.uid==="this-device"?'<span class="tag plain">This device</span>':esc(state.ADMIN.names[r.uid]||"Signed-in viewer");return `<tr tabindex="0" aria-selected="${sel===r}" data-id="${esc(r.id)}" data-u="${esc(r.uid)}"><td class="when">${esc(fmtDate(r.at))}</td><td><span class="tag" style="white-space:nowrap">${ico(k.ic)}${esc(k.label)}</span></td><td><b>${esc((r.who&&r.who.name)||"--")}</b><div class="muted">${esc([(r.who&&r.who.company),(r.who&&r.who.email)].filter(Boolean).join(" · "))}</div></td><td class="sum">${esc(summarize(r))}</td><td>${acct}</td></tr>`;}).join("")}</tbody></table>`:`<div class="empty-c">${ico("inbox")} ${rows.length?"No submissions match this filter.":"No submissions yet. They appear here as visitors register, search, request introductions or send forms."}</div>`}</div>
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
  await _svc.exportSubmissionsCSV();
}


/* ── News management ─────────────────────────────────────────────────── */

const NEWS_CATS = ["Policy Brief","Investor Update","Trade Alert","Market Report","Opportunity","General"];

let _newsArticles = [];
let _newsEditing = null; // null=list, "new"=new form, article._id=edit form

export async function paintNewsAdmin() {
  const body = $("#adm_body"); if (!body) return;
  body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading articles…</b></div></div>`;
  _newsArticles = await _svc.getNews();
  _newsEditing = null;
  renderNewsSection();
}

function renderNewsSection() {
  const body = $("#adm_body"); if (!body) return;
  if (_newsEditing !== null) { renderNewsForm(); return; }
  const list = _newsArticles;
  body.innerHTML = `
    <div class="top" style="margin-top:16px">
      <div><b>${list.length}</b> article${list.length===1?"":"s"}</div>
      <button class="btn btn-sm btn-primary" onclick="newsNew()">${ico("rocket")} New article</button>
    </div>
    ${list.length ? `<div class="atbl-wrap"><table class="atbl"><thead><tr><th>Title</th><th>Category</th><th>Date</th><th></th></tr></thead><tbody>
      ${list.map(a => `<tr>
        <td><b>${esc(a.title)}</b><div class="muted" style="font-size:12px">${esc(a.excerpt||"").slice(0,80)}</div></td>
        <td><span class="tag">${esc(a.category||"")}</span></td>
        <td class="muted" style="white-space:nowrap">${esc(fmtDate(a.published_at||a.createdAt))}</td>
        <td style="white-space:nowrap;display:flex;gap:6px">
          <button class="btn btn-sm" onclick="newsEdit('${esc(a._id)}')">${ico("edit")} Edit</button>
          <button class="btn btn-sm" style="color:var(--red,#e55)" onclick="newsDel('${esc(a._id)}')">${ico("trash")} Delete</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("news")} No articles yet. Click "New article" to publish the first one.</div>`}`;
}

function renderNewsForm() {
  const body = $("#adm_body"); if (!body) return;
  const a = _newsEditing === "new" ? {} : (_newsArticles.find(x => x._id === _newsEditing) || {});
  const isNew = _newsEditing === "new";
  body.innerHTML = `
    <div class="top" style="margin-top:16px">
      <button class="btn btn-sm" onclick="newsCancel()">${ico("arrow")} Back to list</button>
      <h2 style="font-size:18px;margin:0">${isNew ? "New article" : "Edit article"}</h2>
    </div>
    <form class="card" id="newsForm" novalidate style="margin-top:16px;display:flex;flex-direction:column;gap:14px">
      <div class="form-grid">
        <div class="field full"><label for="nf_title">${ico("file")} Title <span class="req">*</span></label><input id="nf_title" value="${esc(a.title||"")}" placeholder="Article headline"></div>
        <div class="field"><label for="nf_cat">${ico("grid")} Category <span class="req">*</span></label><select id="nf_cat">${NEWS_CATS.map(c=>`<option ${(a.category||""===c)?"selected":""}>${esc(c)}</option>`).join("")}</select></div>
        <div class="field">
          <label>${ico("image")} Article image <span class="muted" style="font-weight:400">(optional)</span></label>
          ${a.image_url ? `<div id="nf_img_prev" style="margin-bottom:8px"><img src="${esc(a.image_url)}" style="max-width:100%;max-height:140px;border-radius:8px;object-fit:cover"><br><button type="button" class="btn btn-sm" style="margin-top:6px;color:var(--red,#e55)" onclick="newsImgClear()">× Remove image</button></div>` : `<div id="nf_img_prev" style="display:none"></div>`}
          <label for="nf_img_file" id="nf_img_drop" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:2px dashed var(--line);border-radius:10px;padding:16px 12px;cursor:pointer;text-align:center;${a.image_url?"display:none":""}">
            <span style="color:var(--blue-text);font-size:22px;display:inline-flex">${ico("image")}</span>
            <span style="font-size:13px;color:var(--text-soft)">Click to upload image</span>
            <span style="font-size:11px;color:var(--text-muted)">JPG, PNG or WebP</span>
          </label>
          <input type="file" id="nf_img_file" accept="image/*" style="display:none">
          <div id="nf_img_status" style="font-size:12px;color:var(--text-soft);margin-top:4px"></div>
        </div>
      </div>
      <div class="field full"><label for="nf_excerpt">${ico("file")} Excerpt / summary</label><textarea id="nf_excerpt" rows="2" maxlength="400" placeholder="1–2 sentence summary shown in the list…">${esc(a.excerpt||"")}</textarea></div>
      <div class="field full"><label for="nf_body">${ico("news")} Full article body</label><textarea id="nf_body" rows="10" placeholder="Full article text…">${esc(a.body||a.content||"")}</textarea></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" id="nf_save" type="submit">${ico("rocket")} ${isNew?"Publish article":"Save changes"}</button>
        <button class="btn" type="button" onclick="newsCancel()">Cancel</button>
      </div>
    </form>`;

  let _newsImgUrl = a.image_url || null;
  let _newsImgUploading = false;

  window.newsImgClear = () => {
    _newsImgUrl = null;
    const prev = $("#nf_img_prev"); if (prev) { prev.style.display = "none"; prev.innerHTML = ""; }
    const drop = $("#nf_img_drop"); if (drop) drop.style.display = "flex";
  };

  const imgFile = $("#nf_img_file");
  const imgDrop = $("#nf_img_drop");
  if (imgDrop) imgDrop.onclick = () => imgFile && imgFile.click();
  if (imgFile) imgFile.onchange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const status = $("#nf_img_status");
    const btn = $("#nf_save");
    if (status) status.textContent = "Uploading…";
    if (btn) { btn.disabled = true; }
    _newsImgUploading = true;
    const url = await _svc.uploadImage(file);
    _newsImgUploading = false;
    if (btn) btn.disabled = false;
    if (url) {
      _newsImgUrl = url;
      const prev = $("#nf_img_prev");
      if (prev) { prev.style.display = ""; prev.innerHTML = `<img src="${esc(url)}" style="max-width:100%;max-height:140px;border-radius:8px;object-fit:cover"><br><button type="button" class="btn btn-sm" style="margin-top:6px;color:var(--red,#e55)" onclick="newsImgClear()">× Remove image</button>`; }
      if (imgDrop) imgDrop.style.display = "none";
      if (status) status.textContent = "";
    } else {
      if (status) status.textContent = "Upload failed. Try again.";
      e.target.value = "";
    }
  };

  $("#newsForm").onsubmit = async (e) => {
    e.preventDefault();
    if (_newsImgUploading) { toast("Please wait", "Image is still uploading…", false); return; }
    const title = $("#nf_title").value.trim();
    const category = $("#nf_cat").value;
    if (!title || !category) { toast("Required", "Title and category are required.", false); return; }
    const btn = $("#nf_save"); btn.disabled = true; btn.textContent = "Saving…";
    const payload = {
      title, category,
      excerpt: $("#nf_excerpt").value.trim(),
      body: $("#nf_body").value.trim(),
      image_url: _newsImgUrl || null,
      status: "published",
      published_at: Date.now(),
    };
    let ok;
    if (isNew) ok = await _svc.createNews(payload);
    else ok = await _svc.updateNews(a._id, payload);
    if (ok) { _newsArticles = await _svc.getNews(); _newsEditing = null; renderNewsSection(); }
    else { btn.disabled = false; btn.innerHTML = `${ico("rocket")} ${isNew?"Publish article":"Save changes"}`; }
  };
}

export function newsNew() { _newsEditing = "new"; renderNewsForm(); }
export function newsEdit(id) { _newsEditing = id; renderNewsForm(); }
export function newsCancel() { _newsEditing = null; renderNewsSection(); }
export async function newsDel(id) {
  if (!confirm("Delete this article? This cannot be undone.")) return;
  const ok = await _svc.deleteNews(id);
  if (ok) { _newsArticles = _newsArticles.filter(a => a._id !== id); renderNewsSection(); }
}

/* inline handlers in the markup call these by name */

