import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import getCurrentUser from "../../api/getCurrentUser";
import { fetchNotificationSummary } from "../../api/notifications";
import { useAuthStatus } from "../../hooks/useAuthStatus";
import "./NavBar.css";

import bfLogo from "../../assets/react.svg";

import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import NotificationMenu from "./NotificationMenu";

function NavBar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState(null);
  const [user, setUser] = useState(null);

  const profileMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);

  const { tokenExists, clearToken } = useAuthStatus();

  const createTarget = tokenExists
    ? "/dashboard#dashboard-quick-actions"
    : "/register";

  const refreshNotificationSummary = useCallback(async () => {
    if (!tokenExists) return;

    try {
      const summary = await fetchNotificationSummary();
      setNotificationSummary(summary);
    } catch (error) {
      console.error("Failed to load notification summary:", error);
    }
  }, [tokenExists]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1081) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (!tokenExists) {
        setUser(null);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    }

    loadUser();
  }, [tokenExists]);

  useEffect(() => {
    if (!tokenExists) return;

    let cancelled = false;

    async function fetchSummary() {
      try {
        const summary = await fetchNotificationSummary();
        if (!cancelled) {
          setNotificationSummary(summary);
        }
      } catch (error) {
        console.error("Failed to load notification summary:", error);
      }
    }

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [tokenExists]);

  useEffect(() => {
    if (!tokenExists || !notificationsOpen) return;

    let cancelled = false;

    async function fetchSummary() {
      try {
        const summary = await fetchNotificationSummary();
        if (!cancelled) {
          setNotificationSummary(summary);
        }
      } catch (error) {
        console.error("Failed to load notification summary:", error);
      }
    }

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [tokenExists, notificationsOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }

      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  function toggleMenu() {
    setMenuOpen((value) => !value);
  }

  function handleLogout() {
    clearToken();
    setNotificationSummary(null);
    setUser(null);
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
    closeMenu();
    navigate("/");
  }

  function handleProfileToggle() {
    setNotificationsOpen(false);
    setProfileMenuOpen((value) => !value);
  }

  function handleNotificationsToggle() {
    setProfileMenuOpen(false);
    setNotificationsOpen((value) => !value);
  }

  function handleProfileOpen() {
    setProfileMenuOpen(false);
    closeMenu();
    navigate("/profile");
  }

  const displayName =
    user?.display_name?.trim() ||
    user?.username?.trim() ||
    user?.email?.trim() ||
    "User";

  const userInitials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [displayName]);

const badgeCount = notificationSummary?.unread_count || 0;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
          aria-label="Stack Otterflows Home"
        >
          <img
            className="navbar-logo-img"
            src={bfLogo}
            alt="Stack Otterflows"
          />
        </Link>

        <NavLinks
          tokenExists={tokenExists}
          createTarget={createTarget}
          onClose={closeMenu}
        />

        <div className="navbar-actions">
          {tokenExists && (
            <div className="nav-popover" ref={notificationsMenuRef}>
              <button
                type="button"
                className="icon-btn bell-btn"
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
                onClick={handleNotificationsToggle}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
                  <path d="M12 22a2.46 2.46 0 0 0 2.45-2h-4.9A2.46 2.46 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1Z" />
                </svg>

                {badgeCount > 0 && (
                  <span className="icon-badge">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <NotificationMenu
                  open={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  onSummaryRefresh={refreshNotificationSummary}
                />
              )}
            </div>
          )}

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
            <div className="user-menu" ref={profileMenuRef}>
              <button
                type="button"
                className="avatar-btn"
                aria-label="Open account menu"
                aria-expanded={profileMenuOpen}
                onClick={handleProfileToggle}
              >
                {userInitials}
              </button>

              {profileMenuOpen && (
                <div className="nav-dropdown nav-dropdown--profile">
                  <button
                    type="button"
                    className="nav-dropdown__button"
                    onClick={handleProfileOpen}
                  >
                    Profile
                  </button>

                  <button
                    type="button"
                    className="nav-dropdown__button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

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

      <MobileMenu
        open={menuOpen}
        tokenExists={tokenExists}
        createTarget={createTarget}
        onClose={closeMenu}
      />
    </header>
  );
}

export default NavBar;