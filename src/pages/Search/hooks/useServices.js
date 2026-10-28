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

  const followUpChat = async (searchId, message) => {
    try {
      const response = await APIRequest.request(
        "POST",
        `${ConfigAPIURL.match}/${searchId}/chat`,
        JSON.stringify({ message })
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d;
      return null;
    } catch {
      return null;
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

  return { runMatch, followUpChat, getPopularSearches };
}

export default useServices;


