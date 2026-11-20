/* eslint-disable */
import { mountCarousels } from '../components/Carousel/Carousel.js';
import { closeMenu, renderChrome } from '../components/Navbar/navbar.js';
import { viewAdmin } from '../pages/Admin/Admin.js';
import { viewActivity } from '../pages/Activity/Activity.js';
import { viewContact } from '../pages/Contact/Contact.js';
import { viewDashboard } from '../pages/Dashboard/Dashboard.js';
import { viewDeal } from '../pages/Deal/Deal.js';
import { viewDirectory } from '../pages/Directory/Directory.js';
import { viewEditListing } from '../pages/EditListing/EditListing.js';
import { viewFunding } from '../pages/Funding/Funding.js';
import { viewHome } from '../pages/Home/Home.js';
import { viewLogin, logout } from '../pages/Login/Login.js';
import { viewForgot } from '../pages/Login/Forgot.js';
import { enforcePasswordGate } from './passwordGate.js';
import { viewMember } from '../pages/Member/Member.js';
import { viewNews } from '../pages/News/News.js';
import { viewRegister } from '../pages/Register/Register.js';
import { viewSearch } from '../pages/Search/Search.js';
import { viewAbout, viewFaq, viewFor, viewHow, viewMembership, viewNetwork, viewPrivacy, viewSectors } from '../pages/Static/Static.js';
import { enhance } from './fx.js';
import { toast } from '../components/Toasts/toast.js';
import { $ } from './helpers.js';
import { state } from './state.js';

/**
 * Navigate to a hash route (re-renders when already there) and scroll to top.
 * @param {string} hash route hash, e.g. "#/login"
 */
export function go(hash){closeMenu();if(location.hash===hash){route();}else location.hash=hash;window.scrollTo({top:0,behavior:"smooth"});}

/**
 * First segment of the current hash route, e.g. "dashboard".
 */
export function curBase(){return (location.hash||"#/").slice(2).split("/")[0]||"";}

/**
 * Re-render the current page in place for live updates, unless the user is typing or a search is running.
 * @param {string[]} bases route bases to refresh
 */
export function softRefresh(bases){
  const a=document.activeElement;
  if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;
  if(bases.includes(curBase())&&!state.SR.busy)route(true);
}

/* ================= theme ================= */

/**
 * Render the page for the current location.hash, then mount carousels and effects.
 * @param {boolean} soft true on a background refresh: keep focus/scroll
 * @returns {Promise<void>}
 */
export async function route(soft){
  closeMenu();
  state.CAROUSEL_TIMERS.forEach(clearInterval);state.CAROUSEL_TIMERS=[];
  const h=location.hash||"#/";
  const [base,arg]=h.slice(2).split("/");
  const app=$("#app");
  renderChrome();
  const views={"":viewHome,register:viewRegister,login:viewLogin,forgot:viewForgot,search:viewSearch,directory:viewDirectory,funding:viewFunding,news:viewNews,about:viewAbout,privacy:viewPrivacy,how:viewHow,sectors:viewSectors,network:viewNetwork,membership:viewMembership,faq:viewFaq,admin:viewAdmin,contact:viewContact};
  if(base==="dashboard")state.USER?await viewDashboard(app):await viewLogin(app,"Log in to view your dashboard.");
  else if(base==="edit")state.USER?await viewEditListing(app):await viewLogin(app);
  else if(base==="activity")state.USER?await viewActivity(app):await viewLogin(app,"Log in to see your activity.");
  else if(base==="for")await viewFor(app,arg);
  else if(base==="member")await viewMember(app,arg);
  else if(base==="deal")await viewDeal(app,arg);
  else await (views[base||""]||viewHome)(app,undefined,soft);
  // Accounts without a password are blocked by a popup until they set one (no-op for everyone else).
  enforcePasswordGate(state.USER,{onDone:()=>toast("Password saved","You can use the site now."),onLogout:logout});
  cancelAnimationFrame(window.__rr);window.__rr=requestAnimationFrame(()=>{mountCarousels();enhance(soft);});
}
