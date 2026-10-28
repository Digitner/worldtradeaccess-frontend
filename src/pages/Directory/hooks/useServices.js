import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";

function useServices() {

  const getMembers = async ({ q = "", sector = "", page = 1, limit = 40 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (sector) params.set("sector", sector);
      params.set("page", page);
      params.set("limit", limit);
      const response = await APIRequest.request(
        "GET",
        `${ConfigAPIURL.members}?${params.toString()}`,
        ""
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.members || [];
      return [];
    } catch {
      return [];
    }
  };

  const getFeatured = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.membersFeatured, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.members || [];
      return [];
    } catch {
      return [];
    }
  };

  return { getMembers, getFeatured };
}

export default useServices;


