/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { ccChip, pIco, typeTag } from '../../components/Chips/Chips.js';
import { ringHTML } from '../../components/ScoreRing/ScoreRing.js';
import { toast } from '../../components/Toasts/toast.js';
import { AI_NAME } from '../../constant/brand.js';
import { ROLE_META, TYPE_LABEL } from '../../constant/roles.js';
import { EXAMPLES, POP_SEARCH } from '../../constant/search.js';
import useServices from './hooks/useServices.js';
import { $, $$, bold, esc, ico, imgTag, photo, wc } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { state } from '../../utils/state.js';
import { decorateForm, validateField, FIELD_KIND } from '../../utils/fields.js';

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
    <p class="page-sub">Pick your goal and describe what you seek. ${AI_NAME} reads every member's intent, answers your question directly, and ranks the best counterparties with the reasoning behind each match.</p>
    <form class="console" style="margin-top:20px" id="searchForm" novalidate>
      <span class="flabel" style="margin-bottom:11px">1 · I am here to…</span>
      <div class="roles" id="s_roles">${Object.entries(ROLE_META).map(([k, v]) => `<button type="button" class="role" data-role="${k}" aria-pressed="${k === state.SR.role}">${ico(v.ic)}${v.label}</button>`).join("")}</div>
      <div class="field" style="position:relative;margin-top:20px">
      <label class="flabel" for="s_intent" style="margin:0 0 4px">2 · Describe it, in 25 words</label>
        <textarea id="s_intent" maxlength="320" placeholder="e.g. Mid-size food-processing SME in Kerala seeking a halal-certified snacks distributor in Malaysia and Indonesia.">${esc(preIntent)}</textarea>
        <span class="wordcount" id="s_wc" style="position:absolute;right:12px;bottom:10px;background:var(--surface);padding:2px 7px;border-radius:6px">0 words</span>
      <div class="err-msg">Describe what you're looking for</div></div>
      <div class="examples" id="s_examples"></div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:18px;flex-wrap:wrap">
        <button class="btn btn-primary" id="s_run" type="submit">${ico("sparkle")} Find matches <span class="arrow">→</span></button>
        <span class="engine on" id="s_engine"><span class="live"></span><span>${AI_NAME} answers live</span></span>
      </div>
    </form>
    <div id="s_results" style="margin-top:24px"></div>
  </div></section>`;

  $("#s_roles").onclick = e => { const b = e.target.closest(".role"); if (!b) return; state.SR.role = b.dataset.role; $$("#s_roles .role").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderExamples(); };
  const ta = $("#s_intent");
  decorateForm({ s_intent: { kind: FIELD_KIND.MANDATORY, msg: "Describe what you're looking for" } }); // red = required (SOP)
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
  if (!q) { validateField("s_intent", FIELD_KIND.MANDATORY, undefined, "Describe what you're looking for"); if (res) res.innerHTML = `<div class="empty">${ico("search")} Describe what you're looking for, then run the match.</div>`; if ($("#s_intent")) $("#s_intent").focus(); return; }
  state.SR.busy = true; if ($("#s_run")) $("#s_run").disabled = true;
  if (res) res.innerHTML = `<div class="thinking" role="status"><div class="radar"><svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><div style="font-weight:600">${AI_NAME} is reading every member's intent…</div><div class="muted">Writing an answer and ranking counterparties. This usually takes a few seconds.</div></div></div>`;

  const role = state.SR.role;
  const result = await _svc.runMatch({ goal: role, seek: q });

  let out;
  if (result && result.matches) {
    // API returned real match data
    out = {
      answer: result.answer || "",
      matches: (result.matches || []).map(m => {
        const mem = m.member || m;
        return {
          id: mem._id || mem.id || m.member_id,
          score: m.score || 70,
          // "exact" = lists what was searched, "related" = only partly fits (older backends send none -> exact)
          relevance: m.relevance === "related" ? "related" : "exact",
          reason: m.reason || "",
          action: m.action || "Request an introduction.",
          // Set only where members' past votes changed this result's place (backend: searchLearning.js).
          learned: m.learned || null,
          // What this member lists for sale on their own website for what was searched, with the price
          // their page displays (backend: services/productSearch.js).
          products: Array.isArray(m.products) ? m.products : [],
          // True when they are in these results BECAUSE of that listing, not because the engine ranked them.
          fromProducts: !!m.from_products,
          m: {
            id: mem._id || mem.id || m.member_id,
            name: mem.company_name || mem.name,
            country: mem.country_name || mem.country,
            pillar: mem.sector || mem.pillar,
            type: mem.goal || mem.type,
            seek: mem.seek,
            person: mem.contact_person || mem.person,
            image_url: mem.image_url || null,
            cover_url: mem.cover_url || null,
          }
        };
      }),
      live: true,
      q,
      role,
      poolN: result.pool_size || result.total || (result.matches || []).length,
      pool: result.matches || [],
      // The stored search this result belongs to: feedback is scoped to it, and a guest search has no user to
      // authorise against, so POST /match hands back a token to prove the search was ours.
      searchId: result.search_id || null,
      guestToken: result.guest_token || null,
      // Set when the searcher's OWN listing matches what they searched for. Never a result - you are not
      // introduced to yourself - but worth saying, or their own catalogue looks un-findable.
      ownMatch: result.own_listing_match || null,
    };
  } else {
    toast("No matches", "No strong matches found. Try adjusting your description.", false);
    out = { answer: "", matches: [], live: false, q, role, poolN: 0, pool: [], searchId: null, guestToken: null, ownMatch: null };
  }

  // `votes` are per-search: these are judgements about THESE results, not standing opinions.
  state.SR.last = out; state.SR.votes = {};
  if (res) {
    renderMatches(res, out);
    revealResults(res);
  }
  state.SR.busy = false; const btn = $("#s_run"); if (btn) btn.disabled = false;
}

