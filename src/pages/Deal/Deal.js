/* eslint-disable */
import { ccChip, pIco } from '../../components/Chips/Chips.js';
import { toast } from '../../components/Toasts/toast.js';
import { DEAL_STAGES } from '../../constant/forms.js';
import useServices from './hooks/useServices.js';
import { esc, ico, imgTag } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

const _svc = useServices();

export async function viewDeal(app, id) {
  app.innerHTML = `<section><div class="wrap narrow"><div class="loading-shimmer" style="height:300px;border-radius:12px;margin-top:24px"></div></div></section>`;

  const f = await _svc.getFundingDetail(id);
  if (!f) {
    app.innerHTML = `<section><div class="wrap"><div class="empty">This opportunity isn't available. <button class="linkish" onclick="go('#/funding')">Back to funding</button></div></div></section>`;
    return;
  }

  const company = f.company_name || f.company;
  const country = f.country || "";
  const sector = f.sector || "";
  const amount = f.amount || "Undisclosed";
  const description = f.description || f.desc || "";
  const fid = f._id || f.id;
  const cur = f.my_deal_stage ?? f.my_stage ?? -1;
  const last = DEAL_STAGES.length - 1;
  const cls = f.type === "For Sale" ? "gold" : f.type === "Seeking JV" ? "" : "green";
  const roomOpen = cur >= 1;
  const isOwn = f.is_own || (state.USER && f.owner_user_id === (state.USER._id || state.USER.id));

  const action = isOwn
    ? `<div class="card" style="text-align:center"><p class="muted">This is your own listing.</p></div>`
    : cur < 0
      ? `<button class="btn btn-primary btn-block" id="actBtn">${ico("star")} Express interest</button>`
      : cur >= last
        ? `<div class="card" style="text-align:center;background:var(--green-soft)"><b>Deal closed</b><div class="muted">This opportunity has completed the pipeline.</div></div>`
        : `<button class="btn btn-primary btn-block" id="actBtn">Continue to ${esc(DEAL_STAGES[cur + 1])} <span class="arrow">→</span></button>`;

  app.innerHTML = `
  <section><div class="wrap narrow">
    <button class="backlink" onclick="go('#/funding')">${ico("back")} Back to funding</button>
    <div class="card" style="padding:0;overflow:hidden">
      <div class="media-hero" style="border-radius:0;margin:0;height:220px">${(f.cover_url||f.image_url) ? imgTag(f.cover_url||f.image_url, company) : ""}<div class="cap">${ccChip(country, "on-photo")} ${esc(country)}</div></div>
      <div style="padding:20px">
        <div class="top"><div><h1 style="font-size:27px;margin:0">${esc(company)}</h1><div class="muted" style="margin-top:4px">${pIco(sector)} ${esc(sector)}</div></div><div style="text-align:right"><span class="tag ${cls}">${esc(f.type)}</span><div class="amt" style="font-size:24px;margin-top:6px">${esc(amount)}</div></div></div>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:var(--text-soft)">${esc(description)}</p>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2 style="font-size:18px;margin:0 0 4px">Deal pipeline</h2>
      <p class="muted" style="margin:0 0 10px">The chamber facilitates each stage after you express interest.</p>
      <ol class="stepper">${DEAL_STAGES.map((st, i) => { const done = i < cur || (cur === last); const act = i === cur && cur !== last; return `<li class="stp ${done ? "done" : act ? "active" : ""}"><div class="dot">${done ? ico("check") : i + 1}</div><div class="lbl">${st}</div></li>`; }).join("")}</ol>
      <div style="margin-top:14px">${action}</div>
      ${cur >= 0 && cur < last ? `<p class="muted" style="margin:10px 0 0;text-align:center">Current stage: <b style="color:var(--text)">${esc(DEAL_STAGES[cur])}</b></p>` : ""}
    </div>
    <div class="card" style="margin-top:16px">
      <div class="top" style="align-items:center"><h2 style="font-size:18px;margin:0">Data room</h2>${roomOpen ? `<span class="tag green">${ico("unlock")}Access granted</span>` : `<span class="lock-pill">${ico("lock")}Unlocks at Data room stage</span>`}</div>
      <div id="docList" style="margin-top:8px"><div class="loading-shimmer" style="height:60px;border-radius:8px"></div></div>
      ${!roomOpen && cur >= 0 ? `<button class="btn btn-block" id="roomBtn" style="margin-top:12px">${ico("unlock")} Request data-room access</button>` : ""}
    </div>
  </div></section>`;

  // Load documents if room is open
  if (roomOpen) {
    const docs = await _svc.getDocuments(fid);
    const docEl = document.getElementById("docList");
    if (docEl) {
      const defaultDocs = ["Investment teaser", "Financials & projections", "Cap table", "Legal & compliance"];
      const list = docs.length ? docs : defaultDocs.map(t => ({ title: t }));
      docEl.innerHTML = list.map(d => `<div class="doc-row"><span class="di">${ico("file")}</span><div style="flex:1"><b style="font-size:14px">${esc(d.title || d.name)}</b><div class="muted">${d.url ? "PDF · available" : "Available on request"}</div></div>${d.url ? `<a href="${esc(d.url)}" target="_blank" rel="noopener" class="btn btn-sm">${ico("eye")} Open</a>` : `<span class="lock-pill">${ico("lock")}</span>`}</div>`).join("");
    }
  } else {
    const docEl = document.getElementById("docList");
    if (docEl) docEl.innerHTML = ["Investment teaser", "Financials & projections", "Cap table", "Legal & compliance"].map(t => `<div class="doc-row"><span class="di">${ico("file")}</span><div style="flex:1"><b style="font-size:14px">${t}</b><div class="muted">Request access to unlock</div></div><span class="lock-pill">${ico("lock")}</span></div>`).join("");
  }

  const actBtn = document.getElementById("actBtn");
  if (actBtn) actBtn.onclick = async () => {
    if (!state.USER) { toast("Create an account first", "Register to express interest.", false); go("#/register"); return; }
    actBtn.disabled = true; actBtn.textContent = "Processing…";
    let result;
    if (cur < 0) {
      result = await _svc.expressInterest(fid);
    } else {
      result = await _svc.advanceDeal(f.my_deal_id || fid);
    }
    if (result) { toast(DEAL_STAGES[Math.max(0, cur + 1)], "Your deal has moved forward."); go("#/deal/" + fid); }
    else { actBtn.disabled = false; }
  };

  const roomBtn = document.getElementById("roomBtn");
  if (roomBtn) roomBtn.onclick = async () => {
    if (!state.USER) { toast("Create an account first", "", false); go("#/register"); return; }
    roomBtn.disabled = true; roomBtn.textContent = "Requesting…";
    const result = await _svc.advanceDeal(f.my_deal_id || fid);
    if (result) { toast("Data room access", "Access granted."); go("#/deal/" + fid); }
    else { roomBtn.disabled = false; }
  };
}
