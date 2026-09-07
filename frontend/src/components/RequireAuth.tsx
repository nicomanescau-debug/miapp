import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../services/api";

export default function RequireAuth() {
  const [hasToken, setHasToken] = useState(() => !!getToken());

  useEffect(() => {
    function handleUnauthorized() {
      setHasToken(false);
    }
    window.addEventListener("miapp:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("miapp:unauthorized", handleUnauthorized);
  }, []);

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
