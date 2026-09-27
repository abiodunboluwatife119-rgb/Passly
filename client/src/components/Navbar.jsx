import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { items } = useContext(CartContext);
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">Passly</Link>

        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
          <Link to="/events" className={isActive('/events') ? 'active' : ''}>Events</Link>
          <Link to="/cars" className={isActive('/cars') ? 'active' : ''}>Cars</Link>
          <Link to="/restaurants" className={isActive('/restaurants') ? 'active' : ''}>Food</Link>
          <Link to="/how-it-works" className={isActive('/how-it-works') ? 'active' : ''}>How it works</Link>
          <Link to="/cart" className={isActive('/cart') ? 'active' : ''}>Cart ({items.length})</Link>

          {user ? (
            <div className="navbar-user-menu" ref={dropdownRef}>
              <button className="navbar-user-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {user.name} ▾
              </button>
              <div className={`navbar-dropdown ${dropdownOpen ? 'navbar-dropdown-open' : ''}`}>
                <Link to="/bookings">My Bookings</Link>
                {(user.role === 'vendor' || user.role === 'admin') && (
                  <Link to="/dashboard">Dashboard</Link>
                )}
                {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
                {user.role === 'user' && <Link to="/become-vendor">Become a Vendor</Link>}
                <button className="navbar-dropdown-logout" onClick={logout}>Log Out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="navbar-signin">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;