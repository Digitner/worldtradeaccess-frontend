/* eslint-disable */
/* Motion and effects engine for the WorldTradeAccess design: opening curtain, route sweep, split-text headings,
   scroll reveals, hero and page-banner film, count-up numbers, the animated explainer, the trade-lane globe,
   cursor and tilt. It is called after every route (see utils/router.js) and cleans up after itself.
   The "Turn animations off" button in the footer (and the OS reduced-motion setting) switches it all off. */
import { FILM_CH } from '../constant/content.js';
import { LAND_B64 } from '../constant/land.js';
import { VIDEO } from '../constant/images.js';
import { bgVideo, countryGo } from '../components/Page/Page.js';
import { toggleTheme } from '../themes/theme.js';
import { $, $$, esc } from './helpers.js';
import { logActivity, pageTitle, PAGE_NAME } from './activity.js';
import { curBase, route } from './router.js';

export function moveInd(b){const n=$("#tabInd");if(!n||!b)return;n.style.width=b.offsetWidth+"px";n.style.transform=`translateX(${b.offsetLeft}px)`;}


/* ================= motion ================= */
const OS_REDUCED=matchMedia("(prefers-reduced-motion: reduce)");
function motionPref(){try{return localStorage.getItem("wta_motion");}catch(e){return null;}}
const REDUCED={get matches(){const p=motionPref();return p?p==="off":OS_REDUCED.matches;}};
if(REDUCED.matches)document.documentElement.classList.add("no-motion");
let CLEAN=[];const onClean=f=>CLEAN.push(f);
function teardown(){CLEAN.forEach(f=>{try{f();}catch(e){}});CLEAN=[];}
function enhance(soft){
  teardown();if(!soft)logActivity('Page','Opened '+pageTitle(location.hash||'#/'));mountProgress();pageBanner(soft);document.body.classList.toggle('over-video',!!$('#app .hv,#app .pbn'));syncHeader();mountVideos();mountStory();
  
  mountCounts(soft);mountSteps();mountGlobe();moveInd($("#audTabs .cur"));mountFX(soft);
}
function syncHeader(){const b=$('.topbar');if(b)b.classList.toggle('scrolled',scrollY>30);}
addEventListener('scroll',syncHeader,{passive:true});
function mountProgress(){const b=$(".topbar");if(!b||$(".progress",b))return;const l=document.createElement("div");l.className="progress";l.setAttribute("aria-hidden","true");b.appendChild(l);const u=()=>{const h=document.documentElement.scrollHeight-innerHeight;l.style.setProperty("--p",(h>0?Math.min(1,scrollY/h):0).toFixed(4));};addEventListener("scroll",u,{passive:true});addEventListener("resize",u);u();}
function pageBanner(soft){
  const app=$("#app"),h=$(".page-h",app);if(!h||h.closest(".pbn"))return;
  const kicker=h.previousElementSibling&&h.previousElementSibling.classList.contains("kicker")?h.previousElementSibling:null;
  const sub=h.nextElementSibling&&h.nextElementSibling.classList.contains("page-sub")?h.nextElementSibling:null;
  const banner=document.createElement("div");banner.className="pbn"+(soft?"":" anim");
  banner.innerHTML=bgVideo()+'<div class="wrap"></div>';const w=banner.querySelector(".wrap");
  if(kicker)w.appendChild(kicker);
  w.appendChild(h);
  if(sub)w.appendChild(sub);
  app.prepend(banner);
  const first=banner.nextElementSibling;if(first&&first.tagName==="SECTION"&&first.textContent.trim()==="")first.remove();
}
function mountVideos(){
  $$("video[data-bg]").forEach(v=>{v.muted=true;v.autoplay=!REDUCED.matches;try{v.src=VIDEO.hero;}catch(e){return;}if(!REDUCED.matches){const io=new IntersectionObserver(([e])=>{if(v.dataset.paused)return;if(e.isIntersecting)v.play().catch(()=>{});else v.pause();});io.observe(v);onClean(()=>{io.disconnect();v.pause();v.removeAttribute("src");v.load();});}});
  const t=$("#vtoggle"),hv=$(".hv video");if(t&&hv){if(REDUCED.matches){t.textContent="Play video";t.setAttribute("aria-label","Play background video");hv.dataset.paused="1";}
    t.onclick=()=>{const p=hv.dataset.paused;if(p){delete hv.dataset.paused;hv.play().catch(()=>{});t.textContent="Pause video";t.setAttribute("aria-label","Pause background video");}else{hv.dataset.paused="1";hv.pause();t.textContent="Play video";t.setAttribute("aria-label","Play background video");}};}
}
function mountCounts(soft){
  const run=(n,to,suf)=>{const t0=performance.now();const f=t=>{const k=Math.min(1,(t-t0)/1100);n.textContent=Math.round(to*(1-Math.pow(1-k,3)))+suf;if(k<1)requestAnimationFrame(f);};requestAnimationFrame(f);};
  if(!REDUCED.matches&&!soft)$$("#app .kpi .n").forEach(n=>{const m=n.textContent.trim().match(/^(\d+)(.*)$/);if(m&&+m[1]>0)run(n,+m[1],m[2]);});
}
function mountSteps(){
  const st=$$("#stepsT .step"),art=$$("#stepsArt img");if(!st.length)return;
  let k=0,hold=false,vis=false;
  const show=i=>{k=i;st.forEach((s,n)=>{s.classList.toggle("on",n===k);s.setAttribute("aria-expanded",String(n===k));});art.forEach((a,n)=>{a.classList.toggle("was",a.classList.contains("on")&&n!==k);a.classList.toggle("on",n===k);});};
  st.forEach((s,i)=>{s.onclick=()=>show(i);s.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();show(i);}};});
  const box=$("#stepsT");box.addEventListener("pointerenter",()=>{hold=true;});box.addEventListener("pointerleave",()=>{hold=false;});
  const io=new IntersectionObserver(([e])=>{vis=e.isIntersecting;},{threshold:.3});io.observe(box);
  const tm=REDUCED.matches?0:setInterval(()=>{if(vis&&!hold&&!document.hidden&&innerWidth>860)show((k+1)%st.length);},3800);
  onClean(()=>{clearInterval(tm);io.disconnect();});
}
/* route transition */
let ROUTING=false;
function softRoute(){
  const sw=$("#sweep");
  if(REDUCED.matches||ROUTING||!sw){route();window.scrollTo(0,0);return;}
  ROUTING=true;const lab=$("span",sw);lab.textContent=PAGE_NAME[curBase()]||"";splitChars(lab);
  sw.className="on";void sw.offsetWidth;sw.className="on in";lab.classList.add("go");
  setTimeout(()=>{route();window.scrollTo({top:0,behavior:"instant"});},400);
  setTimeout(()=>{sw.className="on out";setTimeout(()=>{sw.className="";ROUTING=false;},480);},560);
}
/* globe */
const HUBS=[["India",20.6,79],["China",31,114],["Brazil",-15,-50],["Russia",55.7,37.6],["South Africa",-29,25],["Egypt",28,31],["Ethiopia",9,39],["UAE",24.4,54.4],["Saudi Arabia",24,45],["Iran",32,53],["Indonesia",-5,110],["Malaysia",3.1,101.7],["Thailand",13.7,100.5],["Vietnam",16,107],["Philippines",14.6,121],["Singapore",1.3,103.8],["Sri Lanka",7,80.7],["Cambodia",11.6,104.9]];
const HUB_LABEL=new Set(["India","China","Brazil","Russia","South Africa","Egypt","UAE","Indonesia","Malaysia","Thailand","Philippines"]);
const LANES=[["India","Malaysia"],["Russia","India"],["South Africa","Malaysia"],["China","Indonesia"],["Brazil","Vietnam"],["UAE","India"],["Egypt","Thailand"],["Indonesia","India"],["Saudi Arabia","Singapore"],["Ethiopia","Singapore"],["China","Philippines"],["Brazil","South Africa"],["Russia","China"]];
function mountGlobe(){
  const cv=$("#globe");if(!cv)return;const ctx=cv.getContext("2d");const rad=Math.PI/180,raw=atob(LAND_B64),dots=[];
  for(let i=0;i<raw.length;i+=2){const la=(raw.charCodeAt(i)*180/255-90)*rad,lo=(raw.charCodeAt(i+1)*360/255-180)*rad;dots.push([Math.cos(la)*Math.sin(lo),Math.sin(la),Math.cos(la)*Math.cos(lo)]);}
  const v3=(la,lo)=>[Math.cos(la*rad)*Math.sin(lo*rad),Math.sin(la*rad),Math.cos(la*rad)*Math.cos(lo*rad)];
  const hubs=HUBS.map(([n,la,lo])=>({n,v:v3(la,lo)})),byN=Object.fromEntries(hubs.map(h=>[h.n,h]));
  const lanes=LANES.map(([a,b],i)=>{const A=byN[a].v,B=byN[b].v,d=Math.acos(Math.max(-1,Math.min(1,A[0]*B[0]+A[1]*B[1]+A[2]*B[2]))),pts=[];for(let k=0;k<=40;k++){const t=k/40,s=Math.sin(d)||1,a1=Math.sin((1-t)*d)/s,a2=Math.sin(t*d)/s,l=1+Math.sin(Math.PI*t)*Math.min(.22,d*.11);pts.push([(A[0]*a1+B[0]*a2)*l,(A[1]*a1+B[1]*a2)*l,(A[2]*a1+B[2]*a2)*l]);}return {pts,off:i*.137,dur:6+((i*37)%5)};});
  let W=0,D=1,cx=0,cy=0,R=0,lon=-90,lat=-10,vLon=0,drag=null,hot=null,raf=0,vis=false,last=0,moved=0;
  const size=()=>{const r=cv.getBoundingClientRect();W=r.width;D=Math.min(2,devicePixelRatio||1);cv.width=W*D;cv.height=W*D;R=W*.44;cx=cy=W/2;if(!raf)draw(performance.now());};
  const pr=v=>{const a=lon*rad,b=lat*rad,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),x=v[0]*ca+v[2]*sa,z0=-v[0]*sa+v[2]*ca;return [x,v[1]*cb-z0*sb,v[1]*sb+z0*cb];};
  function draw(now){ctx.setTransform(D,0,0,D,0,0);ctx.clearRect(0,0,W,W);const g=ctx.createRadialGradient(cx-R*.35,cy-R*.4,R*.1,cx,cy,R);g.addColorStop(0,"#1B4A7E");g.addColorStop(1,"#0D2B50");ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();ctx.strokeStyle="rgba(150,190,235,.28)";ctx.lineWidth=1;ctx.stroke();
    const ds=Math.max(1.1,R/150);for(const d of dots){const [x,y,z]=pr(d);if(z<=.02)continue;ctx.fillStyle=`rgba(200,220,240,${(.2+z*.55).toFixed(2)})`;ctx.fillRect(cx+x*R-ds/2,cy-y*R-ds/2,ds,ds);}
    for(const l of lanes){const P=l.pts.map(pr);ctx.beginPath();let on=false;for(const p of P){if(p[2]>0||Math.hypot(p[0],p[1])>1){const X=cx+p[0]*R,Y=cy-p[1]*R;on?ctx.lineTo(X,Y):ctx.moveTo(X,Y);on=true;}else on=false;}ctx.strokeStyle="rgba(226,190,115,.5)";ctx.lineWidth=1.2;ctx.stroke();
      if(!REDUCED.matches){const u=(now/1000/l.dur+l.off)%1,p=P[Math.floor(u*40)];if(p[2]>0||Math.hypot(p[0],p[1])>1){ctx.fillStyle="#FFE9B0";ctx.beginPath();ctx.arc(cx+p[0]*R,cy-p[1]*R,2.6,0,7);ctx.fill();}}}
    ctx.font=`500 ${W<420?11:13}px "IBM Plex Sans",sans-serif`;ctx.textBaseline="middle";
    for(const h of hubs){const [x,y,z]=pr(h.v);h.vis=z>.04;if(!h.vis)continue;h.X=cx+x*R;h.Y=cy-y*R;const H=hot===h;ctx.fillStyle="#E2BE73";ctx.beginPath();ctx.arc(h.X,h.Y,H?5:3,0,7);ctx.fill();if(H||(HUB_LABEL.has(h.n)&&z>.3&&W>=420)){ctx.fillStyle=H?"#E2BE73":`rgba(255,255,255,${(z*.95).toFixed(2)})`;const left=["Malaysia","India","Egypt"].includes(h.n),tw=ctx.measureText(h.n).width;ctx.fillText(h.n,left?h.X-tw-8:h.X+8,h.Y-1);}}
  }
  function frame(now){raf=0;if(!vis||document.hidden)return;const dt=Math.min(.05,(now-last)/1000);last=now;if(!drag){if(Math.abs(vLon)>.01){lon+=vLon*dt*60;vLon*=.94;}else if(!hot)lon-=dt*2.4;}draw(now);raf=requestAnimationFrame(frame);}
  const start=()=>{if(!raf&&!REDUCED.matches&&vis){last=performance.now();raf=requestAnimationFrame(frame);}};
  const pos=e=>{const r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
  const hit=(x,y)=>{let b=null,bd=16;for(const h of hubs){if(!h.vis)continue;const d=Math.hypot(h.X-x,h.Y-y);if(d<bd){bd=d;b=h;}}return b;};
  cv.addEventListener("pointerdown",e=>{const [x,y]=pos(e);if(Math.hypot(x-cx,y-cy)>R+10)return;drag={x:e.clientX,y:e.clientY};moved=0;vLon=0;cv.classList.add("drag");try{cv.setPointerCapture(e.pointerId);}catch(_){}});
  cv.addEventListener("pointermove",e=>{const [mx,my]=pos(e);if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);drag={x:e.clientX,y:e.clientY};lon-=dx*.3;vLon=-dx*.15;lat=Math.max(-40,Math.min(40,lat+dy*.16));if(REDUCED.matches)draw(performance.now());}else{const h=hit(mx,my);if(h!==hot){hot=h;cv.classList.toggle("hot",!!h);if(REDUCED.matches)draw(performance.now());}}});
  cv.addEventListener("pointerup",e=>{if(!drag)return;drag=null;cv.classList.remove("drag");if(moved<6){const [x,y]=pos(e),h=hit(x,y);if(h)countryGo(h.n);}});
  cv.addEventListener("pointercancel",()=>{drag=null;cv.classList.remove("drag");});
  cv.addEventListener("pointerleave",()=>{if(!drag){hot=null;cv.classList.remove("hot");}});
  const ro=new ResizeObserver(size);ro.observe(cv);size();
  const io=new IntersectionObserver(([e])=>{vis=e.isIntersecting;if(vis)start();});io.observe(cv);
  const vc=()=>{if(!document.hidden)start();};document.addEventListener("visibilitychange",vc);
  onClean(()=>{cancelAnimationFrame(raf);raf=0;vis=false;ro.disconnect();io.disconnect();document.removeEventListener("visibilitychange",vc);});
}
/* ================= FX: text and interface animation ================= */
function walkText(el,fn){const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),ns=[];while(w.nextNode())ns.push(w.currentNode);ns.forEach(fn);}
function splitChars(el,base){if(el.querySelector(".ch"))return;const t=el.textContent;let c=0;el.innerHTML=t.split(/(\s+)/).map(x=>/^\s+$/.test(x)?" ":x?`<span class="wd">${[...x].map(ch=>`<span class="ch" style="--c:${c++}">${esc(ch)}</span>`).join("")}</span>`:"").join("");if(base)el.style.setProperty("--base",base+"ms");}
function splitWords(el,cls,inner){if(el.dataset.split)return;el.dataset.split="1";let n=0;walkText(el,node=>{if(!node.nodeValue.trim())return;if(node.parentElement.closest("button,a,.vh"))return;const f=document.createDocumentFragment();node.nodeValue.split(/(\s+)/).forEach(x=>{if(!x)return;if(/^\s+$/.test(x)){f.appendChild(document.createTextNode(" "));return;}const s=document.createElement("span");s.className=cls;s.style.setProperty("--n",n++);if(inner){const i=document.createElement("span");i.className="wi";i.textContent=x;s.appendChild(i);}else s.textContent=x;f.appendChild(s);});node.replaceWith(f);});}
function scramble(el){const t=el.textContent;if(!t.trim())return;const G="ABCDEFGHIKLMNOPRSTUVWXYZ";const t0=performance.now();const f=now=>{const k=Math.min(1,(now-t0)/750),r=Math.floor(k*t.length);el.textContent=t.slice(0,r)+[...t.slice(r)].map(c=>c===" "?" ":G[Math.floor(Math.random()*G.length)]).join("");if(k<1)requestAnimationFrame(f);else el.textContent=t;};requestAnimationFrame(f);}
function odometer(n){const to=String(n.dataset.count),suf=n.dataset.suf||"";n.innerHTML=[...to].map((d,k)=>`<em class="odo"><i style="--k:${k}" data-d="${d}">${"0123456789".split("").map(x=>`<u>${x}</u>`).join("")}</i></em>`).join("")+suf;}
let FX_IO=null;
function fxObserve(el){if(FX_IO)FX_IO.observe(el);}
function fxMark(sel,type,step,scope){$$(sel,scope||$("#app")).forEach((el,i)=>{if(el.closest(".hv")||el.dataset.fxd)return;el.dataset.fxd="1";const sib=[...el.parentNode.children].indexOf(el);el.dataset.fx=typeof type==="function"?type(el,i):type;el.style.setProperty("--d",String((sib%6)*(step||80)));el.classList.add("fx");fxObserve(el);});}
function fxPanel(){if(REDUCED.matches)return;const a=$("#audPanel");if(!a)return;$$("h3",a).forEach(h=>{splitWords(h,"w",true);requestAnimationFrame(()=>h.classList.add("go"));});$$("p",a).forEach(p=>{splitWords(p,"wf");requestAnimationFrame(()=>p.classList.add("go"));});$$("li,.btn,.figimg",a).forEach((e,i)=>{e.classList.add("fx-new");e.style.setProperty("--d",String(i*80+120));});rollText(a);}
function rollText(scope){$$(".btn,.navlinks a,.hv-cta button,footer a,.linkish",scope).forEach(b=>{if(b.querySelector(".rl")||b.id==="vtoggle")return;[...b.childNodes].forEach(n=>{if(n.nodeType!==3||!n.nodeValue.trim())return;const t=n.nodeValue.trim();const r=document.createElement("span");r.className="rl";r.dataset.t=t;const s=document.createElement("span");s.textContent=t;r.appendChild(s);n.replaceWith(r);});});}
function magnet(scope){if(!matchMedia("(hover:hover)").matches)return;$$(".btn-primary,.hsr button,.cv .btn,.bigplay span,.hv-cta button",scope).forEach(b=>{if(b.dataset.mag)return;b.dataset.mag="1";b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();b.style.translate=`${(e.clientX-r.left-r.width/2)*.18}px ${(e.clientY-r.top-r.height/2)*.3}px`;});b.addEventListener("pointerleave",()=>{b.style.translate="";});b.style.transition=(getComputedStyle(b).transition||"")+",translate .25s ease-out";});}
function mountFX(soft){
  mountGlobal();syncMotionLabel();
  if(REDUCED.matches){noteMotion();return;}
  const app=$("#app");
  rollText(document);magnet(document);mountTips();
  FX_IO=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const t=e.target;FX_IO.unobserve(t);
    t.classList.add("in","go");
    if(t.dataset.scr)scramble(t);
    if(t.dataset.odo)t.querySelectorAll("i").forEach(i=>{i.style.transform=`translateY(-${+i.dataset.d*10}%)`;});
  }),{threshold:.08,rootMargin:"0px 200px -6% 200px"});
  const io=FX_IO;onClean(()=>io.disconnect());
  app.addEventListener("animationend",fxEnd);onClean(()=>app.removeEventListener("animationend",fxEnd));
  if(!soft){
    /* text */
    $$(".pbn .page-h,#app h1.page-h",app).forEach(h=>{splitChars(h);requestAnimationFrame(()=>h.classList.add("go"));});
    $$(".kicker",app).forEach(k=>{k.dataset.scr="1";fxObserve(k);});
    $$(".page-sub",app).forEach(p=>{splitWords(p,"wf");p.style.setProperty("--w",1);setTimeout(()=>p.classList.add("go"),350);});
    $$("h2,h3:not(.sect h3):not(.tier h3)",app).forEach(h=>{if(h.closest(".hv,#audPanel")||h.classList.contains("consent"))return;splitWords(h,"w",true);fxObserve(h);});
    $$(".rvh",app).forEach(fxObserve);
    $$(".prose p:not(.lead-f),.panel p,.sect p,.ncard p,.tier p,.idx p,.cv p,.film .muted,.notice dd,.card>p.muted,.dm .muted",app).forEach(p=>{p.classList.remove("rv");splitWords(p,"wf");fxObserve(p);});
    $$(".sect h3,.tier h3,.ncard h3,.step h3,.news-item h3",app).forEach(h=>{splitWords(h,"w",true);fxObserve(h);});
    $$(".step small",app).forEach(s=>{s.dataset.scr="1";fxObserve(s);});
    /* elements */
    fxMark(".stat","pop",110);fxMark(".smap","rise",70);fxMark(".acct-items>div","rise",90);fxMark(".acct-kv","pop",0);fxMark(".mkt,.frail","slideR",80);fxMark(".ncard","rise",120);fxMark(".tier","flip",140);fxMark(".idx>div","drop",90);fxMark(".faq-i","slideL",70);fxMark(".chap li","slideR",70);fxMark(".ctry button","pop",24);fxMark(".kpi","pop",90);fxMark(".fund-item,.news-item",(e,i)=>i%2?"slideL":"slideR",0);fxMark(".dash .card,form.card,.card:not(.dash .card)","rise",90);fxMark(".field,.choice,.role,.fbtn","rise",45);fxMark(".list-row,.dm,.dsr,.doc-row","slideL",60);fxMark(".step","slideL",70);fxMark(".panel li","slideL",70);fxMark(".prose .btn,.panel .btn,.tier .btn","pop",60);
    $$(".rv").forEach(e=>{e.classList.remove("rv");});
    $$(".figimg:not(.wipe),.wipe,.media-hero",app).forEach(f=>{f.classList.remove("wipe");f.classList.add("cur-fig");fxObserve(f);});
    $$("[data-count]",app).forEach(n=>{odometer(n);n.dataset.odo="1";fxObserve(n);});
  }
  $$(".mkt,.frail,.tier,.kpi",app).forEach(c=>c.classList.add("spot"));
  mountHero(soft);mountScrub();mountSectors();mountRoll();
}
function fxEnd(e){const t=e.target;if(t.classList&&t.classList.contains("fx")&&/^fx/.test(e.animationName)){t.classList.remove("fx","in");t.removeAttribute("data-fx");}}
function mountHero(soft){
  const hv=$("#hv");if(!hv)return;
  const base=INTRO_MS;
  $$("[data-ch]",hv).forEach((el,i)=>{splitChars(el,base+i*160);});
  const lede=$("[data-wf]",hv);if(lede)splitWords(lede,"wf");
  $$(".fadein",hv).forEach(f=>f.style.setProperty("animation-delay",`${base+(+f.style.getPropertyValue("--i")||0)*90+200}ms`));
  if(lede)lede.style.setProperty("--base",base+650+"ms");
  const r0=$("#rot");if(r0)r0.style.setProperty("--rb",base+620+"ms");
  hv.style.setProperty("--fb",base+500+"ms");
  hv.classList.add("go");
  const rot=$("#rot");if(rot){const W=["partner","buyer","supplier","investor","funder"];let i=0;const b0=rot.querySelector("b");rot.style.width=b0.offsetWidth+"px";if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{rot.style.width=b0.offsetWidth+"px";});
    const tm=setInterval(()=>{if(document.hidden)return;i=(i+1)%W.length;const old=rot.querySelector("b:last-child"),n=document.createElement("b");n.textContent=W[i];n.className="dn";rot.appendChild(n);rot.style.width=n.offsetWidth+"px";requestAnimationFrame(()=>requestAnimationFrame(()=>{n.className="";old.className="up";setTimeout(()=>old.remove(),650);}));},2400);onClean(()=>clearInterval(tm));
    setTimeout(()=>{},0);}
  /* typewriter in the search box */
  const q=$("#heroQ");if(q){const S=["halal snacks distributor in Malaysia","logistics JV partner in India","growth investors for agri-tech","solar EPC partner in South Africa","Islamic trade finance for exporters"];let a=0,c=0,back=false,tm,stop=false;const tick=()=>{if(stop)return;const s=S[a];c+=back?-1:1;q.placeholder="e.g. "+s.slice(0,c);if(!back&&c>=s.length){back=true;tm=setTimeout(tick,1900);return;}if(back&&c<=0){back=false;a=(a+1)%S.length;}tm=setTimeout(tick,back?18:42);};tm=setTimeout(tick,base+1400);q.addEventListener("focus",()=>{stop=true;clearTimeout(tm);q.placeholder="e.g. "+S[a];});onClean(()=>{stop=true;clearTimeout(tm);});}
}
let SCRUBS=[],SC_RAF=0;
function onScrollFX(){if(!SC_RAF)SC_RAF=requestAnimationFrame(()=>{SC_RAF=0;SCRUBS.forEach(f=>f());});}
function mountScrub(){
  SCRUBS=[];const vh=()=>innerHeight;
  const hv=$("#hv");if(hv){const v=$("video",hv),c=$("#hvc");SCRUBS.push(()=>{const p=Math.min(1.2,scrollY/Math.max(1,hv.offsetHeight));if(p>1.1)return;v.style.setProperty("--vs",(1.02+p*.2).toFixed(3));c.style.setProperty("--hy",(p*90).toFixed(1)+"px");c.style.setProperty("--ho",Math.max(0,1-p*1.25).toFixed(3));});}
  $$(".lead-f",$("#app")).forEach(l=>{if(l.dataset.split)return;l.dataset.split="1";let n=0;l.innerHTML=l.textContent.split(/\s+/).filter(Boolean).map(w=>`<span class="sw">${esc(w)}</span>`).join(" ");const ws=$$(".sw",l);const lio=new IntersectionObserver(([e])=>{if(!e.isIntersecting)return;lio.disconnect();ws.forEach((w,i)=>setTimeout(()=>w.classList.add("on"),i*55));},{threshold:.3});lio.observe(l);onClean(()=>lio.disconnect());});
  const pl=$("#player");if(pl)SCRUBS.push(()=>{const r=pl.getBoundingClientRect();const p=Math.max(0,Math.min(1,(vh()-r.top)/(vh()*.7)));pl.style.setProperty("--ci",((1-p)*9).toFixed(2)+"%");});
  const gl=$("#globe");if(gl)SCRUBS.push(()=>{const r=gl.getBoundingClientRect();const p=Math.max(0,Math.min(1,(vh()-r.top)/(vh()*.8)));gl.style.setProperty("--gs",(.72+p*.28).toFixed(3));});
  const figs=$$(".cur-fig",$("#app"));if(figs.length)SCRUBS.push(()=>{figs.forEach(f=>{const r=f.getBoundingClientRect();if(r.bottom<0||r.top>vh())return;const p=(r.top+r.height/2-vh()/2)/vh();const im=f.querySelector("img");if(im)im.style.setProperty("--py",(p*-46).toFixed(1)+"px");});});
  const m1=$("#mq1"),m2=$("#mq2");if(m1&&m2){let x=0,last=scrollY,raf,vis=true;const io=new IntersectionObserver(([e])=>{vis=e.isIntersecting;});io.observe(m1);const t=()=>{raf=requestAnimationFrame(t);if(!vis||document.hidden)return;const v=scrollY-last;last=scrollY;x+=.9+Math.abs(v)*.35;const w=m1.scrollWidth/4,skew=Math.max(-10,Math.min(10,v*.35));m1.style.transform=`translateX(${-(x%w)}px) skewX(${skew}deg)`;m2.style.transform=`translateX(${-w+(x%w)}px) skewX(${-skew}deg)`;};raf=requestAnimationFrame(t);onClean(()=>{cancelAnimationFrame(raf);io.disconnect();});}
  addEventListener("scroll",onScrollFX,{passive:true});onClean(()=>removeEventListener("scroll",onScrollFX));onScrollFX();
}
function mountSectors(){
  const sec=$("#sectSec");if(!sec||innerWidth<1024)return;const track=$(".sects",sec),wrap=$(".wrap",sec),head=$(".section-h",sec);
  sec.classList.add("hs-pin");const sticky=document.createElement("div");sticky.className="hs-sticky";const hw=document.createElement("div");hw.className="wrap";hw.style.width="100%";hw.appendChild(head);sticky.appendChild(hw);sticky.appendChild(track);const bar=document.createElement("div");bar.className="hs-bar";bar.innerHTML="<i></i>";sticky.appendChild(bar);wrap.replaceWith(sticky);
  let dist=0;const size=()=>{dist=Math.max(0,track.scrollWidth-innerWidth);sec.style.height=innerHeight+dist+"px";};size();
  const ims=$$("img",track);
  SCRUBS.push(()=>{const r=sec.getBoundingClientRect();const p=dist?Math.max(0,Math.min(1,-r.top/dist)):0;track.style.transform=`translate3d(${-p*dist}px,0,0)`;bar.style.setProperty("--hp",p.toFixed(3));if(r.bottom>0&&r.top<innerHeight)ims.forEach((im,i)=>{const b=im.parentElement.getBoundingClientRect();const q=(b.left+b.width/2-innerWidth/2)/innerWidth;im.style.setProperty("--ix",(q*-52).toFixed(1)+"px");});});
  addEventListener("resize",size);onClean(()=>removeEventListener("resize",size));
  const sects=$$(".sect",track);sects.forEach((s,i)=>{s.dataset.fx="rise";s.style.setProperty("--d",String(i*100));s.classList.add("fx");fxObserve(s);});
}
function mountRoll(){}
/* app-wide pieces that live once */
let INTRO_MS=0,GLOBAL_DONE=false,LAST_Y=0;
function mountGlobal(){
  if(GLOBAL_DONE)return;GLOBAL_DONE=true;
  if(REDUCED.matches){const f0=$("#footMark");if(f0){fitMark(f0);addEventListener("resize",()=>fitMark(f0));if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>fitMark(f0));}return;}
  /* opening curtain, once per visit */
  try{if(!sessionStorage.getItem("wta_intro")){sessionStorage.setItem("wta_intro","1");playIntro();}}catch(e){}
  /* cursor */
  const cur=$("#cur");if(cur&&matchMedia("(hover:hover)").matches){let tx=0,ty=0,x=0,y=0;addEventListener("pointermove",e=>{tx=e.clientX;ty=e.clientY;cur.classList.add("on");cur.classList.toggle("hot",!!(e.target.closest&&e.target.closest("a,button,input,select,textarea,summary,canvas")));},{passive:true});const t=()=>{x+=(tx-x)*.2;y+=(ty-y)*.2;cur.style.transform=`translate3d(${x}px,${y}px,0)`;requestAnimationFrame(t);};t();}
  /* header */
  const bar=$(".topbar");addEventListener("scroll",()=>{const y=scrollY;bar.classList.toggle("hide",y>LAST_Y&&y>420);LAST_Y=y;const h=document.documentElement.scrollHeight-innerHeight;const tp=$("#totop");if(tp){tp.classList.toggle("on",y>500);tp.style.setProperty("--p",(h>0?y/h:0).toFixed(3));}},{passive:true});
  /* back to top */
  const tp=document.createElement("button");tp.id="totop";tp.setAttribute("aria-label","Back to top");tp.innerHTML=`<svg viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="21"/></svg><svg style="position:static;transform:none;width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`;tp.onclick=()=>scrollTo({top:0,behavior:"smooth"});document.body.appendChild(tp);
  /* spotlight and tilt */
  document.addEventListener("pointermove",e=>{const c=e.target.closest&&e.target.closest(".spot");if(!c)return;const r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;c.style.setProperty("--mx",x+"px");c.style.setProperty("--my",y+"px");c.style.setProperty("--ry",((x/r.width-.5)*9).toFixed(2)+"deg");c.style.setProperty("--rx",((.5-y/r.height)*9).toFixed(2)+"deg");},{passive:true});
  /* if a browser held back autoplay, start on the first touch or scroll */
  const kick=()=>{$$("video[data-bg]").forEach(v=>{if(v.paused&&!v.dataset.paused&&v.src){const r=v.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){v.muted=true;v.play().catch(()=>{});}}});};
  ["pointerdown","touchstart","scroll"].forEach(n=>addEventListener(n,kick,{passive:true}));
  /* ripple */
  document.addEventListener("pointerdown",e=>{const b=e.target.closest&&e.target.closest(".btn");if(!b)return;const r=b.getBoundingClientRect(),s=document.createElement("span");s.className="ripple";s.style.left=e.clientX-r.left+"px";s.style.top=e.clientY-r.top+"px";b.appendChild(s);setTimeout(()=>s.remove(),720);});
  /* footer wordmark */
  const fm=$("#footMark");if(fm){fitMark(fm);addEventListener("resize",()=>fitMark(fm));if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>fitMark(fm));splitChars(fm);fitMark(fm);fm.style.setProperty("--cs","32ms");new IntersectionObserver(es=>{es.forEach(e=>{fm.classList.toggle("go",e.isIntersecting);});},{threshold:.2}).observe(fm);}
  /* results that arrive later */
  new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.closest&&n.closest("#s_results,#chatLog,#rankGrid")||n.matches&&n.matches(".bubble")){const list=n.matches(".match,.answer,.bubble")?[n]:$$(".match,.answer,.bubble",n);list.forEach((el,i)=>{el.classList.add("fx-new");el.style.setProperty("--d",String(i*110));});const a=n.matches(".answer")?n:n.querySelector&&n.querySelector(".answer");if(a){const p=$("p",a);if(p){splitWords(p,"wf");requestAnimationFrame(()=>p.classList.add("go"));}}}}));}).observe($("#app"),{childList:true,subtree:true});
  /* theme change */
  const tt=toggleTheme;if(document.startViewTransition){window.toggleTheme=function(){document.startViewTransition(()=>tt());};}
}
function playIntro(){
  INTRO_MS=1150;const el=document.createElement("div");el.id="intro";el.setAttribute("aria-hidden","true");el.innerHTML=`<b></b><b></b><b></b><div class="intro-m"><strong>WorldTradeAccess</strong><u></u></div>`;document.body.appendChild(el);const s=$("strong",el);splitChars(s);requestAnimationFrame(()=>s.classList.add("go"));
  setTimeout(()=>el.classList.add("open"),1150);setTimeout(()=>{el.remove();},2200);
}
function toggleMotion(){const off=REDUCED.matches;try{localStorage.setItem("wta_motion",off?"on":"off");}catch(e){}location.reload();}
function syncMotionLabel(){const b=$("#motionToggle");if(b)b.textContent=REDUCED.matches?"Turn animations on":"Turn animations off";}
function noteMotion(){if(motionPref()||$(".motion-note"))return;const n=document.createElement("div");n.className="motion-note";n.setAttribute("role","status");n.innerHTML=`<span style="flex:1 1 220px">Animations are off because of this device's motion setting.</span><button onclick="toggleMotion()">Turn on</button><button onclick="try{localStorage.setItem('wta_motion','off')}catch(e){};this.parentElement.remove()">Keep off</button>`;document.body.appendChild(n);}

