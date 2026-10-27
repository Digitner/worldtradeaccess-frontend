import { viewHome, viewRegister, viewLogin, viewSearch, viewDirectory, viewFunding, viewNews, viewAdvertise, viewContact, viewDashboard, viewEditListing, viewMember, viewDeal } from '../routes/publicRoutes.js';
import { viewAdminLogin, viewAdminDashboard, viewAdminSubmissions, viewAdminUsers, viewAdminSettings, isAdminPreview } from '../routes/privateRoutes.js';
/* eslint-disable */
import { mountCarousels } from '../components/Carousel/Carousel.js';
import { closeMenu, renderChrome } from '../components/Navbar/navbar.js';
import { $ } from './helpers.js';
import { state } from './state.js';

export function go(hash){closeMenu();if(location.hash===hash){route();}else location.hash=hash;window.scrollTo({top:0,behavior:"smooth"});}

export function curBase(){return (location.hash||"#/").slice(2).split("/")[0]||"";}

export function softRefresh(bases){
  const a=document.activeElement;
  if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;
  if(bases.includes(curBase())&&!state.SR.busy)route(true);
}

/* ================= theme ================= */

export function route(soft){
  closeMenu();
  state.CAROUSEL_TIMERS.forEach(clearInterval);state.CAROUSEL_TIMERS=[];
  const h=location.hash||"#/";
  const [base,arg]=h.slice(2).split("/");
  const app=$("#app");
  document.body.classList.toggle("wta-admin-mode", base === "admin" && arg !== "login");
  renderChrome();
  // Separate admin routes; demo session only, not a security boundary.
  if (base === 'admin') {
    if (arg === 'login') viewAdminLogin(app);
    else if (arg === 'submissions' || arg === 'users' || arg === 'settings') {
      if (!isAdminPreview()) { location.replace('#/admin/login'); viewAdminLogin(app, 'Start an admin preview to view this page.'); }
      else ({submissions:viewAdminSubmissions,users:viewAdminUsers,settings:viewAdminSettings})[arg](app);
    }
    else if (arg === 'dashboard' || !arg) {
      if (isAdminPreview()) viewAdminDashboard(app);
      else { location.replace('#/admin/login'); viewAdminLogin(app, 'Start an admin preview to view the dashboard.'); }
    } else viewAdminLogin(app);
    return;
  }
  const views={"":viewHome,register:viewRegister,login:viewLogin,search:viewSearch,directory:viewDirectory,funding:viewFunding,news:viewNews,advertise:viewAdvertise,contact:viewContact};
  if(base==="dashboard")state.USER?viewDashboard(app):viewLogin(app,"Log in to view your dashboard.");
  else if(base==="edit")state.USER?viewEditListing(app):viewLogin(app);
  else if(base==="member")viewMember(app,arg);
  else if(base==="deal")viewDeal(app,arg);
  else (views[base||""]||viewHome)(app,undefined,soft);
  requestAnimationFrame(mountCarousels);
}
