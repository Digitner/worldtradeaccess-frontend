import ConfigAPIURL from "../config/ConfigAPIURL";

const APIRequest = {
  request: function (method, url, body) {
    const config = {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        authtoken: localStorage.getItem("wta_token") || "",
      },
      credentials: "include",
    };

    if (body !== "") {
      config.body = body;
    }

    return fetch(url, config)
      .then((response) => response.json())
      .then((data) => this.returnResponse(data, url, config))
      .catch(() => ({ returncode: 0, errors: [{ errormsg: "Network error." }] }));
  },

  returnResponse: async function (response, url, config) {
    // Token expired -- try refresh
    if (response?.data?.responseCode === 118 || response?.responseCode === 118) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry original request once
        config.headers.authtoken = localStorage.getItem("wta_token") || "";
        return fetch(url, config)
          .then((r) => r.json())
          .catch(() => ({ returncode: 0, errors: [{ errormsg: "Network error." }] }));
      } else {
        localStorage.removeItem("wta_token");
        localStorage.removeItem("wta_user");
        window.location.href = "#/login";
        return;
      }
    }

    // Session invalid -- redirect to login
    if (response?.returncode === 2) {
      localStorage.removeItem("wta_token");
      localStorage.removeItem("wta_user");
      window.location.href = "#/login";
      return;
    }

    return Promise.resolve(response);
  },

  refreshToken: async function () {
    try {
      const response = await fetch(ConfigAPIURL.refreshToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      const token = result?.data?.accessToken || result?.data?.token;
      if (token) {
        localStorage.setItem("wta_token", token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};

export default APIRequest;
