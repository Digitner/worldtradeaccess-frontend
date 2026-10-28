/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';

function useServices() {

  async function getAdProducts() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.adProducts, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.products || d.result || [];
    } catch {}
    return [];
  }

  async function getLiveAds() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.ads, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.ads || d.result || [];
    } catch {}
    return [];
  }

  async function getSponsoredMember() {
    try {
      const res = await APIRequest.request("GET", `${ConfigAPIURL.members}?limit=2`, "");
      const d = res?.data;
      if (d?.responseCode === 100) {
        const list = d.result || d.members || [];
        return list.slice(0, 2).map(m => ({ id: m._id || m.id, name: m.company_name || m.name, country: m.country, pillar: m.sector, type: m.goal, seek: m.seek, spon: true }));
      }
    } catch {}
    return [];
  }

  async function submitAdRequest(formData) {
    try {
      const res = await APIRequest.request("POST", ConfigAPIURL.adRequests, JSON.stringify(formData));
      const d = res?.data;
      if (d?.responseCode === 100) {
        toast("Placement requested", "The ad team will be in touch with the rate card shortly.");
        return true;
      }
      toast("Error", d?.message || "Could not send your request. Please try again.", false);
    } catch {
      toast("Error", "Could not send your request. Please try again.", false);
    }
    return false;
  }

  return { getAdProducts, getLiveAds, getSponsoredMember, submitAdRequest };
}

export default useServices;
