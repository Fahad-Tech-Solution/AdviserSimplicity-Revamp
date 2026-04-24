import {
  Alert,
  Card,
  Checkbox,
  Col,
  Progress,
  Row,
  Select,
  Space,
  Tag,
} from "antd";
import Input from "antd/es/input/Input";
import React from "react";

const { TextArea } = Input;

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
}) {
  const goalOptions = riskGoals.map((goal) => ({
    label: goal.value,
    value: goal.value,
  }));

  const selectedGoal = getRiskGoalByValue(participant?.riskGoal);
  const chart = selectedGoal?.chart || [25, 25, 25, 25];
  const chartLabels = ["Cash", "Fixed Interest", "Shares", "Property"];

  return (
    <Card bordered style={{ borderRadius: 16, height: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <h3 style={{ marginBottom: 4 }}>{participantName}</h3>
        <Tag color="green">{participant?.riskGoal || "Not Calculated"}</Tag>
      </div>

      <div style={{ marginBottom: 16 }}>
        {chart.map((value, index) => (
          <div
            key={`${participantKey}-chart-${index}`}
            style={{ marginBottom: 8 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span>{chartLabels[index]}</span>
              <span>{value}%</span>
            </div>
            <Progress percent={value} showInfo={false} strokeColor="#22c55e" />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Risk Goal</div>
        <Select
          style={{ width: "100%" }}
          options={goalOptions}
          value={participant?.riskGoal || undefined}
          onChange={(value) => onGoalChange(participantKey, value)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Description</div>
        <Alert
          type="success"
          showIcon
          message={participant?.riskDescription || "No description available"}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Adviser Note</div>
        <TextArea
          rows={4}
          value={participant?.addNoteDescription || ""}
          onChange={(event) =>
            onTextChange(
              participantKey,
              "addNoteDescription",
              event.target.value,
            )
          }
          placeholder="Add note"
        />
      </div>

      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Checkbox
          checked={participant?.happyWithResult}
          onChange={(event) =>
            onCheckboxChange(
              participantKey,
              "happyWithResult",
              event.target.checked,
            )
          }
        >
          I confirm that I am happy with this risk result.
        </Checkbox>
        {CONFIRMATION_LABELS.map((item) => (
          <Checkbox
            key={`${participantKey}-${item.key}`}
            checked={participant?.[item.key]}
            onChange={(event) =>
              onCheckboxChange(participantKey, item.key, event.target.checked)
            }
          >
            {item.label}
          </Checkbox>
        ))}
      </Space>
    </Card>
  );
}

const ResultsStepV2 = ({
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
}) => {
  return (
    <Row gutter={[16, 16]}>
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
          />
        </Col>
      ) : null}
    </Row>
  );
};

export default ResultsStepV2;
