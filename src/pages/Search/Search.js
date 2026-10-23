/* eslint-disable */
import { carousel } from '../../components/Carousel/Carousel.js';
import { ccChip, pIco, typeTag } from '../../components/Chips/Chips.js';
import { ringHTML } from '../../components/ScoreRing/ScoreRing.js';
import { toast } from '../../components/Toasts/toast.js';
import { COMPAT, ROLE_META, TYPE_LABEL } from '../../constant/roles.js';
import { EXAMPLES, POP_SEARCH } from '../../constant/search.js';
import { $, $$, bold, esc, ico, img, imgTag, photo, wc } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { STORE, state } from '../../utils/state.js';
import { allMembers, record } from '../../utils/store.js';

export function quickSearch(q,role){state.HERO.q=q;state.HERO.role=role||"buy";go("#/search");}

export function viewSearch(app,_a,soft){
  if(soft&&state.SR.last)return; // keep the current answer on live data refresh
  if(state.HERO.q!=null)state.SR.role=state.HERO.role||state.SR.role;
  const preIntent=state.HERO.q!=null?state.HERO.q:((state.USER&&state.USER.seek)?state.USER.seek:"");
  const auto=state.HERO.q!=null||(!!preIntent&&!state.SR.last);
  state.HERO.q=null;state.HERO.role=null;
  const aiOn=!!STORE.sample;
  app.innerHTML=`
  <section><div class="wrap">
    <span class="kicker">The engine</span>
    <h1 class="page-h">Find your matches.</h1>
    <p class="page-sub">Pick your goal and describe what you seek. Claude reads every member's intent, answers your question directly, and ranks the best counterparties with the reasoning behind each match.</p>
    <div class="section-h" style="margin-top:18px"><h2 style="font-size:18px">Popular searches</h2></div>
    ${carousel(POP_SEARCH.map(x=>`<button class="fmt" style="width:262px;padding:0;overflow:hidden;cursor:pointer" onclick="quickSearch(this.dataset.q,this.dataset.r)" data-q="${esc(x.q)}" data-r="${x.role}"><span style="display:block;height:84px;position:relative;background:var(--navy)">${imgTag(img(x.img),"","cover-fill")}</span><span style="display:block;padding:12px 14px"><span style="display:flex;align-items:center;gap:8px;font-weight:600"><span style="color:var(--blue-text);display:inline-flex">${ico(x.ic)}</span>${esc(x.t)}</span><span class="muted" style="display:block;margin-top:5px">${esc(x.q)}</span></span></button>`).join(""),false,"Popular searches")}
    <form class="console" style="margin-top:20px" id="searchForm" novalidate>
      <span class="flabel" style="margin-bottom:11px">1 · I am here to…</span>
      <div class="roles" id="s_roles">${Object.entries(ROLE_META).map(([k,v])=>`<button type="button" class="role" data-role="${k}" aria-pressed="${k===state.SR.role}">${ico(v.ic)}${v.label}</button>`).join("")}</div>
      <label class="flabel" for="s_intent" style="margin:20px 0 11px">2 · Describe it, in 25 words</label>
      <div style="position:relative">
        <textarea id="s_intent" maxlength="320" placeholder="e.g. Mid-size food-processing SME in Kerala seeking a halal-certified snacks distributor in Malaysia and Indonesia.">${esc(preIntent)}</textarea>
        <span class="wordcount" id="s_wc" style="position:absolute;right:12px;bottom:10px;background:var(--surface);padding:2px 7px;border-radius:6px">0 words</span>
      </div>
      <div class="examples" id="s_examples"></div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:18px;flex-wrap:wrap">
        <button class="btn btn-primary" id="s_run" type="submit">${ico("sparkle")} Find matches <span class="arrow">→</span></button>
        <span class="engine ${aiOn?"on":""}" id="s_engine"><span class="live"></span><span>${aiOn?"Claude answers live":"On-device matching (AI not available in this view)"}</span></span>
      </div>
    </form>
    <div id="s_results" style="margin-top:24px"></div>
  </div></section>`;
  $("#s_roles").onclick=e=>{const b=e.target.closest(".role");if(!b)return;state.SR.role=b.dataset.role;$$("#s_roles .role").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));renderExamples();};
  const ta=$("#s_intent");
  const updWc=()=>{const n=wc(ta.value);$("#s_wc").textContent=n+" word"+(n===1?"":"s");$("#s_wc").classList.toggle("warn",n>25);};
  ta.oninput=updWc;updWc();
  ta.onkeydown=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")runSearch();};
  $("#searchForm").onsubmit=e=>{e.preventDefault();runSearch();};
  function renderExamples(){$("#s_examples").innerHTML=(EXAMPLES[state.SR.role]||[]).map((t,i)=>`<button type="button" class="chip" data-i="${i}">“${esc(t)}”</button>`).join("");$$("#s_examples .chip").forEach(b=>b.onclick=()=>{ta.value=EXAMPLES[state.SR.role][+b.dataset.i];updWc();ta.focus();});}
  renderExamples();
  if(state.SR.last&&!auto&&state.SR.last.q===ta.value.trim())renderMatches($("#s_results"),state.SR.last);
  else if(auto&&preIntent)setTimeout(runSearch,120);
}

