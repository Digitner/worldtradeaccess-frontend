// In-memory singleton -- survives re-renders without triggering React state.
// Mirrors the pattern from Freedom Holidays frontend.
class LocalStorage {
  static userDetails = null;   // { _id, company_name, country, sector, goal, seek, tier, email, role }
  static memberDetails = null; // full Member doc for logged-in user
  static token = null;         // JWT access token (mirror of wta_token in localStorage)

  static setUser(user, member) {
    this.userDetails = user;
    this.memberDetails = member || null;
    this.token = localStorage.getItem("wta_token") || null;
    if (user) {
      localStorage.setItem("wta_user", JSON.stringify(user));
    }
  }

  static clear() {
    this.userDetails = null;
    this.memberDetails = null;
    this.token = null;
    localStorage.removeItem("wta_token");
    localStorage.removeItem("wta_user");
  }

  static isLoggedIn() {
    return !!(this.userDetails && localStorage.getItem("wta_token"));
  }

  static isAdmin() {
    return this.userDetails?.role === "admin";
  }

  static restore() {
    // Restore from localStorage on app boot
    try {
      const raw = localStorage.getItem("wta_user");
      if (raw) {
        this.userDetails = JSON.parse(raw);
        this.token = localStorage.getItem("wta_token");
      }
    } catch {
      this.clear();
    }
  }
}

export default LocalStorage;
