---
noteId: "00e74820d22b11f1bcc49784ab29c2dc"
tags: []

---

# WorldTradeAccess Frontend

React + Vite frontend for WorldTradeAccess, the BRICS-ASEAN Chamber of Commerce trade platform.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Structure

```
public/                    favicon
src/
  assets/images/           photos and chamber logo
  components/              one folder per component
    Navbar/ Footer/ Toasts/            React shell (Navbar.jsx, Footer.jsx, Toasts.jsx)
    Carousel/ Ads/ Chips/ ScoreRing/ MarketCard/ FundingCard/   reusable UI blocks
  config/                  env + storage keys
  constant/                countries, pillars, roles, forms, navigation, seed data, icons, images
  hooks/                   useApp.js (starts the router and animations)
  pages/                   Home, Search, Directory, Member, Funding, Deal, News,
                           Advertise, Contact, Register, Login, Dashboard, EditListing, Admin
  themes/                  theme.css (colours, dark mode), theme.js, responsive.css, animations.css
  utils/                   helpers, router, store, state, forms, animations, bootstrap, globals
  App.css, App.jsx, index.css, main.jsx
.env.development / .env.production
```

Routes: `#/`, `#/search`, `#/directory`, `#/member/:id`, `#/funding`, `#/deal/:id`, `#/news`, `#/advertise`, `#/contact`, `#/register`, `#/login`, `#/dashboard`, `#/edit`, `#/admin`.

Data (accounts, submissions, listings) is stored in the browser's localStorage until the backend is connected.
Admin console demo password: `admin`.
