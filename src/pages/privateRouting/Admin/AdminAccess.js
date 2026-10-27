/* eslint-disable */
// FRONTEND-ONLY PREVIEW. This is navigation state, NOT authentication or authorization.
import { viewAdmin } from './Admin.js';
import { state } from '../../../utils/state.js';
import { route } from '../../../utils/router.js';

const DEMO_KEY = 'wta_staff_preview';
export const isAdminPreview = () => sessionStorage.getItem(DEMO_KEY) === 'active';
export function stopAdminPreview() {
  sessionStorage.removeItem(DEMO_KEY);
  state.ADMIN.pw = false;
}
export function viewAdminLogin(app, message = '') {
  if (isAdminPreview()) {
    location.hash = '#/admin/dashboard';
    return route();
  }
  app.innerHTML = `<section class="wrap narrow" style="padding-top:75px;padding-bottom:90px;min-height:65vh">
    <span class="kicker">World Trade Access · Staff portal</span>
    <h1 class="page-h">Admin portal preview</h1>
    <p class="page-sub">Public members and staff have separate navigation flows. This frontend preview is not a secure sign-in system.</p>
    <div class="card" style="margin-top:24px;max-width:480px">
      <div class="admin-banner" role="status" style="margin-bottom:20px">Demo only — no backend authentication connected</div>
      ${message ? `<p role="alert" class="muted" style="margin-bottom:14px">${message}</p>` : ''}
      <p class="muted" style="margin-bottom:20px">Choose the button below to explore the admin dashboard. No email or password is needed or collected for this demo.</p>
      <button type="button" id="wta-admin-preview" class="btn btn-primary btn-block">Enter admin preview</button>
      <p class="muted" style="margin-top:15px;font-size:13px">Production access requires server-side login, staff roles, and protected APIs.</p>
    </div>
    <p style="margin-top:20px"><a href="#/">← Return to public website</a> · <a href="#/login">Member login</a></p>
  </section>`;
  document.getElementById('wta-admin-preview').onclick = () => {
    sessionStorage.setItem(DEMO_KEY, 'active');
    location.hash = '#/admin/dashboard';
    route();
  };
}
export function adminShell(app, selected, renderContent) {
  if (!isAdminPreview()) return viewAdminLogin(app, 'Start an admin preview to view this page.');
  state.ADMIN.pw = true;
  app.innerHTML = `<div class="wta-admin-layout">
    <aside class="wta-admin-sidebar" aria-label="Admin navigation">
      <div class="wta-admin-brand"><span class="wta-admin-brand-icon">W</span><div><strong>World Trade Access</strong><small>Staff workspace · Preview</small></div></div>
      <nav class="wta-admin-links">
        <a href="#/admin/dashboard" class="${selected === 'dashboard' ? 'active' : ''}">▦ <span>Overview</span></a>
        <a href="#/admin/submissions" class="${selected === 'submissions' ? 'active' : ''}">▤ <span>Submissions</span></a>
        <a href="#/admin/users" class="${selected === 'users' ? 'active' : ''}">♙ <span>Users</span></a>
        <a href="#/admin/settings" class="${selected === 'settings' ? 'active' : ''}">⚙ <span>Settings</span></a>
      </nav>
      <div class="wta-admin-sidebar-bottom"><a href="#/">↗ Public website</a><button id="wta-admin-logout" type="button">⇥ Exit preview</button></div>
    </aside>
    <div class="wta-admin-main"><header class="wta-admin-header"><div><small>STAFF PORTAL · FRONTEND DEMO</small><h1>${({dashboard:'Overview',submissions:'Form submissions',users:'Users',settings:'Settings'})[selected]}</h1></div><span class="wta-admin-preview-tag">Preview only · Not authenticated</span></header><div id="wta-admin-content" class="wta-admin-content"></div></div>
  </div>`;
  document.getElementById('wta-admin-logout').onclick = () => {
    stopAdminPreview(); location.hash = '#/admin/login'; route();
  };
  renderContent(document.getElementById('wta-admin-content'));
}
export function viewAdminDashboard(app) {
  adminShell(app, 'dashboard', content => {
    const count = state.LOCAL_FORMS.length;
    content.innerHTML = `<div class="wta-admin-intro"><h2>Welcome to your workspace</h2><p>Manage the World Trade Access frontend from this separate staff area. This is a local demo, not a secure admin system.</p></div>
      <div class="wta-admin-cards"><article><span>Submissions on this device</span><strong>${count}</strong><a href="#/admin/submissions">View submissions →</a></article><article><span>Staff authentication</span><strong class="wta-admin-small-value">Not connected</strong><p>Backend API required</p></article><article><span>Workspace mode</span><strong class="wta-admin-small-value">Preview</strong><p>Session-based navigation only</p></article></div>
      <div class="wta-admin-panel"><h3>Quick actions</h3><p>Review visitor submissions or return to the public website.</p><div class="wta-admin-actions"><a class="btn btn-primary" href="#/admin/submissions">View submissions</a><a class="btn" href="#/">Visit public site</a></div></div>`;
  });
}
export function viewAdminSubmissions(app) {
  adminShell(app, 'submissions', content => {
    viewAdmin(content);
  });
}
export function viewAdminUsers(app) {
  adminShell(app, 'users', content => {
    content.innerHTML = `<div class="wta-admin-panel"><h2>Users management</h2><p>User accounts and staff permissions will appear here when a backend authentication service is connected.</p><div class="wta-admin-empty">No shared user directory is available in frontend-only preview mode.</div></div>`;
  });
}
export function viewAdminSettings(app) {
  adminShell(app, 'settings', content => {
    content.innerHTML = `<div class="wta-admin-panel"><h2>Workspace settings</h2><p>This project currently runs in frontend preview mode.</p><dl class="wta-admin-settings"><dt>Public website</dt><dd>Enabled</dd><dt>Admin navigation</dt><dd>Separate preview area</dd><dt>Authentication</dt><dd>Not connected</dd><dt>Data source</dt><dd>Local browser only (when shared storage is unavailable)</dd></dl><p class="muted">Production deployment needs backend login, staff role checks, and protected data endpoints.</p></div>`;
  });
}
