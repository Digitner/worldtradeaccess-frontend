import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import LocalStorage from "../../../config/LocalStorage.js";
import { toast } from "../../../components/Toasts/toast.js";

function useServices() {
  const publishNotification = (msg, type) => {
    const good = type !== "error";
    toast(type === "error" ? "Error" : "Notice", msg, good);
  };

  const getMe = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.me, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        const user = { ...(d.member || {}), ...(d.user || d.result || {}) };
        LocalStorage.setUser(user);
        return user;
      }
      return null;
    } catch {
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
      const url = (d?.data?.attachmentUrl || d?.attachmentUrl || [])[0];
      if (url) return url;
      publishNotification("Upload failed. Please try again.", "error");
    } catch {
      publishNotification("Upload failed. Please try again.", "error");
    }
    return null;
  };

  const saveListing = async (formData) => {
    try {
      const response = await APIRequest.request(
        "PUT",
        ConfigAPIURL.myListing,
        JSON.stringify(formData)
      );
      const d = response?.data;
      // Server-side guard: e.g. ["website","phone"] already registered - EditListing.js shows the red alerts
      if (Array.isArray(d?.duplicate_fields) && d.duplicate_fields.length) return { duplicate: d.duplicate_fields };
      if (d?.responseCode === 100 ) {
        const updated = d.user || d.result;
        if (updated) LocalStorage.setUser(updated);
        publishNotification("Listing saved!", "success");
        return updated || true;
      }
      publishNotification(d?.message || "Could not save listing.", "error");
      return null;
    } catch {
      publishNotification("Unable to save. Please try again.", "error");
      return null;
    }
  };

  const changePassword = async ({ current_password, new_password }) => {
    try {
      const response = await APIRequest.request(
        "PUT",
        ConfigAPIURL.myPassword,
        JSON.stringify({ current_password, new_password })
      );
      const d = response?.data;
      if (d?.responseCode === 100) {
        publishNotification("Password updated!", "success");
        return true;
      }
      publishNotification(d?.message || "Could not update password.", "error");
      return false;
    } catch {
      publishNotification("Unable to update password. Please try again.", "error");
      return false;
    }
  };

  // Live check for the edit form: which of { name, website, phone, email } belong to ANOTHER member. Your own
  // listing and unchanged fields are excluded server-side. Fails open - the save re-checks authoritatively anyway.
  const checkMyDuplicate = async ({ name = "", website = "", phone = "", email = "" } = {}) => {
    const none = { company: false, website: false, phone: false, email: false };
    try {
      const v = { name, website, phone, email };
      const qs = "?" + Object.entries(v).map(([k, x]) => k + "=" + encodeURIComponent(String(x).trim())).join("&");
      const response = await APIRequest.request("GET", ConfigAPIURL.myCheckDuplicate + qs, "");
      const d = response?.data;
      if (d?.responseCode === 100) {
        return { company: !!d.company_exists, website: !!d.website_exists, phone: !!d.phone_exists, email: !!d.email_exists };
      }
    } catch {}
    return none;
  };

  return { getMe, saveListing, uploadImage, changePassword, checkMyDuplicate };
}

export default useServices;


