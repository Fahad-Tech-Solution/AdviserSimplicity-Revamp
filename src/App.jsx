import { Suspense } from "react";
import { Spin } from "antd";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AuthPage from "./Components/Auth/AuthPage";

/**
 * Best-practice pattern:
 * - Public routes in one list
 * - Protected route "groups" using <Outlet />
 * - Auth/permission logic isolated in one place (replace later with your real auth store)
 *
 * Per your request: all route elements are empty fragments (<></>).
 */

function useAuth() {
  // Replace with your real logic (Recoil/Context/API) later.
  const token =
    localStorage.getItem("token") ??
    localStorage.getItem("accessToken") ??
    localStorage.getItem("jwt");

  // Optional permissions shape: stored as JSON array, e.g. ["cashflow","superAdmin"]
  let permissions = [];
  try {
    const raw = localStorage.getItem("permissions");
    permissions = raw ? JSON.parse(raw) : [];
  } catch {
    permissions = [];
  }

  return {
    isAuthenticated: Boolean(token),
    permissions: Array.isArray(permissions) ? permissions : [],
  };
}

function ProtectedLayout({ requiredPermissions = [] }) {
  const { isAuthenticated, permissions } = useAuth();

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
  { path: "/pricing-table", element: <></> },
  { path: "/buy-adviser-link", element: <></> },
  { path: "/stripe-redirect", element: <></> },
  { path: "/user/warning", element: <></> },
  { path: "/unauthorized", element: <></> },
];

export default function App() {
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
