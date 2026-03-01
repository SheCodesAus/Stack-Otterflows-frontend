// src/components/NavBar/MobileMenu.jsx
import { Link } from "react-router-dom";

function MobileMenu({ open, tokenExists, onClose, onLogout }) {
  return (
    <div id="mobile-nav" className={`mobile-panel ${open ? "open" : ""}`}>
      <nav className="mobile-links" aria-label="Mobile navigation">
        <Link to="/" className="mobile-link" onClick={onClose}>
          Home
        </Link>
        <Link to="/fundraisers" className="mobile-link" onClick={onClose}>
          Browse Festivals
        </Link>
        <Link to="/resources" className="mobile-link" onClick={onClose}>
          Resources
        </Link>
        <Link to="/how-it-works" className="mobile-link" onClick={onClose}>
          How it Works
        </Link>

        {!tokenExists ? (
          <>
            <Link to="/signup" className="mobile-link" onClick={onClose}>
              Sign Up
            </Link>
            <Link to="/login" className="mobile-link" onClick={onClose}>
              Login
            </Link>
            <Link
              to="/fundraisers/new"
              className="mobile-link mobile-cta"
              onClick={onClose}
            >
              Create Festival
            </Link>
          </>
        ) : (
          <>
            <Link to="/profile" className="mobile-link" onClick={onClose}>
              My Dashboard
            </Link>

            <button
              type="button"
              className="mobile-link mobile-link--button"
              onClick={onLogout}
            >
              Logout
            </button>

            <Link
              to="/fundraisers/new"
              className="mobile-link mobile-cta"
              onClick={onClose}
            >
              Create Festival
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}

export default MobileMenu;