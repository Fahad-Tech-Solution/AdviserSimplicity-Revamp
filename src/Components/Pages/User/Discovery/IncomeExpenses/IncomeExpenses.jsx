import { useAtomValue } from "jotai";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
} from "../../../../../store/authState";
import {
  getDiscoveryStepperRoutes,
  pathMatchesDiscoveryRoute,
} from "../../../../Routes/User.Routes";
import { Col, Row } from "antd";
import DiscoveryTotalsCard from "../../../../Common/DiscoveryTotalsCard.jsx";

const IncomeExpenses = () => {
  const location = useLocation();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const discoveryData = useAtomValue(discoveryDataAtom);

  const stepperRoutes = useMemo(
    () => getDiscoveryStepperRoutes(discoveryQuestions),
    [discoveryQuestions],
  );

  const CurrentRoute = useMemo(
    () =>
      stepperRoutes.find((r) =>
        pathMatchesDiscoveryRoute(location.pathname, r),
      ),
    [location.pathname, stepperRoutes],
  );

  const showPartner = !["Single", "Widowed"].includes(
    discoveryData.personalDetails?.client?.clientMaritalStatus,
  );

  return (
    <div>
      <Row gutter={[16, 16]}>
        {CurrentRoute?.Cards?.map((card) => {
          const isYes = discoveryQuestions[card.key] === "Yes";
          if (isYes || card?.alwaysShow) {
            return (
              <Col key={card.key} xs={24} sm={12} md={8} lg={6}>
                <DiscoveryTotalsCard
                  title={card.title}
                  icon={card.icon}
                  firstName={
                    card?.firstNameKey ||
                    discoveryData.personalDetails?.client?.clientPreferredName
                  }
                  firstTotal={
                    discoveryData?.[card.key == "incomeFromRegularLivingExpenses" ? "generalLivingExpenses" : card.key]?.[
                      card?.firstTotalKey || "clientTotal"
                    ]
                  }
                  secondName={
                    card?.secondNameKey ||
                    discoveryData.personalDetails?.partner?.partnerPreferredName
                  }
                  secondTotal={
                    discoveryData?.[card.key == "incomeFromRegularLivingExpenses" ? "retirementLivingExpenses" : card.key]?.[
                      card?.secondTotalKey || "partnerTotal"
                    ]
                  }
                  showPartner={card?.showSecondTotal || showPartner}
                  secondisFormInput={card?.secondisFormInput}
                />
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
