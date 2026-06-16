import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import useAuthSession from "../../hooks/useAuthSession";
import { loggedInUser } from "../../store/authState";
import {
  getUserPermissions,
  hasRequiredPermission,
  isAuthenticatedSession,
} from "../../utils/authSession";

export default function ProtectedRoute({ element, requiredPermissions = [] }) {
  const session = useAtomValue(loggedInUser);
  const { fetchSession, clearSession } = useAuthSession();
  const [authStatus, setAuthStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      setAuthStatus("loading");
      const result = await fetchSession();

      if (!cancelled) {
        setAuthStatus(result.ok ? "authenticated" : "unauthenticated");
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [fetchSession]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      setAuthStatus("unauthenticated");
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [clearSession]);

  if (authStatus === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (authStatus === "unauthenticated" || !isAuthenticatedSession(session)) {
    return <Navigate to="/auth/login" replace />;
  }

  const allPermissions = getUserPermissions(session);

  if (!hasRequiredPermission(allPermissions, requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return element;
}
