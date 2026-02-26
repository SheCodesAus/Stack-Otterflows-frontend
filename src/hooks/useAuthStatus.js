// src/hooks/useAuthStatus.js
import { useEffect, useState } from "react";

/**
 * useAuthStatus
 *
 * This hook keeps track of whether the user is "logged in"
 * by looking for a token in localStorage.
 *
 * It also listens for changes to that token, so if any part of the app
 * logs the user in or out, every place using this hook stays in sync.
 */
export function useAuthStatus() {
  // 1. A little piece of memory: does a token exist right now?
  //
  // Boolean(...) turns the token string or null into true/false.
  const [tokenExists, setTokenExists] = useState(
    Boolean(localStorage.getItem("token"))
  );

  // 2. Keep tokenExists in sync with the outside world.
  //
  // We listen for:
  // - "storage"      -> fires when localStorage changes in *another* tab
  // - "auth-changed" -> a custom event we will fire in *this* tab
  useEffect(() => {
    // Helper that re-reads localStorage and updates our state
    const syncAuth = () => {
      setTokenExists(Boolean(localStorage.getItem("token")));
    };

    // Listen for changes
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);

    // Run once immediately, in case anything changed before we mounted
    syncAuth();

    // Cleanup: stop listening when no component is using this hook anymore
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []); // [] means "run this effect once when the hook is first used"

  // 3. A helper we can call when we want to "log out" at the storage level.
  //
  // This does NOT navigate anywhere. It only:
  // - removes the token
  // - notifies listeners that auth has changed
  const clearToken = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
  };

  // 4. Return the useful bits for components to use.
  //
  // - tokenExists: true/false
  // - clearToken: function to wipe the token
  return { tokenExists, clearToken };
}