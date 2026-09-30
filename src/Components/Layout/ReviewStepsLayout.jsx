import { CheckOutlined } from "@ant-design/icons";
import { Button, Col, Divider, Form, message, Row, Space, Spin, Typography } from "antd";
import { useAtom, useAtomValue } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { addReviewSectionsModalOpen, clientReviewQuestion, SelectedReview, SelectedReviewAllData } from "../../store/authState";
import {
    getReviewStepperRoutes,
    matchReviewRoute,
    pathMatchesReviewRoute,
} from "../Routes/User.Routes.jsx";
import { verifyPersonalDetailsFilled } from "../../hooks/helpers.js";
import useApi from "../../hooks/useApi.js";

const { Text, Title } = Typography;

const PRIMARY_GREEN = "#22c55e";
const MUTED = "#9ca3af";
const LINE = "#e5e7eb";


function ReviewStepper({ pathname, visibleRoutes, onNavigate }) {
    const activeIndex = visibleRoutes.findIndex((r) =>
        pathMatchesReviewRoute(pathname, r)
    );
    const current = activeIndex >= 0 ? activeIndex : -1;

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
                {visibleRoutes.map((route, index) => {
                    const active = index === current;
                    const completed = index < current;
                    const icon = route.stepIcon ?? "•";
                    const label = route.stepTitle ?? route.key;

                    return (
                        <div
                            key={route.key}
                            style={{
                                flex: "1 1 56px",
                                minWidth: 52,
                                maxWidth: 120,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "5px 2px",
                                cursor: "pointer",
                            }}
                            onClick={() => onNavigate(route.key)}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: active || completed ? PRIMARY_GREEN : "#fff",
                                    border:
                                        active || completed
                                            ? `2px solid ${PRIMARY_GREEN}`
                                            : `2px solid ${LINE}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 13,
                                    lineHeight: 1,
                                    boxShadow: active
                                        ? "0 0 0 4px rgba(34, 197, 94, .15)"
                                        : "none",
                                }}
                            >
                                {completed ? (
                                    <CheckOutlined style={{ color: "#fff", fontSize: 15 }} />
                                ) : (
                                    <span style={{ opacity: active ? 1 : 0.75 }}>{icon}</span>
                                )}
                            </div>
                            <Text
                                style={{
                                    marginTop: 8,
                                    fontSize: 9,
                                    lineHeight: 1.2,
                                    textAlign: "center",
                                    color: active || completed ? PRIMARY_GREEN : MUTED,
                                    fontWeight: active || completed ? 700 : 400,
                                    display: "block",
                                }}
                            >
                                {label}
                            </Text>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}



const ReviewStepsLayout = () => {
    const [form] = Form.useForm();
    const location = useLocation();
    const navigate = useNavigate();
    const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useAtom(addReviewSectionsModalOpen);
    const [reviewQuestion, setReviewQuestion] = useAtom(clientReviewQuestion);
    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData)


    const [loading, setLoading] = useState(false)
    const selectedReview = useAtomValue(SelectedReview);
    const formValues = form.getFieldsValue();
    let { get } = useApi();

    // 1. Get dynamically filtered stepper routes based on condition functions
    const stepperRoutes = useMemo(
        () => getReviewStepperRoutes(reviewQuestion),
        [reviewQuestion]
    );

    const matched = matchReviewRoute(location.pathname, reviewQuestion);
    const pageTitle = matched?.stepTitle ?? "Review";
    const showSteps = matched?.noReviewLayout || false

    const handleStepNavigate = (key) => {
        // Intercept "Add Section" click to open modal instead of routing
        if (key === "/user/review-routes/add-section") {

            if (verifyPersonalDetailsFilled(selectedReviewAllData)) {
                setIsAddSectionModalOpen(true);
                return;
            }
            else {
                message.error(`Please complete client details first.`);
                return;
            }
        }
        navigate(key);
    };

    useEffect(() => {
        if (selectedReview?._id) {
            fetchFullData();
        }
    }, [selectedReview])

    const fetchFullData = async () => {
        try {
            setLoading(true);
            let res = await get('reviewScenario/fullDetails/' + selectedReview?._id);
            if (res?.data) {
                setSelectedReviewAllData(res.data);
                setReviewQuestion(res?.data?.reviewGoalQuestions || {});
            }
        }
        catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Some error accrued Please try later`,
            );
        }
        finally {
            setLoading(false);
        }


    }


    return (
        <div style={{ maxWidth: 1100, margin: "21px auto", padding: "0 0 24px" }}>
            {!showSteps && (
                <>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 16,
                            marginBottom: 18,
                            marginTop: 18,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <Text
                                style={{
                                    display: "block",
                                    fontSize: 11,
                                    letterSpacing: 3,
                                    color: PRIMARY_GREEN,
                                    textTransform: "uppercase",
                                    marginBottom: 6,
                                    fontWeight: 400,
                                }}
                            >
                                ANNUAL REVIEW
                            </Text>
                            <Title
                                style={{
                                    margin: 0,
                                    fontFamily: "Georgia,serif",
                                    fontWeight: 500,
                                    fontSize: 28,
                                }}
                            >
                                {pageTitle}
                            </Title>
                        </div>
                        <div>
                            <Space size={10}>
                                📅 Date: <Text>10/10/2026</Text>
                            </Space>
                        </div>
                    </div>

                    {/* Horizontal Stepper */}

                    <ReviewStepper
                        pathname={location.pathname}
                        visibleRoutes={stepperRoutes.filter((r) => !r.noReviewLayout)}
                        onNavigate={handleStepNavigate}
                    />
                </>

            )}
            {loading ?
                <div style={{
                    minHeight: "70vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <Spin size="large" />
                </div>
                :
                <>
                    {/* Renders the current step page component dynamically */}
                    <Outlet />
                </>
            }

        </div>
    );
};

export default ReviewStepsLayout;