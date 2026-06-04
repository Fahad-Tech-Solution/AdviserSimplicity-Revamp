import { useEffect, useMemo, useState } from "react";
import {
    App as AntdApp,
    Button,
    Card,
    Col,
    Empty,
    Row,
    Skeleton,
    Space,
    Switch,
    Typography,
} from "antd";
import {
    ArrowRightOutlined,
    CheckOutlined,
    EyeOutlined,
    MinusOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ActiveDot from "../../../Common/ActiveDot";
import useApi from "../../../../hooks/useApi";

const { Text, Title } = Typography;
const headingStyle = { fontFamily: "Georgia, serif" };
const PRIMARY_GREEN = "#22c55e";

const PLATFORM_FEATURES = [
    { key: "simplicity", label: "Adviser-Simplicity", match: /simplicity/i },
    { key: "cdf", label: "CDF", match: /cdf/i },
    { key: "access", label: "Adviser-Access", match: /access/i },
    { key: "link", label: "AdviserLink", match: /link/i },
];

const TIER_LABELS = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];

const DEFAULT_DESCRIPTIONS = [
    "Essential tools for solo advisers running a small practice.",
    "Built for growing practices that need client portal access.",
    "Full suite for large advisory firms with integration needs.",
];

function toCurrency(value) {
    return Number(value || 0).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    });
}

function getYearlySavePercent(monthlyAmount, yearlyAmount) {
    const monthlyTotal = Number(monthlyAmount || 0) * 12;
    const yearlyTotal = Number(yearlyAmount || 0);
    if (!monthlyTotal || !yearlyTotal || yearlyTotal >= monthlyTotal) return 0;
    return Math.round((1 - yearlyTotal / monthlyTotal) * 100);
}

function getFeatureStates(plan, planIndex) {
    const marketingFeatures = Array.isArray(plan?.marketing_features)
        ? plan.marketing_features
        : [];

    if (!marketingFeatures.length) {
        const includedCount = [2, 3, 4][planIndex] ?? 2;
        return PLATFORM_FEATURES.map((feature, index) => ({
            ...feature,
            included: index < includedCount,
        }));
    }

    return PLATFORM_FEATURES.map((feature) => ({
        ...feature,
        included: marketingFeatures.some((item) => feature.match.test(item)),
    }));
}

function getTierLabel(plan, index) {
    return (
        plan?.metadata?.tier ||
        plan?.tier ||
        TIER_LABELS[index] ||
        "PLAN"
    ).toUpperCase();
}

function getPlanDescription(plan, index) {
    return (
        plan?.description ||
        plan?.metadata?.description ||
        DEFAULT_DESCRIPTIONS[index] ||
        ""
    );
}

function getSubscriberCount(plan) {
    const count =
        plan?.activeSubscribers ??
        plan?.active_subscribers ??
        plan?.subscriberCount ??
        plan?.subscriber_count;
    return Number.isFinite(Number(count)) ? Number(count) : null;
}

function BillingToggle({ isYearly, onChange, savePercent }) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "4px 6px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: "#fff",
            }}
        >
            <button
                type="button"
                onClick={() => onChange(false)}
                style={{
                    border: "none",
                    background: !isYearly ? PRIMARY_GREEN : "transparent",
                    color: !isYearly ? "#fff" : "#6b7280",
                    borderRadius: 999,
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                Monthly
            </button>
            <Switch checked={isYearly} onChange={() => onChange(!isYearly)} />
            <button
                type="button"
                onClick={() => onChange(true)}
                style={{
                    border: "none",
                    background: isYearly ? PRIMARY_GREEN : "transparent",
                    color: isYearly ? "#fff" : "#6b7280",
                    borderRadius: 999,
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                Yearly
                {savePercent > 0 ? (
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: isYearly ? "rgba(255,255,255,0.25)" : "#f0fdf4",
                            color: isYearly ? "#fff" : PRIMARY_GREEN,
                            border: isYearly ? "none" : `1px solid rgb(187, 247, 208)`,
                        }}
                    >
                        Save {savePercent}%
                    </span>
                ) : null}
            </button>
        </div>
    );
}

