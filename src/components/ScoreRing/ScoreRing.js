/* eslint-disable */
import { img } from '../../utils/helpers.js';

export function ringHTML(sc){const circ=2*Math.PI*22,off=circ*(1-sc/100);const col=sc>=85?"var(--green)":sc>=70?"var(--blue-bright)":"var(--gold)";const txt=sc>=85?"var(--green-text)":sc>=70?"var(--blue-text)":"var(--gold-text)";return `<div class="ring" role="img" aria-label="Match score ${sc} of 100"><svg width="54" height="54" viewBox="0 0 56 56"><circle cx="28" cy="28" r="22" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="28" cy="28" r="22" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"/></svg><div class="val" style="color:${txt}">${sc}</div></div>`;}
