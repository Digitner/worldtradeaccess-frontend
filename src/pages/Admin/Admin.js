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
      <button class="fbtn adm-tab" data-s="submissions" aria-pressed="${state.ADMIN.section==='submissions'||!state.ADMIN.section}" onclick="admSection('submissions')">${ico("inbox")} Submissions</button>
      <button class="fbtn adm-tab" data-s="news" aria-pressed="${state.ADMIN.section==='news'}" onclick="admSection('news')">${ico("news")} News</button>
      <button class="fbtn adm-tab" data-s="adrequests" aria-pressed="${state.ADMIN.section==='adrequests'}" onclick="admSection('adrequests')">${ico("mega")} Ad Requests</button>
      <button class="fbtn adm-tab" data-s="adproducts" aria-pressed="${state.ADMIN.section==='adproducts'}" onclick="admSection('adproducts')">${ico("star")} Ad Products</button>
      <button class="fbtn adm-tab" data-s="content" aria-pressed="${state.ADMIN.section==='content'}" onclick="admSection('content')">${ico("grid")} Content</button>
      <button class="fbtn adm-tab" data-s="deals" aria-pressed="${state.ADMIN.section==='deals'}" onclick="admSection('deals')">${ico("briefcase")} Deals</button>
      <button class="fbtn adm-tab" data-s="funding" aria-pressed="${state.ADMIN.section==='funding'}" onclick="admSection('funding')">${ico("rocket")} Funding</button>
      <button class="fbtn adm-tab" data-s="members" aria-pressed="${state.ADMIN.section==='members'}" onclick="admSection('members')">${ico("users")} Members</button>
      <button class="fbtn adm-tab" data-s="users" aria-pressed="${state.ADMIN.section==='users'}" onclick="admSection('users')">${ico("user")} Users</button>
      <button class="fbtn adm-tab" data-s="subscribers" aria-pressed="${state.ADMIN.section==='subscribers'}" onclick="admSection('subscribers')">${ico("bell")} Subscribers</button>
      <button class="fbtn adm-tab" data-s="contact" aria-pressed="${state.ADMIN.section==='contact'}" onclick="admSection('contact')">${ico("send")} Contact</button>
    </div>
    <div id="adm_body"></div>
  </div></section>`;
  updateAdmToolbar(state.ADMIN.section || 'submissions');
  if(!state.ADMIN.loaded)loadAdmin();
  paintAdmin();
}

function updateAdmToolbar(s){
  $$(".adm-tab").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.s === s)));
}

export function admSection(s){
  state.ADMIN.section = s;
  updateAdmToolbar(s);
  if(s==='news') paintNewsAdmin();
  else if(s==='adproducts') paintAdProducts();
  else if(s==='adrequests') { _adReqLoaded=false; paintAdRequests(); }
  else if(s==='content') paintContent();
  else if(s==='deals') { _admDealsLoaded=false; paintAdminDeals(); }
  else if(s==='funding') { _admFundingLoaded=false; paintAdminFunding(); }
  else if(s==='members') { _admMembersLoaded=false; paintAdminMembers(); }
  else if(s==='users') { _admUsersLoaded=false; paintAdminUsers(); }
  else if(s==='subscribers') { _admSubsLoaded=false; paintAdminSubscribers(); }
  else if(s==='contact') { _admContactLoaded=false; paintAdminContact(); }
  else paintAdmin();
}

export function paintAdmin(){
  if(state.ADMIN.section==='news'){if($("#adm_body"))paintNewsAdmin();return;}
  if(state.ADMIN.section==='adproducts'){if($("#adm_body"))paintAdProducts();return;}
  if(state.ADMIN.section==='adrequests'){if($("#adm_body"))paintAdRequests();return;}
  if(state.ADMIN.section==='content'){if($("#adm_body"))paintContent();return;}
  if(state.ADMIN.section==='deals'){if($("#adm_body"))paintAdminDeals();return;}
  if(state.ADMIN.section==='funding'){if($("#adm_body"))paintAdminFunding();return;}
  if(state.ADMIN.section==='members'){if($("#adm_body"))paintAdminMembers();return;}
  if(state.ADMIN.section==='users'){if($("#adm_body"))paintAdminUsers();return;}
  if(state.ADMIN.section==='subscribers'){if($("#adm_body"))paintAdminSubscribers();return;}
  if(state.ADMIN.section==='contact'){if($("#adm_body"))paintAdminContact();return;}
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
  if (state.ADMIN.section !== 'news') return;
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

/* ── Ad Requests management ──────────────────────────────────────────── */

const AD_REQ_STATUSES = ["new", "contacted", "booked"];
const AD_REQ_STATUS_COLOR = { new: "color:var(--blue-text)", contacted: "color:var(--gold-text)", booked: "color:var(--green-text)" };
let _adRequests = [];
let _adReqFilter = "all";
let _adReqLoaded = false;
let _adReqLoading = false;

export async function paintAdRequests(forceReload = false) {
  const body = $("#adm_body"); if (!body) return;
  if (_adReqLoading) return;
  if (!_adReqLoaded || forceReload) {
    _adReqLoading = true;
    body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading ad requests…</b></div></div>`;
    _adRequests = await _svc.getAdRequests({ limit: 200 });
    _adReqLoaded = true;
    _adReqLoading = false;
  }
  if (state.ADMIN.section !== 'adrequests') return;
  renderAdRequests();
}

