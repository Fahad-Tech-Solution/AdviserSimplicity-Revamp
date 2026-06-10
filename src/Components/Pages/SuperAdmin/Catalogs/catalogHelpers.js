export function isCatalogChildActive(pathname, route) {
  if (!pathname || !route) return false;

  const segment = route.relativePath || route.path?.replace(/^\//, "");
  if (!segment) return false;

  const normalizedPath = pathname.toLowerCase();
  const normalizedKey = route.key?.toLowerCase();
  const normalizedSegment = segment.toLowerCase();

  return (
    normalizedPath === normalizedKey ||
    normalizedPath.endsWith(`/catalog/${normalizedSegment}`)
  );
}

/** Resolve the active catalog section from the current URL. */
export function matchCatalogChildRoute(pathname, routes = []) {
  const list = Array.isArray(routes) ? routes : [];
  const visible = list.filter((route) => route.condition?.() !== false);

  return (
    visible.find((route) => isCatalogChildActive(pathname, route)) ?? null
  );
}

export function normalizeCatalogsData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  return data;
}

export function getCatalogSectionList(data, sectionKey) {
  if (!sectionKey) return [];
  const catalogs = normalizeCatalogsData(data);
  const list = catalogs[sectionKey];
  return Array.isArray(list) ? list : [];
}

export function getCatalogSectionCount(data, sectionKey) {
  return getCatalogSectionList(data, sectionKey).length;
}

export function getUnderlyingInvestments(row = {}) {
  const investments = row?.arrayOfOffers;
  return Array.isArray(investments) ? investments : [];
}

export function getCatalogItemName(item = {}) {
  return (
    item.platformName ??
    item.name ??
    item.institutionName ??
    item.productName ??
    ""
  );
}

/** @deprecated Use getCatalogItemName */
export const getInstitutionName = getCatalogItemName;
