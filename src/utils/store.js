/* eslint-disable */
import { toast } from '../components/Toasts/toast.js';
import { KEY } from '../config/index.js';
import { SEED_FUNDING, SEED_MEMBERS } from '../constant/seed.js';
import { save } from './helpers.js';
import { STORE, state } from './state.js';

export function shared(){return !!(STORE.db&&STORE.uid);}

export function myId(){return STORE.uid||(state.USER&&state.USER.id)||"local";}

export function forms(){return shared()&&state.MY_FORMS?state.MY_FORMS:state.LOCAL_FORMS;}

export function allMembers(){
  const extra=shared()?state.LISTINGS:state.LOCAL_MEMBERS;
  const ids=new Set(extra.map(m=>m.id));
  return [...extra,...SEED_MEMBERS.filter(m=>!ids.has(m.id))];
}

export function allFunding(){return [...(shared()?state.PUB_FUNDING:state.LOCAL_FUNDING),...SEED_FUNDING];}

export function myIntros(){return forms().filter(f=>f.kind==="intro");}

export function myDealStage(fid){let s=-1;forms().forEach(f=>{if(f.kind==="deal"&&f.data&&f.data.fid===fid&&typeof f.data.stage==="number")s=Math.max(s,f.data.stage);});return s;}

export function myDeals(){const ids=new Set(forms().filter(f=>f.kind==="deal").map(f=>f.data&&f.data.fid));return [...ids].filter(Boolean).map(fid=>{const f=allFunding().find(x=>x.id===fid);const last=forms().find(x=>x.kind==="deal"&&x.data&&x.data.fid===fid);return {fid,company:f?f.company:(last&&last.data.company)||"Opportunity",amount:f?f.amount:"",stage:myDealStage(fid)};});}

/* ---- record every form submission (shared store for admins + local copy) ---- */

export async function record(kind,data){
  const who={name:(state.USER&&(state.USER.person||state.USER.name))||data.person||data.name||"",email:(state.USER&&state.USER.email)||data.email||"",company:(state.USER&&state.USER.name)||data.company||""};
  const entry={kind,at:Date.now(),data:JSON.parse(JSON.stringify(data||{})),who};
  state.LOCAL_FORMS.unshift({...entry,id:"l"+entry.at});state.LOCAL_FORMS=state.LOCAL_FORMS.slice(0,400);save(KEY.forms,state.LOCAL_FORMS);
  if(shared()){
    try{
      await STORE.db.doc(`subs/${STORE.uid}`).set({uid:STORE.uid,last:entry.at,name:who.name,email:who.email,company:who.company});
      await STORE.db.collection(`subs/${STORE.uid}/forms`).add(entry);
      return true;
    }catch(e){
      if(e&&e.code==="quota_exceeded")toast("Submission not stored","The shared record is full. Ask an admin to clear old entries.",false);
      else toast("Saved on this device only","The shared record couldn't be reached. Your entry is kept here.",false);
      return false;
    }
  }
  return true;
}

export async function publishListing(m){
  if(shared()){
    try{await STORE.db.doc(`listings/${STORE.uid}`).set({...m,id:"u-"+STORE.uid,owner:STORE.uid,updated:Date.now()});}catch(e){}
  }else{
    state.LOCAL_MEMBERS=[m,...state.LOCAL_MEMBERS.filter(x=>x.id!==m.id)];save(KEY.members,state.LOCAL_MEMBERS);
  }
}

export async function publishFunding(item){
  if(shared()){
    const items=[item,...state.MY_FUNDING].slice(0,20);
    try{await STORE.db.doc(`funding/${STORE.uid}`).set({owner:STORE.uid,items,updated:Date.now()});}catch(e){toast("Listing not published","The shared marketplace couldn't be reached. Try again.",false);return false;}
  }else{state.LOCAL_FUNDING.unshift(item);save(KEY.funding,state.LOCAL_FUNDING);}
  return true;
}
