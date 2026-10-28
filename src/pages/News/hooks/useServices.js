import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import { toast } from "../../../components/Toasts/toast.js";

function useServices() {

  const getNews = async ({ page = 1, limit = 20 } = {}) => {
    try {
      const response = await APIRequest.request(
        "GET",
        `${ConfigAPIURL.news}?page=${page}&limit=${limit}`,
        ""
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.articles || [];
      return [];
    } catch {
      return [];
    }
  };

  const getNewsDetail = async (id) => {
    try {
      const response = await APIRequest.request("GET", `${ConfigAPIURL.news}/${id}`, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.article || null;
      return null;
    } catch {
      return null;
    }
  };

  const subscribeAlerts = async ({ email, topics }) => {
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.subscriptionsAlerts,
        JSON.stringify({ email, topics })
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        toast("Subscribed!", `Alerts set up for ${topics.length} topic${topics.length !== 1 ? "s" : ""}. We'll email you when matching news is published.`);
        return true;
      }
      toast("Error", d?.message || "Could not subscribe.", false);
      return false;
    } catch {
      toast("Error", "Unable to subscribe. Please try again.", false);
      return false;
    }
  };

  return { getNews, getNewsDetail, subscribeAlerts };
}

export default useServices;



