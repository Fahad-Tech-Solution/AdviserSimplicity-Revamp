import { useEffect, useMemo, useState } from "react";
import { Card, Spin, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { catalogChildRoutes } from "../Routes/SuperAdmin.Routes.jsx";
import useApi from "../../hooks/useApi.js";
import { useAtom } from "jotai";
import { catalogsDataAtom } from "../../store/authState.js";
import {
  getCatalogSectionCount,
  normalizeCatalogsData,
} from "../Pages/SuperAdmin/Catalogs/catalogHelpers.js";

const { Text, Title } = Typography;
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };

function isCatalogChildActive(pathname, route) {
  const segment = route.relativePath || route.path?.replace(/^\//, "");
  if (!segment) return false;
  return (
    pathname === route.key ||
    pathname.endsWith(`/catalog/${segment}`) ||
    pathname.endsWith(`/Catalog/${segment}`)
  );
}

function CatalogCategoryCard({ route, active, onClick, count }) {
  const icon = route.catalogIcon ?? "📁";
  const title = route.catalogTitle ?? route.label ?? "Section";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "1 1 120px",
        minWidth: 118,
        maxWidth: 150,
        border: active ? `2px solid ${PRIMARY_GREEN}` : "1px solid #e5e7eb",
        background: active ? "#f0fdf4" : "#fff",
        borderRadius: 12,
        padding: "14px 10px 12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        transition: "all 0.15s ease",
        boxShadow: active
          ? "0 8px 20px rgba(34, 197, 94, 0.12)"
          : "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
        {icon}
      </span>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#374151",
          textAlign: "center",
          lineHeight: 1.35,
          minHeight: 30,
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
    () => catalogChildRoutes.filter((route) => route.condition?.() !== false),
    [],
  );

  const activeRoute = useMemo(
    () =>
      visibleCatalogRoutes.find((route) =>
        isCatalogChildActive(location.pathname, route),
      ),
    [location.pathname, visibleCatalogRoutes],
  );

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const res = await get("/api/investmentoffer");
      console.log(res, "res");
      setCatalogsData(normalizeCatalogsData(res));
    } catch (error) {
      console.log(error, "error");
    } finally {
      setLoading(false);
    }
  };

  if(loading){
    return <Spin size="large" />;
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
        }}
      >
        ADMIN
      </Text>

      <Title
        level={3}
        style={{ ...headingStyle, margin: "8px 0 0", fontWeight: 500 }}
      >
        Product Catalog
      </Title>
      <Text
        style={{
          display: "block",
          marginTop: 6,
          marginBottom: 20,
          fontSize: 12,
          color: "#6b7280",
          fontFamily: "Arial, sans-serif",
          maxWidth: 720,
          lineHeight: 1.6,
        }}
      >
        Manage the institutions, platforms, funds, and insurers that advisers
        can select from in their client discovery forms.
      </Text>

      <Card
        styles={{ body: { padding: "16px 14px" } }}
        style={{
          borderRadius: 14,
          border: "1px solid #ebedf0",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 4,
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

      <Outlet context={{ activeCatalogRoute: activeRoute }} />
    </div>
  );
}
