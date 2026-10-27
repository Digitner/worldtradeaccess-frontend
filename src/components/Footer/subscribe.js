/* eslint-disable */
import { toast } from '../Toasts/toast.js';
import APIRequest from '../../utils/APIRequest.js';
import ConfigAPIURL from '../../config/ConfigAPIURL.js';
import { $, isEmail } from '../../utils/helpers.js';

export async function subFooter(e) {
  e.preventDefault();
  const el = $("#footEmail"), v = el.value.trim();
  if (!isEmail(v)) {
    el.classList.add("err");
    toast("Check the email", "Enter an address like name@company.com.", false);
    return;
  }
  el.classList.remove("err");
  try {
    const response = await APIRequest.request(
      "POST",
      ConfigAPIURL.subscriptionsNewsletter,
      JSON.stringify({ email: v })
    );
    const d = response?.data;
    if (d?.responseCode === 100 ) {
      el.value = "";
      toast("Subscribed", "You'll get the monthly briefing.");
    } else {
      toast("Error", d?.message || "Could not subscribe. Please try again.", false);
    }
  } catch {
    toast("Error", "Could not subscribe. Please try again.", false);
  }
}


