export const EMPTY_SESSION = {
  email: "",
  user: null,
  permissions: [],
};

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
