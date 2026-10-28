/* eslint-disable */
import { ccChip } from '../Chips/Chips.js';
import { esc, imgTag } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';

export function fundRailHTML(f){const cls=f.type==="For Sale"?"gold":f.type==="Seeking JV"?"":"green";const coverImg=f.cover_url||f.image_url||f.img||"";return `<button class="frail" onclick="go('#/deal/${esc(f.id)}')"><div class="ph">${coverImg?imgTag(coverImg,""):""}<span class="tag ${cls}">${esc(f.type)}</span></div><div class="b"><div class="mkt-name">${esc(f.company)}</div><div class="mkt-loc" style="margin:4px 0 2px">${ccChip(f.country)} ${esc(f.country)} · ${esc(f.sector)}</div><div class="amt">${esc(f.amount)}</div><div class="mkt-seek" style="margin-top:6px">${esc(f.desc)}</div></div></button>`;}

/* ================= HOME ================= */