function PlanCard({
    plan,
    planIndex,
    isYearly,
    isPopular,
    onSubscribe,
    subscribingPriceId,
}) {
    const prices = Array.isArray(plan?.prices) ? plan.prices : [];
    const monthlyPrice = prices.find((p) => p.interval === "month");
    const yearlyPrice = prices.find((p) => p.interval === "year");
    const activePrice = isYearly ? yearlyPrice : monthlyPrice;
    const featureStates = getFeatureStates(plan, planIndex);
    const subscriberCount = getSubscriberCount(plan);

    return (
        <Card
            style={{
                width: "100%",
                height: "100%",
                borderRadius: 14,
                border: isPopular
                    ? `2px solid ${PRIMARY_GREEN}`
                    : "1px solid #e5e7eb",
                boxShadow: isPopular
                    ? "0 12px 32px rgba(34, 197, 94, 0.12)"
                    : "0 8px 24px rgba(15, 23, 42, 0.05)",
                position: "relative",
                overflow: "visible",
            }}
            styles={{
                body: {
                    padding: "28px 22px 22px",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                },
            }}
        >
            {isPopular ? (
                <div
                    style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: PRIMARY_GREEN,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "1.5px",
                        padding: "4px 14px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                    }}
                >
                    MOST POPULAR
                </div>
            ) : null}

            <Text
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "2px",
                    color: PRIMARY_GREEN,
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                }}
            >
                {getTierLabel(plan, planIndex)}
            </Text>

            <Title
                level={4}
                style={{
                    ...headingStyle,
                    margin: "0 0 8px",
                    fontWeight: 600,
                    fontSize: 22,
                }}
            >
                {plan?.name || "Plan"}
            </Title>

            <Text
                style={{
                    display: "block",
                    fontSize: 13,
                    color: "#6b7280",
                    lineHeight: 1.5,
                    marginBottom: 18,
                    minHeight: 40,
                }}
            >
                {getPlanDescription(plan, planIndex)}
            </Text>

            <div style={{ marginBottom: 20 }}>
                <Title
                    level={2}
                    style={{
                        margin: 0,
                        fontFamily: "Georgia, serif",
                        fontWeight: 500,
                        fontSize: 32,
                        display: "inline",
                    }}
                >
                    {activePrice ? toCurrency(activePrice.amount) : "—"}
                </Title>
                <Text style={{ fontSize: 14, color: "#9ca3af", marginLeft: 4 }}>
                    /{isYearly ? "yr" : "mo"}
                </Text>
            </div>

            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 20px",
                    flex: 1,
                }}
            >
                {featureStates.map((feature) => (
                    <li
                        key={feature.key}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                            fontSize: 13,
                        }}
                    >
                        {feature.included ? (
                            <CheckOutlined style={{ color: PRIMARY_GREEN, fontSize: 14 }} />
                        ) : (
                            <MinusOutlined style={{ color: "#d1d5db", fontSize: 14 }} />
                        )}
                        <Text
                            style={{
                                color: feature.included ? "#374151" : "#d1d5db",
                                fontWeight: feature.included ? 500 : 400,
                            }}
                        >
                            {feature.label}
                        </Text>
                    </li>
                ))}
            </ul>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    fontSize: 12,
                    color: "#6b7280",
                }}
            >
                <ActiveDot size={7} marginRight={0} />
                <span>
                    {subscriberCount !== null
                        ? `${subscriberCount} active subscriber${subscriberCount === 1 ? "" : "s"}`
                        : "— active subscribers"}
                </span>
            </div>

            <Button
                type="primary"
                block
                size="large"
                icon={<ArrowRightOutlined />}
                disabled={!activePrice?.price_id}
                loading={subscribingPriceId === activePrice?.price_id}
                onClick={() => activePrice?.price_id && onSubscribe(activePrice.price_id)}
                style={{
                    borderRadius: 8,
                    fontWeight: 700,
                    height: 44,
                    background: PRIMARY_GREEN,
                    borderColor: PRIMARY_GREEN,
                }}
            >
                Subscribe
            </Button>
        </Card>
    );
}

