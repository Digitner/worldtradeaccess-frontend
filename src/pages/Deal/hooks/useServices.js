import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import LocalStorage from "../../../config/LocalStorage.js";
import useAlert from "../../../hooks/useAlert.js";

function useServices() {
  const { publishNotification } = useAlert();

  const getFundingDetail = async (id) => {
    try {
      const response = await APIRequest.request("GET", `${ConfigAPIURL.funding}/${id}`, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.listing || null;
      return null;
    } catch {
      return null;
    }
  };

  const getDocuments = async (fundingId) => {
    if (!LocalStorage.isLoggedIn()) return [];
    try {
      const response = await APIRequest.request(
        "GET",
        `${ConfigAPIURL.funding}/${fundingId}/documents`,
        ""
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.documents || [];
      return [];
    } catch {
      return [];
    }
  };

  const expressInterest = async (fundingId) => {
    if (!LocalStorage.isLoggedIn()) return "guest";
    try {
      const response = await APIRequest.request(
        "POST",
        `${ConfigAPIURL.funding}/${fundingId}/interest`,
        ""
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        publishNotification("Interest expressed!", "success");
        return d.result || true;
      }
      publishNotification(d?.message || "Could not express interest.", "error");
      return null;
    } catch {
      publishNotification("Unable to express interest.", "error");
      return null;
    }
  };

  const advanceDeal = async (dealId) => {
    try {
      const response = await APIRequest.request(
        "POST",
        `${ConfigAPIURL.deals}/${dealId}/advance`,
        ""
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        publishNotification("Deal advanced!", "success");
        return d.result || true;
      }
      publishNotification(d?.message || "Could not advance deal.", "error");
      return null;
    } catch {
      return null;
    }
  };

  return { getFundingDetail, getDocuments, expressInterest, advanceDeal };
}

export default useServices;


