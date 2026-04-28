import { Button, Col, Row } from "antd";
import React, { useMemo, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import AppModal from "../../../../Common/AppModal";
import { renderModalContent } from "../../../../Common/renderModalContent";
import GoalsObjectivesQuestionsModal from "./GoalsObjectivesQuestionsModal";
import {
  getDiscoveryStepperRoutes,
  pathMatchesDiscoveryRoute,
} from "../../../../Routes/User.Routes";
import { useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import {
  goalsDataAtom,
  goalsSectionQuestionsAtom,
} from "../../../../../store/authState";
import DiscoveryTotalsCard from "../../../../Common/DiscoveryTotalsCard";
import GoalsFromModal from "./GoalsFromModal";
import useTitleBlock from "../../../../../hooks/useTitleBlock";
const PRIMARY_GREEN = "#22c55e";
const DISCOVERY_ADD_BUTTON_STYLE = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: PRIMARY_GREEN,
  borderColor: PRIMARY_GREEN,
  boxShadow: "0 8px 18px rgba(34, 197, 94, 0.28)",
};

function hasSectionData(value) {
  if (!value) return false;
  if (typeof value !== "object") return Boolean(value);
  if (value._id) return true;
  return Object.keys(value).length > 0;
}

const GoalsObjectives = () => {
  const location = useLocation();
  const renderTitleBlock = useTitleBlock({
    titleStyle: {
      fontFamily: "Georgia,serif",
    },
  });

  const [goalsQuestions, setGoalsQuestions] = useAtom(
    goalsSectionQuestionsAtom,
  );
  const [goalsData, setGoalsData] = useAtom(goalsDataAtom);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const discoveryRoutes = useMemo(
    () => getDiscoveryStepperRoutes(goalsQuestions),
    [goalsQuestions],
  );

  const CurrentRoute = useMemo(
    () =>
      discoveryRoutes.find((r) =>
        pathMatchesDiscoveryRoute(location.pathname, r),
      ),
    [location.pathname, discoveryRoutes],
  );

  const visibleCards = useMemo(() => {
    const allSections = (CurrentRoute?.Cards || []).flatMap((card) =>
      [...(card.sections || [])].sort((left, right) => {
        const leftHasData = hasSectionData(goalsData?.[left.key]);
        const rightHasData = hasSectionData(goalsData?.[right.key]);

        if (leftHasData === rightHasData) {
          return 0;
        }

        return leftHasData ? -1 : 1;
      }),
    );

    return allSections.filter(
      (section) => goalsQuestions?.[section.key] === "Yes",
    );
  }, [CurrentRoute?.Cards, goalsData, goalsQuestions]);

  return (
    <div>
      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalData?.icon
            ? renderTitleBlock({
                title: modalData?.title,
                icon: modalData?.icon,
              })
            : modalData?.title
        }
        width={modalData?.width}
      >
        {renderModalContent(modalData)}
      </AppModal>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Button
          type="primary"
          shape="circle"
          onClick={() => {
            setModalOpen(true);
            setModalData({
              key: "GoalsObjectives",
              title: "Goals and Objectives",
              width: "800px",
              component: <GoalsObjectivesQuestionsModal />,
              cards: CurrentRoute?.Cards || [],
            });
          }}
          style={DISCOVERY_ADD_BUTTON_STYLE}
        >
          <PlusOutlined style={{ fontSize: 18, fontWeight: 700 }} />
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {visibleCards.map((card) => {
          return (
            <Col key={card.key} xs={24} sm={12} md={8} lg={6}>
              <DiscoveryTotalsCard
                title={card.title}
                icon={card.icon}
                cardHeight={"270px"}
                firstName="Scope"
                firstTotal={goalsData[card.key]?.scopeOfAdvice || 0}
                secondName="Amount"
                secondTotal={goalsData[card.key]?.estimatedValue || 0}
                showPartner={true}
                firstPlaceholder="Scope"
                OpenModal={() => {
                  setModalOpen(true);
                  setModalData({
                    title: card.title,
                    component: <GoalsFromModal />,
                    icon: card.icon,
                    key: card.key,
                    cardData: card,
                    width: "580px",
                    closeModal: () => setModalOpen(false),
                  });
                }}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default GoalsObjectives;
