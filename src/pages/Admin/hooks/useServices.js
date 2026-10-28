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

  return { getSubmissions, getUsers, exportSubmissionsCSV, uploadImage, getNews, createNews, updateNews, deleteNews, getAdRequests, updateAdRequestStatus, getAdProducts, createAdProduct, updateAdProduct, deleteAdProduct };
}

export default useServices;


