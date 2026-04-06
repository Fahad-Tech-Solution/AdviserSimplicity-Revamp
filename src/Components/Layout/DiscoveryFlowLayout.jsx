import { Typography } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  addDiscoverySectionsModalOpen,
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
} from "../../store/authState";
import {
  DISCOVERY_ADD_SECTION_KEY,
  getDiscoveryStepperRoutes,
  matchDiscoveryRoute,
  pathMatchesDiscoveryRoute,
} from "../Routes/User.Routes.jsx";

const { Text, Title } = Typography;

const PRIMARY_GREEN = "#22c55e";
const MUTED = "#9ca3af";
const LINE = "#e5e7eb";

function DiscoveryStepper({ pathname, visibleRoutes, onNavigate }) {
  const activeIndex = visibleRoutes.findIndex((r) =>
    pathMatchesDiscoveryRoute(pathname, r),
  );
  const hasActiveStep = activeIndex >= 0;
  const current = hasActiveStep ? activeIndex : -1;

  return (
    <div style={{ position: "relative", marginBottom: 28, paddingTop: 8 }}>
      <div
        style={{
          position: "absolute",
          left: "2%",
          right: "2%",
          top: 30,
          height: 2,
          background: LINE,
          zIndex: 0,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          zIndex: 1,
          gap: 2,
          overflowX: "auto",
          paddingBottom: 4,
          paddingInline: 20,
        }}
      >
        {visibleRoutes.map((route, index) => {
          const active = hasActiveStep && index === current;
          const icon = route.stepIcon ?? "•";
          const label = route.stepTitle ?? route.key;
          return (
            <div
              key={route.key}
              style={{
                flex: "1 1 56px",
                minWidth: 52,
                maxWidth: 120,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "none",
                border: "none",
                padding: "5px 2px",
              }}
            >
              <div
                role="button"
                onClick={() => onNavigate(route.key)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: active ? PRIMARY_GREEN : "#fff",
                  border: active
                    ? `2px solid ${PRIMARY_GREEN}`
                    : `2px solid ${LINE}`,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  lineHeight: 1,
                  boxShadow: active
                    ? "0 0 0 4px rgba(34, 197, 94, .15)"
                    : "none",
                }}
              >
                <span style={{ opacity: active ? 1 : 0.75 }}>{icon}</span>
              </div>
              <Text
                role="button"
                onClick={() => onNavigate(route.key)}
                style={{
                  marginTop: 8,
                  fontSize: 9,
                  lineHeight: 1.2,
                  textAlign: "center",
                  color: active ? PRIMARY_GREEN : MUTED,
                  fontWeight: active ? 700 : 400,
                  display: "block",
                  padding: "0 25px",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {label}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Shell for all Discovery steps: section kicker, dynamic title, horizontal stepper from
 * `discoveryRoutes` (filtered by questionnaire), then the active page via `<Outlet />`.
 */
export default function DiscoveryFlowLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setAddDiscoveryModalOpen = useSetAtom(addDiscoverySectionsModalOpen);

  const handleStepNavigate = (to) => {
    if (to === DISCOVERY_ADD_SECTION_KEY) {
      setAddDiscoveryModalOpen(true);
      return;
    }
    navigate(to);
  };

  const stepperRoutes = useMemo(
    () => getDiscoveryStepperRoutes(discoveryQuestions),
    [discoveryQuestions],
  );

  const matched = matchDiscoveryRoute(location.pathname, discoveryQuestions);
  const pageTitle = matched?.stepTitle ?? "Discovery";

  return (
    <div style={{ maxWidth: 1100, margin: "21px auto", padding: "0px 0 24px" }}>
      <Text
        style={{
          display: "block",
          fontSize: 11,
          letterSpacing: 3,
          color: PRIMARY_GREEN,
          textTransform: "uppercase",
          marginBottom: 8,
          fontWeight: 400,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Discovery
      </Text>
      <Title
        level={2}
        style={{
          marginTop: 18,
          marginBottom: 24,
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          fontSize: 28,
          color: "#111827",
        }}
        onClick={() => console.log(discoveryQuestions, discoveryData)}
      >
        {pageTitle}
      </Title>

      <DiscoveryStepper
        pathname={location.pathname}
        visibleRoutes={stepperRoutes}
        onNavigate={handleStepNavigate}
      />

      <Outlet />
    </div>
  );
}