export function directoryForAI(pool){return pool.map(m=>({id:m.id,name:m.name,country:m.country,sector:m.pillar,goal:TYPE_LABEL[m.type],seeks:m.seek}));}

export async function runSearch(){
  if(state.SR.busy)return;
  const q=$("#s_intent").value.trim(),res=$("#s_results");
  if(!q){res.innerHTML=`<div class="empty">${ico("search")} Describe what you're looking for, then run the match.</div>`;$("#s_intent").focus();return;}
  state.SR.busy=true;$("#s_run").disabled=true;
  res.innerHTML=`<div class="thinking" role="status"><div class="radar"><svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="20" stroke="var(--line)" stroke-width="2"/><path d="M22 2 a20 20 0 0 1 20 20" stroke="var(--blue-bright)" stroke-width="2.5" stroke-linecap="round"/></svg></div><div><div style="font-weight:600">${STORE.sample?"Claude is reading every member's intent…":"Scoring the network…"}</div><div class="muted">${STORE.sample?"Writing an answer and ranking counterparties. This usually takes a few seconds.":"Matching your words against member intent data"}</div></div></div>`;
  const role=state.SR.role;
  const pool=allMembers().filter(m=>COMPAT[role].includes(m.type)&&(!state.USER||m.id!==state.USER.id));
  let out=null;
  if(STORE.sample){
    try{out=await aiMatch(q,role,pool);out.live=true;}
    catch(e){
      if(e&&e.code==="not_granted"){STORE.sample=null;const en=$("#s_engine");if(en){en.classList.remove("on");en.lastElementChild.textContent="On-device matching (AI permission declined)";}}
      else if(e&&e.code==="rate_limited")toast("AI is busy","Too many requests right now. Showing on-device matches instead.",false);
      else if(e&&e.code!=="cancelled")toast("AI answer unavailable","Showing on-device matches instead.",false);
      out=null;
    }
  }
  if(!out)out={answer:"",matches:localMatch(q,pool,role),next:[],live:false};
  out.q=q;out.role=role;out.poolN=pool.length;out.pool=pool;
  state.SR.last=out;state.SR.chat=[];
  renderMatches(res,out);
  record("search",{goal:ROLE_META[role].label,intent:q,engine:out.live?"Claude (AI)":"On-device",top_matches:out.matches.slice(0,6).map(d=>`${d.m.name} (${Math.round(d.score)})`).join(", "),answer:out.answer||""});
  state.SR.busy=false;const btn=$("#s_run");if(btn)btn.disabled=false;
}