function renderAdRequests() {
  const body = $("#adm_body"); if (!body) return;
  const counts = { all: _adRequests.length };
  AD_REQ_STATUSES.forEach(s => counts[s] = _adRequests.filter(r => r.status === s).length);
  const list = _adReqFilter === "all" ? _adRequests : _adRequests.filter(r => r.status === _adReqFilter);

  body.innerHTML = `
    <div class="astat" style="margin-top:16px">
      <button class="kpi" aria-pressed="${_adReqFilter==='all'}" onclick="adReqFilter('all')"><span class="ki">${ico("mega")}</span><div><div class="n">${counts.all}</div><div class="l">All requests</div></div></button>
      <button class="kpi" aria-pressed="${_adReqFilter==='new'}" onclick="adReqFilter('new')"><span class="ki" style="background:var(--blue-soft,#e8f0fe);color:var(--blue-text)">${ico("inbox")}</span><div><div class="n">${counts.new||0}</div><div class="l">New</div></div></button>
      <button class="kpi" aria-pressed="${_adReqFilter==='contacted'}" onclick="adReqFilter('contacted')"><span class="ki" style="background:var(--gold-soft);color:var(--gold-text)">${ico("send")}</span><div><div class="n">${counts.contacted||0}</div><div class="l">Contacted</div></div></button>
      <button class="kpi" aria-pressed="${_adReqFilter==='booked'}" onclick="adReqFilter('booked')"><span class="ki" style="background:var(--green-soft);color:var(--green-text)">${ico("check")}</span><div><div class="n">${counts.booked||0}</div><div class="l">Booked</div></div></button>
    </div>
    ${list.length ? `<div class="atbl-wrap" style="margin-top:12px"><table class="atbl"><thead><tr><th>Date</th><th>Company</th><th>Email</th><th>Format</th><th>Budget</th><th>Sector</th><th>Message</th><th>Status</th></tr></thead><tbody>
      ${list.map(r => `<tr>
        <td class="muted" style="white-space:nowrap;font-size:12px">${esc(fmtDate(r.createdAt))}</td>
        <td><b>${esc(r.company)}</b></td>
        <td style="user-select:all;font-size:13px">${esc(r.email)}</td>
        <td><span class="tag">${esc(r.format)}</span></td>
        <td class="muted">${esc(r.budget || "—")}</td>
        <td class="muted">${esc(r.target_sector || "Any")}</td>
        <td class="muted" style="font-size:13px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(r.message || "")}">${esc(r.message || "—")}</td>
        <td>
          <select class="adreq-status" data-id="${esc(r._id)}" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface);${AD_REQ_STATUS_COLOR[r.status]||""}">
            ${AD_REQ_STATUSES.map(s => `<option value="${s}" ${r.status===s?"selected":""}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join("")}
          </select>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("mega")} No ad requests ${_adReqFilter !== "all" ? `with status "${_adReqFilter}"` : "yet"}.</div>`}`;

  $$(".adreq-status").forEach(sel => {
    sel.onchange = async (e) => {
      const id = sel.dataset.id;
      const status = sel.value;
      const ok = await _svc.updateAdRequestStatus(id, status);
      if (ok) {
        const req = _adRequests.find(r => r._id === id);
        if (req) req.status = status;
        sel.style.cssText = `font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface);${AD_REQ_STATUS_COLOR[status]||""}`;
        renderAdRequests();
      }
    };
  });
}

export function adReqFilter(f) { _adReqFilter = f; renderAdRequests(); }

/* ── Ad Products management ──────────────────────────────────────────── */

const AD_PERIODS = ["month", "issue"];
let _adProducts = [];
let _adpEditing = null; // null=list, "new"=new, id=edit

