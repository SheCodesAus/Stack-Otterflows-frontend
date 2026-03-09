import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import getCurrentUser from "../api/getCurrentUser";
import { clearToken, hasToken } from "../api/auth";

function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let ignore = false;

    async function checkAuth() {
      if (!hasToken()) {
        if (!ignore) setStatus("unauthenticated");
        return;
      }

      try {
        await getCurrentUser();
        if (!ignore) setStatus("authenticated");
      } catch {
        clearToken();
        if (!ignore) setStatus("unauthenticated");
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
        <p>Checking your session...</p>
      </section>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default RequireAuth;