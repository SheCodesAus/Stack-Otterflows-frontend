import { Link } from "react-router-dom";

function NavLinks({ tokenExists, createTarget, onClose }) {
  return (
    <nav className="navbar-links" aria-label="Primary navigation">
      {!tokenExists ? (
        <>
          <Link to="/" className="navbar-link" onClick={onClose}>
            Home
          </Link>

          <Link to="/how-it-works" className="navbar-link" onClick={onClose}>
            How It Works
          </Link>

          <Link to="/login" className="navbar-link" onClick={onClose}>
            Login
          </Link>

          <Link to="/register" className="navbar-link" onClick={onClose}>
            Sign Up
          </Link>
        </>
      ) : (
        <>
          <Link to="/dashboard" className="navbar-link" onClick={onClose}>
            My Dashboard
          </Link>

          <Link to="/goals" className="navbar-link" onClick={onClose}>
            Goals
          </Link>

          <Link to="/pods" className="navbar-link" onClick={onClose}>
            Pods
          </Link>

          <Link to="/connections" className="navbar-link" onClick={onClose}>
            Connections
          </Link>

          <Link to="/how-it-works" className="navbar-link" onClick={onClose}>
            How It Works
          </Link>

          <Link
            to={createTarget}
            className="navbar-link navbar-link--cta"
            onClick={onClose}
          >
            Create
          </Link>
        </>
      )}
    </nav>
  );
}

export default NavLinks;