export async function paintAdProducts() {
  const body = $("#adm_body"); if (!body) return;
  body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading ad products…</b></div></div>`;
  _adProducts = await _svc.getAdProducts();
  _adpEditing = null;
  if (state.ADMIN.section !== 'adproducts') return;
  renderAdProducts();
}

function renderAdProducts() {
  const body = $("#adm_body"); if (!body) return;
  if (_adpEditing !== null) { renderAdProductForm(); return; }
  body.innerHTML = `
    <div class="top" style="margin-top:16px">
      <div><b>${_adProducts.length}</b> ad product${_adProducts.length === 1 ? "" : "s"} · shown on the Advertise page as pricing cards</div>
      <button class="btn btn-sm btn-primary" onclick="adpNew()">${ico("rocket")} New product</button>
    </div>
    ${_adProducts.length ? `<div class="atbl-wrap"><table class="atbl"><thead><tr><th>Name</th><th>Description</th><th>Price</th><th>Period</th><th>Active</th><th></th></tr></thead><tbody>
      ${_adProducts.map(p => `<tr>
        <td><b>${esc(p.name)}</b></td>
        <td class="muted" style="font-size:13px">${esc(p.description || "")}</td>
        <td><b>USD ${Number(p.price_usd).toLocaleString("en-US")}</b></td>
        <td class="muted">/ ${esc(p.period || "month")}</td>
        <td><span class="tag ${p.active !== false ? "plain" : ""}" style="${p.active !== false ? "color:var(--green-text)" : "color:var(--red,#e55)"}">${p.active !== false ? "Active" : "Inactive"}</span></td>
        <td style="white-space:nowrap;display:flex;gap:6px">
          <button class="btn btn-sm" onclick="adpEdit('${esc(p._id)}')">${ico("edit")} Edit</button>
          <button class="btn btn-sm" style="color:var(--red,#e55)" onclick="adpDel('${esc(p._id)}')">${ico("trash")} Delete</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("star")} No ad products yet. Add one to populate the Advertise page pricing section.</div>`}`;
}

function renderAdProductForm() {
  const body = $("#adm_body"); if (!body) return;
  const p = _adpEditing === "new" ? {} : (_adProducts.find(x => x._id === _adpEditing) || {});
  const isNew = _adpEditing === "new";
  body.innerHTML = `
    <div class="top" style="margin-top:16px">
      <button class="btn btn-sm" onclick="adpCancel()">${ico("arrow")} Back to list</button>
      <h2 style="font-size:18px;margin:0">${isNew ? "New ad product" : "Edit ad product"}</h2>
    </div>
    <form class="card" id="adpForm" novalidate style="margin-top:16px;display:flex;flex-direction:column;gap:14px">
      <div class="form-grid">
        <div class="field full"><label for="ap_name">${ico("star")} Name <span class="req">*</span></label>
          <input id="ap_name" value="${esc(p.name || "")}" placeholder="e.g. Leaderboard banner">
        </div>
        <div class="field full"><label for="ap_desc">${ico("file")} Description</label>
          <input id="ap_desc" value="${esc(p.description || "")}" placeholder="e.g. Top of Directory & Search">
        </div>
        <div class="field"><label for="ap_price">${ico("coins")} Price (USD) <span class="req">*</span></label>
          <input id="ap_price" type="number" min="0" step="1" value="${p.price_usd ?? ""}">
        </div>
        <div class="field"><label for="ap_period">${ico("calendar")} Billing period</label>
          <select id="ap_period">${AD_PERIODS.map(per => `<option value="${per}" ${(p.period || "month") === per ? "selected" : ""}>${per}</option>`).join("")}</select>
        </div>
        <div class="field"><label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" id="ap_active" style="width:18px;height:18px" ${p.active !== false ? "checked" : ""}> Active (shown on Advertise page)
        </label></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" id="ap_save" type="submit">${ico("rocket")} ${isNew ? "Create product" : "Save changes"}</button>
        <button class="btn" type="button" onclick="adpCancel()">Cancel</button>
      </div>
    </form>`;
  $("#adpForm").onsubmit = async (e) => {
    e.preventDefault();
    const name = $("#ap_name").value.trim();
    const price_usd = parseFloat($("#ap_price").value);
    if (!name || isNaN(price_usd)) { toast("Required", "Name and price are required.", false); return; }
    const btn = $("#ap_save"); btn.disabled = true; btn.textContent = "Saving…";
    const payload = {
      name,
      description: $("#ap_desc").value.trim() || null,
      price_usd,
      period: $("#ap_period").value,
      active: $("#ap_active").checked,
    };
    let ok;
    if (isNew) ok = await _svc.createAdProduct(payload);
    else ok = await _svc.updateAdProduct(p._id, payload);
    if (ok) { _adProducts = await _svc.getAdProducts(); _adpEditing = null; renderAdProducts(); }
    else { btn.disabled = false; btn.innerHTML = `${ico("rocket")} ${isNew ? "Create product" : "Save changes"}`; }
  };
}

export function adpNew() { _adpEditing = "new"; renderAdProductForm(); }
export function adpEdit(id) { _adpEditing = id; renderAdProductForm(); }
export function adpCancel() { _adpEditing = null; renderAdProducts(); }
export async function adpDel(id) {
  if (!confirm("Delete this ad product? It will no longer appear on the Advertise page.")) return;
  const ok = await _svc.deleteAdProduct(id);
  if (ok) { _adProducts = _adProducts.filter(p => p._id !== id); renderAdProducts(); }
}

/* ── Admin Deals ─────────────────────────────────────────────────────── */

const DEAL_STAGE_NAMES = ["Interest Sent","Data Room","Intro Call","Due Diligence","Term Sheet","Closed"];
let _admDeals = [];
let _admDealsLoaded = false;
let _admDealsLoading = false;
let _admDealsStageFilter = "";

export async function paintAdminDeals() {
  const body = $("#adm_body"); if (!body) return;
  if (_admDealsLoading) return;
  if (!_admDealsLoaded) {
    _admDealsLoading = true;
    body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading deals…</b></div></div>`;
    _admDeals = await _svc.getAdminDeals({ limit: 200 });
    _admDealsLoaded = true;
    _admDealsLoading = false;
  }
  if (state.ADMIN.section !== 'deals') return;
  renderAdminDeals();
}

function renderAdminDeals() {
  const body = $("#adm_body"); if (!body) return;
  const stageCounts = {};
  _admDeals.forEach(d => { stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1; });
  const list = _admDealsStageFilter === "" ? _admDeals : _admDeals.filter(d => d.stage === Number(_admDealsStageFilter));

  body.innerHTML = `
    <div class="astat" style="margin-top:16px">
      <button class="kpi" aria-pressed="${_admDealsStageFilter===''}" onclick="admDealsFilter('')"><span class="ki">${ico("briefcase")}</span><div><div class="n">${_admDeals.length}</div><div class="l">All deals</div></div></button>
      ${DEAL_STAGE_NAMES.map((name, i) => `<button class="kpi" aria-pressed="${_admDealsStageFilter===String(i)}" onclick="admDealsFilter('${i}')"><span class="ki" style="font-size:12px;font-weight:700">${i}</span><div><div class="n">${stageCounts[i]||0}</div><div class="l">${name}</div></div></button>`).join("")}
    </div>
    <div class="top" style="margin-top:12px">
      <div class="muted"><b>${list.length}</b> deal${list.length===1?"":"s"}</div>
      <button class="btn btn-sm" onclick="_admDealsLoaded=false;paintAdminDeals()">${ico("refresh")} Refresh</button>
    </div>
    ${list.length ? `<div class="atbl-wrap"><table class="atbl"><thead><tr><th>Created</th><th>Listing / Company</th><th>Investor</th><th>Stage</th><th>Move to</th></tr></thead><tbody>
      ${list.map(d => {
        const company = d.funding_listing_id?.company || d.listing?.company || "—";
        const investor = d.user_id?.email || d.investor?.email || "—";
        const curStage = d.stage ?? 0;
        return `<tr>
          <td class="muted" style="white-space:nowrap;font-size:12px">${esc(fmtDate(d.createdAt))}</td>
          <td><b>${esc(company)}</b></td>
          <td class="muted" style="font-size:13px">${esc(investor)}</td>
          <td><span class="tag">${esc(DEAL_STAGE_NAMES[curStage]||curStage)}</span></td>
          <td>
            <select class="adm-deal-stage" data-id="${esc(d._id)}" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface)">
              ${DEAL_STAGE_NAMES.map((n,i) => `<option value="${i}" ${i===curStage?"selected":""}>${i} – ${n}</option>`).join("")}
            </select>
          </td>
        </tr>`;
      }).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("briefcase")} No deals ${_admDealsStageFilter !== "" ? `at stage ${_admDealsStageFilter}` : "yet"}.</div>`}`;

  $$(".adm-deal-stage").forEach(sel => {
    sel.onchange = async () => {
      const id = sel.dataset.id;
      const stage = Number(sel.value);
      const ok = await _svc.updateDealStage(id, stage);
      if (ok) {
        const deal = _admDeals.find(d => d._id === id);
        if (deal) deal.stage = stage;
        renderAdminDeals();
      }
    };
  });
}

export function admDealsFilter(f) { _admDealsStageFilter = f; renderAdminDeals(); }

/* ── Admin Funding ───────────────────────────────────────────────────── */

const FUNDING_STATUSES = ["live","closed","hidden"];
const FUNDING_STATUS_COLOR = { live: "color:var(--green-text)", closed: "color:var(--red,#e55)", hidden: "color:var(--text-soft)" };
const DOC_TITLES = ["Investment teaser","Financials & projections","Cap table","Legal & compliance"];

let _admFunding = [];
let _admFundingLoaded = false;
let _admFundingLoading = false;
let _admFundingStatusFilter = "";
let _admFundingSelected = null; // listing id currently showing data room
let _admFundingDocs = [];

export async function paintAdminFunding() {
  const body = $("#adm_body"); if (!body) return;
  if (_admFundingLoading) return;
  if (!_admFundingLoaded) {
    _admFundingLoading = true;
    body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading listings…</b></div></div>`;
    _admFunding = await _svc.getAdminFunding({ limit: 200 });
    _admFundingLoaded = true;
    _admFundingLoading = false;
  }
  if (state.ADMIN.section !== 'funding') return;
  renderAdminFunding();
}

