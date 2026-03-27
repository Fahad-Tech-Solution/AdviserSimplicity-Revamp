import { Suspense, useEffect } from "react";
import { Spin } from "antd";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAtomValue } from "jotai";
import AuthPage from "./Components/Auth/AuthPage";
import PricingTable from "./Components/SuperAdminComponent/PricingTable";
import http from "./services/http";
import { loggedInUser } from "./store/authState";
import Unauthorized from "./Components/Auth/Unauthorized";

/**
 * Best-practice pattern:
 * - Public routes in one list
 * - Protected route "groups" using <Outlet />
 * - Auth/permission logic isolated in one place (replace later with your real auth store)
 *
 * Per your request: all route elements are empty fragments (<></>).
 */

function ProtectedLayout({ requiredPermissions = [] }) {
  const session = useAtomValue(loggedInUser);
  const token = session?.token || "";
  const user = session?.user || null;
  const permissions = Array.isArray(session?.permissions)
    ? session.permissions
    : [];
  const isAuthenticated = Boolean(token && user);

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  const ok =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((p) => permissions.includes(p));

  if (!ok) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}

const publicRoutes = [
  { path: "/user/verify-email", element: <></> },
  { path: "/change-password", element: <></> },
  { path: "/pricing-table", element: <PricingTable /> },
  { path: "/buy-adviser-link", element: <></> },
  { path: "/stripe-redirect", element: <></> },
  { path: "/user/warning", element: <></> },
  { path: "/unauthorized", element: <Unauthorized /> },
];

export default function App() {
  const session = useAtomValue(loggedInUser);
  const token = session?.token || "";

  useEffect(() => {
    if (token) {
      http.defaults.headers.common.Authorization = `Bearer ${token}`;
      return;
    }
    delete http.defaults.headers.common.Authorization;
  }, [token]);

  return (
    <Suspense
      fallback={
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
      }
    >
      <Routes>
        {/* Auth shell routes (motion + theme + form switching) */}
        <Route path="/auth/*" element={<AuthPage />} />

        {/* Public */}
        {publicRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}

        {/* Protected: Super Admin */}
        <Route
          path="/super/admin"
          element={<ProtectedLayout requiredPermissions={["superAdmin"]} />}
        >
          <Route index element={<></>} />
          <Route path="*" element={<></>} />
        </Route>

        {/* Protected: Cashflow */}
        <Route
          path="/user/cashflow"
          element={<ProtectedLayout requiredPermissions={["cashflow"]} />}
        >
          <Route index element={<></>} />
          <Route path="*" element={<></>} />
        </Route>

        {/* Protected: Main user area */}
        <Route
          path="/user"
          element={
            <ProtectedLayout requiredPermissions={["fact find", "prospects"]} />
          }
        >
          <Route index element={<></>} />
          <Route path="*" element={<></>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Suspense>
  );
}
