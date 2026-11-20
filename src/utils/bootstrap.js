/* eslint-disable */
import './globals.js';
import { initTheme } from '../themes/theme.js';
import { initNavbar, renderChrome } from '../components/Navbar/navbar.js';
import { route } from './router.js';
import { initFx } from './fx.js';
import { initTracking } from './activity.js';
import { state } from './state.js';
import LocalStorage from '../config/LocalStorage.js';
import APIRequest from './APIRequest.js';
import ConfigAPIURL from '../config/ConfigAPIURL.js';
import { startSessionWatch } from './session.js';
import { watchPasswordFields } from './passwordToggle.js';

/* Starts the app once the React shell (navbar, <main id="app">, footer) is in the DOM. */
export async function bootstrap() {
  if (window.__wtaBooted) return;
  window.__wtaBooted = true;

  initTheme();
  initNavbar();
  watchPasswordFields(); // eye (show/hide) button on every password box, including ones rendered later
  initFx();          // route changes go through the page sweep, then route()
  initTracking();    // optional click tracking (browser only, off until a member agrees)

  // Restore user from localStorage and verify session with backend
  // Auto-logout when the 5-7 day session ends (also checks at boot, so an expired tab is cleared on open).
  startSessionWatch(() => { LocalStorage.clear(); state.USER = null; });
  LocalStorage.restore();
  if (LocalStorage.isLoggedIn()) {
    state.USER = LocalStorage.userDetails;
    // Silently verify token is still valid
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.me, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        const user = { ...(d.member || {}), ...(d.user || d.result || {}) };
        LocalStorage.setUser(user);
        state.USER = user;
        renderChrome();
      } else if (d?.responseCode === 118 || response?.returncode === 2) {
        // Token expired/invalid â€" clear and let router redirect
        LocalStorage.clear();
        state.USER = null;
      }
    } catch {
      // Network error â€" keep cached user, app works offline-ish
    }
  }

  route();
}