function renderAdminFunding() {
  const body = $("#adm_body"); if (!body) return;
  const counts = { all: _admFunding.length };
  FUNDING_STATUSES.forEach(s => counts[s] = _admFunding.filter(f => f.status === s).length);
  const list = _admFundingStatusFilter === "" ? _admFunding : _admFunding.filter(f => f.status === _admFundingStatusFilter);
  const sel = _admFundingSelected ? _admFunding.find(f => f._id === _admFundingSelected) : null;

  body.innerHTML = `
    <div class="astat" style="margin-top:16px">
      <button class="kpi" aria-pressed="${_admFundingStatusFilter===''}" onclick="admFundingFilter('')"><span class="ki">${ico("rocket")}</span><div><div class="n">${counts.all}</div><div class="l">All listings</div></div></button>
      ${FUNDING_STATUSES.map(s => `<button class="kpi" aria-pressed="${_admFundingStatusFilter===s}" onclick="admFundingFilter('${s}')"><span class="ki" style="${FUNDING_STATUS_COLOR[s]||""}">${ico(s==="live"?"check":s==="closed"?"x":"lock")}</span><div><div class="n">${counts[s]||0}</div><div class="l">${s.charAt(0).toUpperCase()+s.slice(1)}</div></div></button>`).join("")}
    </div>
    <div class="split" style="margin-top:12px">
      <div class="main">
        <div class="top"><div class="muted"><b>${list.length}</b> listing${list.length===1?"":"s"}</div><button class="btn btn-sm" onclick="_admFundingLoaded=false;paintAdminFunding()">${ico("refresh")} Refresh</button></div>
        ${list.length ? `<div class="atbl-wrap"><table class="atbl"><thead><tr><th>Company</th><th>Type</th><th>Amount</th><th>Sector</th><th>Status</th><th>Data room</th></tr></thead><tbody>
          ${list.map(f => `<tr class="${_admFundingSelected===f._id?"sel-row":""}">
            <td><b>${esc(f.company||f.company_name||"")}</b><div class="muted" style="font-size:11px">${esc(fmtDate(f.createdAt))}</div></td>
            <td><span class="tag">${esc(f.type||"")}</span></td>
            <td class="muted">${esc(f.amount||"Undisclosed")}</td>
            <td class="muted">${esc(f.sector||"")}</td>
            <td>
              <select class="adm-fund-status" data-id="${esc(f._id)}" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface);${FUNDING_STATUS_COLOR[f.status]||""}">
                ${FUNDING_STATUSES.map(s => `<option value="${s}" ${f.status===s?"selected":""}>${s}</option>`).join("")}
              </select>
            </td>
            <td><button class="btn btn-sm" onclick="admFundingOpenRoom('${esc(f._id)}')">${ico("file")} Docs</button></td>
          </tr>`).join("")}
        </tbody></table></div>`
        : `<div class="empty" style="margin-top:24px">${ico("rocket")} No listings.</div>`}
      </div>
      <div class="side" id="adm_room_panel">${sel ? renderDataRoomPanel(sel) : `<div class="drawer"><div class="muted">${ico("file")} Click "Docs" on a listing to manage its data room.</div></div>`}</div>
    </div>`;

  $$(".adm-fund-status").forEach(sel => {
    sel.onchange = async () => {
      const id = sel.dataset.id;
      const status = sel.value;
      const ok = await _svc.updateFundingStatus(id, status);
      if (ok) {
        const item = _admFunding.find(f => f._id === id);
        if (item) item.status = status;
        sel.style.cssText = `font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface);${FUNDING_STATUS_COLOR[status]||""}`;
      }
    };
  });
}

function renderDataRoomPanel(listing) {
  const docs = _admFundingDocs;
  return `<div class="drawer">
    <div class="top" style="align-items:center">
      <h3 style="font-size:16px;margin:0">${ico("file")} Data room</h3>
      <button class="icon-btn" onclick="admFundingCloseRoom()" style="width:32px;height:32px">${ico("x")}</button>
    </div>
    <div class="muted" style="font-size:13px;margin:4px 0 12px">${esc(listing.company||"")}</div>
    <div id="adm_room_docs">
      ${docs.length ? docs.map(d => `<div class="list-row" style="gap:8px"><span class="ic">${ico("file")}</span><div style="flex:1;min-width:0"><b style="font-size:13px">${esc(d.title)}</b>${d.file_url||d.url?`<div><a href="${esc(d.file_url||d.url)}" target="_blank" rel="noopener" class="muted" style="font-size:12px">${ico("eye")} Open</a></div>`:"<div class='muted' style='font-size:12px'>No file</div>"}</div><button class="btn btn-sm" style="color:var(--red,#e55);flex-shrink:0" onclick="admRoomDel('${esc(d._id)}')">${ico("trash")}</button></div>`).join("")
      : `<p class="muted" style="font-size:13px">No documents yet.</p>`}
    </div>
    <div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px">
      <b style="font-size:13px">Add document</b>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
        <select id="adm_doc_title" style="padding:7px 10px;border-radius:8px;border:1px solid var(--line);background:var(--surface);font-size:13px">
          ${DOC_TITLES.map(t => `<option>${esc(t)}</option>`).join("")}
        </select>
        <input id="adm_doc_url" placeholder="File URL (https://…)" style="padding:7px 10px;border-radius:8px;border:1px solid var(--line);background:var(--surface);font-size:13px">
        <button class="btn btn-sm btn-primary" onclick="admRoomAdd('${esc(listing._id)}')">${ico("rocket")} Add document</button>
      </div>
    </div>
  </div>`;
}

export async function admFundingOpenRoom(id) {
  _admFundingSelected = id;
  const listing = _admFunding.find(f => f._id === id);
  if (!listing) return;
  const panel = $("#adm_room_panel"); if (!panel) return;
  panel.innerHTML = `<div class="drawer"><div class="muted">${ico("clock")} Loading documents…</div></div>`;
  _admFundingDocs = await _svc.getDataRoomDocs(id);
  panel.innerHTML = renderDataRoomPanel(listing);
}

export function admFundingCloseRoom() {
  _admFundingSelected = null;
  const panel = $("#adm_room_panel"); if (!panel) return;
  panel.innerHTML = `<div class="drawer"><div class="muted">${ico("file")} Click "Docs" on a listing to manage its data room.</div></div>`;
}

export async function admRoomAdd(fundingId) {
  const title = $("#adm_doc_title")?.value;
  const file_url = $("#adm_doc_url")?.value.trim();
  if (!file_url) { toast("Required", "Paste the file URL first.", false); return; }
  const ok = await _svc.addDataRoomDoc(fundingId, { title, file_url });
  if (ok) {
    _admFundingDocs = await _svc.getDataRoomDocs(fundingId);
    const listing = _admFunding.find(f => f._id === fundingId);
    const panel = $("#adm_room_panel"); if (panel && listing) panel.innerHTML = renderDataRoomPanel(listing);
  }
}

