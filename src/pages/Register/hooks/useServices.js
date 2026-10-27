/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';
import LocalStorage from '../../../config/LocalStorage.js';

function useServices() {
  const register = async (formData) => {
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.register,
        JSON.stringify(formData)
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        const token = d.accessToken || d.token;
        if (token) localStorage.setItem("wta_token", token);
        const user = d.user || d.result;
        if (user) LocalStorage.setUser(user);
        toast("Welcome", "Your account is ready. Welcome to WorldTradeAccess!", true);
        return user || true;
      } else if (d?.responseCode === 601) {
        toast("Already registered", "That email is already registered. Log in instead.", false);
        return null;
      }
      toast("Registration failed", d?.message || "Check the form and try again.", false);
      return null;
    } catch {
      toast("Error", "Unable to register. Please try again.", false);
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
      return (d?.data?.attachmentUrl || d?.attachmentUrl || [])[0] || null;
    } catch { return null; }
  };

  return { register, uploadImage };
}

export default useServices;


