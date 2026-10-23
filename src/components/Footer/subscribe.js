/* eslint-disable */
import { toast } from '../Toasts/toast.js';
import { $, isEmail } from '../../utils/helpers.js';
import { state } from '../../utils/state.js';
import { record } from '../../utils/store.js';

export async function subFooter(e){
  e.preventDefault();
  const el=$("#footEmail"),v=el.value.trim();
  if(!isEmail(v)){el.classList.add("err");toast("Check the email","Enter an address like name@company.com.",false);return;}
  el.classList.remove("err");
  await record("newsletter",{email:v,list:"Monthly briefing"});
  el.value="";toast("Subscribed","You'll get the monthly briefing.");
}

/* ================= state.ADMIN CONSOLE ================= */
