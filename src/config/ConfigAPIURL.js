class ConfigAPIURL {
  static baseUrl =
    import.meta.env.VITE_PAY_DEF_BASE_URL ||
    import.meta.env.VITE_DEV_PAY_DEF_BASE_URL;

  // Meta
  static meta = `${this.baseUrl}/api/meta`;

  // Auth
  static register         = `${this.baseUrl}/api/auth/register`;
  static login            = `${this.baseUrl}/api/auth/login`;
  static logout           = `${this.baseUrl}/api/auth/logout`;
  static forgotPassword   = `${this.baseUrl}/api/auth/forgot-password`;
  static resetPassword    = `${this.baseUrl}/api/auth/reset-password`;
  static verifyEmail      = `${this.baseUrl}/api/auth/verify-email`;
  static refreshToken     = `${this.baseUrl}/api/auth/refresh`;

  // Me (member self)
  static me               = `${this.baseUrl}/api/me`;
  static dashboard        = `${this.baseUrl}/api/me/dashboard`;
  static myListing        = `${this.baseUrl}/api/me/listing`;
  static myPassword       = `${this.baseUrl}/api/me/password`;
  static myIntros         = `${this.baseUrl}/api/me/intros`;
  static myFunding        = `${this.baseUrl}/api/me/funding`;
  static myDeals          = `${this.baseUrl}/api/me/deals`;
  static myMatchCount     = `${this.baseUrl}/api/me/match-count`;

  // Members
  static members          = `${this.baseUrl}/api/members`;
  static membersFeatured  = `${this.baseUrl}/api/members/featured`;
  static membersTop       = `${this.baseUrl}/api/members/top`;
  // GET /api/members/:id        → `${this.members}/${id}`
  // GET /api/members/:id/similar→ `${this.members}/${id}/similar`

  // AI Match
  static searchPopular    = `${this.baseUrl}/api/search/popular`;
  static match            = `${this.baseUrl}/api/match`;
  // POST /api/match/:search_id/chat → `${this.match}/${searchId}/chat`

  // Introductions
  static intros           = `${this.baseUrl}/api/intros`;
  static introsDraft      = `${this.baseUrl}/api/intros/draft`;

  // Funding / Deals
  static funding          = `${this.baseUrl}/api/funding`;
  // GET  /api/funding/:id           → `${this.funding}/${id}`
  // POST /api/funding/:id/interest  → `${this.funding}/${id}/interest`
  // GET  /api/funding/:id/documents → `${this.funding}/${id}/documents`
  static deals            = `${this.baseUrl}/api/deals`;
  // POST /api/deals/:deal_id/advance → `${this.deals}/${dealId}/advance`

  // News
  static news             = `${this.baseUrl}/api/news`;
  // GET /api/news/:id → `${this.news}/${id}`

  // Ads
  static ads              = `${this.baseUrl}/api/ads`;
  // POST /api/ads/:id/click → `${this.ads}/${id}/click`
  static adProducts       = `${this.baseUrl}/api/ad-products`;

  // Leads / Subscriptions / Contact
  static contact              = `${this.baseUrl}/api/contact`;
  static subscriptionsAlerts  = `${this.baseUrl}/api/subscriptions/alerts`;
  static subscriptionsNewsletter = `${this.baseUrl}/api/subscriptions/newsletter`;
  static adRequests           = `${this.baseUrl}/api/ad-requests`;

  // Home content
  static partners         = `${this.baseUrl}/api/partners`;
  static testimonials     = `${this.baseUrl}/api/testimonials`;
  static trending         = `${this.baseUrl}/api/trending`;

  // File upload
  static uploadFile       = `${this.baseUrl}/api/upload/file`;

  // Admin: home content
  static adminPartners        = `${this.baseUrl}/api/admin/partners`;
  static adminTestimonials    = `${this.baseUrl}/api/admin/testimonials`;
  static adminTrending        = `${this.baseUrl}/api/admin/trending`;

  // Admin
  static adminSubmissions       = `${this.baseUrl}/api/admin/submissions`;
  static adminSubmissionsExport = `${this.baseUrl}/api/admin/submissions/export.csv`;
  static adminUsers             = `${this.baseUrl}/api/admin/users`;
  static adminMembers           = `${this.baseUrl}/api/admin/members`;
  static adminIntros            = `${this.baseUrl}/api/admin/intros`;
  static adminDeals             = `${this.baseUrl}/api/admin/deals`;
  static adminFunding           = `${this.baseUrl}/api/admin/funding`;
  static adminDocuments         = `${this.baseUrl}/api/admin/documents`;
  static adminAdRequests        = `${this.baseUrl}/api/admin/ad-requests`;
  static adminContact           = `${this.baseUrl}/api/admin/contact`;
  static adminSubscriptions     = `${this.baseUrl}/api/admin/subscriptions`;
  static adminNews              = `${this.baseUrl}/api/admin/news`;
  static adminAds               = `${this.baseUrl}/api/admin/ads`;
  static adminAdProducts        = `${this.baseUrl}/api/admin/ad-products`;
}

export default ConfigAPIURL;