export async function aiMatch(q,role,pool){
  const prompt=`You are the matching engine and trade advisor for WorldTradeAccess, a B2B network for the BRICS-ASEAN corridor run by the BRICS-ASEAN Chamber of Commerce.
A member whose goal is "${ROLE_META[role].label}" asked:
"""${q}"""

Using ONLY the directory below (never invent companies), do two things:
1. Answer the member directly in 2-4 sentences of plain, practical advice: who the strongest counterparties are, what corridor/settlement/certification considerations matter, and what to do first. Name companies from the directory where relevant.
2. Rank up to 6 genuinely relevant counterparties.

Directory (JSON):
${JSON.stringify(directoryForAI(pool))}

Reply with ONLY one JSON object of this shape:
{"answer":"<2-4 sentences>","matches":[{"id":"<directory id>","score":<integer 40-99>,"reason":"<one sharp sentence, max 26 words; wrap the single most important phrase in **double asterisks**>","action":"<one concrete next step, max 14 words>"}],"next":["<follow-up question the member might ask, max 10 words>","<another>","<another>"]}
Order matches by score, highest first.`;
  const data=await STORE.sample.json(prompt,{modelTier:"default",cache:true});
  if(!data||!Array.isArray(data.matches))throw{code:"invalid_json"};
  const matches=data.matches.map(d=>({...d,score:Math.max(0,Math.min(99,Number(d.score)||0)),m:pool.find(x=>x.id===d.id)})).filter(d=>d.m).sort((a,b)=>b.score-a.score).slice(0,6);
  return {answer:String(data.answer||""),matches,next:Array.isArray(data.next)?data.next.slice(0,3).map(String):[]};
}

export function localMatch(q,pool,role){
  const stop=new Set("the a an and or for to of in on with seeking seek want wants looking need needs my our i we me across from into".split(" "));
  const toks=q.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(w=>w.length>2&&!stop.has(w));
  return pool.map(m=>{
    const hay=(m.seek+" "+m.name+" "+m.country+" "+m.pillar).toLowerCase();
    const matched=toks.filter(t=>hay.includes(t));
    const score=Math.min(96,38+matched.length*(toks.length?Math.round(52/Math.max(3,toks.length)):8)+(matched.length?8:0));
    return {m,score,matched};
  }).filter(x=>x.matched.length).sort((a,b)=>b.score-a.score).slice(0,6).map(s=>({id:s.m.id,score:s.score,m:s.m,reason:`Aligns on ${s.matched.slice(0,3).map(x=>"**"+x+"**").join(", ")}, a ${TYPE_LABEL[s.m.type].toLowerCase()} counterparty in ${s.m.country}.`,action:(role==="invest"||role==="capital")?"Open a capital conversation.":"Request an introduction."}));
}

export function renderMatches(res,out){
  const list=out.matches;
  let html="";
  if(out.live&&out.answer){
    html+=`<div class="answer"><div class="hd"><span class="ai">${ico("sparkle")}</span><b class="serif" style="font-size:18px">Claude's answer</b><span class="badge-ai"><span class="live-dot" style="width:6px;height:6px;box-shadow:none"></span>Generated live</span></div><p>${bold(out.answer)}</p>${out.next&&out.next.length?`<div class="examples" style="margin-top:14px">${out.next.map((n,i)=>`<button class="chip" onclick="askFollow(state.SR.last.next[${i}])">${ico("send")} ${esc(n)}</button>`).join("")}</div>`:""}</div>`;
  }
  if(!list.length){res.innerHTML=html+`<div class="empty">No strong matches in the network for that one. Try a different sector, goal or one of the examples.</div>`;return;}
  html+=`<div class="top" style="margin-bottom:14px;align-items:center"><div style="font-weight:600"><span style="color:var(--blue-text)">${list.length}</span> strong ${list.length===1?"match":"matches"} across ${out.poolN} eligible members</div>${out.live?`<span class="badge-ai">${ico("sparkle")} Ranked by Claude</span>`:`<span class="badge-ai off">${ico("cube")} On-device match</span>`}</div><div class="match-grid">`;
  list.forEach((d,i)=>{const m=d.m,sc=Math.round(d.score);
    html+=`<article class="match" style="animation-delay:${i*.06}s">${ringHTML(sc)}<div style="flex:1;min-width:0">
      <div class="top" style="gap:10px"><div style="display:flex;gap:11px;align-items:center;min-width:0">${imgTag(photo(m),"","thumb")}<div style="min-width:0"><h3 class="name">${esc(m.name)}</h3><div class="loc">${ccChip(m.country)} ${esc(m.country)} · ${pIco(m.pillar)} ${esc(m.pillar)}</div></div></div>${typeTag(m.type)}</div>
      <p class="reason">${bold(d.reason||"")}</p>
      <div class="action"><span class="ic">${ico("arrow")}</span><span>${esc(d.action||"Request an introduction.")}</span></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm btn-primary" onclick="go('#/member/${esc(m.id)}')">${ico("handshake")} Request introduction</button><button class="btn btn-sm" onclick="go('#/member/${esc(m.id)}')">${ico("eye")} View profile</button></div>
    </div></article>`;});
  html+=`</div>`;
  if(STORE.sample){
    html+=`<div class="card chat"><div class="top" style="align-items:center"><h2 style="font-size:18px;margin:0;display:flex;gap:9px;align-items:center"><span style="color:var(--blue-text);display:inline-flex">${ico("sparkle")}</span>Ask a follow-up</h2><span class="muted">Claude answers using these matches and the member directory</span></div>
      <div class="chat-log" id="chatLog" aria-live="polite"></div>
      <div class="examples" id="chatSugg">${["Which of these accept local-currency settlement?","Draft an intro message to the top match","What documents should I prepare first?"].map(s=>`<button class="chip" onclick="askFollow(this.textContent)">${esc(s)}</button>`).join("")}</div>
      <form class="chat-form" id="chatForm" style="margin-top:12px"><label class="vh" for="chatQ">Your follow-up question</label><input id="chatQ" placeholder="Ask about these matches…" autocomplete="off"><button class="btn btn-primary" type="submit">${ico("send")}<span class="hide-sm">Ask</span></button></form></div>`;
  }
  res.innerHTML=html;
  const cf=$("#chatForm");if(cf)cf.onsubmit=e=>{e.preventDefault();const v=$("#chatQ").value.trim();if(v){$("#chatQ").value="";askFollow(v);}};
  renderChat();
}

