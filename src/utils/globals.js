/* eslint-disable */
/* Markup built by the pages uses inline handlers (onclick="go('#/')"), so these helpers are exposed on window. */
import { ico, esc, bold, initialsOf, wc, load, save, img, photo, imgTag, fmtDate, fmtShort, isEmail } from './helpers.js';
import { reqField } from './forms.js';
import { go, curBase, softRefresh, route } from './router.js';
import { shared, myId, forms, allMembers, allFunding, myIntros, myDealStage, myDeals, record, publishListing, publishFunding } from './store.js';
import { effectiveDark, toggleTheme } from '../themes/theme.js';
import { toast } from '../components/Toasts/toast.js';
import { renderChrome, closeMenu } from '../components/Navbar/navbar.js';
import { subFooter } from '../components/Footer/subscribe.js';
import { carousel, mountCarousels } from '../components/Carousel/Carousel.js';
import { adClick, adLeaderHTML, adSideHTML, adInlineHTML } from '../components/Ads/Ads.js';
import { ccChip, pIco, typeTag } from '../components/Chips/Chips.js';
import { ringHTML } from '../components/ScoreRing/ScoreRing.js';
import { mktCardHTML } from '../components/MarketCard/MarketCard.js';
import { fundRailHTML } from '../components/FundingCard/FundingCard.js';
import { heroSearch, heroChip, rankTab, viewHome } from '../pages/public/Home/Home.js';
import { viewRegister } from '../pages/public/Register/Register.js';
import { viewLogin, logout } from '../pages/public/Login/Login.js';
import { viewDashboard } from '../pages/public/Dashboard/Dashboard.js';
import { viewEditListing } from '../pages/public/EditListing/EditListing.js';
import { quickSearch, viewSearch, directoryForAI, runSearch, aiMatch, localMatch, renderMatches, renderChat, askFollow } from '../pages/public/Search/Search.js';
import { viewDirectory, paintDir } from '../pages/public/Directory/Directory.js';
import { viewMember, openVideo, closeVideo } from '../pages/public/Member/Member.js';
import { dealAct, viewDeal } from '../pages/public/Deal/Deal.js';
import { viewFunding, paintFund } from '../pages/public/Funding/Funding.js';
import { viewNews, toggleNews } from '../pages/public/News/News.js';
import { viewAdvertise } from '../pages/public/Advertise/Advertise.js';
import { viewContact } from '../pages/public/Contact/Contact.js';
import { loadAdmin, adminRows, summarize, viewAdmin, paintAdmin, adminDetail, admTab, exportCSV } from '../pages/privateRouting/Admin/Admin.js';
import { state, STORE } from './state.js';
import { IMG } from '../constant/images.js';

Object.assign(window, { ico, esc, bold, initialsOf, wc, load, save, img, photo, imgTag, fmtDate, fmtShort, isEmail, reqField, go, curBase, softRefresh, route, shared, myId, forms, allMembers, allFunding, myIntros, myDealStage, myDeals, record, publishListing, publishFunding, effectiveDark, toggleTheme, toast, renderChrome, closeMenu, subFooter, carousel, mountCarousels, adClick, adLeaderHTML, adSideHTML, adInlineHTML, ccChip, pIco, typeTag, ringHTML, mktCardHTML, fundRailHTML, heroSearch, heroChip, rankTab, viewHome, viewRegister, viewLogin, logout, viewDashboard, viewEditListing, quickSearch, viewSearch, directoryForAI, runSearch, aiMatch, localMatch, renderMatches, renderChat, askFollow, viewDirectory, paintDir, viewMember, openVideo, closeVideo, dealAct, viewDeal, viewFunding, paintFund, viewNews, toggleNews, viewAdvertise, viewContact, loadAdmin, adminRows, summarize, viewAdmin, paintAdmin, adminDetail, admTab, exportCSV, state, STORE, IMG });
