import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import LocalStorage from "../../../config/LocalStorage.js";
import { toast } from "../../../components/Toasts/toast.js";

/**
 * Service hook: returns the API wrappers this page uses. Each resolves to data (or null on failure) and shows its own error toast.
 * @returns {Object} API wrapper functions
 */
function useServices() {
  const publishNotification = (msg, type) => {
    const good = type !== "error";
    toast(type === "error" ? "Error" : "Notice", msg, good);
  };

  const getMember = async (id) => {
    try {
      const response = await APIRequest.request("GET", `${ConfigAPIURL.members}/${id}`, "");
      const d = response?.data;
      if (d?.responseCode === 100) {
        const m = d.result || d.member || null;
        if (m) {
          if (d.is_own) m.is_own = true;
          if (d.my_intro) {
            m.intro_already = true;
            m.intro_date = d.my_intro.createdAt;
          }
          // The catalogue read from their own website - a sibling of `member` in the envelope, not a field
          // on it, since it comes from its own collection (backend: models/MemberProduct.js).
          m.products = Array.isArray(d.products) ? d.products : [];
        }
        return m;
      }
      return null;
    } catch {
      return null;
    }
  };

  /**
   * Re-read my own website now: "About the business" plus the product catalogue it publishes. Only ever
   * called on the member's own listing. Resolves to the result summary, or null on failure (toasted).
   */
  const refreshWebsite = async () => {
    try {
      const response = await APIRequest.request("POST", ConfigAPIURL.myRefreshWebsite, JSON.stringify({}));
      const d = response?.data;
      if (d?.responseCode === 100) return d.result || d;
      publishNotification(d?.message || "Couldn't read your website just now.", "error");
      return null;
    } catch {
      publishNotification("Couldn't read your website just now.", "error");
      return null;
    }
  };

  const sendIntro = async ({ toMemberId, message }) => {
    if (!LocalStorage.isLoggedIn()) return "guest";
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.intros,
        JSON.stringify({ to_member_id: toMemberId, message })
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        publishNotification("Introduction sent!", "success");
        return "sent";
      }
      publishNotification(d?.message || "Could not send introduction.", "error");
      return "error";
    } catch {
      publishNotification("Unable to send introduction.", "error");
      return "error";
    }
  };

  const draftIntro = async ({ toMemberId }) => {
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.introsDraft,
        JSON.stringify({ to_member_id: toMemberId })
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result?.message || d.message || "";
      publishNotification(d?.message || "Could not draft an introduction.", "error");
      return "";
    } catch {
      publishNotification("Unable to draft an introduction.", "error");
      return "";
    }
  };

  return { getMember, refreshWebsite, sendIntro, draftIntro };
}

export default useServices;


