import './Logo.css';

const Logo = ({ size = 32, showName = true, tone = 'dark' }) => (
  <span className={`logo logo-${tone}`}>
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#B45A3C" />
      <g transform="translate(0 -3)">
        <path d="M146 390 V226 a110 110 0 0 1 220 0 V390 Z" fill="#F9F7F1" />
        <path d="M200 390 V236 a56 56 0 0 1 112 0 V390 Z" fill="#5C1A1A" />
        <rect x="110" y="386" width="292" height="16" rx="8" fill="#2C2520" />
      </g>
    </svg>
    {showName && (
      <span className="logo-name" style={{ fontSize: size * 0.72 }}>
        Passly
      </span>
    )}
  </span>
);

export default Logo;