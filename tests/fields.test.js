import { describe, test, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { applyKind, validateField, decorateForm, setAutoValue, lockAuto, validators, FIELD_KIND, KIND_CLASS } from "../src/utils/fields.js";

/** Build a one-field form so each test starts from a clean DOM. */
const mount = (html) => { document.body.innerHTML = `<form>${html}</form>`; };
const field = (id, extra = "") => `<div class="field"><label for="${id}">Label</label><input id="${id}" ${extra}><div class="err-msg">bad</div></div>`;
const wrapOf = (id) => document.getElementById(id).closest(".field");

describe("validators", () => {
  test.each([["a@b.co", true], ["a@b", false], ["a b@c.com", false], ["", false]])("email %s", (v, ok) => expect(validators.email(v)).toBe(ok));
  test.each([["+60 12 345 6789", true], ["1234567", true], ["12345", false], ["abc1234567", false], ["1".repeat(16), false]])("phone %s", (v, ok) => expect(validators.phone(v)).toBe(ok));
  test.each([["company.com", true], ["https://a.co/x?y=1", true], ["not a url", false], ["http://", false]])("url %s", (v, ok) => expect(validators.url(v)).toBe(ok));
  test.each([["abcdefg1", true], ["abcdefgh", false], ["12345678", false], ["a1", false]])("password %s", (v, ok) => expect(validators.password(v)).toBe(ok));
  test.each([["123456", true], ["12345", false], ["12a456", false]])("otp %s", (v, ok) => expect(validators.otp(v)).toBe(ok));
  test("required trims", () => { expect(validators.required("  ")).toBe(false); expect(validators.required(" x ")).toBe(true); });
});

describe("mandatory fields (red)", () => {
  beforeEach(() => mount(field("m")));

  test("gets the red class, asterisk and aria-required", () => {
    applyKind("m", FIELD_KIND.MANDATORY);
    expect(wrapOf("m").classList.contains(KIND_CLASS.mandatory)).toBe(true);
    expect(wrapOf("m").querySelector("label .req")).not.toBeNull();
    expect(document.getElementById("m").getAttribute("aria-required")).toBe("true");
  });
  test("empty value triggers the error state", () => {
    applyKind("m", FIELD_KIND.MANDATORY);
    expect(validateField("m", "mandatory")).toBe(false);
    expect(document.getElementById("m").classList.contains("err")).toBe(true);
    expect(wrapOf("m").querySelector(".err-msg").classList.contains("show")).toBe(true);
  });
  test("whitespace-only counts as empty", () => {
    applyKind("m", "mandatory"); document.getElementById("m").value = "   ";
    expect(validateField("m", "mandatory")).toBe(false);
  });
  test("invalid format triggers an error even when filled", () => {
    applyKind("m", "mandatory"); document.getElementById("m").value = "nope";
    expect(validateField("m", "mandatory", validators.email)).toBe(false);
  });
  test("valid value clears the error and shows the custom message on failure", () => {
    applyKind("m", "mandatory");
    validateField("m", "mandatory", validators.email, "Custom msg");
    expect(wrapOf("m").querySelector(".err-msg").textContent).toBe("Custom msg");
    document.getElementById("m").value = "a@b.co";
    expect(validateField("m", "mandatory", validators.email)).toBe(true);
    expect(document.getElementById("m").classList.contains("err")).toBe(false);
    expect(document.getElementById("m").getAttribute("aria-invalid")).toBe("false");
  });
});

describe("auto-generated fields (blue)", () => {
  beforeEach(() => mount(field("a")));

  test("gets the blue class, auto tag, value and is read-only", () => {
    applyKind("a", FIELD_KIND.AUTO, { autoValue: "sys@wta.org" });
    const el = document.getElementById("a");
    expect(wrapOf("a").classList.contains(KIND_CLASS.auto)).toBe(true);
    expect(wrapOf("a").querySelector(".auto-tag")).not.toBeNull();
    expect(el.value).toBe("sys@wta.org");
    expect(el.readOnly).toBe(true);
    expect(el.getAttribute("aria-readonly")).toBe("true");
  });
  test("an input event cannot overwrite the value", () => {
    applyKind("a", "auto", { autoValue: "ORIGINAL" });
    const el = document.getElementById("a");
    el.value = "hacked"; el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("ORIGINAL");
  });
  test("paste and drop are blocked", () => {
    applyKind("a", "auto", { autoValue: "ORIGINAL" });
    const el = document.getElementById("a");
    for (const type of ["paste", "drop", "cut"]) {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      el.value = "x"; el.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      expect(el.value).toBe("ORIGINAL");
    }
  });
  test("validation re-asserts the system value and never blocks", () => {
    applyKind("a", "auto", { autoValue: "ORIGINAL" });
    const el = document.getElementById("a"); el.value = "tampered";
    expect(validateField("a", "auto")).toBe(true);
    expect(el.value).toBe("ORIGINAL");
  });
  test("the system can update it through setAutoValue, and the new value is then protected", () => {
    applyKind("a", "auto", { autoValue: "ONE" });
    setAutoValue("a", "TWO");
    const el = document.getElementById("a");
    expect(el.value).toBe("TWO");
    el.value = "x"; el.dispatchEvent(new Event("input"));
    expect(el.value).toBe("TWO");
  });
  test("selects are disabled instead of read-only", () => {
    mount(`<div class="field"><label for="s">L</label><select id="s"><option>A</option><option>B</option></select></div>`);
    lockAuto("s", "B");
    expect(document.getElementById("s").disabled).toBe(true);
    expect(document.getElementById("s").value).toBe("B");
  });
});

describe("optional fields (green)", () => {
  beforeEach(() => mount(field("o")));

  test("gets the green class and an (optional) tag, and no asterisk", () => {
    applyKind("o", FIELD_KIND.OPTIONAL);
    expect(wrapOf("o").classList.contains(KIND_CLASS.optional)).toBe(true);
    expect(wrapOf("o").querySelector(".opt-tag")).not.toBeNull();
    expect(wrapOf("o").querySelector("label .req")).toBeNull();
    expect(document.getElementById("o").hasAttribute("aria-required")).toBe(false);
  });
  test("empty is allowed, with or without a format rule", () => {
    applyKind("o", "optional");
    expect(validateField("o", "optional")).toBe(true);
    expect(validateField("o", "optional", validators.phone)).toBe(true);
    expect(document.getElementById("o").classList.contains("err")).toBe(false);
  });
  test("a filled value is format-validated", () => {
    applyKind("o", "optional"); const el = document.getElementById("o");
    el.value = "abc"; expect(validateField("o", "optional", validators.phone)).toBe(false);
    expect(el.classList.contains("err")).toBe(true);
    el.value = "+60 12 345 6789"; expect(validateField("o", "optional", validators.phone)).toBe(true);
    expect(el.classList.contains("err")).toBe(false);
  });
  test("clearing a bad value makes it valid again", () => {
    applyKind("o", "optional"); const el = document.getElementById("o");
    el.value = "bad"; validateField("o", "optional", validators.url);
    el.value = ""; expect(validateField("o", "optional", validators.url)).toBe(true);
  });
});

describe("kind switching", () => {
  test("re-applying a kind replaces the previous class and marker", () => {
    mount(field("x"));
    applyKind("x", "mandatory"); applyKind("x", "optional");
    const w = wrapOf("x");
    expect(w.classList.contains(KIND_CLASS.mandatory)).toBe(false);
    expect(w.classList.contains(KIND_CLASS.optional)).toBe(true);
    expect(w.querySelectorAll("label .req, label .opt-tag, label .auto-tag").length).toBe(1);
  });
  test("a missing control is ignored safely", () => {
    mount("");
    expect(applyKind("nope", "mandatory")).toBeNull();
    expect(validateField("nope", "mandatory")).toBe(true);
  });
});

describe("decorateForm", () => {
  const html = field("m") + field("o") + field("a");
  const spec = () => ({
    m: { kind: "mandatory", rule: validators.email },
    o: { kind: "optional", rule: validators.phone },
    a: { kind: "auto", autoValue: "SYS" },
  });

  test("applies every kind from one spec", () => {
    mount(html); decorateForm(spec());
    expect(wrapOf("m").dataset.kind).toBe("mandatory");
    expect(wrapOf("o").dataset.kind).toBe("optional");
    expect(wrapOf("a").dataset.kind).toBe("auto");
  });
  test("form is invalid while the mandatory field is empty, even though the optional is empty too", () => {
    mount(html); const f = decorateForm(spec());
    expect(f.validate()).toBe(false);
    expect(f.firstInvalid().id).toBe("m");
  });
  test("form submits when mandatory is valid and optional is left empty", () => {
    mount(html); const f = decorateForm(spec());
    document.getElementById("m").value = "a@b.co";
    expect(f.validate()).toBe(true);
    expect(f.firstInvalid()).toBeNull();
  });
  test("a bad optional value blocks the form", () => {
    mount(html); const f = decorateForm(spec());
    document.getElementById("m").value = "a@b.co"; document.getElementById("o").value = "xx";
    expect(f.validate()).toBe(false);
  });
  test("blur validates a mandatory field; typing clears its error live", () => {
    mount(html); decorateForm(spec());
    const m = document.getElementById("m");
    m.dispatchEvent(new Event("blur"));
    expect(m.classList.contains("err")).toBe(true);
    m.value = "a@b.co"; m.dispatchEvent(new Event("input"));
    expect(m.classList.contains("err")).toBe(false);
  });
  test("blur on an empty optional field stays clean", () => {
    mount(html); decorateForm(spec());
    const o = document.getElementById("o"); o.dispatchEvent(new Event("blur"));
    expect(o.classList.contains("err")).toBe(false);
  });
});

describe("theme.css colour standard", () => {
  const css = fs.readFileSync(path.resolve(process.cwd(), "src/themes/theme.css"), "utf8");
  test.each([
    [".field--mandatory label", "var(--red)"],
    [".field--auto label", "var(--blue-text)"],
    [".field--optional label", "var(--green-text)"],
  ])("%s uses %s", (sel, color) => {
    const m = css.match(new RegExp(sel.replace(/[.\-]/g, "\\$&") + ",?[^{]*\\{([^}]*)\\}"));
    expect(m && m[1]).toContain(`color:${color}`);
  });
  test("each kind has a border rule in its colour", () => {
    expect(css).toMatch(/\.field--mandatory input[^{]*\{border-color:var\(--red\)\}/);
    expect(css).toMatch(/\.field--auto input[^{]*\{[^}]*border-color:var\(--blue\)[^}]*background:var\(--blue-soft\)/);
    expect(css).toMatch(/\.field--optional input[^{]*\{border-color:var\(--green\)\}/);
  });
});
