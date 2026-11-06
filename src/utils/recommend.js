/* eslint-disable */
/* Best matches for the dashboard.
   1. Asks the server (GET /api/me/recommendations) for scored matches. If it has none, or is not built yet,
   2. scores the member's opportunities here: what they seek vs what the other side offers, plus the sectors
      and countries they look at when click tracking is on. A score from the server (score / match_score)
      always wins over the local one. */
import APIRequest from './APIRequest.js';
import ConfigAPIURL from '../config/ConfigAPIURL.js';
import { COMPAT } from '../constant/roles.js';
import { interests, trackingOn } from './activity.js';

const STOP = new Set("the a an and or of for to in on with from by at as is are be seeking looking want need needs our we us your you that this these those into across over under more most all any new via per".split(" "));
const words = s => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));

export function scoreLocal(user, m, int) {
  const reasons = []; let s = 52;
  const ug = user.goal || user.type;
  if (ug && COMPAT[ug] && COMPAT[ug].includes(m.goal)) { s += 12; reasons.push("Complements what you do"); }
  const mine = new Set(words(user.seek)), theirs = words((m.seek || "") + " " + (m.company_name || ""));
  const hit = [...new Set(theirs.filter(w => mine.has(w)))];
  if (hit.length) { s += Math.min(22, hit.length * 7); reasons.push("Shared: " + hit.slice(0, 3).join(", ")); }
  if (user.sector && m.sector === user.sector) { s += 4; reasons.push("Same sector"); }
  if (m.is_verified) s += 3;
  if (int && int.total) {
    const sc = int.sec.get(m.sector) || 0, cc = int.cty.get(m.country_name || m.country) || int.cty.get(m.country) || 0;
    if (sc) { s += Math.min(10, 4 + sc * 2); reasons.push("You look at " + m.sector + " listings"); }
    if (cc) { s += Math.min(6, 2 + cc * 2); reasons.push("You look at " + (m.country_name || m.country)); }
  }
  return { score: Math.max(40, Math.min(98, Math.round(s))), reasons };
}

export async function getRecommendations(user, opportunities, limit = 5) {
  try {
    const r = await APIRequest.request("GET", ConfigAPIURL.myRecommendations, "");
    const d = r && r.data;
    const rows = d && d.responseCode === 100 ? (d.matches || d.result || d.members || []) : [];
    if (Array.isArray(rows) && rows.length) {
      return { source: "server", list: rows.filter(m => !(m._id && m._id === user._id)).slice(0, limit).map(m => ({ m, score: Math.round(m.score ?? m.match_score ?? 70), reasons: m.reasons || (m.reason ? [m.reason] : []) })) };
    }
  } catch (e) {}
  const int = trackingOn() ? interests() : null;
  const me = u => u && ((u._id && u._id === user._id) || (u.email && user.email && String(u.email).toLowerCase() === String(user.email).toLowerCase()));
  const list = (opportunities || []).filter(m => !me(m)).map(m => {
    const l = scoreLocal(user, m, int);
    return { m, score: Math.round(m.score ?? m.match_score ?? l.score), reasons: l.reasons };
  }).sort((a, b) => b.score - a.score).slice(0, limit);
  return { source: int && int.total ? "activity" : "listing", list };
}
