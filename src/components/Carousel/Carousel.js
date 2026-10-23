/* eslint-disable */
import { $$, esc, ico } from '../../utils/helpers.js';
import { state } from '../../utils/state.js';
import { shared } from '../../utils/store.js';

export function carousel(inner,auto,label){return `<div class="carousel" ${auto?'data-autoplay="1"':""} role="region" aria-label="${esc(label||"Carousel")}"><button class="cbtn prev" aria-label="Previous">${ico("back")}</button><div class="carousel-track">${inner}</div><button class="cbtn next" aria-label="Next">${ico("arrow")}</button></div>`;}

/* ================= shared fragments ================= */

export function mountCarousels(){
  $$("#app .carousel").forEach(c=>{
    const track=c.querySelector(".carousel-track");if(!track)return;
    const prev=c.querySelector(".cbtn.prev"),next=c.querySelector(".cbtn.next");
    const step=()=>Math.max(240,track.clientWidth*0.85);
    const upd=()=>{if(prev)prev.disabled=track.scrollLeft<8;if(next)next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-8;};
    if(prev)prev.onclick=()=>track.scrollBy({left:-step(),behavior:"smooth"});
    if(next)next.onclick=()=>track.scrollBy({left:step(),behavior:"smooth"});
    track.addEventListener("scroll",()=>{clearTimeout(c.__t);c.__t=setTimeout(upd,90);});
    setTimeout(upd,60);
    if(c.dataset.autoplay&&!matchMedia("(prefers-reduced-motion: reduce)").matches){let dir=1;const id=setInterval(()=>{if(document.hidden)return;if(track.scrollLeft+track.clientWidth>=track.scrollWidth-8)dir=-1;else if(track.scrollLeft<8)dir=1;track.scrollBy({left:dir*step(),behavior:"smooth"});},5200);state.CAROUSEL_TIMERS.push(id);c.addEventListener("mouseenter",()=>clearInterval(id));c.addEventListener("focusin",()=>clearInterval(id));}
  });
}