function mountTips(){}

function fitMark(fm){const box=fm.parentElement,st=getComputedStyle(box),w=box.clientWidth-parseFloat(st.paddingLeft)-parseFloat(st.paddingRight);fm.style.fontSize="100px";fm.style.display="inline-block";const tw=fm.getBoundingClientRect().width;fm.style.display="";if(tw>0)fm.style.fontSize=Math.min(220,100*w/tw*.985)+"px";}
/* ================= live animated explainer (replaces the film) ================= */
function mountStory(){
  const pl=$("#player");if(!pl)return;
  const stage=$("#stStage",pl),cv=$("#stGlobe",pl),c=cv.getContext("2d"),chap=$$("#chap button"),tgl=$("#stToggle",pl);
  const S=[["s1",6],["s2",7.5],["s3",7],["s4",7],["s5",6.5],["s6",5]],TOTAL=39;
  const q=s=>stage.querySelector(s),qa=s=>[...stage.querySelectorAll(s)];
  const E=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3),cl=t=>Math.max(0,Math.min(1,t));
  const W25="We sell halal-certified spice blends from Kerala and want distributors and private-label buyers across Malaysia, Indonesia and the Gulf, starting with trial containers this quarter.".split(" ");
  const KEY=new Set(["halal-certified","spice","blends","distributors","private-label","buyers","Malaysia,","Indonesia","Gulf,"]);
  q(".st-text").innerHTML=W25.map(w=>`<span class="${KEY.has(w)?"k":""}">${esc(w)}</span>`).join(" ");
  const words=qa(".st-text span"),ticks=qa(".st-ticks i"),count=q(".st-count"),rows=qa(".st-m"),stops=qa(".st-stop"),ship=q(".st-ship"),fill=q(".st-fill"),photos=qa(".st-ph"),who=q(".st-who"),fade=q(".st-fade"),PW=["Buyers","Sellers","Investors","Funders","JV partners"];
  const rad=Math.PI/180,v3=(a,o)=>[Math.cos(a*rad)*Math.sin(o*rad),Math.sin(a*rad),Math.cos(a*rad)*Math.cos(o*rad)];
  const raw=atob(LAND_B64),dots=[];for(let i=0;i<raw.length;i+=2)dots.push(v3(raw.charCodeAt(i)*180/255-90,raw.charCodeAt(i+1)*360/255-180));
  const H={India:[20.6,79],China:[31,114],Brazil:[-15,-50],Russia:[55.7,37.6],"South Africa":[-29,25],Egypt:[28,31],UAE:[24.4,54.4],Indonesia:[-5,110],Malaysia:[3.1,101.7],Thailand:[13.7,100.5],Vietnam:[16,107],Philippines:[14.6,121]};
  const lanes=[["India","Malaysia"],["Russia","India"],["South Africa","Malaysia"],["China","Indonesia"],["UAE","India"],["Egypt","Thailand"],["Indonesia","India"],["China","Philippines"],["Russia","China"],["South Africa","India"]].map(([a,b],i)=>{const A=v3(...H[a]),B=v3(...H[b]),d=Math.acos(A[0]*B[0]+A[1]*B[1]+A[2]*B[2]),p=[];for(let k=0;k<=40;k++){const t=k/40,s=Math.sin(d),a1=Math.sin((1-t)*d)/s,a2=Math.sin(t*d)/s,l=1+Math.sin(Math.PI*t)*Math.min(.24,d*.12);p.push([(A[0]*a1+B[0]*a2)*l,(A[1]*a1+B[1]*a2)*l,(A[2]*a1+B[2]*a2)*l]);}return {p,i};});
  let W=1280,small=false,scale=1,D=1;
  function layout(){const r=pl.clientWidth;small=r<640;W=small?720:1280;pl.classList.toggle("st-sm",small);stage.style.width=W+"px";scale=r/W;stage.style.transform=`scale(${scale})`;D=Math.min(2,(devicePixelRatio||1)*scale+.25);cv.width=W*D;cv.height=720*D;cv.style.width=W+"px";cv.style.height="720px";draw(T);}
  function globe(t){c.setTransform(D,0,0,D,0,0);c.clearRect(0,0,W,720);const lon=-(88-t*2.2)*rad,lat=-10*rad,ca=Math.cos(lon),sa=Math.sin(lon),cb=Math.cos(lat),sb=Math.sin(lat),pr=v=>{const x=v[0]*ca+v[2]*sa,z0=-v[0]*sa+v[2]*ca;return [x,v[1]*cb-z0*sb,v[1]*sb+z0*cb];};
    const cx=small?360:942,cy=small?462:360,r=(small?236:308)*(.94+.06*E(t/1.2));const g=c.createRadialGradient(cx-r*.35,cy-r*.38,30,cx,cy,r);g.addColorStop(0,"#1B4A7E");g.addColorStop(1,"#0D2B50");c.fillStyle=g;c.beginPath();c.arc(cx,cy,r,0,7);c.fill();c.strokeStyle="rgba(150,190,235,.3)";c.lineWidth=1;c.stroke();
    for(const d of dots){const [x,y,z]=pr(d);if(z<.02)continue;c.fillStyle=`rgba(200,220,240,${(.2+z*.6).toFixed(2)})`;c.fillRect(cx+x*r-1.2,cy-y*r-1.2,2.4,2.4);}
    c.lineWidth=1.6;for(const l of lanes){const pg=E((t-.5-l.i*.14)/1.1),n=Math.floor(pg*40);c.beginPath();let on=false;for(let i=0;i<=n;i++){const q=pr(l.p[i]);if(q[2]>0||Math.hypot(q[0],q[1])>1){const X=cx+q[0]*r,Y=cy-q[1]*r;on?c.lineTo(X,Y):c.moveTo(X,Y);on=true;}else on=false;}c.strokeStyle="rgba(226,190,115,.75)";c.stroke();
      if(pg>=.99){const q=pr(l.p[Math.floor(((t/3.5+l.i*.17)%1)*40)]);if(q[2]>0||Math.hypot(q[0],q[1])>1){c.fillStyle="#FFE9B0";c.beginPath();c.arc(cx+q[0]*r,cy-q[1]*r,3.6,0,7);c.fill();}}}
    c.font='600 17px "IBM Plex Sans",sans-serif';c.textBaseline="alphabetic";for(const k in H){const [x,y,z]=pr(v3(...H[k]));if(z<.06)continue;c.fillStyle="#E2BE73";c.beginPath();c.arc(cx+x*r,cy-y*r,4,0,7);c.fill();if(["India","China","Indonesia","Philippines","Russia","South Africa"].includes(k)&&z>.2){c.fillStyle="#fff";c.fillText(k,cx+x*r+9,cy-y*r+5);}}}
  const ri=(e,a,dy=26)=>{e.style.opacity=cl(a);e.style.transform=`translateY(${(1-E(a))*dy}px)`;};
  let curScene="";
  function draw(T0){
    let t=T0,idx=0;for(;idx<S.length-1;idx++){if(t<S[idx][1])break;t-=S[idx][1];}
    const [id,d]=S[idx];
    if(id!==curScene){curScene=id;qa(".st-s").forEach(s=>s.classList.toggle("on",s.dataset.s===id));}
    fade.style.opacity=Math.max(1-t/.4,(t-(d-.4))/.4,0);
    if(id==="s1"){globe(t);ri(q(".st-a"),(t-.5)/.6);ri(q(".st-b"),(t-1.9)/.6);}
    if(id==="s2"){const n=Math.min(25,Math.floor(Math.max(0,t-.7)/.19));words.forEach((w,i)=>w.classList.toggle("on",i<n));ticks.forEach((k,i)=>k.classList.toggle("on",i<n));count.textContent=n+" of 25 words";}
    if(id==="s3")rows.forEach((m,i)=>{const a=E((t-.7-i*.9)/.6);m.style.opacity=a;m.style.transform=`translateX(${(1-a)*70}px)`;});
    if(id==="s4"){const p=cl((t-.6)/5.2),pc=p*100;fill.style.width=pc+"%";ship.style.left=pc+"%";ship.style.marginTop=Math.sin(t*2.4)*2+"px";stops.forEach((r,i)=>r.classList.toggle("on",p*5>=i-.02));}
    if(id==="s5"){const seg=d/5,i=Math.min(4,Math.floor(t/seg)),lt=t-i*seg;photos.forEach((e,k)=>{const a=k===i?1:(k===i+1?cl((lt-seg+.35)/.35):0);e.style.opacity=k<=i+1?a:0;const u=(t-k*seg)/seg;e.style.transform=`scale(${1.06+u*.05}) translateX(${(k%2?-1:1)*u*8}px)`;e.style.zIndex=k;});who.textContent=PW[i];ri(who,lt/.35,16);}
    if(id==="s6")qa('.st-s[data-s="s6"]>*').forEach((e,i)=>ri(e,(t-.25-i*.22)/.55,14));
    let ck=0;FILM_CH.forEach(([x],i)=>{if(T0>=x-.03)ck=i;});chap.forEach((b,i)=>b.classList.toggle("on",i===ck));
  }
  let T=REDUCED.matches?4.5:0,raf=0,last=0,vis=false,playing=!REDUCED.matches;
  const frame=now=>{raf=0;if(!vis||!playing||document.hidden)return;T=(T+Math.min(.05,(now-last)/1000))%TOTAL;last=now;draw(T);raf=requestAnimationFrame(frame);};
  const start=()=>{if(!raf&&vis&&playing&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);}};
  const setPlay=v=>{playing=v;tgl.setAttribute("aria-label",v?"Pause animation":"Play animation");tgl.innerHTML=v?'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>';if(v)start();};
  tgl.onclick=()=>setPlay(!playing);setPlay(playing);
  chap.forEach(b=>b.onclick=()=>{T=+b.dataset.t+.45;if(REDUCED.matches)T=+b.dataset.t+3.5;draw(T);start();});
  const ro=new ResizeObserver(layout);ro.observe(pl);layout();
  const io=new IntersectionObserver(([e])=>{vis=e.isIntersecting;if(vis)start();},{threshold:.15});io.observe(pl);
  const vc=()=>start();document.addEventListener("visibilitychange",vc);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>draw(T));
  onClean(()=>{cancelAnimationFrame(raf);raf=0;vis=false;ro.disconnect();io.disconnect();document.removeEventListener("visibilitychange",vc);});
}

/* ================= boot ================= */
export { REDUCED, enhance, softRoute, toggleMotion, syncMotionLabel, syncHeader };
export function initFx(){ addEventListener("hashchange",()=>softRoute()); }
