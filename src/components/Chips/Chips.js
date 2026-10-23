/* eslint-disable */
import { CC } from '../../constant/countries.js';
import { PILLAR_IC } from '../../constant/pillars.js';
import { ROLE_META, TYPE_LABEL } from '../../constant/roles.js';
import { esc, ico } from '../../utils/helpers.js';

export function ccChip(c,cls){return `<span class="cc ${cls||''}" title="${esc(c)}">${esc(CC[c]||"··")}</span>`;}

export function pIco(p){return ico(PILLAR_IC[p]||"globe");}

export function typeTag(t){return `<span class="tag ${t==="invest"||t==="capital"?"gold":""}">${ico(ROLE_META[t]?ROLE_META[t].ic:"globe")}${TYPE_LABEL[t]||"Member"}</span>`;}