export async function admRoomDel(docId) {
  if (!confirm("Delete this document?")) return;
  const ok = await _svc.deleteDataRoomDoc(docId);
  if (ok && _admFundingSelected) {
    _admFundingDocs = _admFundingDocs.filter(d => d._id !== docId);
    const listing = _admFunding.find(f => f._id === _admFundingSelected);
    const panel = $("#adm_room_panel"); if (panel && listing) panel.innerHTML = renderDataRoomPanel(listing);
  }
}

export function admFundingFilter(f) { _admFundingStatusFilter = f; renderAdminFunding(); }

/* ── Content management (Partners / Testimonials / Trending) ─────────── */

let _contentTab = 'partners'; // partners | testimonials | trending
let _partners = [], _testimonials = [], _trending = [];
let _contentEditing = null; // null=list, "new"=new, id=edit
let _contentLoaded = false;

export async function paintContent() {
  const body = $("#adm_body"); if (!body) return;
  if (!_contentLoaded) {
    body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading content…</b></div></div>`;
    [_partners, _testimonials, _trending] = await Promise.all([_svc.getPartners(), _svc.getTestimonials(), _svc.getTrending()]);
    _contentLoaded = true;
  }
  if (state.ADMIN.section !== 'content') return;
  _contentEditing = null;
  renderContent();
}

function renderContent() {
  const body = $("#adm_body"); if (!body) return;
  if (_contentEditing !== null) { renderContentForm(); return; }
  const items = _contentTab === 'partners' ? _partners : _contentTab === 'testimonials' ? _testimonials : _trending;
  body.innerHTML = `
    <div class="toolbar" style="margin-top:16px;margin-bottom:0">
      <button class="fbtn" aria-pressed="${_contentTab==='partners'}" onclick="contentTab('partners')">${ico("handshake")} Partners <span class="n">${_partners.length}</span></button>
      <button class="fbtn" aria-pressed="${_contentTab==='testimonials'}" onclick="contentTab('testimonials')">${ico("user")} Testimonials <span class="n">${_testimonials.length}</span></button>
      <button class="fbtn" aria-pressed="${_contentTab==='trending'}" onclick="contentTab('trending')">${ico("sparkle")} Trending Keywords <span class="n">${_trending.length}</span></button>
    </div>
    <div class="top" style="margin-top:14px">
      <div class="muted">Shown live on the Home page</div>
      <button class="btn btn-sm btn-primary" onclick="contentNew()">${ico("rocket")} Add ${_contentTab === 'partners' ? 'partner' : _contentTab === 'testimonials' ? 'testimonial' : 'keyword'}</button>
    </div>
    ${items.length ? `<div class="atbl-wrap"><table class="atbl"><thead><tr>${
      _contentTab === 'partners' ? '<th>Name</th><th>Website</th><th>Logo URL</th><th>Active</th><th></th>' :
      _contentTab === 'testimonials' ? '<th>Quote</th><th>Name</th><th>Company</th><th>Active</th><th></th>' :
      '<th>Keyword</th><th>Sort order</th><th>Active</th><th></th>'
    }</tr></thead><tbody>
      ${items.map(item => `<tr>
        ${_contentTab === 'partners' ? `
          <td><b>${esc(item.name)}</b></td>
          <td class="muted">${esc(item.website || '—')}</td>
          <td class="muted" style="font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(item.logo_url || '—')}</td>` :
        _contentTab === 'testimonials' ? `
          <td style="max-width:240px"><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">"${esc(item.quote)}"</span></td>
          <td><b>${esc(item.name)}</b></td>
          <td class="muted">${esc(item.company)}</td>` : `
          <td><b>${esc(item.keyword)}</b></td>
          <td class="muted">${item.sort_order ?? 0}</td>`}
        <td><span class="tag" style="${item.active !== false ? 'color:var(--green-text)' : 'color:var(--red,#e55)'}">${item.active !== false ? 'Active' : 'Hidden'}</span></td>
        <td style="white-space:nowrap;display:flex;gap:6px">
          <button class="btn btn-sm" onclick="contentEdit('${esc(item._id)}')">${ico("edit")} Edit</button>
          <button class="btn btn-sm" style="color:var(--red,#e55)" onclick="contentDel('${esc(item._id)}')">${ico("trash")}</button>
        </td>
      </tr>`).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("grid")} No ${_contentTab} yet. Add one above.</div>`}`;
}

function renderContentForm() {
  const body = $("#adm_body"); if (!body) return;
  const items = _contentTab === 'partners' ? _partners : _contentTab === 'testimonials' ? _testimonials : _trending;
  const item = _contentEditing === "new" ? {} : (items.find(x => x._id === _contentEditing) || {});
  const isNew = _contentEditing === "new";
  const label = _contentTab === 'partners' ? 'partner' : _contentTab === 'testimonials' ? 'testimonial' : 'keyword';

  const fields = _contentTab === 'partners' ? `
    <div class="field full"><label>Name <span class="req">*</span></label><input id="cf_name" value="${esc(item.name || '')}" placeholder="e.g. Asian Development Bank"></div>
    <div class="field"><label>Website</label><input id="cf_website" value="${esc(item.website || '')}" placeholder="https://..."></div>
    <div class="field"><label>Logo URL</label><input id="cf_logo" value="${esc(item.logo_url || '')}" placeholder="https://... (optional)"></div>
    <div class="field"><label>Sort order</label><input id="cf_sort" type="number" value="${item.sort_order ?? 0}"></div>` :
  _contentTab === 'testimonials' ? `
    <div class="field full"><label>Quote <span class="req">*</span></label><textarea id="cf_quote" rows="3">${esc(item.quote || '')}</textarea></div>
    <div class="field"><label>Name <span class="req">*</span></label><input id="cf_name" value="${esc(item.name || '')}" placeholder="e.g. Farah Aziz"></div>
    <div class="field"><label>Company <span class="req">*</span></label><input id="cf_company" value="${esc(item.company || '')}" placeholder="e.g. KL Prime Grocers, Malaysia"></div>
    <div class="field"><label>Initials</label><input id="cf_initials" value="${esc(item.initials || '')}" placeholder="FA (auto if blank)" maxlength="3"></div>
    <div class="field"><label>Avatar URL</label><input id="cf_avatar" value="${esc(item.avatar_url || '')}" placeholder="https://... (optional)"></div>
    <div class="field"><label>Sort order</label><input id="cf_sort" type="number" value="${item.sort_order ?? 0}"></div>` : `
    <div class="field full"><label>Keyword <span class="req">*</span></label><input id="cf_keyword" value="${esc(item.keyword || '')}" placeholder="e.g. halal packaged foods"></div>
    <div class="field"><label>Sort order</label><input id="cf_sort" type="number" value="${item.sort_order ?? 0}"></div>`;

  body.innerHTML = `
    <div class="top" style="margin-top:16px">
      <button class="btn btn-sm" onclick="contentCancel()">${ico("arrow")} Back</button>
      <h2 style="font-size:18px;margin:0">${isNew ? `Add ${label}` : `Edit ${label}`}</h2>
    </div>
    <form class="card" id="contentForm" novalidate style="margin-top:16px;display:flex;flex-direction:column;gap:14px">
      <div class="form-grid">${fields}
        <div class="field"><label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" id="cf_active" style="width:18px;height:18px" ${item.active !== false ? "checked" : ""}> Active (shown on Home page)
        </label></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" id="cf_save" type="submit">${ico("rocket")} ${isNew ? "Add" : "Save"}</button>
        <button class="btn" type="button" onclick="contentCancel()">Cancel</button>
      </div>
    </form>`;

  $("#contentForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("#cf_save"); btn.disabled = true; btn.textContent = "Saving…";
    let payload = { active: $("#cf_active").checked, sort_order: Number($("#cf_sort")?.value || 0) };
    if (_contentTab === 'partners') {
      const name = $("#cf_name").value.trim();
      if (!name) { toast("Required", "Name is required.", false); btn.disabled = false; btn.textContent = isNew ? "Add" : "Save"; return; }
      payload = { ...payload, name, website: $("#cf_website").value.trim() || null, logo_url: $("#cf_logo").value.trim() || null };
    } else if (_contentTab === 'testimonials') {
      const quote = $("#cf_quote").value.trim(), name = $("#cf_name").value.trim(), company = $("#cf_company").value.trim();
      if (!quote || !name || !company) { toast("Required", "Quote, name and company are required.", false); btn.disabled = false; btn.textContent = isNew ? "Add" : "Save"; return; }
      payload = { ...payload, quote, name, company, initials: $("#cf_initials").value.trim() || null, avatar_url: $("#cf_avatar").value.trim() || null };
    } else {
      const keyword = $("#cf_keyword").value.trim();
      if (!keyword) { toast("Required", "Keyword is required.", false); btn.disabled = false; btn.textContent = isNew ? "Add" : "Save"; return; }
      payload = { ...payload, keyword };
    }
    let ok;
    if (_contentTab === 'partners') ok = isNew ? await _svc.createPartner(payload) : await _svc.updatePartner(item._id, payload);
    else if (_contentTab === 'testimonials') ok = isNew ? await _svc.createTestimonial(payload) : await _svc.updateTestimonial(item._id, payload);
    else ok = isNew ? await _svc.createTrending(payload) : await _svc.updateTrending(item._id, payload);
    if (ok) {
      [_partners, _testimonials, _trending] = await Promise.all([_svc.getPartners(), _svc.getTestimonials(), _svc.getTrending()]);
      _contentEditing = null; renderContent();
    } else { btn.disabled = false; btn.textContent = isNew ? "Add" : "Save"; }
  };
}

export function contentTab(t) { _contentTab = t; _contentEditing = null; renderContent(); }
export function contentNew() { _contentEditing = "new"; renderContentForm(); }
export function contentEdit(id) { _contentEditing = id; renderContentForm(); }
export function contentCancel() { _contentEditing = null; renderContent(); }
export async function contentDel(id) {
  if (!confirm("Delete this item?")) return;
  let ok;
  if (_contentTab === 'partners') ok = await _svc.deletePartner(id);
  else if (_contentTab === 'testimonials') ok = await _svc.deleteTestimonial(id);
  else ok = await _svc.deleteTrending(id);
  if (ok) {
    [_partners, _testimonials, _trending] = await Promise.all([_svc.getPartners(), _svc.getTestimonials(), _svc.getTrending()]);
    renderContent();
  }
}

/* ── Admin Members ───────────────────────────────────────────────────── */

const MEMBER_STATUSES = ["live","pending","hidden"];
const MEMBER_TIERS    = ["open","bacc","baicte"];
const MEMBER_SECTORS  = ["Finance","Investment","Infrastructure","Resources","Trade","Opportunity"];
const MEMBER_STATUS_COLOR = { live:"color:var(--green-text)", pending:"color:var(--gold-text)", hidden:"color:var(--text-soft)" };

let _admMembers = [];
let _admMembersLoaded = false;
let _admMembersLoading = false;
let _admMemberStatusFilter = "";
let _admMemberTierFilter = "";
let _admMemberSectorFilter = "";

export async function paintAdminMembers() {
  const body = $("#adm_body"); if (!body) return;
  if (_admMembersLoading) return;
  if (!_admMembersLoaded) {
    _admMembersLoading = true;
    body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading members…</b></div></div>`;
    _admMembers = await _svc.getMembers({ limit: 200 });
    _admMembersLoaded = true;
    _admMembersLoading = false;
  }
  if (state.ADMIN.section !== 'members') return;
  renderAdminMembers();
}

