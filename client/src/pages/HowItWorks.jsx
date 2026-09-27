import { Link } from 'react-router-dom';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <div className="container hiw-page">
      <h1>How Passly Works</h1>

      <div className="hiw-steps">
        <div className="hiw-step">
          <span className="hiw-step-number">1</span>
          <h3>Browse</h3>
          <p>
            Explore events, cars, and restaurants near you. Filter by category,
            location, or cuisine to find exactly what you're looking for.
          </p>
        </div>
        <div className="hiw-step">
          <span className="hiw-step-number">2</span>
          <h3>Book</h3>
          <p>
            Select what you want — a ticket tier, a rental period or a meal,
            and confirm your booking in a few clicks.
          </p>
        </div>
        <div className="hiw-step">
          <span className="hiw-step-number">3</span>
          <h3>Get Your Pass</h3>
          <p>
            Once payment is confirmed, you'll instantly receive a digital pass
            with a unique code. No printing, no waiting in line.
          </p>
        </div>
      </div>

      <div className="hiw-organizer">
        <h2>Are you an event organizer, car owner, or restaurant?</h2>
        <p>
          List your events, cars, or menu on Passly and reach customers looking
          to book exactly what you offer. Manage everything, listings, availability,
          and photos — from your own vendor dashboard.
        </p>
        <Link to="/become-vendor" className="hiw-organizer-cta">Get Started</Link>
      </div>
    </div>
  );
};

export default HowItWorks;