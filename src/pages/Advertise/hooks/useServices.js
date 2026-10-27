/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';

function useServices() {
  async function getSponsoredMember() {
    try {
      const res = await APIRequest.request("GET", `${ConfigAPIURL.members}?limit=1`, "");
      const d = res?.data;
      if (d?.responseCode === 100) {
        const m = (d.result || d.members || [])[0];
        if (m) return { id: m._id || m.id, name: m.company_name || m.name, country: m.country, pillar: m.sector, type: m.goal, seek: m.seek, spon: true };
      }
    } catch {}
    return null;
  }

  async function submitAdRequest(formData) {
    try {
      const res = await APIRequest.request("POST", ConfigAPIURL.adRequests, JSON.stringify(formData));
      const d = res?.data;
      if (d?.responseCode === 100 ) {
        toast("Placement requested", "The ad team will be in touch with the rate card.");
        return true;
      }
      toast("Error", d?.message || "Could not send your request. Please try again.", false);
    } catch {
      toast("Error", "Could not send your request. Please try again.", false);
    }
    return false;
  }

  return { getSponsoredMember, submitAdRequest };
}

export default useServices;


