/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';

function useServices() {
  async function getSubmissions({ kind, page = 1, limit = 400 } = {}) {
    try {
      let url = `${ConfigAPIURL.adminSubmissions}?page=${page}&limit=${limit}`;
      if (kind && kind !== "all") url += `&kind=${encodeURIComponent(kind)}`;
      const res = await APIRequest.request("GET", url, "");
      const d = res?.data;
      if (d?.responseCode === 100 ) return d.result || d.submissions || [];
      toast("Error", d?.message || "Could not load submissions.", false);
    } catch {
      toast("Error", "Could not load submissions.", false);
    }
    return [];
  }

  async function getUsers({ q, page = 1, limit = 100 } = {}) {
    try {
      let url = `${ConfigAPIURL.adminUsers}?page=${page}&limit=${limit}`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      const res = await APIRequest.request("GET", url, "");
      const d = res?.data;
      if (d?.responseCode === 100 ) return d.result || d.users || [];
      toast("Error", d?.message || "Could not load users.", false);
    } catch {
      toast("Error", "Could not load users.", false);
    }
    return [];
  }

  async function exportSubmissionsCSV() {
    try {
      const res = await fetch(ConfigAPIURL.adminSubmissionsExport, {
        headers: { authtoken: localStorage.getItem("wta_token") || "" },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `worldtradeaccess-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return true;
    } catch {
      toast("Export failed", "The download couldn't be created.", false);
    }
    return false;
  }

  async function uploadImage(file) {
    try {
      const fd = new FormData();
      fd.append("attachment", file);
      fd.append("bucketName", "profiles");
      const token = localStorage.getItem("wta_token") || "";
      const res = await fetch(ConfigAPIURL.uploadFile, {
        method: "PUT",
        headers: { authtoken: token },
        body: fd,
      });
      const d = await res.json();
      const url = d?.data?.attachmentUrl?.[0] || d?.data?.fileUrl || d?.data?.Location || null;
      if (!url) { toast("Upload failed", "Could not upload image.", false); return null; }
      return url;
    } catch {
      toast("Upload failed", "Could not upload image.", false);
      return null;
    }
  }

  async function getNews({ page = 1, limit = 50 } = {}) {
    try {
      const res = await APIRequest.request("GET", `${ConfigAPIURL.adminNews}?page=${page}&limit=${limit}`, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.articles || d.result || [];
    } catch {}
    return [];
  }

  async function createNews(body) {
    try {
      const res = await APIRequest.request("POST", ConfigAPIURL.adminNews, JSON.stringify(body));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Article published", "News article is now live."); return d.article || true; }
      toast("Error", d?.message || "Could not create article.", false);
    } catch { toast("Error", "Could not create article.", false); }
    return null;
  }

  async function updateNews(id, body) {
    try {
      const res = await APIRequest.request("PUT", `${ConfigAPIURL.adminNews}/${id}`, JSON.stringify(body));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Article updated", "Changes saved."); return d.article || true; }
      toast("Error", d?.message || "Could not update article.", false);
    } catch { toast("Error", "Could not update article.", false); }
    return null;
  }

  async function deleteNews(id) {
    try {
      await APIRequest.request("DELETE", `${ConfigAPIURL.adminNews}/${id}`, "");
      toast("Deleted", "Article removed.");
      return true;
    } catch { toast("Error", "Could not delete article.", false); }
    return false;
  }

  async function getAdRequests({ status, page = 1, limit = 100 } = {}) {
    try {
      let url = `${ConfigAPIURL.adminAdRequests}?page=${page}&limit=${limit}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      const res = await APIRequest.request("GET", url, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.ad_requests || d.result || [];
    } catch {}
    return [];
  }

  async function updateAdRequestStatus(id, status) {
    try {
      const res = await APIRequest.request("PATCH", `${ConfigAPIURL.adminAdRequests}/${id}`, JSON.stringify({ status }));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Updated", `Status set to "${status}".`); return true; }
      toast("Error", d?.message || "Could not update.", false);
    } catch { toast("Error", "Could not update.", false); }
    return false;
  }

  async function getAdProducts() {
    try {
      const res = await APIRequest.request("GET", ConfigAPIURL.adminAdProducts, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.products || d.result || [];
    } catch {}
    return [];
  }

  async function createAdProduct(body) {
    try {
      const res = await APIRequest.request("POST", ConfigAPIURL.adminAdProducts, JSON.stringify(body));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Created", "Ad product added."); return d.product || true; }
      toast("Error", d?.message || "Could not create.", false);
    } catch { toast("Error", "Could not create.", false); }
    return null;
  }

  async function updateAdProduct(id, body) {
    try {
      const res = await APIRequest.request("PUT", `${ConfigAPIURL.adminAdProducts}/${id}`, JSON.stringify(body));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Updated", "Ad product saved."); return d.product || true; }
      toast("Error", d?.message || "Could not update.", false);
    } catch { toast("Error", "Could not update.", false); }
    return null;
  }

  async function deleteAdProduct(id) {
    try {
      await APIRequest.request("DELETE", `${ConfigAPIURL.adminAdProducts}/${id}`, "");
      toast("Deleted", "Ad product removed.");
      return true;
    } catch { toast("Error", "Could not delete.", false); }
    return false;
  }

  // ── Admin Deals ───────────────────────────────────────────────────────
  async function getAdminDeals({ stage, page = 1, limit = 100 } = {}) {
    try {
      let url = `${ConfigAPIURL.adminDeals}?page=${page}&limit=${limit}`;
      if (stage !== undefined && stage !== "") url += `&stage=${stage}`;
      const res = await APIRequest.request("GET", url, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.deals || d.result || [];
    } catch {}
    return [];
  }
  async function updateDealStage(id, stage) {
    try {
      const res = await APIRequest.request("PATCH", `${ConfigAPIURL.adminDeals}/${id}`, JSON.stringify({ stage }));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Deal updated", `Stage set to ${stage}.`); return true; }
      toast("Error", d?.message || "Could not update deal.", false);
    } catch { toast("Error", "Could not update deal.", false); }
    return false;
  }

  // ── Admin Funding ─────────────────────────────────────────────────────
  async function getAdminFunding({ status, page = 1, limit = 100 } = {}) {
    try {
      let url = `${ConfigAPIURL.adminFunding}?page=${page}&limit=${limit}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      const res = await APIRequest.request("GET", url, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.listings || d.funding_listings || d.result || [];
    } catch {}
    return [];
  }
  async function updateFundingStatus(id, status) {
    try {
      const res = await APIRequest.request("PATCH", `${ConfigAPIURL.adminFunding}/${id}`, JSON.stringify({ status }));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Listing updated", `Status set to "${status}".`); return true; }
      toast("Error", d?.message || "Could not update.", false);
    } catch { toast("Error", "Could not update.", false); }
    return false;
  }
  async function getDataRoomDocs(fundingId) {
    try {
      const res = await APIRequest.request("GET", `${ConfigAPIURL.funding}/${fundingId}/documents`, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.documents || d.result || [];
    } catch {}
    return [];
  }
  async function addDataRoomDoc(fundingId, payload) {
    try {
      const res = await APIRequest.request("POST", `${ConfigAPIURL.adminFunding}/${fundingId}/documents`, JSON.stringify(payload));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Document added", ""); return d.document || true; }
      toast("Error", d?.message || "Could not add document.", false);
    } catch { toast("Error", "Could not add document.", false); }
    return null;
  }
  async function deleteDataRoomDoc(docId) {
    try {
      await APIRequest.request("DELETE", `${ConfigAPIURL.adminDocuments}/${docId}`, "");
      toast("Deleted", "Document removed."); return true;
    } catch { toast("Error", "Could not delete document.", false); }
    return false;
  }

  // ── Partners ──────────────────────────────────────────────────────────
  async function getPartners() {
    try { const res = await APIRequest.request("GET", ConfigAPIURL.adminPartners, ""); const d = res?.data; if (d?.responseCode === 100) return d.partners || d.result || []; } catch {}
    return [];
  }
  async function createPartner(body) {
    try { const res = await APIRequest.request("POST", ConfigAPIURL.adminPartners, JSON.stringify(body)); const d = res?.data; if (d?.responseCode === 100) { toast("Partner added", ""); return d.partner || true; } toast("Error", d?.message || "Could not create.", false); } catch { toast("Error", "Could not create.", false); }
    return null;
  }
  async function updatePartner(id, body) {
    try { const res = await APIRequest.request("PUT", `${ConfigAPIURL.adminPartners}/${id}`, JSON.stringify(body)); const d = res?.data; if (d?.responseCode === 100) { toast("Partner saved", ""); return true; } toast("Error", d?.message || "Could not update.", false); } catch { toast("Error", "Could not update.", false); }
    return null;
  }
  async function deletePartner(id) {
    try { await APIRequest.request("DELETE", `${ConfigAPIURL.adminPartners}/${id}`, ""); toast("Deleted", ""); return true; } catch { toast("Error", "Could not delete.", false); }
    return false;
  }

  // ── Testimonials ──────────────────────────────────────────────────────
  async function getTestimonials() {
    try { const res = await APIRequest.request("GET", ConfigAPIURL.adminTestimonials, ""); const d = res?.data; if (d?.responseCode === 100) return d.testimonials || d.result || []; } catch {}
    return [];
  }
  async function createTestimonial(body) {
    try { const res = await APIRequest.request("POST", ConfigAPIURL.adminTestimonials, JSON.stringify(body)); const d = res?.data; if (d?.responseCode === 100) { toast("Testimonial added", ""); return d.testimonial || true; } toast("Error", d?.message || "Could not create.", false); } catch { toast("Error", "Could not create.", false); }
    return null;
  }
  async function updateTestimonial(id, body) {
    try { const res = await APIRequest.request("PUT", `${ConfigAPIURL.adminTestimonials}/${id}`, JSON.stringify(body)); const d = res?.data; if (d?.responseCode === 100) { toast("Testimonial saved", ""); return true; } toast("Error", d?.message || "Could not update.", false); } catch { toast("Error", "Could not update.", false); }
    return null;
  }
  async function deleteTestimonial(id) {
    try { await APIRequest.request("DELETE", `${ConfigAPIURL.adminTestimonials}/${id}`, ""); toast("Deleted", ""); return true; } catch { toast("Error", "Could not delete.", false); }
    return false;
  }

  // ── Trending Keywords ─────────────────────────────────────────────────
  async function getTrending() {
    try { const res = await APIRequest.request("GET", ConfigAPIURL.adminTrending, ""); const d = res?.data; if (d?.responseCode === 100) return d.keywords || d.result || []; } catch {}
    return [];
  }
  async function createTrending(body) {
    try { const res = await APIRequest.request("POST", ConfigAPIURL.adminTrending, JSON.stringify(body)); const d = res?.data; if (d?.responseCode === 100) { toast("Keyword added", ""); return d.keyword || true; } toast("Error", d?.message || "Could not create.", false); } catch { toast("Error", "Could not create.", false); }
    return null;
  }
  async function updateTrending(id, body) {
    try { const res = await APIRequest.request("PUT", `${ConfigAPIURL.adminTrending}/${id}`, JSON.stringify(body)); const d = res?.data; if (d?.responseCode === 100) { toast("Keyword saved", ""); return true; } toast("Error", d?.message || "Could not update.", false); } catch { toast("Error", "Could not update.", false); }
    return null;
  }
  async function deleteTrending(id) {
    try { await APIRequest.request("DELETE", `${ConfigAPIURL.adminTrending}/${id}`, ""); toast("Deleted", ""); return true; } catch { toast("Error", "Could not delete.", false); }
    return false;
  }

  // ── Members ───────────────────────────────────────────────────────────
  async function getMembers({ status, sector, tier, page = 1, limit = 100 } = {}) {
    try {
      let url = `${ConfigAPIURL.adminMembers}?page=${page}&limit=${limit}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      if (sector) url += `&sector=${encodeURIComponent(sector)}`;
      if (tier) url += `&tier=${encodeURIComponent(tier)}`;
      const res = await APIRequest.request("GET", url, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.members || d.result || [];
      toast("Error", d?.message || "Could not load members.", false);
    } catch { toast("Error", "Could not load members.", false); }
    return [];
  }
  async function updateMember(id, body) {
    try {
      const res = await APIRequest.request("PATCH", `${ConfigAPIURL.adminMembers}/${id}`, JSON.stringify(body));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Member updated", "Changes saved."); return true; }
      toast("Error", d?.message || "Could not update member.", false);
    } catch { toast("Error", "Could not update member.", false); }
    return false;
  }

  // ── Users ─────────────────────────────────────────────────────────────
  async function updateUserRole(id, role) {
    try {
      const res = await APIRequest.request("PATCH", `${ConfigAPIURL.adminUsers}/${id}/role`, JSON.stringify({ role }));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Role updated", `Role set to "${role}".`); return true; }
      toast("Error", d?.message || "Could not update role.", false);
    } catch { toast("Error", "Could not update role.", false); }
    return false;
  }

  // ── Subscriptions ─────────────────────────────────────────────────────
  async function getSubscriptions({ type, page = 1, limit = 200 } = {}) {
    try {
      let url = `${ConfigAPIURL.adminSubscriptions}?page=${page}&limit=${limit}`;
      if (type) url += `&type=${encodeURIComponent(type)}`;
      const res = await APIRequest.request("GET", url, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.subscriptions || d.result || [];
    } catch {}
    return [];
  }
  async function deleteSubscription(id) {
    try {
      await APIRequest.request("DELETE", `${ConfigAPIURL.adminSubscriptions}/${id}`, "");
      toast("Removed", "Subscription removed."); return true;
    } catch { toast("Error", "Could not remove.", false); }
    return false;
  }

  // ── Contact messages ──────────────────────────────────────────────────
  async function getContactMessages({ status, page = 1, limit = 100 } = {}) {
    try {
      let url = `${ConfigAPIURL.adminContact}?page=${page}&limit=${limit}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      const res = await APIRequest.request("GET", url, "");
      const d = res?.data;
      if (d?.responseCode === 100) return d.contact_messages || d.messages || d.result || [];
    } catch {}
    return [];
  }
  async function updateContactStatus(id, status) {
    try {
      const res = await APIRequest.request("PATCH", `${ConfigAPIURL.adminContact}/${id}`, JSON.stringify({ status }));
      const d = res?.data;
      if (d?.responseCode === 100) { toast("Updated", `Marked as "${status}".`); return true; }
      toast("Error", d?.message || "Could not update.", false);
    } catch { toast("Error", "Could not update.", false); }
    return false;
  }

  return { getSubmissions, getUsers, updateUserRole, exportSubmissionsCSV, uploadImage, getNews, createNews, updateNews, deleteNews, getAdRequests, updateAdRequestStatus, getAdProducts, createAdProduct, updateAdProduct, deleteAdProduct, getAdminDeals, updateDealStage, getAdminFunding, updateFundingStatus, getDataRoomDocs, addDataRoomDoc, deleteDataRoomDoc, getPartners, createPartner, updatePartner, deletePartner, getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, getTrending, createTrending, updateTrending, deleteTrending, getMembers, updateMember, getSubscriptions, deleteSubscription, getContactMessages, updateContactStatus };
}

export default useServices;


