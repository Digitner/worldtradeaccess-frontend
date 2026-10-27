/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { ccChip, pIco, typeTag } from '../../components/Chips/Chips.js';
import { ringHTML } from '../../components/ScoreRing/ScoreRing.js';
import { toast } from '../../components/Toasts/toast.js';
import { ROLE_META, TYPE_LABEL } from '../../constant/roles.js';
import { EXAMPLES, POP_SEARCH } from '../../constant/search.js';
import useServices from './hooks/useServices.js';
import { $, $$, bold, esc, ico, imgTag, photo, wc } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';

export function quickSearch(q, role) { state.HERO.q = q; state.HERO.role = role || "buy"; go("#/search"); }

export async function viewSearch(app, _a, soft) {
  if (soft && state.SR.last) return;
  if (state.HERO.q != null) state.SR.role = state.HERO.role || state.SR.role;
  const preIntent = state.HERO.q != null ? state.HERO.q : ((state.USER && state.USER.seek) ? state.USER.seek : "");
  const auto = state.HERO.q != null || (!!preIntent && !state.SR.last);
  state.HERO.q = null; state.HERO.role = null;

  app.innerHTML = `
  <section><div class="wrap">
    <span class="kicker">The engine</span>
    <h1 class="page-h">Find your matches.</h1>
    <p class="page-sub">Pick your goal and describe what you seek. Claude reads every member's intent, answers your question directly, and ranks the best counterparties with the reasoning behind each match.</p>
    <form class="console" style="margin-top:20px" id="searchForm" novalidate>
      <span class="flabel" style="margin-bottom:11px">1 · I am here to…</span>
      <div class="roles" id="s_roles">${Object.entries(ROLE_META).map(([k, v]) => `<button type="button" class="role" data-role="${k}" aria-pressed="${k === state.SR.role}">${ico(v.ic)}${v.label}</button>`).join("")}</div>
      <label class="flabel" for="s_intent" style="margin:20px 0 11px">2 · Describe it, in 25 words</label>
      <div style="position:relative">
        <textarea id="s_intent" maxlength="320" placeholder="e.g. Mid-size food-processing SME in Kerala seeking a halal-certified snacks distributor in Malaysia and Indonesia.">${esc(preIntent)}</textarea>
        <span class="wordcount" id="s_wc" style="position:absolute;right:12px;bottom:10px;background:var(--surface);padding:2px 7px;border-radius:6px">0 words</span>
      </div>
      <div class="examples" id="s_examples"></div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:18px;flex-wrap:wrap">
        <button class="btn btn-primary" id="s_run" type="submit">${ico("sparkle")} Find matches <span class="arrow">→</span></button>
        <span class="engine on" id="s_engine"><span class="live"></span><span>Claude answers live</span></span>
      </div>
    </form>
    <div id="s_results" style="margin-top:24px"></div>
  </div></section>`;

  $("#s_roles").onclick = e => { const b = e.target.closest(".role"); if (!b) return; state.SR.role = b.dataset.role; $$("#s_roles .role").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderExamples(); };
  const ta = $("#s_intent");
  const updWc = () => { const n = wc(ta.value); $("#s_wc").textContent = n + " word" + (n === 1 ? "" : "s"); $("#s_wc").classList.toggle("warn", n > 25); };
  ta.oninput = updWc; updWc();
  ta.onkeydown = e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runSearch(); };
  $("#searchForm").onsubmit = e => { e.preventDefault(); runSearch(); };

  function renderExamples() { const ex = EXAMPLES[state.SR.role] || []; $("#s_examples").innerHTML = ex.map((t, i) => `<button type="button" class="chip" data-i="${i}">"${esc(t)}"</button>`).join(""); $$("#s_examples .chip").forEach(b => b.onclick = () => { ta.value = ex[+b.dataset.i]; updWc(); ta.focus(); }); }
  renderExamples();

  if (state.SR.last && !auto && state.SR.last.q === ta.value.trim()) renderMatches($("#s_results"), state.SR.last);
  else if (auto && preIntent) setTimeout(runSearch, 120);

}

const _svc = useServices();

