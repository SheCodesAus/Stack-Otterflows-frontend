import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import getCurrentUser from "../api/getCurrentUser";
import { clearToken, hasToken } from "../api/auth";
import LoadingState from "../components/LoadingState";

function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let ignore = false;

    async function checkAuth() {
      if (!hasToken()) {
        if (!ignore) {
          setStatus("unauthenticated");
        }
        return;
      }

      try {
        await getCurrentUser();
        if (!ignore) {
          setStatus("authenticated");
        }
      } catch {
        clearToken();
        if (!ignore) {
          setStatus("unauthenticated");
        }
      }
    }

    checkAuth();

    return () => {
      ignore = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <section className="page-shell">
        <LoadingState
          title="Getting PodFlow ready"
          message="Checking your session and loading your space."
        />
      </section>
    );
  }

  if (status === "unauthenticated") {
    const intendedPath = `${location.pathname || ""}${location.search || ""}${location.hash || ""}`;

    try {
      sessionStorage.setItem("postLoginRedirect", intendedPath);
    } catch {
      // Ignore storage issues
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default RequireAuth;