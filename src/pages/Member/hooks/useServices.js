import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import LocalStorage from "../../../config/LocalStorage.js";
import { toast } from "../../../components/Toasts/toast.js";

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
        }
        return m;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getSimilar = async (id) => {
    try {
      const response = await APIRequest.request("GET", `${ConfigAPIURL.members}/${id}/similar`, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.members || [];
      return [];
    } catch {
      return [];
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
      return "";
    } catch {
      return "";
    }
  };

  return { getMember, getSimilar, sendIntro, draftIntro };
}

export default useServices;


