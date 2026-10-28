import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import LocalStorage from "../../../config/LocalStorage.js";
import { toast } from "../../../components/Toasts/toast.js";

function useServices() {
  const publishNotification = (msg, type) => {
    const good = type !== "error";
    toast(type === "error" ? "Error" : "Notice", msg, good);
  };

  const getFunding = async ({ page = 1, limit = 20 } = {}) => {
    try {
      const response = await APIRequest.request(
        "GET",
        `${ConfigAPIURL.funding}?page=${page}&limit=${limit}`,
        ""
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.listings || [];
      return [];
    } catch {
      return [];
    }
  };

  const publishListing = async (formData) => {
    if (!LocalStorage.isLoggedIn()) return "guest";
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.funding,
        JSON.stringify(formData)
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        publishNotification("Listing published!", "success");
        return d.result || true;
      }
      publishNotification(d?.message || "Could not publish listing.", "error");
      return null;
    } catch {
      publishNotification("Unable to publish listing.", "error");
      return null;
    }
  };

  const uploadImage = async (file) => {
    try {
      const fd = new FormData();
      fd.append("attachment", file);
      fd.append("bucketName", "profiles");
      const token = LocalStorage.token || localStorage.getItem("wta_token") || "";
      const res = await fetch(ConfigAPIURL.uploadFile, {
        method: "PUT",
        headers: { authtoken: token },
        body: fd,
      });
      const d = await res.json();
      const url = d?.data?.attachmentUrl?.[0] || d?.data?.fileUrl || d?.data?.Location || null;
      if (!url) { toast("Upload failed", "Could not upload image.", false); return null; }
      return url;
    } catch {
      toast("Upload failed", "Could not upload image.", false);
      return null;
    }
  };

  const getInboundDeals = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.myInboundDeals, "");
      const d = response?.data;
      if (d?.responseCode === 100) return d.result || d.deals || [];
      return [];
    } catch { return []; }
  };

  return { getFunding, publishListing, uploadImage, getInboundDeals };
}

export default useServices;


