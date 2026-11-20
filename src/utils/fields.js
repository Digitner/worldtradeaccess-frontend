/* eslint-disable */
/**
 * @file Field colour-coding + validation standard (SOP).
 *
 *  - MANDATORY (red)   : strict required-field validation, red label/border/asterisk.
 *  - AUTO      (blue)  : system-filled, read-only, cannot be overwritten by the user; blue label/border/tint.
 *  - OPTIONAL  (green) : may stay empty; format is validated ONLY when a value is typed; green label/border.
 *
 * The kind is carried by a modifier class on the `.field` wrapper (`field--mandatory|auto|optional`), styled in
 * themes/theme.css. Keeping the state in classes (not inline styles) makes it testable and themeable.
 */
import { $ } from './helpers.js';

/** @enum {string} The three field kinds of the SOP. */
export const FIELD_KIND = Object.freeze({ MANDATORY: "mandatory", AUTO: "auto", OPTIONAL: "optional" });

/** @type {Record<string,string>} Wrapper class for each kind. */
export const KIND_CLASS = Object.freeze({
  mandatory: "field--mandatory",
  auto: "field--auto",
  optional: "field--optional",
});

/**
 * Reusable format validators. Each takes the trimmed value and returns true when it is acceptable.
 * They never treat "empty" specially: emptiness is decided by the field KIND, not by the format rule.
 * @type {Record<string,(v:string)=>boolean>}
 */
export const validators = {
  /** @param {string} v @returns {boolean} non-empty after trimming */
  required: (v) => String(v ?? "").trim().length > 0,
  /** @param {string} v @returns {boolean} looks like name@host.tld */
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  /** @param {string} v @returns {boolean} 7-15 digits, optional leading +, spaces/dashes/brackets allowed (E.164 length) */
  phone: (v) => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15,
  /** @param {string} v @returns {boolean} domain with optional scheme/path, e.g. company.com or https://a.co/x */
  url: (v) => /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(v),
  /** @param {string} v @returns {boolean} 8-128 chars with at least one letter and one digit (mirrors the server rule) */
  password: (v) => /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(v),
  /** @param {string} v @returns {boolean} exactly six digits (OTP) */
  otp: (v) => /^\d{6}$/.test(v),
};

/**
 * Locate the label element that belongs to a control.
 * @param {HTMLElement} el form control
 * @returns {HTMLElement|null}
 */
function labelOf(el) {
  const wrap = el.closest(".field");
  return (wrap && (wrap.querySelector(`label[for="${el.id}"]`) || wrap.querySelector("label, .flabel"))) || null;
}

/**
 * Put a field into one of the three kinds: sets the wrapper class, the marker next to the label and, for AUTO
 * fields, locks the control. Safe to call repeatedly (idempotent).
 * @param {string} id control id (without #)
 * @param {"mandatory"|"auto"|"optional"} kind
 * @param {{autoValue?:string}} [opts] AUTO only: the system value to show
 * @returns {HTMLElement|null} the control, or null when it is not in the DOM
 */
export function applyKind(id, kind, opts = {}) {
  const el = $("#" + id);
  if (!el) return null;
  const wrap = el.closest(".field");
  if (wrap) {
    Object.values(KIND_CLASS).forEach((c) => wrap.classList.remove(c));
    wrap.classList.add(KIND_CLASS[kind]);
    wrap.dataset.kind = kind;
  }
  el.dataset.kind = kind;
  const label = labelOf(el);
  if (label) {
    // Replace any previous marker so the label never shows two states at once.
    label.querySelectorAll(".req, .opt-tag, .auto-tag").forEach((n) => n.remove());
    const m = document.createElement("span");
    if (kind === FIELD_KIND.MANDATORY) { m.className = "req"; m.textContent = " *"; m.setAttribute("aria-hidden", "true"); }
    if (kind === FIELD_KIND.OPTIONAL) { m.className = "opt-tag"; m.textContent = " (optional)"; }
    if (kind === FIELD_KIND.AUTO) { m.className = "auto-tag"; m.textContent = " (auto)"; }
    label.appendChild(m);
  }
  if (kind === FIELD_KIND.MANDATORY) el.setAttribute("aria-required", "true");
  else el.removeAttribute("aria-required");
  if (kind === FIELD_KIND.AUTO) lockAuto(id, opts.autoValue ?? el.value);
  return el;
}

