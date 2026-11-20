/* eslint-disable */
import { toast } from "../components/Toasts/toast.js";

/**
 * Hook returning a function that shows toast notifications.
 */
function useAlert() {
  const publishNotification = (message, type = "info") => {
    const isGood = type === "success" || type === "info";
    const title = type === "success" ? "Success" : type === "error" ? "Error" : "Notice";
    toast(title, message, isGood);
  };

  return { publishNotification };
}

export default useAlert;
