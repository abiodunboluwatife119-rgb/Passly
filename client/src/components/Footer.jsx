import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Logo from './Logo';
import './Footer.css';

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M5.2 3.5A1.7 1.7 0 1 1 5.2 6.9a1.7 1.7 0 0 1 0-3.4ZM3.7 8.3h3v9.9h-3V8.3Zm4.9 0h2.9v1.35h.04c.4-.77 1.38-1.58 2.84-1.58 3.04 0 3.6 2 3.6 4.6v5.53h-3v-4.9c0-1.17-.02-2.68-1.64-2.68-1.64 0-1.89 1.28-1.89 2.59v4.99h-3V8.3Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 4.5 18.8 19.5M18.6 4.5 5 19.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2.5a9.5 9.5 0 0 0-3 18.52c.48.09.65-.21.65-.46v-1.68c-2.64.57-3.2-1.12-3.2-1.12-.44-1.1-1.06-1.4-1.06-1.4-.86-.59.07-.58.07-.58.95.07 1.45.98 1.45.98.84 1.44 2.2 1.02 2.74.78.09-.61.33-1.02.6-1.25-2.1-.24-4.3-1.05-4.3-4.66 0-1.03.37-1.87.98-2.53-.1-.24-.42-1.2.09-2.5 0 0 .8-.26 2.61.97A9.1 9.1 0 0 1 12 7.25c.81 0 1.62.11 2.38.32 1.81-1.23 2.61-.97 2.61-.97.51 1.3.19 2.26.09 2.5.61.66.98 1.5.98 2.53 0 3.62-2.21 4.42-4.32 4.65.34.3.64.88.64 1.78v2.64c0 .25.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z" />
  </svg>
);

const Footer = () => {
  const { user } = useContext(AuthContext);
  const year = new Date().getFullYear();

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="pf">
      <div className="pf-inner">
        <div className="pf-main">
          <div className="pf-brand">
            <Link to="/" className="pf-logo" aria-label="Passly home">
              <Logo size={42} tone="light" />
            </Link>
            <p className="pf-kicker">One pass. More to look forward to.</p>
            <p className="pf-description">
              Passly brings the night, the road and the table into one simple place —
              so making a plan feels as good as the plan itself.
            </p>
            <div className="pf-socials" aria-label="Passly social links">
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="Passly on LinkedIn">
                <LinkedinIcon />
              </a>
              <a href="https://x.com/hey_tife?s=11" target="_blank" rel="noreferrer" aria-label="Passly on X">
                <XIcon />
              </a>
              <a href="https://github.com/abiodunboluwatife119-rgb" target="_blank" rel="noreferrer" aria-label="Passly on GitHub">
                <GithubIcon />
              </a>
            </div>
          </div>

          <div className="pf-content">
            <div className="pf-note">
              <span className="pf-note-label">The Passly idea</span>
              <p>Find something good, make it yours, and keep every booking close at hand.</p>
            </div>

            <div className="pf-links">
              <div className="pf-col">
                <h3>Explore</h3>
                <span>Events worth showing up for</span>
                <span>Cars for the way there</span>
                <span>Tables for staying awhile</span>
              </div>

              <div className="pf-col">
                <h3>Account</h3>
                {user ? (
                  <>
                    <Link to="/bookings">My bookings</Link>
                    {user.role === 'admin' && <Link to="/admin">Admin panel</Link>}
                  </>
                ) : (
                  <>
                    <Link to="/login">Log in</Link>
                    <Link to="/signup">Create account</Link>
                  </>
                )}
              </div>

              <div className="pf-col">
                <h3>For vendors</h3>
                <span>Put your place on the map</span>
                <span>Share what makes it special</span>
                <span>Welcome the right people in</span>
              </div>

              <div className="pf-col">
                <h3>Good to know</h3>
                <span>Simple bookings</span>
                <span>Clear details</span>
                <span>Your plans, together</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pf-bottom">
          <span>&copy; {year} Passly. Made for better plans.</span>
          <span className="pf-bottom-note">Events · Cars · Food</span>
          <button type="button" className="pf-top-btn" onClick={scrollTop}>Back to top ↑</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;