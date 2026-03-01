// src/components/NavBar/NavLinks.jsx
import { Link } from "react-router-dom";

function NavLinks({ tokenExists, onLogout }) {
  return (
    <nav className="navbar-links" aria-label="Primary navigation">
      <Link to="/" className="navbar-link">
        Home
      </Link>
      <Link to="/fundraisers" className="navbar-link">
        Browse Festivals
      </Link>
      <Link to="/resources" className="navbar-link">
        Resources
      </Link>
      <Link to="/how-it-works" className="navbar-link">
        How it Works
      </Link>

      {!tokenExists ? (
        <>
          <Link to="/signup" className="navbar-link">
            Sign Up
          </Link>
          <Link to="/login" className="navbar-link">
            Login
          </Link>
        </>
      ) : (
        <>
          <Link to="/profile" className="navbar-link">
            My Dashboard
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