/**
 * Lock an auto-generated field. WHY several guards: `readonly` stops typing, but paste/drop/devtools edits and
 * programmatic changes can still land, so the value is re-asserted on every input event too.
 * Selects/checkboxes cannot be read-only, so they are disabled instead.
 * @param {string} id control id
 * @param {string} value system-generated value
 */
export function lockAuto(id, value) {
  const el = $("#" + id);
  if (!el) return;
  el.value = value ?? "";
  el.dataset.autoValue = el.value;
  el.setAttribute("aria-readonly", "true");
  if (el.tagName === "SELECT" || el.type === "checkbox") el.disabled = true;
  else el.readOnly = true;
  if (!el.__autoGuard) {
    el.__autoGuard = true;
    const restore = () => { if (el.value !== el.dataset.autoValue) el.value = el.dataset.autoValue; };
    ["input", "change", "drop", "paste", "cut"].forEach((ev) => el.addEventListener(ev, (e) => {
      if (ev === "drop" || ev === "paste" || ev === "cut") e.preventDefault();
      restore();
    }));
  }
}

/**
 * The ONLY sanctioned way to change an auto field's value (the system, not the user, calls this).
 * @param {string} id control id
 * @param {string} value new system value
 */
export function setAutoValue(id, value) {
  const el = $("#" + id);
  if (!el) return;
  el.dataset.autoValue = value ?? "";
  el.value = el.dataset.autoValue;
}

/**
 * Show or clear the error state on a control and its `.err-msg`.
 * @param {HTMLElement} el control
 * @param {boolean} bad true to show the error
 * @param {string} [msg] replacement message text
 */
function paint(el, bad, msg) {
  el.classList.toggle("err", bad);
  el.setAttribute("aria-invalid", bad ? "true" : "false");
  const em = el.closest(".field") && el.closest(".field").querySelector(".err-msg");
  if (em) {
    if (msg && bad) em.textContent = msg;
    em.classList.toggle("show", bad);
  }
}

/**
 * Validate one field according to its kind.
 *  - mandatory: must be non-empty AND pass `rule` when one is given.
 *  - optional : empty is fine (error cleared); a typed value must pass `rule`.
 *  - auto     : never blocks; the value is re-asserted to the system value.
 * @param {string} id control id
 * @param {"mandatory"|"auto"|"optional"} kind
 * @param {(v:string)=>boolean} [rule] format validator
 * @param {string} [msg] message to show on failure
 * @returns {boolean} true when the field is acceptable
 */
export function validateField(id, kind, rule, msg) {
  const el = $("#" + id);
  if (!el) return true;
  const v = String(el.value ?? "").trim();
  if (kind === FIELD_KIND.AUTO) {
    if (el.dataset.autoValue !== undefined && el.value !== el.dataset.autoValue) el.value = el.dataset.autoValue;
    paint(el, false);
    return true;
  }
  let ok;
  if (kind === FIELD_KIND.OPTIONAL) ok = v === "" || (rule ? rule(v) : true);
  else ok = v !== "" && (rule ? rule(v) : true);
  paint(el, !ok, msg);
  return ok;
}

/**
 * Apply kinds to a whole form from one declarative spec, and validate it later with the same spec.
 * @typedef {{kind:"mandatory"|"auto"|"optional", rule?:(v:string)=>boolean, msg?:string, autoValue?:string}} FieldSpec
 * @param {Record<string,FieldSpec>} spec map of control id -> spec
 * @returns {{validate:()=>boolean, firstInvalid:()=>HTMLElement|null}} handle to validate on submit
 */
export function decorateForm(spec) {
  Object.entries(spec).forEach(([id, s]) => applyKind(id, s.kind, { autoValue: s.autoValue }));
  // Live feedback: re-check a field as soon as it loses focus, and clear its error while typing.
  Object.entries(spec).forEach(([id, s]) => {
    const el = $("#" + id);
    if (!el || s.kind === FIELD_KIND.AUTO) return;
    el.addEventListener("blur", () => { if (el.value !== "" || s.kind === FIELD_KIND.MANDATORY) validateField(id, s.kind, s.rule, s.msg); });
    el.addEventListener("input", () => { if (el.classList.contains("err")) validateField(id, s.kind, s.rule, s.msg); });
  });
  return {
    validate: () => Object.entries(spec).map(([id, s]) => validateField(id, s.kind, s.rule, s.msg)).every(Boolean),
    firstInvalid: () => Object.keys(spec).map((id) => $("#" + id)).find((el) => el && el.classList.contains("err")) || null,
  };
}
