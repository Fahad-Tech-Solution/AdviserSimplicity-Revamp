export const ADVISER_LOGIN_PATH = "/auth/login";
export const ADMIN_LOGIN_PATH = "/auth/admin-login";

export const EMPTY_SESSION = {
  email: "",
  user: null,
  permissions: [],
};

/** Login route for a protected area (e.g. super-admin shell → admin login). */
export function getLoginPathForRequiredPermissions(requiredPermissions = []) {
  if (requiredPermissions.includes("superAdmin")) {
    return ADMIN_LOGIN_PATH;
  }
  return ADVISER_LOGIN_PATH;
}

/** Login route for the current session (logout redirect). */
export function getLoginPathForSession(session = {}) {
  const roleName = session?.user?.roleID?.roleName?.trim() || "";
  if (roleName === "superAdmin") {
    return ADMIN_LOGIN_PATH;
  }
  const permissions = getUserPermissions(session);
  if (permissions.includes("superAdmin")) {
    return ADMIN_LOGIN_PATH;
  }
  return ADVISER_LOGIN_PATH;
}

/** Build client session state from login / me API responses (no token stored). */
export function normalizeSessionFromApi(res = {}, fallbackEmail = "") {
  const user = res?.user ?? res?.data?.user ?? (res?._id ? res : null);

  if (!user || typeof user !== "object") {
    return EMPTY_SESSION;
  }

  const permissions =
    res?.permissions ??
    user?.roleID?.permissions ??
    user?.permissions ??
    [];

  return {
    email: (res?.email ?? user?.email ?? fallbackEmail ?? "").toLowerCase(),
    user,
    permissions: Array.isArray(permissions) ? permissions : [],
  };
}

export function isAuthenticatedSession(session = {}) {
  return Boolean(session?.user && (session.user._id || session.user.id || session.user.email));
}

/** Collect permissions from primary role and any populated additional roles. */
export function getUserPermissions(session = {}) {
  const { user, permissions = [] } = session;

  const primary = Array.isArray(permissions)
    ? permissions
    : user?.roleID?.permissions ?? user?.permissions ?? [];

  const fromAdditionalRoles = 
    Array.isArray(user?.additionalRoleIDs) ? user.additionalRoleIDs : []
  

  return [...new Set([...primary, ...fromAdditionalRoles].filter(Boolean))];
}

export function hasRequiredPermission(allPermissions = [], requiredPermissions = []) {
  if (!requiredPermissions.length) return true;
  return requiredPermissions.some((permission) =>
    allPermissions.includes(permission),
  );
}
