/* eslint-disable */
import { $ } from './helpers.js';
import { state } from './state.js';

/**
 * Legacy single-field required check (kept for pages not yet on utils/fields.js).
 * Toggles the red error state and message.
 * @param {string} id control id without #
 * @param {(v:string)=>boolean} [test] extra format check; default is non-empty
 * @returns {boolean} true when valid
 */
export function reqField(id,test){const el=$("#"+id);const bad=!(test?test(el.value.trim()):el.value.trim());el.classList.toggle("err",bad);el.setAttribute("aria-invalid",bad?"true":"false");const em=el.closest(".field")&&el.closest(".field").querySelector(".err-msg");if(em)em.classList.toggle("show",bad);return !bad;}

/* ================= state ================= */
