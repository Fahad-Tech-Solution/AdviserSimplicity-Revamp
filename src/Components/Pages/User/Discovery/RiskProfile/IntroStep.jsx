import { Button, Card, Radio } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import nattyAiAvatar from "../../../../../assets/image/ProfileImages/NattyAI.png";

//  ../../assets/image/ProfileImages/NattyAI.png
const IntroStep = ({
  joinedProfile,
  onJoinedProfileChange,
  showPartner,
  onClick,
  values,
}) => {
  const navigate = useNavigate();
  return (
    <div style={{ paddingTop: 56 }}>
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
        <h2
          onClick={() =>
            console.log(
              "values",
              values,
              "showPartner",
              showPartner,
              "joinedProfile",
              joinedProfile,
            )
          }
          style={{
            marginBottom: 28,
            fontFamily: "Arial, sans-serif",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          <strong>RISK PROFILE QUESTIONNAIRE</strong>
        </h2>
        <div style={{ fontSize: 52, marginBottom: 28 }}>
          <svg
            width="180"
            height="130"
            viewBox="0 0 180 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="87"
              y="30"
              width="6"
              height="80"
              fill="#1e3a5f"
              rx="2"
            ></rect>
            <rect
              x="60"
              y="108"
              width="60"
              height="10"
              fill="#1e3a5f"
              rx="3"
            ></rect>
            <rect
              x="75"
              y="100"
              width="30"
              height="10"
              fill="#1e3a5f"
              rx="2"
            ></rect>
            <rect
              x="20"
              y="33"
              width="140"
              height="5"
              fill="#1e3a5f"
              rx="2"
            ></rect>
            <circle
              cx="90"
              cy="30"
              r="6"
              fill="#6b7280"
              stroke="#fff"
              stroke-width="1.5"
            ></circle>
            <line
              x1="30"
              y1="35"
              x2="38"
              y2="68"
              stroke="#6b7280"
              stroke-width="1.5"
              stroke-dasharray="3 2"
            ></line>
            <line
              x1="38"
              y1="35"
              x2="30"
              y2="68"
              stroke="#6b7280"
              stroke-width="1.5"
              stroke-dasharray="3 2"
            ></line>
            <line
              x1="142"
              y1="35"
              x2="150"
              y2="62"
              stroke="#6b7280"
              stroke-width="1.5"
              stroke-dasharray="3 2"
            ></line>
            <line
              x1="150"
              y1="35"
              x2="142"
              y2="62"
              stroke="#6b7280"
              stroke-width="1.5"
              stroke-dasharray="3 2"
            ></line>
            <ellipse cx="34" cy="72" rx="28" ry="8" fill="#22c55e"></ellipse>
            <rect
              x="8"
              y="64"
              width="52"
              height="16"
              rx="4"
              fill="#22c55e"
            ></rect>
            <text
              x="34"
              y="76"
              text-anchor="middle"
              fill="white"
              font-size="11"
              font-weight="900"
              font-family="Arial"
              letter-spacing="1"
            >
              RISK
            </text>
            <ellipse cx="146" cy="64" rx="28" ry="8" fill="#ef4444"></ellipse>
            <rect
              x="120"
              y="56"
              width="52"
              height="16"
              rx="4"
              fill="#ef4444"
            ></rect>
            <text
              x="146"
              y="68"
              text-anchor="middle"
              fill="white"
              font-size="10"
              font-weight="900"
              font-family="Arial"
              letter-spacing="0.5"
            >
              REWARD
            </text>
          </svg>
        </div>
        <div
          style={{
            marginBottom: 18,
            fontWeight: 700,
            fontSize: "14px",
            fontFamily: "Arial, sans-serif",
            letterSpacing: "1.5px",
          }}
        >
          RISK PROFILER: YOUR ATTITUDE TO INVESTING
        </div>
        <p
          style={{
            color: "#6b7280",
            marginBottom: 28,
            fontSize: "12.5px",
            color: "rgb(55, 65, 81)",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.75",
            margin: "0px auto 14px",
            maxWidth: "700px",
          }}
        >
          A Risk Profiler is a tool that can assist you in determining your
          tolerance to risk and how that relates to particular investments. Your
          risk profile is not the only information you should take into account
          before making an investment decision. These tools do not take into
          account your individual investment objectives, financial situation or
          particular needs.
          <br />
          <br />
          Because of this, before making any investment decision you should
          consider whether the funds matched to your risk profile are
          appropriate in light of your individual investment objectives,
          financial circumstances and needs. This may include your need to
          access funds, any pre-existing financial commitments you may have and
          what other financial assets that you own.
          <br />
          <br />
          This Risk Profiler questionnaire poses a series of questions and
          assigns a weighting (score) against your responses. Your overall score
          will reflect your approximate Risk profile based on certain industry
          standards.
        </p>
        <div
          style={{
            color: "#6b7280",
            marginBottom: 12,
            fontSize: "12.5px",
            color: "rgb(55, 65, 81)",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.75",
            margin: "0px auto 14px",
            maxWidth: "700px",
          }}
        >
          Would you like to answer this questionnaire individually?
        </div>
        <Radio.Group
          value={joinedProfile}
          onChange={(event) => onJoinedProfileChange(event.target.value)}
          optionType="button"
          buttonStyle="solid"
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Radio.Button
            value="No"
            disabled={!showPartner}
            style={{
              border: "1px solid #22C55E",
              color: joinedProfile === "No" ? "#ffffff" : "rgb(23 163 74)",
              width: "180px",
              height: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "700",
              fontFamily: "Arial",
            }}
          >
            No
          </Radio.Button>
          <Radio.Button
            value="Yes"
            style={{
              border: "1px solid #22C55E",
              color: joinedProfile === "Yes" ? "#ffffff" : "rgb(23 163 74)",
              width: "180px",
              height: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "700",
              fontFamily: "Arial",
            }}
          >
            Yes
          </Radio.Button>
        </Radio.Group>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 12,
          alignItems: "center",
        }}
      >
        <Button
          type="primary"
          size="large"
          style={{
            marginTop: 0,
            width: "360px",
            fontsize: "14px",
            fontWeight: "700",
            fontFamily: "Arial",
            borderRadius: "8px",
            padding: "12px 24px",
            boxShadow: " rgba(34, 197, 94, 0.3) 0px 2px 8px",
          }}
          onClick={onClick}
        >
          Submit
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 12,
          alignItems: "center",
        }}
      >
        {/* Natty Ai Section Card */}
        <div
          style={{
            backgroundColor: "#0F2147",
            borderRadius: "16px",
            padding: "16px 20px",
            maxWidth: "600px",
            width: "100%",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            border: "1px solid #1A346B",
          }}
        >
          {/* Avatar with Glowing/Ring Border */}
          <div
            style={{
              position: "relative",
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              padding: "3px",
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
                border: "2px solid #0F2147",
              }}
            >
              <img
                src={nattyAiAvatar} // Replace this URL with your actual image path/avatar source
                alt="Natty AI"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>

          {/* Text Content */}
          <div style={{ textAlign: "left", flex: 1 }}>
            <h3
              style={{
                color: "#3B82F6",
                fontSize: "15px",
                fontWeight: "700",
                margin: "0 0 6px 0",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Natty AI will guide your client through every step
            </h3>
            <p
              style={{
                color: "#94A3B8",
                fontSize: "12.5px",
                lineHeight: "1.5",
                margin: 0,
                fontFamily: "Arial, sans-serif",
              }}
            >
              She reads each question aloud, explains with real-world examples, flags
              inconsistencies, and describes the risk profile result. Say{" "}
              <strong style={{ color: "#22C55E" }}>"Next"</strong>,{" "}
              <strong style={{ color: "#22C55E" }}>"Explain"</strong>, or{" "}
              <strong style={{ color: "#22C55E" }}>"Repeat"</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroStep;
