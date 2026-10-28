/* eslint-disable */
import './globals.js';
import { initTheme } from '../themes/theme.js';
import { initNavbar } from '../components/Navbar/navbar.js';
import { route } from './router.js';
import { STORE } from './state.js';

/* Starts the app once the React shell (navbar, <main id="app">, footer) is in the DOM. */
export function bootstrap() {
  if (window.__wtaBooted) return;
  window.__wtaBooted = true;
  initTheme();
  initNavbar();
  window.addEventListener('hashchange', () => route());
  STORE.checked = true; // standalone mode: data is kept on this device (localStorage)
  route();
}