function renderAdminMembers() {
  const body = $("#adm_body"); if (!body) return;
  let list = _admMembers;
  if (_admMemberStatusFilter) list = list.filter(m => m.status === _admMemberStatusFilter);
  if (_admMemberTierFilter)   list = list.filter(m => m.tier === _admMemberTierFilter);
  if (_admMemberSectorFilter) list = list.filter(m => m.sector === _admMemberSectorFilter);

  body.innerHTML = `
    <div class="top" style="margin-top:16px;flex-wrap:wrap;gap:8px">
      <div class="muted"><b>${_admMembers.length}</b> total members · <b>${list.length}</b> shown</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <select id="adm_mem_status" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface)" onchange="admMembersFilter()">
          <option value="">All statuses</option>${MEMBER_STATUSES.map(s=>`<option value="${s}" ${_admMemberStatusFilter===s?"selected":""}>${s}</option>`).join("")}
        </select>
        <select id="adm_mem_tier" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface)" onchange="admMembersFilter()">
          <option value="">All tiers</option>${MEMBER_TIERS.map(t=>`<option value="${t}" ${_admMemberTierFilter===t?"selected":""}>${t}</option>`).join("")}
        </select>
        <select id="adm_mem_sector" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface)" onchange="admMembersFilter()">
          <option value="">All sectors</option>${MEMBER_SECTORS.map(s=>`<option value="${s}" ${_admMemberSectorFilter===s?"selected":""}>${s}</option>`).join("")}
        </select>
        <button class="btn btn-sm" onclick="_admMembersLoaded=false;paintAdminMembers()">${ico("refresh")} Refresh</button>
      </div>
    </div>
    ${list.length ? `<div class="atbl-wrap" style="margin-top:12px"><table class="atbl"><thead><tr><th>Company</th><th>Contact</th><th>Sector</th><th>Status</th><th>Tier</th><th>Verified</th><th>Sponsored</th></tr></thead><tbody>
      ${list.map(m => `<tr>
        <td><b>${esc(m.company_name||"")}</b><div class="muted" style="font-size:11px">${esc(m.country_name||"")}</div></td>
        <td class="muted" style="font-size:13px">${esc(m.contact_person||"")}${m.email?`<br><span style="user-select:all">${esc(m.email)}</span>`:""}</td>
        <td class="muted">${esc(m.sector||"")}</td>
        <td><select class="adm-mem-status" data-id="${esc(m._id)}" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface);${MEMBER_STATUS_COLOR[m.status]||""}">
          ${MEMBER_STATUSES.map(s=>`<option value="${s}" ${m.status===s?"selected":""}>${s}</option>`).join("")}
        </select></td>
        <td><select class="adm-mem-tier" data-id="${esc(m._id)}" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface)">
          ${MEMBER_TIERS.map(t=>`<option value="${t}" ${m.tier===t?"selected":""}>${t}</option>`).join("")}
        </select></td>
        <td><input type="checkbox" class="adm-mem-verified" data-id="${esc(m._id)}" ${m.is_verified?"checked":""} title="Verified"></td>
        <td><input type="checkbox" class="adm-mem-sponsored" data-id="${esc(m._id)}" ${m.is_sponsored?"checked":""} title="Sponsored"></td>
      </tr>`).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("users")} No members match the current filters.</div>`}`;

  const patchMember = async (id, patch) => {
    const ok = await _svc.updateMember(id, patch);
    if (ok) { const m = _admMembers.find(x=>x._id===id); if (m) Object.assign(m, patch); }
  };
  $$(".adm-mem-status").forEach(sel => { sel.onchange = () => patchMember(sel.dataset.id, { status: sel.value }).then(() => { sel.style.cssText = `font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface);${MEMBER_STATUS_COLOR[sel.value]||""}`; }); });
  $$(".adm-mem-tier").forEach(sel => { sel.onchange = () => patchMember(sel.dataset.id, { tier: sel.value }); });
  $$(".adm-mem-verified").forEach(cb => { cb.onchange = () => patchMember(cb.dataset.id, { is_verified: cb.checked }); });
  $$(".adm-mem-sponsored").forEach(cb => { cb.onchange = () => patchMember(cb.dataset.id, { is_sponsored: cb.checked }); });
}

