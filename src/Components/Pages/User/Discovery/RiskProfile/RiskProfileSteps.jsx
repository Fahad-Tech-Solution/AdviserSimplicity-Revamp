import React from "react";
import { useNavigate } from "react-router-dom";

const PRIMARY_GREEN = "#22c55e";
const MUTED = "#9ca3af";
const LINE = "#e5e7eb";
const WARNING = "rgb(245, 158, 11)";
const WARNING_BG = "rgb(245, 158, 11)";

const RiskProfileSteps = ({ currentStep, steps, lockedStepKeys = [] }) => {
  const activeIndex = steps.findIndex((step) => step.key === currentStep.key);
  const navigate = useNavigate();
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
        {steps.map((step, index) => {
          const active = index === activeIndex;
          const completed = index < activeIndex;
          const warningActive = lockedStepKeys.includes(step.key) && activeIndex > index;
          const icon = step.icon ?? "•";
          const label = step.title ?? step.key;
          if (step?.showInSteps === false) return null;
          
          return (
            <div
              key={step.key}
              role="button"
              onClick={() => {
                navigate(`/user/discovery/risk-profile/${step.route}`);
              }}
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
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: warningActive
                    ? WARNING_BG
                    : active || completed
                      ? PRIMARY_GREEN
                      : "#fff",
                  border: warningActive
                    ? `2px solid ${WARNING}`
                    : active || completed
                      ? `2px solid ${PRIMARY_GREEN}`
                      : `2px solid ${LINE}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  lineHeight: 1,
                  boxShadow: warningActive
                    ? "0 0 0 4px rgba(245, 159, 11, 0.35)"
                    : active
                      ? "0 0 0 4px rgba(34, 197, 94, .15)"
                      : "none",
                  color: warningActive ? WARNING : undefined,
                }}
              >
                <span>{icon}</span>
                {warningActive ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "red",
                      color: "#fff",
                      fontSize: 8,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 0 2px #fff",
                      fontFamily: "Georgia, serif",

                      //   position: absolute;
                      //   top: -4px;
                      //   right: -4px;
                      //   width: 14px;
                      //   height: 14px;
                      //   border-radius: 50%;
                      //   background: rgb(239, 68, 68);
                      //   border: 2px solid rgb(255, 255, 255);
                      //   display: flex;
                      //   align-items: center;
                      //   justify-content: center;
                      //   font-size: 8px;
                      //   color: rgb(255, 255, 255);
                      //   font-weight: 900;
                    }}
                  >
                    !
                  </span>
                ) : null}
              </div>
              <span
                style={{
                  marginTop: 8,
                  fontSize: 9,
                  lineHeight: 1.2,
                  textAlign: "center",
                  color: warningActive
                    ? WARNING
                    : active
                      ? PRIMARY_GREEN
                      : completed ? "rgb(55, 65, 81)" : MUTED,
                  fontWeight: warningActive || active || completed ? 700 : 400,
                  display: "block",
                  padding: "0 23px",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskProfileSteps;
