import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import { toast } from "../../../components/Toasts/toast.js";

function useServices() {
  const publishNotification = (msg, type) => {
    const good = type !== "error";
    toast(type === "error" ? "Error" : "Notice", msg, good);
  };

  const runMatch = async ({ goal, seek, intent }) => {
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.match,
        JSON.stringify({ goal, intent: intent || seek })
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        return d.result || d;
      }
      publishNotification(d?.message || "No matches found.", "info");
      return null;
    } catch {
      publishNotification("Matching service unavailable. Try again.", "error");
      return null;
    }
  };

  /**
   * Thumbs up / down on one search result, or on the answer above them.
   *
   * This is what makes the search improve: the backend remembers the vote against the WORDS of this search,
   * and ranks later searches worded similarly by it (api/controller/services/searchLearning.js). The vote is
   * therefore tied to the stored search it was cast on, which a guest proves is theirs with the token POST
   * /match handed back, since a guest search has no user to authorise against.
   *
   * Resolves to { ok, counted, message } and never throws: a vote that fails to save must not take down the
   * results the member is reading. `counted` is false when the vote was stored but will not shape rankings
   * (a guest, or a member rating their own listing).
   */
  const sendFeedback = async ({ searchId, scope, memberId, vote, guestToken }) => {
    if (!searchId) return { ok: false };
    try {
      const body = { scope, vote };
      if (memberId) body.member_id = memberId;
      if (guestToken) body.guest_token = guestToken;
      const response = await APIRequest.request(
        "POST",
        `${ConfigAPIURL.match}/${searchId}/feedback`,
        JSON.stringify(body)
      );
      const d = response?.data;
      if (d?.responseCode === 100) return { ok: true, counted: d.counted !== false, message: d.message };
      return { ok: false, message: d?.message };
    } catch {
      return { ok: false };
    }
  };

  const getPopularSearches = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.searchPopular, "");
      const d = response?.data;
      if (d?.responseCode === 100 && Array.isArray(d.popular)) return d.popular;
      return [];
    } catch {
      return [];
    }
  };

  return { runMatch, sendFeedback, getPopularSearches };
}

export default useServices;


