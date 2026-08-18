import { useEffect, useMemo, useState } from "react";
import { Card, Spin, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { catalogChildRouteConfigs } from "../Routes/catalogRouteConfig";
import useApi from "../../hooks/useApi.js";
import { useAtom } from "jotai";
import { catalogsDataAtom } from "../../store/authState.js";
import {
  getCatalogSectionCount,
  isCatalogChildActive,
  matchCatalogChildRoute,
  normalizeCatalogsData,
} from "../Pages/SuperAdmin/Catalogs/catalogHelpers.js";

const { Text, Title } = Typography;
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };

function CatalogCategoryCard({ route, active, onClick, count }) {
  const icon = route.catalogIcon ?? "📁";
  const title = route.catalogTitle ?? route.label ?? "Section";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "14px 6px 12px",
        borderRadius: 11,
        cursor: "pointer",
        transition: "all 0.15s ease",
        border: "none",
        flex: "1 1 120px",
        minWidth: 118,
        maxWidth: 150,
        background: active ? "#f0fdf4" : "#fff",
      }}
    >
      <span
        style={{
          fontSize: 16,
          lineHeight: 1,
          background: active ? "#22c55e" : "#f3f4f6",
          color: active ? "#6b7280" : "#fff",
          boxShadow: active ? "0 3px 10px rgba(34, 197, 94, .35)" : "none",
          borderRadius: 50,
          padding: "4px 8px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
        }}
        aria-hidden
      >
        {icon} 
      </span>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: active ? "#16a34a" : "#6b7280",
          textAlign: "center",
          lineHeight: 1.35,
          minHeight: 30,
          maxWidth: 100,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {title}
      </Text>
      <span
        style={{
          minWidth: 28,
          height: 22,
          padding: "0 8px",
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          background: active ? PRIMARY_GREEN : "#f3f4f6",
          color: active ? "#fff" : "#6b7280",
        }}
      >
        {count}
      </span>
    </button>
  );
}

export default function CatalogsLayoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { get } = useApi();
  const [catalogsData, setCatalogsData] = useAtom(catalogsDataAtom);
  const [loading, setLoading] = useState(false);

  const visibleCatalogRoutes = useMemo(
    () =>
      catalogChildRouteConfigs.filter(
        (route) =>
          route.condition?.() !== false &&
          !route.switchToInvestmentSectionsPage,
      ),
    [],
  );

  const activeRoute = useMemo(
    () => matchCatalogChildRoute(location.pathname, catalogChildRouteConfigs),
    [location.pathname],
  );

  const isInvestmentSectionsRoute = useMemo(
    () => location.pathname === "/super-admin/catalog/investment-sections",
    [location.pathname],
  );

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const res = await get("/investmentoffer");
      console.log(res, "res");
      setCatalogsData(normalizeCatalogsData(res));
    } catch (error) {
      console.log(error, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (isInvestmentSectionsRoute) {
    return <Outlet key={activeRoute?.key ?? location.pathname} />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 32px)",
        padding: "12px 4px 24px",
      }}
    >
      <Text
        style={{
          fontFamily: "Arial, serif",
          fontWeight: 700,
          letterSpacing: "3px",
          fontSize: "11px",
          color: PRIMARY_GREEN,
          marginBottom: 6,
        }}
      >
        ADMIN
      </Text>

      <Title
        level={3}
        style={{
          ...headingStyle,
          margin: "0 0",
          fontWeight: 500,
          fontSize: 28,
        }}
      >
        Product Catalog
      </Title>
      <Text
        style={{
          display: "block",
          marginTop: 0,
          marginBottom: 20,
          fontSize: 12,
          color: "#6b7280",
          fontFamily: "Arial, sans-serif",
          // maxWidth: 580,
          lineHeight: 1.6,
        }}
      >
        Manage the institutions, platforms, funds, and insurers that advisers
        can select from in their client discovery forms.
      </Text>

      <Card
        styles={{ body: { padding: "12px 12px", background: "none" } }}
        style={{
          borderRadius: 16,
          border: "1px solid rgba(0, 0, 0, .08)",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 0,
          }}
        >
          {visibleCatalogRoutes.map((route) => {
            const active = isCatalogChildActive(location.pathname, route);
            return (
              <CatalogCategoryCard
                count={getCatalogSectionCount(
                  catalogsData,
                  route.catalogDataKey,
                )}
                key={route.key}
                route={route}
                active={active}
                onClick={() => navigate(route.key)}
              />
            );
          })}
        </div>
      </Card>

      <Outlet key={activeRoute?.key ?? location.pathname} />
    </div>
  );
}
