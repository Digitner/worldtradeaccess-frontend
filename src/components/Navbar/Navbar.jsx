import { IMG } from '../../constant/images.js';

export default function Navbar() {
  return (
    <div className="topbar">
      <div className="wrap">
        <nav className="nav" aria-label="Main">
          <button className="brand" onClick={() => window.go('#/')} aria-label="WorldTradeAccess home">
            <img className="logo-img nav-logo" src={IMG.logo} alt="BRICS-ASEAN Chamber of Commerce crest" />
            <span className="brand-div"></span>
            <b>WorldTrade<span className="tld">Access</span></b>
          </button>
          <div className="navlinks" id="navlinks"></div>
          <div className="spacer"></div>
          <div className="authbox" id="authbox"></div>
          <button className="icon-btn hamb" id="hamb" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu"></button>
        </nav>
      </div>
      <div className="mobile-menu" id="mobileMenu"></div>
    </div>
  );
}
