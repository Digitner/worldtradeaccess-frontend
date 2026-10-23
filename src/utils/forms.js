/* eslint-disable */
import { $ } from './helpers.js';
import { state } from './state.js';

export function reqField(id,test){const el=$("#"+id);const bad=!(test?test(el.value.trim()):el.value.trim());el.classList.toggle("err",bad);el.setAttribute("aria-invalid",bad?"true":"false");const em=el.closest(".field")&&el.closest(".field").querySelector(".err-msg");if(em)em.classList.toggle("show",bad);return !bad;}

/* ================= state ================= */