export function renderChat(){const log=$("#chatLog");if(!log)return;log.innerHTML=state.SR.chat.map((t,i)=>`<div class="bubble ${t.role==="user"?"me":"ai"}" ${t.role==="assistant"?`id="bub${i}"`:""}>${esc(t.content||"Thinking…")}</div>`).join("");}

export async function askFollow(question){
  if(!STORE.sample||!state.SR.last||state.SR.chatBusy)return;
  state.SR.chatBusy=true;
  const ctx=state.SR.last;
  const rules=`You are WorldTradeAccess's trade advisor for the BRICS-ASEAN corridor. Answer the member's follow-up concisely (under 140 words), practically, in plain text without markdown headings. Use ONLY these facts.
Member goal: ${ROLE_META[ctx.role].label}. Their intent: "${ctx.q}".
Ranked matches: ${JSON.stringify(ctx.matches.map(d=>({name:d.m.name,country:d.m.country,seeks:d.m.seek,contact:d.m.person?d.m.person+", "+(d.m.role_t||""):"",score:Math.round(d.score),why:String(d.reason||"").replace(/\*\*/g,"")})))}
Wider directory: ${JSON.stringify(directoryForAI(ctx.pool).slice(0,40))}
If asked to draft a message, write it ready to send, signed as the member${state.USER&&state.USER.person?` (${state.USER.person}, ${state.USER.name})`:""}.`;
  state.SR.chat.push({role:"user",content:question});state.SR.chat.push({role:"assistant",content:""});renderChat();
  const idx=state.SR.chat.length-1;
  const turns=[{role:"user",content:rules},{role:"assistant",content:"Understood. What would you like to know?"},...state.SR.chat.slice(0,-1).filter(t=>t.content)];
  try{
    const {text}=await STORE.sample(turns,{cache:false,modelTier:"default",onText:({text})=>{state.SR.chat[idx].content=text;const b=$("#bub"+idx);if(b)b.textContent=text;}});
    state.SR.chat[idx].content=text;
  }catch(e){state.SR.chat[idx].content=e&&e.text?e.text:(e&&e.code==="rate_limited"?"Claude is busy right now. Try again in a minute.":"Claude couldn't answer that just now. Try again.");}
  renderChat();state.SR.chatBusy=false;
}

/* ================= DIRECTORY ================= */
