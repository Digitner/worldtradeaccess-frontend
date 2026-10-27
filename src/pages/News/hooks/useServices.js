import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import useAlert from "../../../hooks/useAlert.js";

function useServices() {
  const { publishNotification } = useAlert();

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
        publishNotification(`Subscribed â€" Alerts set up for ${topics.length} topic${topics.length !== 1 ? "s" : ""}.`, "success");
        return true;
      }
      publishNotification(d?.message || "Could not subscribe.", "error");
      return false;
    } catch {
      publishNotification("Unable to subscribe. Please try again.", "error");
      return false;
    }
  };

  return { getNews, getNewsDetail, subscribeAlerts };
}

export default useServices;



