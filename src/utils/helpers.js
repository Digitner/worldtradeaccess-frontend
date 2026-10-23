/* eslint-disable */
import { ICONS } from '../constant/icons.js';
import { IMG } from '../constant/images.js';
import { PILLAR_IMG } from '../constant/pillars.js';

export function ico(n,cls){return `<svg class="ico ${cls||''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||ICONS.globe}</svg>`;}

/* ================= reference data ================= */

export const $=(s,r=document)=>r.querySelector(s);

export const $$=(s,r=document)=>[...r.querySelectorAll(s)];

export function esc(s){return (s==null?"":String(s)).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

export function bold(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");}

export function initialsOf(s){return (s||"?").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?";}

export function wc(s){return s.trim()?s.trim().split(/\s+/).length:0;}

export function load(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch(e){return fb;}}

export function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

export function img(key){return IMG[key]||"";}

export function photo(m){return img(m&&m.img)||img(PILLAR_IMG[m&&m.pillar])||"";}

export function imgTag(src,alt,cls){return src?`<img ${cls?`class="${cls}"`:""} src="${esc(src)}" alt="${esc(alt||"")}" loading="lazy">`:"";}

export function fmtDate(ts){try{return new Date(ts).toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}catch(e){return "";}}

export function fmtShort(ts){try{return new Date(ts).toLocaleDateString("en-GB",{day:"numeric",month:"short"});}catch(e){return "";}}

export function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
