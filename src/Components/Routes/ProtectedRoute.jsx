import { Navigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { loggedInUser } from "../../store/authState";

/**
 * element: React element to render if authenticated & authorized
 * requiredPermissions: array of permissions required to view this route
 */
export default function ProtectedRoute({ element, requiredPermissions = [] }) {
  const session = useAtomValue(loggedInUser);
  const token = session?.token || "";
  const user = session?.user || null;
  const permissions = Array.isArray(session?.permissions)
    ? session.permissions
    : [];

  const isAuthenticated = Boolean(token && user);

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  const hasPermission =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((p) => permissions.includes(p));

  if (!hasPermission) return <Navigate to="/unauthorized" replace />;

  return element;
}
