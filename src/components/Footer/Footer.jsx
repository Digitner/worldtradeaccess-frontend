import { IMG } from '../../constant/images.js';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fr">
          <div>
            <img className="logo-img foot-logo" src={IMG.logo} alt="BRICS-ASEAN Chamber of Commerce crest" /><br />
            <b>WorldTradeAccess</b> — a project for the BRICS-ASEAN Chamber of Commerce<br />
            Reg. PPM-009-10-22052020 · Kuala Lumpur, Malaysia<br />
            <button className="linkish" style={{ fontSize: '12.5px', marginTop: '8px' }} onClick={() => window.go('#/admin')}>Admin console →</button>
          </div>
          <form className="foot-form" onSubmit={(e) => window.subFooter(e)}>
            <b>Monthly briefing</b>
            <div className="foot-sub">
              <label className="vh" htmlFor="footEmail">Email for the monthly briefing</label>
              <input id="footEmail" type="email" placeholder="you@company.com" />
              <button className="btn btn-primary btn-sm" type="submit">Subscribe</button>
            </div>
          </form>
        </div>
        <p className="disc">Demonstration prototype built by Digitner Tech Solutions. The member network, news and funding listings are synthetic sample data that illustrate the product and do not represent real chamber members. Forms submitted here are stored in this page's shared record so chamber admins can review them. Match answers are written by Claude using the viewer's own account. Photos: Unsplash.</p>
      </div>
    </footer>
  );
}
