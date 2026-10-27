/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';
import LocalStorage from '../../../config/LocalStorage.js';

function useServices() {
  const login = async ({ email, password }) => {
    try {
      const response = await APIRequest.request(
        "POST",
        ConfigAPIURL.login,
        JSON.stringify({ email, password })
      );
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        const token = d.accessToken || d.token;
        localStorage.setItem("wta_token", token);
        const me = await getMe();
        return me;
      }
      toast("Login failed", d?.message || "Wrong email or password.", false);
      return null;
    } catch {
      toast("Error", "Unable to log in. Please try again.", false);
      return null;
    }
  };

  const getMe = async () => {
    const response = await APIRequest.request("GET", ConfigAPIURL.me, "");
    const d = response?.data;
    if (d?.responseCode === 100 ) {
      const user = { ...(d.member || {}), ...(d.user || d.result || {}) };
      LocalStorage.setUser(user);
      return user;
    }
    return null;
  };

  return { login, getMe };
}

export default useServices;


