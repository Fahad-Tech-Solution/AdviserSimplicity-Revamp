import { Alert, Card, Col, Radio, Row, Space } from "antd";
import React from "react";

const QuestionStep = ({
  step,
  values,
  includePartner,
  clientName,
  partnerName,
  onAnswerChange,
}) => {
  const participantCards = [
    { key: "client", name: clientName || "Client" },
    ...(includePartner
      ? [{ key: "partner", name: partnerName || "Partner" }]
      : []),
  ];

  return (
    <div>
      <div
        className="d-flex justify-content-start align-items-start border"
        style={{
          gap: 20,
          marginBottom: 32,
          padding: "20px 24px",
          background: "rgb(249, 250, 251)",
          borderRadius: 12,
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            fontSize: 56,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {step.icon}
        </div>
        <p
          style={{
            fontSize: 15,
            fontFamily: "Arial",
            fontWeight: 600,
            color: "rgb(17, 24, 39)",
            lineHeight: 1.6,
          }}
        >
          {step.question}
        </p>
      </div>
      <Row gutter={[16, 16]}>
        {participantCards.map((participant) => (
          <Col xs={24} lg={24} key={participant.key}>
            <div>
              <Row style={{ marginBottom: 14 }}>
                <Col md={24}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "Arial",
                      color: "rgb(17, 24, 39)",
                    }}
                    className="d-flex align-items-center justify-content-start"
                  >
                    {participant.key === "client" ? "🧑" : "👥"}
                    &nbsp;
                    {participant.name}
                    {values?.[participant.key]?.[step.key] !== null && (
                      <div
                        className="ms-auto "
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "Arial",
                          color: "rgb(22, 163, 74)",
                          borderRadius: 99,
                          border: "1px solid rgb(187, 247, 208)",
                          background: "rgb(240, 253, 244)",
                          padding: "0px 10px",
                        }}
                      >
                        + {values?.[participant.key]?.[step.key] + 1} pts
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
              <Radio.Group
                value={values?.[participant.key]?.[step.key]}
                onChange={(event) =>
                  onAnswerChange(participant.key, step.key, event.target.value)
                }
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {step.choices.map((choice, index) => (
                    <Radio
                      key={`${participant.key}-${step.key}-${index}`}
                      value={index}
                      style={{
                        fontSize: 14,
                        fontWeight: 400,
                        fontFamily: "Arial",
                        color: "rgb(17, 24, 39)",
                        border:
                          values?.[participant.key]?.[step.key] === index
                            ? "1.5px solid #22C55E"
                            : "1.5px solid rgb(229, 231, 235)",
                        background:
                          values?.[participant.key]?.[step.key] === index
                            ? "rgb(23 163 74 / 0.08)"
                            : "#ffffff",
                        width: "100%",
                        display: "flex",
                        alignItems: "start",
                        justifyContent: "start",
                        gap: 12,
                        padding: "10px 0px 10px 14px",
                        cursor: "pointer",
                        borderRadius: 10,
                      }}
                      styles={{
                        label: {
                          width: "100%",
                        },
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 12,
                          width: "100%",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>{choice}</div>

                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "Arial",
                            color:
                              values?.[participant.key]?.[step.key] === index
                                ? "#22C55E"
                                : "rgb(156, 163, 175)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {index + 1} pts
                        </div>
                      </div>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default QuestionStep;
