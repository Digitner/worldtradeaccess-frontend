/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';

function useServices() {
  const { publishNotification } = { publishNotification: (msg, type) => {
    const good = type !== "error";
    const title = type === "success" ? "Success" : type === "error" ? "Error" : "Notice";
    toast(title, msg, good);
  }};

  async function getFeaturedMembers() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.membersFeatured, "");
      const d = res?.data;
      if (d?.responseCode === 100 ) return d.result || d.members || [];
    } catch {}
    return [];
  }

  async function getTopMembers() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.membersTop, "");
      const d = res?.data;
      if (d?.responseCode === 100 ) return d.result || d.members || [];
    } catch {}
    return [];
  }

  async function getFundingHighlights() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.funding, "");
      const d = res?.data;
      if (d?.responseCode === 100 ) return d.result || d.listings || [];
    } catch {}
    return [];
  }

  async function getAds() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.ads, "");
      const d = res?.data;
      if (d?.responseCode === 100 ) return d.result || d.ads || [];
    } catch {}
    return [];
  }

  async function getPartners() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.partners, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.partners || [];
    } catch {}
    return [];
  }

  async function getTestimonials() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.testimonials, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.testimonials || [];
    } catch {}
    return [];
  }

  async function getTrending() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.trending, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.keywords || [];
    } catch {}
    return [];
  }

  return { getFeaturedMembers, getTopMembers, getFundingHighlights, getAds, getPartners, getTestimonials, getTrending };
}

export default useServices;


