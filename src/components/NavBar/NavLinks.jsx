// src/components/NavBar/NavLinks.jsx
import { Link } from "react-router-dom";

function NavLinks({ tokenExists, onLogout }) {
  return (
    <nav className="navbar-links" aria-label="Primary navigation">
      {!tokenExists ? (
        <>
          <Link to="/" className="navbar-link">
            Home
          </Link>

          <Link to="/how-it-works" className="navbar-link">
            How It Works
          </Link>

          <Link to="/login" className="navbar-link">
            Login
          </Link>

          <Link to="/register" className="navbar-link">
            Sign Up
          </Link>
        </>
      ) : (
        <>
          <Link to="/dashboard" className="navbar-link">
            My Dashboard
          </Link>

          <Link to="/goals" className="navbar-link">
            Goals
          </Link>

          <Link to="/pods" className="navbar-link">
            Pods
          </Link>

          <Link to="/how-it-works" className="navbar-link">
            How It Works
          </Link>

          <button
            type="button"
            className="navbar-link navbar-link--button"
            onClick={onLogout}
          >
            Logout
          </button>
        </>
      )}
    </nav>
  );
}

export default NavLinks;