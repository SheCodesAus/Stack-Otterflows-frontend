import { Link } from "react-router-dom";

function MobileMenu({ open, tokenExists, createTarget, onClose }) {
  return (
    <div id="mobile-nav" className={`mobile-panel ${open ? "open" : ""}`}>
      <nav className="mobile-links" aria-label="Mobile navigation">
        {!tokenExists ? (
          <>
            <Link to="/" className="mobile-link" onClick={onClose}>
              Home
            </Link>

            <Link to="/how-it-works" className="mobile-link" onClick={onClose}>
              How It Works
            </Link>

            <Link to="/login" className="mobile-link" onClick={onClose}>
              Login
            </Link>

            <Link to="/register" className="mobile-link" onClick={onClose}>
              Sign Up
            </Link>

            <Link
              to="/register"
              className="mobile-link mobile-cta"
              onClick={onClose}
            >
              Create
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="mobile-link" onClick={onClose}>
              My Dashboard
            </Link>

            <Link to="/goals" className="mobile-link" onClick={onClose}>
              Goals
            </Link>

            <Link to="/pods" className="mobile-link" onClick={onClose}>
              Pods
            </Link>

            <Link to="/how-it-works" className="mobile-link" onClick={onClose}>
              How It Works
            </Link>

            <Link
              to={createTarget}
              className="mobile-link mobile-cta"
              onClick={onClose}
            >
              Create
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}

export default MobileMenu;