export default function SuperAdminPricingTablePage() {
    const { message } = AntdApp.useApp();
    const api = useApi();
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [isYearly, setIsYearly] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [subscribingPriceId, setSubscribingPriceId] = useState("");

    const fetchPricingPlans = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/api/products-with-prices");
            setPlans(Array.isArray(res?.products) ? res.products : []);
        } catch (err) {
            setPlans([]);
            message.error(
                err?.response?.data?.message || "Failed to load subscription plans.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPricingPlans();
    }, []);

    const maxYearlySavePercent = useMemo(() => {
        let max = 0;
        plans.forEach((plan) => {
            const prices = Array.isArray(plan?.prices) ? plan.prices : [];
            const monthly = prices.find((p) => p.interval === "month");
            const yearly = prices.find((p) => p.interval === "year");
            const percent = getYearlySavePercent(monthly?.amount, yearly?.amount);
            if (percent > max) max = percent;
        });
        return max;
    }, [plans]);

    const popularPlanIndex = useMemo(() => {
        const flagged = plans.findIndex(
            (p) => p?.metadata?.popular === true || p?.mostPopular === true,
        );
        if (flagged >= 0) return flagged;
        return plans.length >= 2 ? 1 : -1;
    }, [plans]);

    const handleSubscribe = async (priceId) => {
        try {
            setSubscribingPriceId(priceId);
            message.info("Opening adviser checkout preview…");
            navigate("/pricing-table");
        } finally {
            setSubscribingPriceId("");
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "calc(100vh - 32px)",
                padding: "12px 4px 24px",
            }}
        >
            <Text
                style={{
                    fontFamily: "Arial, serif",
                    fontWeight: 700,
                    letterSpacing: "3px",
                    fontSize: "11px",
                    color: PRIMARY_GREEN,
                }}
            >
                ADMIN
            </Text>

            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginTop: 8,
                    marginBottom: 24,
                }}
            >
                <div style={{ maxWidth: 640 }}>
                    <Title
                        level={3}
                        style={{ ...headingStyle, margin: 0, fontWeight: 500 }}
                    >
                        Subscription Plans
                    </Title>
                    <Text
                        style={{
                            display: "block",
                            fontSize: 12,
                            color: "#6b7280",
                            fontFamily: "Arial, sans-serif",
                            marginTop: 6,
                            lineHeight: 1.6,
                        }}
                    >
                        Manage the plans advisers can subscribe to. Edit pricing or features,
                        view who&apos;s subscribed to each tier, and add new plans as your
                        product evolves.
                    </Text>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                    marginBottom: 28,
                }}
            >
                <BillingToggle
                    isYearly={isYearly}
                    onChange={setIsYearly}
                    savePercent={maxYearlySavePercent || 17}
                />

                <Space wrap>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => navigate("/pricing-table")}
                        style={{
                            borderRadius: 8,
                            fontWeight: 600,
                            height: 40,
                            borderColor: "#111827",
                            color: "#111827",
                        }}
                    >
                        Preview as adviser
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => message.info("Add plan — coming soon")}
                        style={{
                            borderRadius: 8,
                            fontWeight: 700,
                            height: 40,
                            background: PRIMARY_GREEN,
                            borderColor: PRIMARY_GREEN,
                        }}
                    >
                        Add Plan
                    </Button>
                </Space>
            </div>

            {isLoading ? (
                <Row gutter={[20, 20]}>
                    {[1, 2, 3].map((key) => (
                        <Col key={key} xs={24} md={12} xl={8}>
                            <Card style={{ borderRadius: 14 }}>
                                <Skeleton active paragraph={{ rows: 8 }} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : !plans.length ? (
                <Empty description="No subscription plans found." />
            ) : (
                <Row gutter={[20, 28]} align="stretch">
                    {plans.map((plan, index) => (
                        <Col
                            key={plan?.id || plan?.name || index}
                            xs={24}
                            md={12}
                            xl={8}
                            style={{ display: "flex" }}
                        >
                            <PlanCard
                                plan={plan}
                                planIndex={index}
                                isYearly={isYearly}
                                isPopular={index === popularPlanIndex}
                                onSubscribe={handleSubscribe}
                                subscribingPriceId={subscribingPriceId}
                            />
                        </Col>
                    ))}
                </Row>
            )}

            <div
                style={{
                    marginTop: 32,
                    padding: "18px 22px",
                    borderRadius: 12,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        maxWidth: 520,
                    }}
                >
                    <span style={{ fontSize: 18 }} aria-hidden>
                        🔒
                    </span>
                    <Text style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                        Payments are 100% secure. Handled by Stripe with PCI-DSS compliance.
                        Advisers can change or cancel anytime.
                    </Text>
                </div>

                <Space wrap size={8}>
                    {["Credit / Debit", "Apple Pay", "Google Pay"].map((method) => (
                        <span
                            key={method}
                            style={{
                                padding: "6px 14px",
                                borderRadius: 999,
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#6b7280",
                            }}
                        >
                            {method}
                        </span>
                    ))}
                </Space>
            </div>
        </div>
    );
}
