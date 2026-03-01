// src/components/NavBar/NavBar.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStatus } from "../../hooks/useAuthStatus";
import { useFundraiserAutocomplete } from "../../hooks/useFundraiserAutocomplete";
import "./NavBar.css";

import bfLogo from "../../assets/react.svg";

import NavLinks from "./NavLinks";
import NavSearch from "./NavSearch";
import MobileMenu from "./MobileMenu";

function NavBar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  // Auth status
  const { tokenExists, clearToken } = useAuthStatus();

  // Search hook (fundraisers for now, later pods)
  const search = useFundraiserAutocomplete();

  // Close mobile menu if desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const toggleMenu = () => {
    setMenuOpen((v) => !v);
    search.closeSearch(); // don't fight with search UI
  };

  const handleLogout = () => {
    clearToken();
    closeMenu();
    navigate("/");
  };

  const onPickSuggestion = (fundraiserId) => {
    navigate(`/fundraisers/${fundraiserId}`);
    search.closeSearch();
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();

    const q = search.query.trim();
    if (!q) {
      navigate("/fundraisers");
      search.closeSearch();
      return;
    }

    const params = new URLSearchParams();
    params.set("q", q);

    navigate(`/fundraisers?${params.toString()}`);
    search.closeSearch();
  };

  return (
    <header className={`navbar ${search.searchOpen ? "search-mode" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
          aria-label="Stack Otterflows Home"
        >
          <img className="navbar-logo-img" src={bfLogo} alt="Stack Otterflows" />
        </Link>

        {/* Desktop navigation */}
        <NavLinks tokenExists={tokenExists} onLogout={handleLogout} />

        {/* Actions */}
        <div className="navbar-actions">
          <NavSearch
            searchOpen={search.searchOpen}
            toggleSearch={() => {
              search.toggleSearch();
              setMenuOpen(false);
            }}
            openSearch={() => {
              search.openSearch();
              setMenuOpen(false);
            }}
            closeSearch={search.closeSearch}
            query={search.query}
            setQuery={search.setQuery}
            suggestions={search.suggestions}
            suggestionsOpen={search.suggestionsOpen}
            setSuggestionsOpen={search.setSuggestionsOpen}
            inputRef={search.inputRef}
            onSubmitSearch={onSubmitSearch}
            onPickSuggestion={onPickSuggestion}
            placeholder="Search festivals…"
          />

          {/* Route is protected by RequireAuth */}
          <Link to="/fundraisers/new" className="cta-btn" onClick={closeMenu}>
            Create Festival
          </Link>

          {/* Mobile login / logout icon */}
          {!tokenExists ? (
            <Link
              to="/login"
              className="icon-btn login-icon"
              aria-label="Login"
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.58-4.5-8-4.5Z" />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              className="icon-btn login-icon"
              aria-label="Logout"
              onClick={handleLogout}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
                <path d="M10 17v-2h4v-2h-4v-2l-3 3 3 3Zm9-12H9a2 2 0 0 0-2 2v3h2V7h10v10H9v-3H7v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
              </svg>
            </button>
          )}

          {/* Hamburger */}
          <button
            type="button"
            className="icon-btn hamburger"
            onClick={toggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
              {menuOpen ? (
                <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.31 1.41 1.42Z" />
              ) : (
                <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <MobileMenu
        open={menuOpen}
        tokenExists={tokenExists}
        onClose={closeMenu}
        onLogout={handleLogout}
      />
    </header>
  );
}

export default NavBar;