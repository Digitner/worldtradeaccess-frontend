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

  // Follow-up question against a previous search. This is the ONE endpoint in the app that streams: the
  // backend (MatchController.chat) answers with Server-Sent Events - `data: {"text":"..."}` per token, then
  // `data: [DONE]` - so it cannot go through APIRequest.request, which does fetch().then(r => r.json()) and
  // would just fail to parse the stream and look like nothing happened. Hence the hand-rolled reader below.
  //
  // It also takes `question` (not `message` - the old name here never matched the backend, so every call
  // would have come back 422) and, for a guest, the guest_token that POST /match handed out, since a guest
  // search has no user to authorise against.
  //
  // `onText` is called with the FULL text so far on each chunk, so the caller can paint a live bubble.
  const followUpChat = async ({ searchId, question, guestToken, onText, signal }) => {
    const payload = { question };
    if (guestToken) payload.guest_token = guestToken;

    const response = await fetch(`${ConfigAPIURL.match}/${searchId}/chat`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        authtoken: localStorage.getItem("wta_token") || "",
      },
      credentials: "include",
      body: JSON.stringify(payload),
      signal,
    });

    // Anything rejected before streaming begins (missing question, 403 on someone else's search, a crash
    // before the first write) still comes back as the normal JSON envelope, not as SSE - surface its message
    // rather than a blank bubble.
    //
    // Two DIFFERENT envelope shapes can land here, and only one nests the real text under `.message`:
    //   - UtilController.sendSuccess with a non-100 responseCode (missing question, wrong owner, ...):
    //     {message:"success", data:{responseCode, message:"<real reason>"}}
    //   - UtilController.sendError, for anything unexpected (e.g. the Anthropic SDK call throwing):
    //     {message:"failure", data:"<real reason>"}  <- `message` is ALWAYS the literal string "failure"
    //     here, never the actual error. `data` is a plain string, not an object - reading `d.data.message`
    //     silently gets `undefined` off a string, so this used to fall through to `d.message` and show the
    //     literal word "failure" instead of why the call actually failed.
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/event-stream")) {
      let message = "The advisor couldn't answer that just now.";
      try {
        const d = await response.json();
        const real = typeof d?.data === "string" ? d.data : d?.data?.message;
        message = real || message;
      } catch { /* not JSON either - keep the default */ }
      throw new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // a frame can be split across chunks - keep the partial line for the next read
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const frame = line.slice(5).trim();
        if (!frame || frame === "[DONE]") continue;
        let event;
        try {
          event = JSON.parse(frame);
        } catch {
          continue; // half-written frame; the next chunk completes it
        }
        if (event.error) throw new Error(event.error);
        if (event.text) {
          full += event.text;
          if (onText) onText(full);
        }
      }
    }
    return full;
  };

  /**
   * Thumbs up / down on one search result, or on the answer above them.
   *
   * This is what makes the search improve: the backend remembers the vote against the WORDS of this search,
   * and ranks later searches worded similarly by it (api/controller/services/searchLearning.js). The vote is
   * therefore tied to the stored search it was cast on, which a guest proves is theirs with the token POST
   * /match handed back - the same rule the follow-up chat uses.
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

  return { runMatch, followUpChat, sendFeedback, getPopularSearches };
}

export default useServices;


