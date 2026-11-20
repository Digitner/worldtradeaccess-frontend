import { describe, test, expect, beforeEach } from "vitest";
import { enhancePasswordFields, watchPasswordFields } from "../src/utils/passwordToggle.js";

const pw = (id) => `<div class="field"><label for="${id}">P</label><input id="${id}" type="password"><div class="err-msg">x</div></div>`;
beforeEach(() => { document.body.innerHTML = pw("a") + pw("b") + '<input id="t" type="text">'; });

describe("password eye button", () => {
  test("every password input gets one button, text inputs do not", () => {
    expect(enhancePasswordFields()).toBe(2);
    expect(document.querySelectorAll(".pw-eye").length).toBe(2);
    expect(document.getElementById("t").closest(".pw-wrap")).toBeNull();
  });
  test("is idempotent", () => {
    enhancePasswordFields(); expect(enhancePasswordFields()).toBe(0);
    expect(document.querySelectorAll(".pw-eye").length).toBe(2);
  });
  test("click shows then hides the password and updates the accessible state", () => {
    enhancePasswordFields();
    const input = document.getElementById("a"), btn = input.parentElement.querySelector(".pw-eye");
    expect(btn.getAttribute("aria-label")).toBe("Show password");
    btn.click();
    expect(input.type).toBe("text");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(btn.getAttribute("aria-label")).toBe("Hide password");
    btn.click();
    expect(input.type).toBe("password");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });
  test("the toggle button never submits the form", () => {
    enhancePasswordFields();
    expect(document.querySelector(".pw-eye").type).toBe("button");
  });
  test("keeps the value, the label link and the error message in the same field", () => {
    document.getElementById("a").value = "secret";
    enhancePasswordFields();
    const field = document.getElementById("a").closest(".field");
    expect(document.getElementById("a").value).toBe("secret");
    expect(field.querySelector('label[for="a"]')).not.toBeNull();
    expect(field.querySelector(".err-msg")).not.toBeNull();
  });
  test("inputs added later are enhanced by the watcher", async () => {
    const stop = watchPasswordFields();
    document.body.insertAdjacentHTML("beforeend", pw("late"));
    await new Promise((r) => setTimeout(r, 10));
    expect(document.getElementById("late").parentElement.querySelector(".pw-eye")).not.toBeNull();
    stop();
  });
});
