import APIRequest from "../../../utils/APIRequest.js";
import ConfigAPIURL from "../../../config/ConfigAPIURL.js";
import LocalStorage from "../../../config/LocalStorage.js";

function useServices() {

  const getDashboard = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.dashboard, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) {
        return d.result || d.dashboard || d;
      }
      return null;
    } catch {
      return null;
    }
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

  const getMyIntros = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.myIntros, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.intros || [];
      return [];
    } catch {
      return [];
    }
  };

  const getMyFunding = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.myFunding, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.listings || [];
      return [];
    } catch {
      return [];
    }
  };

  const getMyDeals = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.myDeals, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.deals || [];
      return [];
    } catch {
      return [];
    }
  };

  const getInboundDeals = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.myInboundDeals, "");
      const d = response?.data;
      if (d?.responseCode === 100) return d.result || d.deals || [];
      return [];
    } catch {
      return [];
    }
  };

  const getOpportunities = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.members + "?limit=10", "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.members || [];
      return [];
    } catch {
      return [];
    }
  };

  // Companies the member has actually opened the profile page for, most recent first - GET /me/recently-viewed
  // (MemberController.recentlyViewed, fed by a ProfileView row written in MemberController.getById). A card
  // seen in a carousel or search result never counts; only clicking through to the profile itself does.
  const getRecentlyViewed = async () => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.recentlyViewed, "");
      const d = response?.data;
      if (d?.responseCode === 100 ) return d.result || d.members || [];
      return [];
    } catch {
      return [];
    }
  };

  return { getDashboard, getMe, getMyIntros, getMyFunding, getMyDeals, getInboundDeals, getOpportunities, getRecentlyViewed };
}

export default useServices;


