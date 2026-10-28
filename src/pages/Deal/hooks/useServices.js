/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';
import { state } from '../../../utils/state.js';

function useServices() {

  const getFundingDetail = async (id) => {
    try {
      const response = await APIRequest.request("GET", `${ConfigAPIURL.funding}/${id}`, "");
      const d = response?.data;
      if (d?.responseCode === 100) return d.result || d.listing || null;
      return null;
    } catch {
      return null;
    }
  };

  const getDocuments = async (fundingId) => {
    if (!state.USER) return [];
    try {
      const response = await APIRequest.request("GET", `${ConfigAPIURL.funding}/${fundingId}/documents`, "");
      const d = response?.data;
      if (d?.responseCode === 100) return d.result || d.documents || [];
      return [];
    } catch {
      return [];
    }
  };

  const expressInterest = async (fundingId) => {
    if (!state.USER) return "guest";
    try {
      const response = await APIRequest.request("POST", `${ConfigAPIURL.funding}/${fundingId}/interest`, "");
      const d = response?.data;
      if (d?.responseCode === 100) {
        toast("Interest expressed!", "The chamber has been notified.");
        return d.result || true;
      }
      toast("Error", d?.message || "Could not express interest.", false);
      return null;
    } catch {
      toast("Error", "Unable to express interest.", false);
      return null;
    }
  };

  const advanceDeal = async (dealId, toStage) => {
    if (!state.USER) return "guest";
    try {
      const response = await APIRequest.request("POST", `${ConfigAPIURL.deals}/${dealId}/advance`, JSON.stringify({ to_stage: toStage }));
      const d = response?.data;
      if (d?.responseCode === 100) {
        toast("Deal advanced!", "Your deal has moved to the next stage.");
        return d.result || true;
      }
      // Member trying to advance beyond stage 1 — chamber facilitates the rest
      if (d?.message && d.message.includes("Members may only advance")) {
        toast("Chamber facilitates next step", "The chamber will move your deal forward once both parties are ready. No action needed from you.", true);
        return "chamber";
      }
      toast("Error", d?.message || "Could not advance deal.", false);
      return null;
    } catch {
      toast("Error", "Unable to advance deal.", false);
      return null;
    }
  };

  const getInboundDealsCount = async (fundingListingId) => {
    try {
      const response = await APIRequest.request("GET", ConfigAPIURL.myInboundDeals, "");
      const d = response?.data;
      if (d?.responseCode === 100) {
        const deals = d.result || d.deals || [];
        return deals.filter(deal => {
          const lid = deal.funding_listing_id?.toString?.() || String(deal.funding_listing_id || "");
          return lid === fundingListingId?.toString?.();
        }).length;
      }
      return 0;
    } catch { return 0; }
  };

  return { getFundingDetail, getDocuments, expressInterest, advanceDeal, getInboundDealsCount };
}

export default useServices;
