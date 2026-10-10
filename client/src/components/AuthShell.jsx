import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Logo from './Logo';
import '../pages/Auth.css';

const LINES = [
  { lead: 'Tickets for', accent: 'the night.' },
  { lead: 'Wheels for', accent: 'the weekend.' },
  { lead: 'Dinner,', accent: 'delivered.' },
];

const AuthShell = ({ title, subtitle, children, footer }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % LINES.length);
    }, 3400);
    return () => clearInterval(timer);
  }, []);

  const line = LINES[index];

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-brand">
          <span className="auth-shape auth-shape-a" />
          <span className="auth-shape auth-shape-b" />
          <span className="auth-shape auth-shape-c" />
          <span className="auth-shape auth-shape-d" />

          <div className="auth-brand-top">
            <Logo size={48} tone="light" />
          </div>

          <div className="auth-brand-copy">
            <h2 key={index} className="auth-rotator">
              {line.lead} <em>{line.accent}</em>
            </h2>
            <p>Events, car rentals and food in one cart, with one pass to show for it.</p>
          </div>

          <div className="auth-tickets" aria-hidden="true">
            <div className="auth-ticket auth-ticket-back">
              <span className="auth-ticket-label">ADMIT ONE</span>
              <strong>Sunday Brunch</strong>
            </div>
            <div className="auth-ticket auth-ticket-front">
              <div className="auth-ticket-top">
                <span className="auth-ticket-label">ADMIT ONE</span>
                <strong>Lagos Jazz Night</strong>
                <span className="auth-ticket-meta">Sat, 8:00 PM</span>
              </div>
              <div className="auth-ticket-cut" />
              <div className="auth-ticket-bottom">
                <QRCodeSVG value="https://passly-gamma.vercel.app" size={72} fgColor="#2C2520" bgColor="#F9F7F1" />
                <span className="auth-ticket-meta">Scan at the door</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-card">
            <header className="auth-heading">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </header>
            {children}
            <p className="auth-switch">{footer}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;