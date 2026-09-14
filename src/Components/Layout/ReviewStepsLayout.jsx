import { CheckOutlined } from "@ant-design/icons";
import { Button, Col, Divider, Form, Row, Space, Typography } from "antd";
import { useAtomValue } from "jotai";
import React, { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clientReviewQuestion } from "../../store/authState";
import {
    getReviewStepperRoutes,
    matchReviewRoute,
    pathMatchesReviewRoute,
} from "../Routes/User.Routes.jsx";
import AppModal from "../Common/AppModal.jsx";
import FormItem from "antd/es/form/FormItem/index.js";
import AdviceGoalCard from "../Common/AdviceGoalCard.jsx";

const { Text, Title } = Typography;

const PRIMARY_GREEN = "#22c55e";
const MUTED = "#9ca3af";
const LINE = "#e5e7eb";

const selectedSections = [
    {
        icon: "🐷",
        title: "Super Projection",
        key: 'superProjection'
    },
    {
        icon: "💸",
        title: "Retirement Adequacy",
        key: 'retirementAdequacy'
    },
    {
        icon: "🏛️",
        title: "Age Pension Assessment",
        key: 'agePensionAssessment'
    },
    {
        icon: "🏡",
        title: "Loan Simulator",
        key: 'loanSimulator'
    },
    {
        icon: "🛡️",
        title: "Insurance Needs",
        key: 'insuranceNeeds'
    },
    {
        icon: "🧾",
        title: "Tax Planning",
        key: 'taxPlanning'
    },
]

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
    const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState();
    const reviewQuestion = useAtomValue(clientReviewQuestion);

    const formValues = form.getFieldsValue();
    const enabledCount = Object.values(formValues).filter(
        (val) => val === "Yes"
    ).length;
    const totalCount = Object.keys(formValues).length;


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
            setIsAddSectionModalOpen(true);
            return;
        }
        navigate(key);
    };

    const onFinish = async() => {
        
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

            {/* Renders the current step page component dynamically */}
            <Outlet />

            {/* Add Section Modal */}
            <AppModal
                open={isAddSectionModalOpen}
                onClose={() => setIsAddSectionModalOpen(false)}
                width={"800px"}
            >
                <Form
                    form={form}
                    initialValues={reviewQuestion}
                    onFinish={onFinish}
                >
                    <div className="mb-3">
                        <Title style={{
                            fontSize: "22px",
                            margin: "0px",
                            padding: "0px"
                        }}>
                            Add Section
                        </Title>
                        <Text>
                            Choose which calculators appear in this review. Hidden ones won't appear in the sidebar or stepper.
                        </Text>
                    </div>

                    <Row gutter={[16, 16]}>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues !== currentValues}
                        >
                            {() =>
                                selectedSections.map((section) => {
                                    const currentStatus = form.getFieldValue(section.key) || "No";

                                    return (
                                        <Col md={8} key={section.key}>
                                            <AdviceGoalCard
                                                label={section.title}
                                                Icon={section.icon}
                                                status={currentStatus}
                                                info={section.info}
                                                onClick={() => {
                                                    form.setFieldValue(
                                                        section.key,
                                                        currentStatus === "Yes" ? "No" : "Yes"
                                                    );
                                                }}
                                            />
                                        </Col>
                                    );
                                })
                            }
                        </Form.Item>
                    </Row>

                    <Divider />

                    {/* Dynamic Footer with Live Reactive Counts */}
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues !== currentValues}
                    >
                        {() => {
                            // Pass true to get all store values (including initialValues)
                            const formValues = form.getFieldsValue(true);
                            const enabledCount = Object.values(formValues).filter((val) => val === "Yes").length;
                            const totalCount = Object.keys(formValues).length;

                            return (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        width: "100%",
                                    }}
                                >
                                    <Text onClick={() => { console.log(formValues) }}>
                                        {enabledCount} of {totalCount} sections enabled
                                    </Text>

                                    <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                                        <Button
                                            onClick={() => {
                                                const isAllSelected = Object.values(formValues).every((val) => val === "Yes");
                                                const targetValue = isAllSelected ? "No" : "Yes";

                                                const updatedValues = {};
                                                Object.keys(formValues).forEach((key) => {
                                                    updatedValues[key] = targetValue;
                                                });

                                                form.setFieldsValue(updatedValues);
                                            }}
                                        >
                                            {Object.values(formValues).every((val) => val === "Yes") ? "Unselect all" : "Select all"}
                                        </Button>
                                        <Button type="primary" onClick={() => form.submit()}>
                                            Save and Exit
                                        </Button>
                                    </div>
                                </div>
                            );
                        }}
                    </Form.Item>
                </Form>
            </AppModal>
        </div>
    );
};

export default ReviewStepsLayout;