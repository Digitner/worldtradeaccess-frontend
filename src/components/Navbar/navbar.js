/* eslint-disable */
import { IMG } from '../../constant/images.js';
import { NAVITEMS } from '../../constant/navigation.js';
import { effectiveDark, toggleTheme } from '../../themes/theme.js';
import { $, $$, esc, ico, initialsOf } from '../../utils/helpers.js';
import { go } from '../../utils/router.js';
import { STORE, state } from '../../utils/state.js';
import LocalStorage from '../../config/LocalStorage.js';

export function renderChrome(){
  const active=location.hash||"#/";
  $("#navlinks").innerHTML=NAVITEMS.map(([h,l,i])=>`<a href="${h}" class="${active.startsWith(h)?"active":""}" ${active.startsWith(h)?'aria-current="page"':""}>${ico(i)}${l}</a>`).join("");
  const loggedIn = LocalStorage.isLoggedIn() || !!state.USER;
  $("#mobileMenu").innerHTML=[["#/","Home","home"],...NAVITEMS,...(LocalStorage.isAdmin()||STORE.canAdmin?[["#/admin","Admin console","shield"]]:[]),...(loggedIn?[["#/dashboard","Dashboard","grid"]]:[["#/login","Log in","login"],["#/register","Become a member","user"]])].map(([h,l,i])=>`<a href="${h}" class="${active===h||(h!=="#/"&&active.startsWith(h))?"active":""}">${ico(i)}${l}</a>`).join("")+`<button class="mm-theme" onclick="toggleTheme()">${ico(effectiveDark()?"sun":"moon")}Switch to ${effectiveDark()?"light":"dark"} mode</button>`;
  const themeBtn=`<button class="icon-btn" onclick="toggleTheme()" aria-label="Switch to ${effectiveDark()?"light":"dark"} mode">${ico(effectiveDark()?"sun":"moon")}</button>`;
  const isAdmin = LocalStorage.isAdmin() || STORE.canAdmin;
  const adminBtn=isAdmin?`<button class="icon-btn hide-sm" onclick="go('#/admin')" aria-label="Admin console" title="Admin console">${ico("shield")}</button>`:"";
  const user = state.USER || LocalStorage.userDetails || null;
  const avatarInner = user?.image_url
    ? `<img src="${esc(user.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : esc(initialsOf(user?.contact_person||user?.person||user?.company_name||user?.name||"?"));
  $("#authbox").innerHTML=user
    ?`${adminBtn}<button class="btn btn-ghost btn-sm hide-sm" onclick="go('#/dashboard')">${ico("grid")}Dashboard</button><button class="avatar" onclick="go('#/dashboard')" aria-label="Your dashboard" style="${user.image_url?"padding:0;overflow:hidden":""}">${avatarInner}</button>${themeBtn}`
    :`${adminBtn}<button class="btn btn-ghost btn-sm hide-sm" onclick="go('#/login')">Log in</button><button class="btn btn-primary btn-sm" onclick="go('#/register')"><span class="long">Become a member</span><span class="short">Join</span></button>${themeBtn}`;
  $("#hamb").innerHTML=ico("menu");
  $$("[data-logo]").forEach(i=>{if(IMG.logo){i.src=IMG.logo;i.hidden=false;}});
  $$("[data-logo-div]").forEach(d=>d.hidden=!IMG.logo);
}

export function closeMenu(){$("#mobileMenu").classList.remove("open");$("#hamb").setAttribute("aria-expanded","false");}

export function initNavbar(){
$("#hamb").onclick=()=>{const o=$("#mobileMenu").classList.toggle("open");$("#hamb").setAttribute("aria-expanded",o?"true":"false");};

/* ================= router ================= */
}