export function admMembersFilter() {
  _admMemberStatusFilter = $("#adm_mem_status")?.value || "";
  _admMemberTierFilter   = $("#adm_mem_tier")?.value   || "";
  _admMemberSectorFilter = $("#adm_mem_sector")?.value || "";
  renderAdminMembers();
}

/* ── Admin Users ─────────────────────────────────────────────────────── */

let _admUsers = [];
let _admUsersLoaded = false;
let _admUsersLoading = false;

export async function paintAdminUsers() {
  const body = $("#adm_body"); if (!body) return;
  if (_admUsersLoading) return;
  if (!_admUsersLoaded) {
    _admUsersLoading = true;
    body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading users…</b></div></div>`;
    _admUsers = await _svc.getUsers({ limit: 200 });
    _admUsersLoaded = true;
    _admUsersLoading = false;
  }
  if (state.ADMIN.section !== 'users') return;
  renderAdminUsers();
}

function renderAdminUsers() {
  const body = $("#adm_body"); if (!body) return;
  const myUid = (() => { try { const t = localStorage.getItem("wta_token"); if (!t) return null; const p = t.split(".")[1]; return JSON.parse(atob(p)).uid; } catch { return null; } })();

  body.innerHTML = `
    <div class="top" style="margin-top:16px">
      <div class="muted"><b>${_admUsers.length}</b> users</div>
      <button class="btn btn-sm" onclick="_admUsersLoaded=false;paintAdminUsers()">${ico("refresh")} Refresh</button>
    </div>
    ${_admUsers.length ? `<div class="atbl-wrap" style="margin-top:12px"><table class="atbl"><thead><tr><th>Email</th><th>Name</th><th>Created</th><th>Role</th></tr></thead><tbody>
      ${_admUsers.map(u => {
        const isSelf = u._id === myUid || u.id === myUid;
        return `<tr ${isSelf?"style=\"background:var(--blue-soft,#e8f0fe)10\"":" "}>
          <td style="user-select:all;font-size:13px">${esc(u.email||"")}</td>
          <td>${esc(u.name||u.full_name||"")}</td>
          <td class="muted" style="font-size:12px;white-space:nowrap">${esc(fmtDate(u.createdAt||u.created_at))}</td>
          <td>${isSelf
            ? `<span class="tag" title="You cannot change your own role">${esc(u.role||"member")}</span>`
            : `<select class="adm-user-role" data-id="${esc(u._id||u.id||"")}" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface)">
                <option value="member" ${u.role==="member"?"selected":""}>member</option>
                <option value="admin"  ${u.role==="admin" ?"selected":""}>admin</option>
              </select>`
          }</td>
        </tr>`;
      }).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("user")} No users found.</div>`}`;

  $$(".adm-user-role").forEach(sel => {
    sel.onchange = async () => {
      const id = sel.dataset.id;
      const ok = await _svc.updateUserRole(id, sel.value);
      if (ok) { const u = _admUsers.find(x=>(x._id||x.id)===id); if (u) u.role = sel.value; }
    };
  });
}

/* ── Admin Subscribers ───────────────────────────────────────────────── */

let _admSubs = [];
let _admSubsLoaded = false;
let _admSubsLoading = false;
let _admSubsTypeFilter = "";

export async function paintAdminSubscribers() {
  const body = $("#adm_body"); if (!body) return;
  if (_admSubsLoading) return;
  if (!_admSubsLoaded) {
    _admSubsLoading = true;
    body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading subscribers…</b></div></div>`;
    _admSubs = await _svc.getSubscriptions({ limit: 500 });
    _admSubsLoaded = true;
    _admSubsLoading = false;
  }
  if (state.ADMIN.section !== 'subscribers') return;
  renderAdminSubscribers();
}

