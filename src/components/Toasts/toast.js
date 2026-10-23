/* eslint-disable */
import { $, esc, ico } from '../../utils/helpers.js';

export function toast(title,msg,good=true){
  const t=document.createElement("div");t.className="toast "+(good?"good":"bad");
  t.innerHTML=`<span class="ti">${good?ico("check"):ico("x")}</span><div><b>${esc(title)}</b>${msg?`<span>${esc(msg)}</span>`:""}</div>`;
  $("#toasts").appendChild(t);
  setTimeout(()=>{t.style.transition=".3s";t.style.opacity="0";setTimeout(()=>t.remove(),300);},3600);
}
