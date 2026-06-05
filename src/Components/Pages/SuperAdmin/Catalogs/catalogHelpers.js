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

export function getInstitutionName(item = {}) {
  return item.platformName ?? item.name ?? item.institutionName ?? "";
}
