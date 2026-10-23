/* eslint-disable */
import { KEY } from '../config/index.js';
import { load } from './helpers.js';
import { shared } from './store.js';

/* Shared app state (replaces the old top-level variables). Also exposed as window.state for inline handlers. */
export const STORE={db:null,user:null,uid:null,canAdmin:false,checked:false,sample:null,downloads:null};

export const state = {};
state.USER=load(KEY.user,null);
state.LOCAL_FORMS=load(KEY.forms,[]);
state.LOCAL_MEMBERS=load(KEY.members,[]);
state.LOCAL_FUNDING=load(KEY.funding,[]);
state.LISTINGS=[];      // shared member listings from all viewers
state.PUB_FUNDING=[];   // shared funding listings from all viewers
state.MY_FUNDING=[];    // this viewer's funding items (shared mode)
state.MY_FORMS=null;    // this viewer's own submissions (shared mode)
state.CAROUSEL_TIMERS=[];
state.SR={role:(state.USER&&state.USER.type)||"buy",busy:false,last:null,chat:[],ctl:null};
state.HERO={q:null,role:null};
state.DIR={pillar:"all",q:""};
state.ADMIN={rows:[],loaded:false,loading:false,tab:"all",q:"",sel:null,names:{},err:"",pw:false};
