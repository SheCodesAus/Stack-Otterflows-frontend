import { useEffect, useState } from "react";
import { clearToken as removeToken, getAuthEventName, hasToken } from "../api/auth";

export function useAuthStatus() {
  const [tokenExists, setTokenExists] = useState(hasToken());

  useEffect(() => {
    const syncAuthState = () => {
      setTokenExists(hasToken());
    };

    window.addEventListener("storage", syncAuthState);
    window.addEventListener(getAuthEventName(), syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener(getAuthEventName(), syncAuthState);
    };
  }, []);

  return {
    tokenExists,
    clearToken: removeToken,
  };
}