export async function runSearch() {
  if (state.SR.busy) return;
  const q = $("#s_intent")?.value.trim(), res = $("#s_results");
  if (!q) { if (res) res.innerHTML = `<div class="empty">${ico("search")} Describe what you're looking for, then run the match.</div>`; if ($("#s_intent")) $("#s_intent").focus(); return; }
  state.SR.busy = true; if ($("#s_run")) $("#s_run").disabled = true;
  if (res) res.innerHTML = `<div class="thinking" role="status"><div class="radar"><svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><div style="font-weight:600">Claude is reading every member's intent…</div><div class="muted">Writing an answer and ranking counterparties. This usually takes a few seconds.</div></div></div>`;

  const role = state.SR.role;
  const result = await _svc.runMatch({ goal: role, seek: q });

  let out;
  if (result && result.matches) {
    // API returned real match data
    out = {
      answer: result.answer || result.claude_answer || "",
      matches: (result.matches || []).map(m => {
        const mem = m.member || m;
        return {
          id: mem._id || mem.id || m.member_id,
          score: m.score || 70,
          reason: m.reason || "",
          action: m.action || "Request an introduction.",
          m: {
            id: mem._id || mem.id || m.member_id,
            name: mem.company_name || mem.name,
            country: mem.country || mem.country_name,
            pillar: mem.sector || mem.pillar,
            type: mem.goal || mem.type,
            seek: mem.seek,
            person: mem.contact_person || mem.person,
            image_url: mem.image_url || null,
            cover_url: mem.cover_url || null,
          }
        };
      }),
      next: result.next || result.follow_ups || [],
      live: true,
      q,
      role,
      poolN: result.total || (result.matches || []).length,
      pool: result.matches || [],
    };
  } else {
    toast("No matches", "No strong matches found. Try adjusting your description.", false);
    out = { answer: "", matches: [], next: [], live: false, q, role, poolN: 0, pool: [] };
  }

  state.SR.last = out; state.SR.chat = [];
  if (res) renderMatches(res, out);
  state.SR.busy = false; const btn = $("#s_run"); if (btn) btn.disabled = false;
}

export function renderMatches(res, out) {
  const list = out.matches || [];
  let html = "";
  if (out.live && out.answer) {
    html += `<div class="answer"><div class="hd"><span class="ai">${ico("sparkle")}</span><b class="serif" style="font-size:18px">Claude's answer</b><span class="badge-ai"><span class="live-dot" style="width:6px;height:6px;box-shadow:none"></span>Generated live</span></div><p>${bold(out.answer)}</p>${out.next && out.next.length ? `<div class="examples" style="margin-top:14px">${out.next.map((n, i) => `<button class="chip" onclick="askFollow(state.SR.last.next[${i}])">${ico("send")} ${esc(n)}</button>`).join("")}</div>` : ""}</div>`;
  }
  if (!list.length) { res.innerHTML = html + `<div class="empty">No strong matches in the network for that one. Try a different sector, goal or one of the examples.</div>`; return; }
  html += `<div class="top" style="margin-bottom:14px;align-items:center"><div style="font-weight:600"><span style="color:var(--blue-text)">${list.length}</span> strong ${list.length === 1 ? "match" : "matches"}</div>${out.live ? `<span class="badge-ai">${ico("sparkle")} Ranked by Claude</span>` : `<span class="badge-ai off">${ico("cube")} On-device match</span>`}</div><div class="match-grid">`;
  list.forEach((d, i) => {
    const m = d.m, sc = Math.round(d.score);
    html += `<article class="match" style="animation-delay:${i * .06}s">${ringHTML(sc)}<div style="flex:1;min-width:0">
      <div class="top" style="gap:10px"><div style="display:flex;gap:11px;align-items:center;min-width:0">${imgTag(photo(m), "", "thumb")}<div style="min-width:0"><h3 class="name">${esc(m.name)}</h3><div class="loc">${ccChip(m.country)} ${esc(m.country)} · ${pIco(m.pillar)} ${esc(m.pillar)}</div></div></div>${typeTag(m.type)}</div>
      <p class="reason">${bold(d.reason || "")}</p>
      <div class="action"><span class="ic">${ico("arrow")}</span><span>${esc(d.action || "Request an introduction.")}</span></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm btn-primary" onclick="go('#/member/${esc(m.id)}')">${ico("handshake")} Request introduction</button><button class="btn btn-sm" onclick="go('#/member/${esc(m.id)}')">${ico("eye")} View profile</button></div>
    </div></article>`;
  });
  html += `</div>`;
  res.innerHTML = html;
}

// Keep localMatch for fallback use elsewhere
export function localMatch(q, pool, role) {
  const stop = new Set("the a an and or for to of in on with seeking seek want wants looking need needs my our i we me across from into".split(" "));
  const toks = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
  return pool.map(m => {
    const hay = (m.seek + " " + m.name + " " + m.country + " " + m.pillar).toLowerCase();
    const matched = toks.filter(t => hay.includes(t));
    const score = Math.min(96, 38 + matched.length * (toks.length ? Math.round(52 / Math.max(3, toks.length)) : 8) + (matched.length ? 8 : 0));
    return { m, score, matched };
  }).filter(x => x.matched.length).sort((a, b) => b.score - a.score).slice(0, 6).map(s => ({ id: s.m.id, score: s.score, m: s.m, reason: `Aligns on ${s.matched.slice(0, 3).map(x => "**" + x + "**").join(", ")}, a ${(TYPE_LABEL[s.m.type] || "").toLowerCase()} counterparty in ${s.m.country}.`, action: (role === "invest" || role === "capital") ? "Open a capital conversation." : "Request an introduction." }));
}
