/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';
import LocalStorage from '../../../config/LocalStorage.js';

function useServices() {
  const sendOtp = async (email) => {
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.sendOtp,
        JSON.stringify({ email })
      );
      const d = response?.data;
      if (d?.responseCode === 100) {
        return { ok: true, dev_hint: d.dev_hint || null };
      }
      toast("Failed", d?.message || "Could not send OTP. Try again.", false);
      return null;
    } catch {
      toast("Error", "Unable to send OTP. Please try again.", false);
      return null;
    }
  };

  const verifyOtpAndRegister = async (email, otp, profileData) => {
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.verifyOtp,
        JSON.stringify({ email, otp, ...profileData })
      );
      const d = response?.data;
      // HTTP 202: still needs profile (shouldn't happen when profileData is passed, but handle gracefully)
      if (response?.status === 202 || d?.needs_profile) {
        return { needs_profile: true };
      }
      if (d?.responseCode === 100) {
        const token = d.accessToken || d.token;
        if (token) localStorage.setItem("wta_token", token);
        if (d.refreshToken) localStorage.setItem("wta_refresh", d.refreshToken);
        const user = { ...(d.member || {}), ...(d.user || d.result || {}) };
        LocalStorage.setUser(user);
        return { user };
      }
      toast("Failed", d?.message || "Could not complete registration.", false);
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

  return { sendOtp, verifyOtpAndRegister, uploadImage };
}

export default useServices;
