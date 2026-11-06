export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-mark" id="footMark" aria-hidden="true">WorldTradeAccess</div>
        <div className="foot-g">
          <div>
            <p style={{ margin: 0 }}>
              <b style={{ color: '#fff' }}>BRICS-ASEAN Chamber of Commerce</b><br />
              Reg. PPM-009-10-22052020<br />
              Kuala Lumpur, Malaysia
            </p>
          </div>
          <div>
            <h4>Platform</h4>
            <a href="#/search">Find matches</a>
            <a href="#/directory">Directory</a>
            <a href="#/funding">Funding</a>
            <a href="#/news">News</a>
          </div>
          <div>
            <h4>Chamber</h4>
            <a href="#/about">About</a>
            <a href="#/membership">Membership</a>
            <a href="#/contact">Contact</a>
            <a href="#/admin">Admin console</a>
          </div>
          <form className="foot-form" onSubmit={(e) => window.subFooter(e)}>
            <h4>Monthly briefing</h4>
            <div className="foot-sub">
              <label className="vh" htmlFor="footEmail">Email for the monthly briefing</label>
              <input id="footEmail" type="email" placeholder="you@company.com" />
              <button className="btn btn-primary btn-sm" type="submit">Subscribe</button>
            </div>
          </form>
        </div>
        <div className="disc">
          <span>Demonstration prototype built by Digitner Tech Solutions. The member network, news and funding listings are sample data and do not represent real chamber members. Photos: Unsplash.</span>
          <span className="disc-l">
            <a href="#/privacy">Privacy</a>
            <button className="motion-toggle" id="motionToggle" type="button" onClick={() => window.toggleMotion()}></button>
          </span>
        </div>
      </div>
    </footer>
  );
}
