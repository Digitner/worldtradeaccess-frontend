/* eslint-disable */
import { toast } from '../../../components/Toasts/toast.js';
import APIRequest from '../../../utils/APIRequest.js';
import ConfigAPIURL from '../../../config/ConfigAPIURL.js';

function useServices() {
  async function sendMessage(formData) {
    try {
      const res = await APIRequest.request("POST", ConfigAPIURL.contact, JSON.stringify(formData));
      const d = res?.data;
      if (d?.responseCode === 100 ) {
        toast("Message sent", "The team will be in touch.");
        return true;
      }
      toast("Error", d?.message || "Could not send your message. Please try again.", false);
    } catch {
      toast("Error", "Could not send your message. Please try again.", false);
    }
    return false;
  }

  return { sendMessage };
}

export default useServices;