// After a fresh search, bring the answer (or the results) into view so it is read first and the member cards
// follow below it. Only moves if it is not already on screen; respects "reduce motion".
function revealResults(res) {
  const target = res.querySelector(".answer") || res;
  const r = target.getBoundingClientRect();
  if (r.top >= 80 && r.top < window.innerHeight * 0.6) return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
}

/* ================= FEEDBACK: "was this a good match?" =================
   The input side of the self-improving search. Each vote is sent to POST /match/:id/feedback, which remembers
   it against the words of this search; a later search worded similarly is then ranked by what members said
   (backend: api/controller/services/searchLearning.js). Votes live in state.SR.votes for this search only, so
   returning to the page still shows what was chosen, and a new search starts with a clean slate. */

const VOTE_THANKS = "Thanks - this shapes the next search.";

/** The two thumb buttons, already reflecting any vote cast on this search. `key` is "answer" or a member id. */
function voteRow(scope, memberId, label) {
  const key = scope === "answer" ? "answer" : memberId;
  const chosen = (state.SR.votes || {})[key] || null;
  const btn = (dir, icon, title) =>
    `<button type="button" class="vote ${dir}" data-scope="${scope}"${memberId ? ` data-member="${esc(memberId)}"` : ""}` +
    ` data-vote="${dir}" aria-pressed="${chosen === dir}" title="${title}">${ico(icon)}<span class="vh">${title}</span></button>`;
  return `<div class="vote-row${chosen ? " voted" : ""}" data-label="${esc(label)}">
    <span class="vote-q">${chosen ? VOTE_THANKS : esc(label)}</span>
    ${btn("up", "thumbUp", scope === "answer" ? "Useful answer" : "Good match")}
    ${btn("down", "thumbDown", scope === "answer" ? "Not useful" : "Not relevant")}
  </div>`;
}

/**
 * Says so on the card when members' feedback is why this result is here. Only shown for a result feedback
 * HELPED: a member does not need telling that others voted something down, and saying so on a company's own
 * card would be gratuitous.
 */
function learnedBadge(d) {
  const l = d.learned;
  if (!l || !(l.up > 0) || !(l.delta > 0)) return "";
  const who = `${l.up} member${l.up === 1 ? "" : "s"}`;              // "1 member"   / "3 members"
  const whose = l.up === 1 ? "1 member's" : `${l.up} members'`;      // "1 member's" / "3 members'"
  return `<span class="learned-tag" title="Members who searched for something similar rated this a good match">` +
    `${ico("thumbUp")} ${l.promoted ? `Added because ${who} rated it a good match` : `Ranked higher by ${whose} feedback`}</span>`;
}

/** Reflect a vote in one row without re-rendering the results around it. */
function paintVote(row, chosen, note) {
  if (!row) return;
  $$(".vote", row).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vote === chosen)));
  const q = $(".vote-q", row);
  if (q) q.textContent = note;
  row.classList.toggle("voted", !!chosen);
}

/**
 * One delegated listener for every thumb on the page. #s_results itself survives each re-render (only its
 * innerHTML is replaced), so assigning onclick here keeps working for rows drawn later.
 *
 * The vote paints immediately and is rolled back if the request fails - a member should never be left unsure
 * whether their click registered.
 */
function wireVotes(res, out) {
  res.onclick = async (e) => {
    const b = e.target.closest(".vote");
    if (!b || b.disabled) return;
    const { scope, vote: dir } = b.dataset;
    const memberId = b.dataset.member || null;
    const key = scope === "answer" ? "answer" : memberId;
    if (!key || !out.searchId) return;

    if (!state.SR.votes) state.SR.votes = {};
    const prev = state.SR.votes[key] || null;
    if (prev === dir) return;                       // already said this, nothing to send

    const row = b.closest(".vote-row");
    state.SR.votes[key] = dir;
    paintVote(row, dir, VOTE_THANKS);

    const r = await _svc.sendFeedback({
      searchId: out.searchId, scope, memberId, vote: dir, guestToken: out.guestToken,
    });

    if (!r.ok) {
      if (prev) state.SR.votes[key] = prev; else delete state.SR.votes[key];
      paintVote(row, prev, prev ? VOTE_THANKS : (row?.dataset.label || ""));
      toast("Not saved", r.message || "Your feedback couldn't be saved. Try again.", false);
    } else if (!r.counted) {
      // Stored, but it will not move any ranking - say so rather than implying it will.
      paintVote(row, dir, "Thanks - noted.");
    }
  };
}

