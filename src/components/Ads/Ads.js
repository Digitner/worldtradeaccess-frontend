/* eslint-disable */
import { toast } from '../Toasts/toast.js';
import { ADS_LEADER, ADS_SIDE } from '../../constant/seed.js';
import { esc, ico } from '../../utils/helpers.js';

export function adClick(){toast("Sponsored placement","In production this opens the advertiser's page.");}

export function adLeaderHTML(i){const a=ADS_LEADER[(i||0)%ADS_LEADER.length];return `<aside class="ad ad-leader" aria-label="Advertisement"><span class="ad-label">Advertisement</span><div class="logo">${ico(a.logo)}</div><div style="flex:1 1 280px;min-width:0"><h4>${esc(a.title)}</h4><p>${esc(a.body)}</p></div><button class="btn btn-gold btn-sm" onclick="adClick()">${esc(a.cta)}</button></aside>`;}

export function adSideHTML(i){const a=ADS_SIDE[(i||0)%ADS_SIDE.length];return `<aside class="ad ad-side" style="margin-top:16px" aria-label="Advertisement"><span class="ad-label">Ad</span><div class="logo">${ico(a.logo)}</div><h4>${esc(a.title)}</h4><p>${esc(a.body)}</p><button class="btn btn-sm btn-block" style="margin-top:12px" onclick="adClick()">Visit sponsor</button></aside>`;}

export function adInlineHTML(i){const a=ADS_SIDE[(i||0)%ADS_SIDE.length];return `<aside class="ad ad-inline" aria-label="Advertisement"><span class="ad-label">Sponsored</span><div class="logo">${ico(a.logo)}</div><div style="flex:1;min-width:0;padding-right:40px"><h4>${esc(a.title)}</h4><p>${esc(a.body)}</p></div><button class="btn btn-sm" onclick="adClick()">Visit</button></aside>`;}