function renderAdminSubscribers() {
  const body = $("#adm_body"); if (!body) return;
  const list = _admSubsTypeFilter ? _admSubs.filter(s=>s.type===_admSubsTypeFilter) : _admSubs;
  const alerts = _admSubs.filter(s=>s.type==="alerts").length;
  const newsletter = _admSubs.filter(s=>s.type==="newsletter").length;

  body.innerHTML = `
    <div class="astat" style="margin-top:16px">
      <button class="kpi" aria-pressed="${_admSubsTypeFilter===''}" onclick="admSubsFilter('')"><span class="ki">${ico("bell")}</span><div><div class="n">${_admSubs.length}</div><div class="l">All</div></div></button>
      <button class="kpi" aria-pressed="${_admSubsTypeFilter==='alerts'}" onclick="admSubsFilter('alerts')"><span class="ki" style="color:var(--blue-text)">${ico("bell")}</span><div><div class="n">${alerts}</div><div class="l">News alerts</div></div></button>
      <button class="kpi" aria-pressed="${_admSubsTypeFilter==='newsletter'}" onclick="admSubsFilter('newsletter')"><span class="ki" style="color:var(--gold-text)">${ico("send")}</span><div><div class="n">${newsletter}</div><div class="l">Newsletter</div></div></button>
    </div>
    <div class="top" style="margin-top:12px">
      <div class="muted"><b>${list.length}</b> subscriber${list.length===1?"":"s"}</div>
      <button class="btn btn-sm" onclick="_admSubsLoaded=false;paintAdminSubscribers()">${ico("refresh")} Refresh</button>
    </div>
    ${list.length ? `<div class="atbl-wrap"><table class="atbl"><thead><tr><th>Email</th><th>Type</th><th>Topics</th><th>Date</th><th></th></tr></thead><tbody>
      ${list.map(s => `<tr>
        <td style="user-select:all">${esc(s.email||"")}</td>
        <td><span class="tag">${esc(s.type||"")}</span></td>
        <td class="muted" style="font-size:12px">${(s.topics||[]).join(", ")||"—"}</td>
        <td class="muted" style="font-size:12px;white-space:nowrap">${esc(fmtDate(s.createdAt))}</td>
        <td><button class="btn btn-sm" style="color:var(--red,#e55)" onclick="admSubsDel('${esc(s._id)}')">${ico("trash")}</button></td>
      </tr>`).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("bell")} No subscribers yet.</div>`}`;
}

export function admSubsFilter(t) { _admSubsTypeFilter = t; renderAdminSubscribers(); }
export async function admSubsDel(id) {
  if (!confirm("Remove this subscriber?")) return;
  const ok = await _svc.deleteSubscription(id);
  if (ok) { _admSubs = _admSubs.filter(s=>s._id!==id); renderAdminSubscribers(); }
}

/* ── Admin Contact ───────────────────────────────────────────────────── */

const CONTACT_STATUSES = ["new","read","replied"];
const CONTACT_STATUS_COLOR = { new:"color:var(--blue-text)", read:"color:var(--text-soft)", replied:"color:var(--green-text)" };

let _admContact = [];
let _admContactLoaded = false;
let _admContactLoading = false;
let _admContactStatusFilter = "";

export async function paintAdminContact() {
  const body = $("#adm_body"); if (!body) return;
  if (_admContactLoading) return;
  if (!_admContactLoaded) {
    _admContactLoading = true;
    body.innerHTML = `<div class="thinking" role="status" style="margin-top:16px"><div class="radar"><svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><b>Loading messages…</b></div></div>`;
    _admContact = await _svc.getContactMessages({ limit: 200 });
    _admContactLoaded = true;
    _admContactLoading = false;
  }
  if (state.ADMIN.section !== 'contact') return;
  renderAdminContact();
}

function renderAdminContact() {
  const body = $("#adm_body"); if (!body) return;
  const list = _admContactStatusFilter ? _admContact.filter(c=>c.status===_admContactStatusFilter) : _admContact;
  const counts = {};
  CONTACT_STATUSES.forEach(s=>counts[s]=_admContact.filter(c=>c.status===s).length);

  body.innerHTML = `
    <div class="astat" style="margin-top:16px">
      <button class="kpi" aria-pressed="${_admContactStatusFilter===''}" onclick="admContactFilter('')"><span class="ki">${ico("send")}</span><div><div class="n">${_admContact.length}</div><div class="l">All</div></div></button>
      ${CONTACT_STATUSES.map(s=>`<button class="kpi" aria-pressed="${_admContactStatusFilter===s}" onclick="admContactFilter('${s}')"><span class="ki" style="${CONTACT_STATUS_COLOR[s]||""}">${ico(s==="new"?"inbox":s==="read"?"check":"send")}</span><div><div class="n">${counts[s]||0}</div><div class="l">${s.charAt(0).toUpperCase()+s.slice(1)}</div></div></button>`).join("")}
    </div>
    <div class="top" style="margin-top:12px">
      <div class="muted"><b>${list.length}</b> message${list.length===1?"":"s"}</div>
      <button class="btn btn-sm" onclick="_admContactLoaded=false;paintAdminContact()">${ico("refresh")} Refresh</button>
    </div>
    ${list.length ? `<div class="atbl-wrap"><table class="atbl"><thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Status</th></tr></thead><tbody>
      ${list.map(c => `<tr>
        <td class="muted" style="font-size:12px;white-space:nowrap">${esc(fmtDate(c.createdAt))}</td>
        <td><b>${esc(c.name||"")}</b></td>
        <td style="user-select:all;font-size:13px">${esc(c.email||"")}</td>
        <td class="muted" style="font-size:13px">${esc(c.subject||"")}</td>
        <td class="muted" style="font-size:13px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(c.message||"")}">${esc(c.message||"—")}</td>
        <td><select class="adm-contact-status" data-id="${esc(c._id)}" style="font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface);${CONTACT_STATUS_COLOR[c.status]||""}">
          ${CONTACT_STATUSES.map(s=>`<option value="${s}" ${c.status===s?"selected":""}>${s}</option>`).join("")}
        </select></td>
      </tr>`).join("")}
    </tbody></table></div>`
    : `<div class="empty" style="margin-top:24px">${ico("send")} No contact messages ${_admContactStatusFilter?"with that status":""} yet.</div>`}`;

  $$(".adm-contact-status").forEach(sel => {
    sel.onchange = async () => {
      const id = sel.dataset.id;
      const ok = await _svc.updateContactStatus(id, sel.value);
      if (ok) {
        const m = _admContact.find(c=>c._id===id);
        if (m) m.status = sel.value;
        sel.style.cssText = `font-size:13px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--surface);${CONTACT_STATUS_COLOR[sel.value]||""}`;
      }
    };
  });
}

export function admContactFilter(s) { _admContactStatusFilter = s; renderAdminContact(); }

/* inline handlers in the markup call these by name */

