import { useAtomValue, useSetAtom } from "jotai";
import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
} from "../../../../../store/authState";
import {
  getDiscoveryStepperRoutes,
  pathMatchesDiscoveryRoute,
} from "../../../../Routes/User.Routes";
import { Col, message, Row } from "antd";
import DiscoveryTotalsCard from "../../../../Common/DiscoveryTotalsCard.jsx";
import useApi from "../../../../../hooks/useApi.js";
import AppModal from "../../../../Common/AppModal.jsx";
import { renderModalContent } from "../../../../Common/renderModalContent.jsx";
import useTitleBlock from "../../../../../hooks/useTitleBlock.jsx";
import { toCommaAndDollar } from "../../../../../hooks/helpers.js";

const SMSF = () => {
  const location = useLocation();
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const discoveryData = useAtomValue(discoveryDataAtom);

  const headingStyle = { fontFamily: "Georgia,serif" };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const renderTitleBlock = useTitleBlock({
    titleStyle: headingStyle,
  });

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

  const visibleCards = useMemo(
    () =>
      (CurrentRoute?.Cards || []).filter((card) => {
        const isYes = discoveryQuestions[card.key] === "Yes";
        return isYes || card?.alwaysShow;
      }),
    [CurrentRoute?.Cards, discoveryQuestions],
  );

  const SMSFTotal = useMemo(() => {
    try {
      const parseNum = (val) =>
        val && typeof val === "string"
          ? parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0
          : typeof val === "number"
            ? val
            : 0;

      const pickTotal = (
        obj,
        prefer = [
          "SMSFTotal",
          "propertyPortfolio",
          "totalDebt",
          "clientTotal",
          "partnerTotal",
          "jointTotal",
        ],
      ) => {
        if (!obj || typeof obj !== "object") {
          return 0;
        }

        for (const field of prefer) {
          if (obj[field] !== undefined && obj[field] !== null) {
            return parseNum(obj[field]);
          }
        }

        return 0;
      };

      const assetKeys = [
        "SMSFBank",
        "SMSFTermDeposits",
        "SMSFAustralianShares",
        "SMSFManagedFunds",
        "SMSFInvestmentProperties",
        "SMSFOtherInvestment",
      ];

      const liabilityKeys = ["SMSFInvestmentLoan", "SMSFInvestmentProperties"];

      const assetsSum = assetKeys.reduce((acc, key) => {
        return (
          acc +
          pickTotal(
            discoveryQuestions?.[key] === "Yes" ? discoveryData?.[key] : "$0",
          )
        );
      }, 0);

      const liabilitiesSum = liabilityKeys.reduce((acc, key) => {
        return (
          acc +
          pickTotal(
            discoveryQuestions?.[key] === "Yes" ? discoveryData?.[key] : "$0",
            ["totalDebt", "SMSFTotal", "propertyPortfolio"],
          )
        );
      }, 0);

      return toCommaAndDollar(assetsSum - liabilitiesSum);
    } catch (error) {
      console.error("Error calculating SMSF totals:", error);
      return "$0";
    }
  }, [discoveryData, discoveryQuestions]);

  return (
    <div>
      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={renderTitleBlock({
          title: modalData?.title,
          icon: modalData?.icon,
        })}
        width={modalData?.width}
      >
        {renderModalContent(modalData)}
      </AppModal>

      {visibleCards.length === 0 ? (
        <div
          style={{
            minHeight: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "32px 16px",
          }}
        >
          <div>
            <span style={{ fontSize: 56, color: "#111827", marginBottom: 12 }}>
              ➕
            </span>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#475569",
                marginBottom: 8,
              }}
            >
              No items selected
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#94a3b8",
              }}
            >
              Click the + button above to add financial investments items
            </div>
          </div>
        </div>
      ) : (
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
                      card?.key === "SMSFDetails"
                        ? SMSFTotal
                        : discoveryData?.[card?.key]?.[
                            card?.firstTotalKey || "clientTotal"
                          ]
                    }
                    secondName={
                      card?.secondNameKey ||
                      discoveryData.personalDetails?.partner
                        ?.partnerPreferredName
                    }
                    secondTotal={
                      discoveryData?.[card.key]?.[
                        card?.secondTotalKey || "partnerTotal"
                      ]
                    }
                    showPartner={
                      [
                        "SMSFDetails",
                        "SMSFBank",
                        "SMSFTermDeposits",
                        "SMSFAustralianShares",
                        "SMSFManagedFunds",
                        "SMSFInvestmentLoan",
                        "SMSFInvestmentProperties",
                        "SMSFOtherInvestment",
                      ].includes(card.key)
                        ? card?.showSecondTotal
                        : card?.showSecondTotal || showPartner
                    }
                    OpenModal={() => {
                      setModalOpen(true);
                      setModalData({
                        title: [
                          "SMSFInvestmentLoan",
                          "SMSFInvestmentProperties",
                          "SMSFOtherInvestment",
                          "SMSFPensionPhase",
                        ].includes(card.key)
                          ? "SMSF_" + card.title
                          : card.title,
                        component: card.component,
                        icon: card.icon,
                        key: card.key,
                        width: card?.modalWidth || 1000,
                        closeModal: () => setModalOpen(false),
                        innerComponent: card?.innerComponent || null,
                        tableRows: card?.tableRows || 10,
                      });
                    }}
                  />
                </Col>
              );
            }
            return null;
          })}
        </Row>
      )}
    </div>
  );
};

export default SMSF;
