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
      // Server-side guard: e.g. ["company","phone"] already registered - Register.js shows the red alerts
      if (Array.isArray(d?.duplicate_fields) && d.duplicate_fields.length) {
        return { duplicate: d.duplicate_fields };
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

  // Which of { name, website, phone, email } are already registered by an existing member (any membership type).
  // Pass any subset; blank fields answer false. Fails open on errors, since the server re-checks before creating
  // the account anyway. Returns { company, website, phone, email } booleans.
  const checkDuplicate = async ({ name = "", website = "", phone = "", email = "" } = {}) => {
    const none = { company: false, website: false, phone: false, email: false };
    const v = { name: name.trim(), website: website.trim(), phone: phone.trim(), email: email.trim() };
    if (!v.name && !v.website && !v.phone && !v.email) return none;
    try {
      const qs = "?" + Object.entries(v).map(([k, x]) => k + "=" + encodeURIComponent(x)).join("&");
      const response = await APIRequest.request("GET", ConfigAPIURL.membersCheckDuplicate + qs, "");
      const d = response?.data;
      if (d?.responseCode === 100) {
        return { company: !!d.company_exists, website: !!d.website_exists, phone: !!d.phone_exists, email: !!d.email_exists };
      }
    } catch {}
    return none;
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

  return { sendOtp, verifyOtpAndRegister, uploadImage, checkDuplicate };
}

export default useServices;
