/* eslint-disable */
import { ccChip, pIco, typeTag } from '../Chips/Chips.js';
import { esc, ico, imgTag, photo } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';

export function mktCardHTML(m){
  return `<button class="mkt" onclick="go('#/member/${esc(m.id)}')" aria-label="${esc(m.name)}, ${esc(m.country)}"><div class="mkt-cover">${imgTag(photo(m),"","cover-fill")}${ccChip(m.country,"on-photo mkt-flag")}<span class="mkt-pill">${pIco(m.pillar)} ${esc(m.pillar)}</span>${m.spon?'<span class="spon-badge" style="position:absolute;top:10px;left:10px;z-index:1">Sponsored</span>':""}${m.mine?'<span class="spon-badge" style="position:absolute;top:10px;left:10px;z-index:1;background:#e4f5ec;color:#145f3c">You</span>':""}</div><div class="mkt-body"><span class="mkt-name">${esc(m.name)}</span><span class="mkt-loc">${ico("pin")}${esc(m.country)}</span><span class="mkt-seek">${esc(m.seek)}</span><span class="mkt-foot">${typeTag(m.type)}<span class="mkt-cta">View →</span></span></div></button>`;
}
