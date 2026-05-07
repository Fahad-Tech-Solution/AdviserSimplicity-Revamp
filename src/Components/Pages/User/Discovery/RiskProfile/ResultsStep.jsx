import {
  Alert,
  Avatar,
  Card,
  Checkbox,
  Col,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import Input from "antd/es/input/Input";
import React, { useState } from "react";
import { MdOutlineArrowDropDown } from "react-icons/md";
import PieChartComponent from "./PieChartComponent";
import AppModal from "../../../../Common/AppModal";
import { renderModalContent } from "../../../../Common/renderModalContent";
import RiskGoals from "./RiskGoals";
import RiskCheckBoxConfirmation from "./RiskCheckBoxConfirmation";

import { Grid } from "antd";
const { useBreakpoint } = Grid;

const { TextArea } = Input;
const { Text } = Typography;

function ResultCard({
  title,
  participantKey,
  participantName,
  participant,
  onGoalChange,
  onTextChange,
  onCheckboxChange,
  riskGoals,
  getRiskGoalByValue,
  CONFIRMATION_LABELS,
  calculateScore,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const screens = useBreakpoint();
  const extractChartData = (goal) => {
    return {
      chart: goal?.chart?.map((item) => item.value),
      chartLabels: goal?.chart?.map((item) => item.title),
      colors: goal?.chart?.map((item) => item.color),
    };
  };

  const selectedGoal = getRiskGoalByValue(participant?.riskGoal);
  const { chart, chartLabels, colors } = extractChartData(selectedGoal);

  const ParticipentScore = calculateScore(participant);

  return (
    <div>
      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        width={modalData?.width || 1000}
        noCancelButton={true}
      >
        {renderModalContent(modalData)}
      </AppModal>

      <Card
        style={{
          background: "rgb(249, 250, 251)",
          borderRadius: 12,
          padding: "12px 16px 12px 16px",
          border: "1px solid rgb(229, 231, 235)",
          marginBottom: 20,
        }}
        styles={{
          body: {
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          },
        }}
      >
        <div style={{ textAlign: "center" }}>{participantName}</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                fontFamily: "Arial",
                fontSize: 11,
                color: "rgb(156, 163, 175)",
              }}
            >
              Score:{" "}
              <span style={{ color: "rgb(17, 24, 39)", fontWeight: 700 }}>
                {ParticipentScore}
              </span>{" "}
              / 38
            </div>
            <div
              style={{
                padding: "3px 10px 3px 10px",
                borderRadius: 99,
                background: "rgba(34, 197, 94, 0.133)",
                border: "1px solid rgb(34, 197, 94)",
                fontFamily: "Arial",
                fontSize: 11,
                fontWeight: 700,
                color: "rgb(55, 65, 81);",
              }}
            >
              {selectedGoal?.title}
            </div>
          </div>
        </div>
      </Card>

      <Card
        style={{
          background: "rgb(255, 255, 255)",
          borderRadius: 18,
          border: participant?.happyWithResult
            ? "1.5px solid rgb(187, 247, 208)"
            : "1.5px solid rgb(229, 231, 235)",
          boxShadow: participant?.happyWithResult
            ? "rgba(34, 197, 94, 0.1) 0px 4px 18px"
            : "rgba(0, 0, 0, 0.05) 0px 2px 8px",
          padding: "24px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          height: screens.xxl ? "48vh" : "90vh",
        }}
        styles={{
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          },
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Avatar
              size={32}
              style={{
                background:
                  "linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))",
                color: "#fff",
              }}
            >
              {participantName?.charAt(0)}
            </Avatar>

            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {participantName}
            </div>
          </div>
          <div
            onClick={() => {
              setModalOpen(true);
              setModalData({
                component: <RiskGoals />,
                width: 680,
                participantName: participantName,
                participant: participant,
                participantKey: participantKey,
                onGoalChange: onGoalChange,
                closeModal: () => setModalOpen(false),
              });
            }}
            role="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 8,
              border: `1.5px solid rgb(${selectedGoal?.goalColor})`,
              background: `rgba(${selectedGoal?.goalColor}, 0.094)`,
              fontFamily: "Arial",
              fontSize: 11,
              fontWeight: 700,
              color: "rgb(55, 65, 81)",
            }}
          >
            <div
              style={{
                background: `rgb(${selectedGoal?.goalColor})`,
                color: "#fff",
                padding: "4px ",
                borderRadius: 4,
              }}
            />
            {participant?.riskGoal || "Not Calculated"}
            <MdOutlineArrowDropDown size={16} />
          </div>
        </div>

        <Row>
          <Col xs={24} lg={8} className="py-3">
            <PieChartComponent data={chart} colors={colors} />
          </Col>
          <Col
            xs={24}
            lg={16}
            className=" d-flex flex-column justify-content-center align-items-center 
              ps-4
            "
          >
            {selectedGoal?.chart?.map((item, index) => (
              <div
                key={`${participantKey}-chart-${index}`}
                className="d-flex justify-content-between align-items-center gap-2 w-100"
              >
                <div
                  className="d-flex align-items-center gap-2"
                  style={{
                    fontFamily: "Arial",
                    fontSize: 11,
                    color: "rgb(55, 65, 81)",
                    flex: "1 1 0%",
                  }}
                >
                  <div
                    style={{
                      background: item.color,
                      color: "#fff",
                      padding: "4px",
                      borderRadius: 2,
                    }}
                  />
                  {item.title}
                </div>
                <div
                  style={{
                    fontFamily: "Arial",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgb(22, 163, 74)",
                  }}
                >
                  {item.value}%
                </div>
              </div>
            ))}
          </Col>
          <Col xs={24} lg={24}>
            <div
              style={{
                textAlign: "center",
                padding: "8px 0px",
                borderRadius: "10px",
                border: `1.5px solid rgba(${selectedGoal?.goalColor}, 0.25)`,
                background: `rgba(${selectedGoal?.goalColor}, 0.07)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontFamily: "Arial",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "rgb(17,24,39)",
                }}
              >
                {selectedGoal?.title}
              </div>
              <div
                style={{
                  fontFamily: "Arial",
                  fontSize: 11,
                  fontWeight: 700,
                  color: `rgb(${selectedGoal?.goalColor})`,
                }}
              >
                RISK PROFILE
              </div>
            </div>
          </Col>
          <Col xs={24} lg={24} className="py-3">
            <div
              style={{
                fontFamily: "Arial",
                fontSize: 12,
                color: "rgb(107, 114, 128)",
                lineHeight: "1.65",
                flex: "1 1 0%",
              }}
            >
              {selectedGoal?.description}
            </div>
          </Col>
        </Row>

        <div className="mt-auto">
          <Checkbox
            checked={participant?.happyWithResult}
            onChange={(event) => {
              if (participant?.happyWithResult) {
                CONFIRMATION_LABELS.forEach((item) => {
                  onCheckboxChange(participantKey, item.key, false);
                });
                onCheckboxChange(participantKey, "happyWithResult", false);
                return;
              }
              setModalOpen(true);
              setModalData({
                component: <RiskCheckBoxConfirmation />,
                width: 680,
                participantName: participantName,
                participant: participant,
                participantKey: participantKey,
                onGoalChange: onGoalChange,
                CONFIRMATION_LABELS: CONFIRMATION_LABELS,
                closeModal: ({ values: confirmationValues } = {}) => {
                  setModalOpen(false);
                  if (confirmationValues) {
                    CONFIRMATION_LABELS.forEach((item) => {
                      onCheckboxChange(
                        participantKey,
                        item.key,
                        Boolean(confirmationValues?.[item.key]),
                      );
                    });
                    onCheckboxChange(participantKey, "happyWithResult", true);
                  }
                },
              });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 12px",
              background: participant?.happyWithResult
                ? "rgb(23, 163, 74, 0.07)"
                : "rgb(250, 250, 250)",
              border: participant?.happyWithResult
                ? "1.5px solid rgb(23, 163, 74)"
                : "1.5px solid rgb(229, 231, 235)",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "0.15s",
              color: participant?.happyWithResult
                ? "rgb(21, 128, 61)"
                : "rgb(17, 24, 39)",
              fontFamily: "Arial",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {participant?.happyWithResult
              ? "✓ Risk profile confirmed"
              : "Confirm risk profile"}
          </Checkbox>
        </div>
      </Card>
    </div>
  );
}

const ResultsStep = ({
  values,
  includePartner,
  clientName,
  partnerName,
  onGoalChange,
  onTextChange,
  onCheckboxChange,
  riskGoals,
  getRiskGoalByValue,
  CONFIRMATION_LABELS,
  calculateScore,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={24}>
        <Text
          style={{
            fontFamily: "Arial",
            fontSize: 10,
            letterSpacing: 2,
            color: "rgb(34, 197, 94)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          RISK RESULTS
        </Text>
        <br />
        <Text
          style={{
            fontSize: 10,
            fontFamily: "Arial",
            color: "rgb(156, 163, 175)",
            marginBottom: 20,
          }}
        >
          Review each client's risk profile. Click the profile pill to change
          it, then confirm.
        </Text>
      </Col>
      <Col xs={24} lg={includePartner ? 12 : 24}>
        <ResultCard
          title="Client"
          participantKey="client"
          participantName={clientName}
          participant={values.client}
          onGoalChange={onGoalChange}
          onTextChange={onTextChange}
          onCheckboxChange={onCheckboxChange}
          riskGoals={riskGoals}
          getRiskGoalByValue={getRiskGoalByValue}
          CONFIRMATION_LABELS={CONFIRMATION_LABELS}
          calculateScore={calculateScore}
        />
      </Col>
      {includePartner ? (
        <Col xs={24} lg={12}>
          <ResultCard
            title="Partner"
            participantKey="partner"
            participantName={partnerName}
            participant={values.partner}
            onGoalChange={onGoalChange}
            onTextChange={onTextChange}
            onCheckboxChange={onCheckboxChange}
            riskGoals={riskGoals}
            getRiskGoalByValue={getRiskGoalByValue}
            CONFIRMATION_LABELS={CONFIRMATION_LABELS}
            calculateScore={calculateScore}
          />
        </Col>
      ) : null}

      <Col xs={24} lg={includePartner ? 12 : 24}>
        <Card
          borderd
          style={{
            background: "rgb(255, 255, 255)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 16,
            padding: "22px 24px",
            boxShadow: "rgba(0, 0, 0, 0.04) 0px 2px 8px",
            marginBottom: 32,
          }}
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 20 }}>📝</div>
            <div
              style={{
                fontFamily: "Arial",
                fontSize: 15,
                fontWeight: 700,
                color: "rgb(17, 24, 39)",
              }}
            >
              Adviser Notes
            </div>
          </div>
          <TextArea
            style={{
              width: "100%",
              border: "1.5px solid rgba(34, 197, 94, 0.35)",
              borderRadius: 10,
              padding: "12px 14px",
              fontFamily: "Arial",
              fontSize: 13,
              color: "rgb(55, 65, 81)",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              background: "rgb(250, 255, 254)",
              lineHeight: 1.7,
            }}
            readOnly={true}
            rows={4}
            value={values.client.addNoteDescription}
            placeholder="Add notes about the client's risk profile, any discussion points, clarifications or observations from the questionnaire..."
          />
        </Card>
      </Col>
      {includePartner ? (
        <Col xs={24} lg={12}>
          <Card
            borderd
            style={{
              background: "rgb(255, 255, 255)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: 16,
              padding: "22px 24px",
              boxShadow: "rgba(0, 0, 0, 0.04) 0px 2px 8px",
              marginBottom: 32,
            }}
            styles={{
              body: {
                padding: 0,
              },
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 20 }}>📝</div>
              <div
                style={{
                  fontFamily: "Arial",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "rgb(17, 24, 39)",
                }}
              >
                Adviser Notes
              </div>
            </div>
            <TextArea
              style={{
                width: "100%",
                border: "1.5px solid rgba(34, 197, 94, 0.35)",
                borderRadius: 10,
                padding: "12px 14px",
                fontFamily: "Arial",
                fontSize: 13,
                color: "rgb(55, 65, 81)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                background: "rgb(250, 255, 254)",
                lineHeight: 1.7,
              }}
              readOnly={true}
              rows={4}
              value={values.partner.addNoteDescription}
              placeholder="Add notes about the client's risk profile, any discussion points, clarifications or observations from the questionnaire..."
            />
          </Card>
        </Col>
      ) : null}
    </Row>
  );
};

export default ResultsStep;