/**
 * The products a matched member lists for what was searched - the concrete answer behind the match: this
 * company publishes this item at this price on their own site. Prices are shown exactly as that site
 * displayed them, and an item they price on request shows no price rather than a made-up one.
 * @param {object[]} products from the match
 * @returns {string} HTML, or "" when none of their catalogue matched
 */
function matchProductsHTML(products) {
  const list = (products || []).slice(0, 4);
  if (!list.length) return "";
  // Plain rows, not links: the next step is an introduction through the chamber, not a trip to the
  // member's own checkout.
  return `<div class="match-products">
    <div class="match-products-hd">${ico("box")} Listed on their website</div>
    ${list.map((p) => `<div class="mprod">
      <span class="mprod-img">${p.image_url
        ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`
        : ""}${ico("box")}</span>
      <span class="mprod-name">${esc(p.name)}</span>
      ${p.price_text
        ? `<span class="mprod-price">${esc(p.price_text)}${p.price_unit ? `<span class="mprod-unit">/${esc(p.price_unit)}</span>` : ""}</span>`
        : `<span class="mprod-price mprod-price--none">On enquiry</span>`}
    </div>`).join("")}
  </div>`;
}

/**
 * Says that the member's own listing matches this search, since it is deliberately never returned as a
 * result. Without it, a member searching for what they sell sees their catalogue missing and reasonably
 * concludes it is not findable.
 * @param {object|null} own from the API
 * @returns {string} HTML
 */
function ownMatchNote(own) {
  if (!own || !own.products || !own.products.length) return "";
  const names = own.products.map((p) => `<b>${esc(p.name)}</b>`).join(", ");
  return `<div class="own-match">${ico("check")}<span>Your own listing matches this search &mdash; ${names}.
    Other members searching this will find you. Your listing is never shown in your own results.</span></div>`;
}

export function renderMatches(res, out) {
  const list = out.matches || [];
  let html = "";
  if (out.live && out.answer) {
    html += `<div class="answer" role="status" aria-live="polite"><div class="hd"><b class="serif answer-title">${AI_NAME}'s answer</b></div><p>${bold(out.answer)}</p>${out.searchId ? voteRow("answer", null, "Was this answer useful?") : ""}</div>`;
  }
  html += ownMatchNote(out.ownMatch);
  if (!list.length) {
    res.innerHTML = html + `<div class="empty">No member in the network matches that yet. Try different words, another goal, or one of the examples.</div>`;
    wireVotes(res, out);   // the answer above can still be rated even when nothing matched
    return;
  }
  const nStrong = list.filter((d) => d.relevance !== "related").length;
  const nRelated = list.length - nStrong;
  const countLabel = nStrong
    ? `<span style="color:var(--blue-text)">${nStrong}</span> strong ${nStrong === 1 ? "match" : "matches"}${nRelated ? ` <span class="muted" style="font-weight:400">+ ${nRelated} related</span>` : ""}`
    : `<span style="color:var(--blue-text)">${list.length}</span> possible ${list.length === 1 ? "match" : "matches"}`;
  html += `<div class="top" style="margin-bottom:14px;align-items:center"><div style="font-weight:600">${countLabel}</div></div>${nStrong ? "" : `<p class="match-note">No member lists exactly what you searched. These only partly fit, so check each reason before reaching out.</p>`}<div class="match-grid">`;
  list.forEach((d, i) => {
    const m = d.m, sc = Math.round(d.score);
    html += `<article class="match" style="animation-delay:${i * .06}s">${ringHTML(sc)}<div style="flex:1;min-width:0">
      <div class="top" style="gap:10px"><div style="display:flex;gap:11px;align-items:center;min-width:0">${imgTag(photo(m), "", "thumb")}<div style="min-width:0"><h3 class="name">${esc(m.name)}</h3><div class="loc">${ccChip(m.country)} ${esc(m.country)} · ${pIco(m.pillar)} ${esc(m.pillar)}</div></div></div>${typeTag(m.type)}</div>
      <p class="reason">${bold(d.reason || "")}</p>${learnedBadge(d)}${matchProductsHTML(d.products)}
      <div class="action"><span class="ic">${ico("arrow")}</span><span>${esc(d.action || "Request an introduction.")}</span></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm btn-primary" onclick="go('#/member/${esc(m.id)}')">${ico("handshake")} Request introduction</button><button class="btn btn-sm" onclick="go('#/member/${esc(m.id)}')">${ico("eye")} View profile</button></div>
      ${out.searchId ? voteRow("member", m.id, "Good match?") : ""}
    </div></article>`;
  });
  html += `</div>`;
  res.innerHTML = html;
  wireVotes(res, out);
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
