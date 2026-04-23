import { Card, Radio } from "antd";
import React from "react";
import RiskProfileInfoSVG from "../../../../../assets/image/SectionImages/RiskProfileInfoSVG.svg";

const IntroStep = ({ joinedProfile, onJoinedProfileChange, showPartner }) => {
  return (
    <div style={{ paddingTop: 56 }}>
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
        <h2
          style={{
            marginBottom: 8,
            fontFamily: "Arial, sans-serif",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          <strong>RISK PROFILE QUESTIONNAIRE</strong>
        </h2>
        <div style={{ fontSize: 52, marginBottom: 8 }}>
          {/* <img
            src={RiskProfileInfoSVG}
            alt="Risk Profile Questionnaire"
            style={{ width: "100px", height: "130px" }}
          /> */}
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
        <p style={{ color: "#6b7280", marginBottom: 24 }}>
          This questionnaire helps estimate investment risk tolerance. It should
          be considered together with time horizon, cash flow needs, existing
          commitments, and broader advice objectives.
        </p>
        <div style={{ marginBottom: 12, fontWeight: 600 }}>
          Would you like to answer individually or as a couple?
        </div>
        <Radio.Group
          value={joinedProfile}
          onChange={(event) => onJoinedProfileChange(event.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="Yes">Individually</Radio.Button>
          <Radio.Button value="No" disabled={!showPartner}>
            As a Couple
          </Radio.Button>
        </Radio.Group>
      </div>
    </div>
  );
};

export default IntroStep;
