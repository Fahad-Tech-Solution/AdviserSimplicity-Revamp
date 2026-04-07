import { useAtomValue } from "jotai";
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
} from "../../../../../store/authState";
import {
  getDiscoveryStepperRoutes,
  pathMatchesDiscoveryRoute,
} from "../../../../Routes/User.Routes";
import { Card, Col, Input, Row, Typography } from "antd";
import { GoArrowUpRight } from "react-icons/go";

const IncomeExpenses = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const [ModalOpen, setModalOpen] = useState(false);

  const { Title } = Typography;

  const stepperRoutes = useMemo(
    () => getDiscoveryStepperRoutes(discoveryQuestions),
    [discoveryQuestions],
  );

  const CurrentRoute = useMemo(
    () =>
      stepperRoutes.find((r) =>
        pathMatchesDiscoveryRoute(location.pathname, r),
      ),
    [discoveryQuestions],
  );

  return (
    <div>
      <Row gutter={[16, 16]}>
        {CurrentRoute?.Cards?.map((card) => {
          const isYes = discoveryQuestions[card.key] === "Yes";
          if (isYes) {
            return (
              <Col key={card.key} xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 2px 12px rgba(0, 0, 0, .05)",
                  }}
                  styles={{
                    body: {
                      padding: "24px 16px 18px",
                      minHeight: "220px",
                    },
                  }}
                >
                  <h6
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "Arial, sans-serif",
                      textAlign: "center",
                    }}
                  >
                    {card.title}
                  </h6>
                  <p
                    style={{
                      fontSize: 44,
                      fontWeight: 700,
                      textAlign: "center",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    {card.icon}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "5px",
                        background: "#22c55e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        marginBottom: "6px",
                        color: "#fff",
                        boxShadow: "0 2px 6px rgba(34, 197, 94, .3)",
                      }}
                    >
                      <GoArrowUpRight />
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 400,
                        fontFamily: "Arial, sans-serif",
                        textAlign: "center",
                        color: "#6b7280",
                        marginBottom: "5px",
                      }}
                    >
                      {discoveryData.personalDetails?.client
                        ?.clientPreferredName || "N/A"}
                    </p>
                    <div>
                      <Input
                        placeholder="$0"
                        size="small"
                        style={{
                          textAlign: "center",
                          borderColor: "rgba(0, 0, 0, .1)",
                          borderRadius: "6px",
                          fontSize: 12,
                          padding: "5px 10px",
                          fontFamily: "Georgia,serif",
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            );
          }
          return null;
        })}
      </Row>
    </div>
  );
};

export default IncomeExpenses;
