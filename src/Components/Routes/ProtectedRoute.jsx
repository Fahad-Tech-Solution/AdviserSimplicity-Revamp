import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { loggedInUser } from "../../store/authState";
import { Spin } from "antd";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ element, requiredPermissions = [] }) {
  const session = useAtomValue(loggedInUser);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check if the atom has been hydrated from storage
  useEffect(() => {
    // Small delay to ensure atom storage is loaded
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while waiting for hydration
  if (!isHydrated) {
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
    ); // or your spinner component
  }

  // If session is still null after hydration, consider it as not authenticated
  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  const { token, user, permissions = [] } = session;

  const isAuthenticated = Boolean(token && user);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Primary role permissions (unchanged for normal users)
  const primaryPermissions = permissions;

  // Extra permissions from secondary roles (empty [] for most users).
  // API may send a flat list and/or populated role objects on additionalRoleIDs.
  const additionalRolePermissions = Array.isArray(user?.additionalRoleIDs)
    ? user.additionalRoleIDs
    : [];

  const permissionsFromAdditionalRoles = (
    Array.isArray(user?.additionalRoleIDs) ? user.additionalRoleIDs : []
  ).flatMap((role) => {
    if (typeof role === "string") return [];
    return role?.permissions ?? role?.roleID?.permissions ?? [];
  });

  const allPermissions = [
    ...primaryPermissions,
    ...additionalRolePermissions,
    ...permissionsFromAdditionalRoles,
  ];

  console.log(allPermissions, "allPermissions");

  const hasPermission =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((p) => allPermissions.includes(p));

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return element;
}
