/* eslint-disable */
/**
 * @file Show/hide ("eye") button for every password box in the app.
 * A MutationObserver adds it to inputs rendered later (page changes, the set-password popup), so no page has to
 * remember to call it. The button is keyboard-reachable and announces its state to screen readers.
 */

const EYE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.7 10.7 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/></svg>';

/**
 * Add an eye button to every password input under `root` that does not have one yet. Idempotent.
 * @param {ParentNode} [root] where to look (default: whole document)
 * @returns {number} how many inputs were enhanced
 */
export function enhancePasswordFields(root = document) {
  let n = 0;
  root.querySelectorAll('input[type="password"]:not([data-pwtoggle])').forEach((input) => {
    input.dataset.pwtoggle = "1";
    const wrap = document.createElement("div");
    wrap.className = "pw-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pw-eye";
    btn.setAttribute("aria-label", "Show password");
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = EYE;
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.innerHTML = show ? EYE_OFF : EYE;
    });
    wrap.appendChild(btn);
    n++;
  });
  return n;
}

/**
 * Enhance existing password inputs and keep watching for new ones.
 * @returns {()=>void} stop function
 */
export function watchPasswordFields() {
  enhancePasswordFields();
  const mo = new MutationObserver(() => enhancePasswordFields());
  mo.observe(document.body, { childList: true, subtree: true });
  return () => mo.disconnect();
}
