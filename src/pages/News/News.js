/* eslint-disable */
import { toast } from '../../components/Toasts/toast.js';
import { NEWS_TOPICS } from '../../constant/news.js';
import { reqField } from '../../utils/forms.js';
import useServices from './hooks/useServices.js';
import { $, $$, esc, ico, img, imgTag, isEmail } from '../../utils/helpers.js';
import { state } from '../../utils/state.js';

const _svc = useServices();

export async function viewNews(app) {
  app.innerHTML = `
  <section><div class="wrap">
    <span class="kicker">Newsroom</span>
    <h1 class="page-h">World trade news &amp; alerts.</h1>
    <p class="page-sub">Briefings on trade flows, policy and opportunities across the two blocs. Subscribe to get alerts matched to your sectors.</p>
    <div class="split" style="margin-top:18px">
      <div class="main" id="newsMain"><div class="loading-shimmer" style="height:300px;border-radius:12px"></div></div>
      <div class="side">
        <form class="card" id="alertForm" novalidate>
          <h2 style="font-size:18px;margin:0 0 4px;display:flex;gap:8px;align-items:center"><span style="color:var(--blue-text);display:inline-flex">${ico("bell")}</span>News alerts</h2>
          <p class="muted" style="margin:0 0 14px">Get briefings matched to the sectors you care about.</p>
          <div class="field" style="margin-bottom:12px"><label for="na_email">${ico("mail")}Email <span class="req">*</span></label><input id="na_email" type="email" value="${state.USER ? esc(state.USER.email || "") : ""}" placeholder="you@company.com"><div class="err-msg">Enter a valid email, like name@company.com</div></div>
          <fieldset style="border:none;padding:0;margin:0"><legend class="flabel" style="margin-bottom:6px">Topics</legend>
            <div style="display:flex;flex-direction:column;gap:8px">${NEWS_TOPICS.map((t, i) => `<label style="display:flex;gap:10px;align-items:center;font-size:14px;cursor:pointer"><input type="checkbox" class="na_topic" id="na_t${i}" value="${esc(t)}" style="width:18px;min-height:18px;height:18px" ${i < 2 ? "checked" : ""}> ${esc(t)}</label>`).join("")}</div>
          </fieldset>
          <button class="btn btn-primary btn-block" id="alertBtn" type="submit" style="margin-top:16px">${ico("bell")} Subscribe to alerts</button>
        </form>
      </div>
    </div>
  </div></section>`;

  // Load news from API
  const articles = await _svc.getNews();
  const mainEl = document.getElementById("newsMain");
  if (mainEl) {
    if (articles.length) {
      mainEl.innerHTML = articles.map(n => `<article class="news-item"><div class="ph">${imgTag(n.image_url ? n.image_url : "", "")}</div><div class="b"><div class="news-meta"><span class="tag">${ico("news")}${esc(n.category || n.cat || "News")}</span><span style="display:inline-flex;gap:5px;align-items:center">${ico("calendar")}${esc(n.published_date || n.date || "")}</span></div><h3>${esc(n.title)}</h3><p class="muted" style="margin:0;font-size:14.5px">${esc(n.excerpt || "")}</p><div class="news-body" id="nb_${n._id || n.id}" hidden>${esc(n.body || n.content || "")}</div><button class="btn btn-sm btn-ghost" style="margin-top:10px;padding-left:0" aria-expanded="false" aria-controls="nb_${n._id || n.id}" onclick="toggleNews('${esc(n._id || n.id)}',this)">Read more</button></div></article>`).join("");
    } else {
      mainEl.innerHTML = `<div class="empty">No news articles yet. Check back soon.</div>`;
    }
  }

  $("#alertForm").onsubmit = async (e) => {
    e.preventDefault();
    if (!reqField("na_email", isEmail)) return;
    const topics = $$(".na_topic").filter(c => c.checked).map(c => c.value);
    if (!topics.length) { toast("Select topics", "Choose at least one topic to subscribe.", false); return; }
    const btn = $("#alertBtn"); btn.disabled = true; btn.textContent = "Subscribing…";
    const ok = await _svc.subscribeAlerts({ email: $("#na_email").value.trim(), topics });
    if (ok) {
      btn.innerHTML = `${ico("check")} Subscribed!`;
      btn.style.background = "var(--green-text,#16a34a)";
    } else {
      btn.disabled = false;
      btn.innerHTML = `${ico("bell")} Subscribe to alerts`;
    }
  };
}

export function toggleNews(id, btn) {
  const el = document.getElementById("nb_" + id);
  if (!el) return;
  el.hidden = !el.hidden;
  btn.textContent = el.hidden ? "Read more" : "Show less";
  btn.setAttribute("aria-expanded", String(!el.hidden));
}
