/* eslint-disable */
import { mountCarousels } from '../components/Carousel/Carousel.js';
import { closeMenu, renderChrome } from '../components/Navbar/navbar.js';
import { viewAdmin } from '../pages/Admin/Admin.js';
import { viewAdvertise } from '../pages/Advertise/Advertise.js';
import { viewContact } from '../pages/Contact/Contact.js';
import { viewDashboard } from '../pages/Dashboard/Dashboard.js';
import { viewDeal } from '../pages/Deal/Deal.js';
import { viewDirectory } from '../pages/Directory/Directory.js';
import { viewEditListing } from '../pages/EditListing/EditListing.js';
import { viewFunding } from '../pages/Funding/Funding.js';
import { viewHome } from '../pages/Home/Home.js';
import { viewLogin } from '../pages/Login/Login.js';
import { viewMember } from '../pages/Member/Member.js';
import { viewNews } from '../pages/News/News.js';
import { viewRegister } from '../pages/Register/Register.js';
import { viewSearch } from '../pages/Search/Search.js';
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
  renderChrome();
  const views={"":viewHome,register:viewRegister,login:viewLogin,search:viewSearch,directory:viewDirectory,funding:viewFunding,news:viewNews,advertise:viewAdvertise,admin:viewAdmin,contact:viewContact};
  if(base==="dashboard")state.USER?viewDashboard(app):viewLogin(app,"Log in to view your dashboard.");
  else if(base==="edit")state.USER?viewEditListing(app):viewLogin(app);
  else if(base==="member")viewMember(app,arg);
  else if(base==="deal")viewDeal(app,arg);
  else (views[base||""]||viewHome)(app,undefined,soft);
  requestAnimationFrame(mountCarousels);
}
