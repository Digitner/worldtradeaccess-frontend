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

  return { getMe, saveListing, uploadImage, changePassword };
}

export default useServices;


