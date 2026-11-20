/* eslint-disable */
import { renderChrome } from '../components/Navbar/navbar.js';
import { load, save } from '../utils/helpers.js';

/**
 * True when the dark theme is in effect (explicit choice or OS preference).
 */
export function effectiveDark(){const t=document.documentElement.getAttribute("data-theme");if(t)return t==="dark";return matchMedia("(prefers-color-scheme: dark)").matches;}

/**
 * Switch between light and dark and remember the choice.
 */
export function toggleTheme(){const d=effectiveDark();document.documentElement.setAttribute("data-theme",d?"light":"dark");save("wta_theme",d?"light":"dark");renderChrome();}

/**
 * Apply the saved theme at startup.
 */
export function initTheme(){
(function(){const t=load("wta_theme",null);if(t)document.documentElement.setAttribute("data-theme",t);})();

/* ================= chrome ================= */
}
