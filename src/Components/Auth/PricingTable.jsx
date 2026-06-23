import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Switch,
  Tag,
  Typography,
} from "antd";
import { ArrowRightOutlined, CheckOutlined } from "@ant-design/icons";
import { useAtomValue } from "jotai";
import { useLocation, useNavigate } from "react-router-dom";
import useApi from "../../hooks/useApi";
import useAuthSession from "../../hooks/useAuthSession";
import { loggedInUser } from "../../store/authState";

const { Title, Text } = Typography;
const headingStyle = { fontFamily: "Georgia,serif" };

function toCurrency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function getDiscountLabel(monthlyTotal, yearlyTotal) {
  if (!monthlyTotal || !yearlyTotal || yearlyTotal >= monthlyTotal) return "";
  return `Save ${toCurrency(monthlyTotal - yearlyTotal)} vs monthly`;
}

export default function PricingTable() {
  const { message } = AntdApp.useApp();
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAtomValue(loggedInUser);
  const { fetchSession, clearSession } = useAuthSession();

  const [plans, setPlans] = useState([]);
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState("loading");
  const [subscribingPriceId, setSubscribingPriceId] = useState("");
  const [hasPurchasedSubscription, setHasPurchasedSubscription] =
    useState(false);

  const email = session?.email || session?.user?.email || "";
  const blockedFromCurrentPath = useMemo(
    () => location.pathname.includes("/super/admin"),
    [location.pathname],
  );

  const fetchPricingPlans = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/products-with-prices");
      setPlans(Array.isArray(res?.products) ? res.products : []);
      setHasPurchasedSubscription(Boolean(res?.hasPurchasedSubscription));
    } catch (err) {
      setPlans([]);
      message.error(
        err?.response?.data?.message || "Failed to load pricing plans.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      setAuthStatus("loading");
      const result = await fetchSession();

      if (!cancelled) {
        setAuthStatus(result.ok ? "authenticated" : "unauthenticated");
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [fetchSession]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      setAuthStatus("unauthenticated");
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [clearSession]);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const handleSubscribe = async (priceId) => {
    try {
      if (!email) {
        message.warning("Please login before subscribing.");
        navigate("/auth/login", {
          state: { from: { pathname: "/pricing-table" } },
        });
        return;
      }

      if (blockedFromCurrentPath) {
        message.error("Subscription is not allowed from this section.");
        return;
      }

      setSubscribingPriceId(priceId);
      const successStatus = hasPurchasedSubscription ? "renew" : "success";

      const res = await api.post("/api/create-checkout-session", {
        priceId,
        email,
        successUrl: `${window.location.origin}/#/auth/stripe-redirect?status=${successStatus}`,
        cancelUrl: `${window.location.origin}/#/auth/stripe-redirect?status=cancel`,
      });

      if (!res?.checkoutUrl) {
        throw new Error("No checkout URL returned by server.");
      }

      window.location.href = res.checkoutUrl;
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to start checkout.",
      );
    } finally {
      setSubscribingPriceId("");
    }
  };

  if (isLoading || authStatus === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "40px 16px",
          background: "#f8fafc",
        }}
      >
        <Row gutter={[20, 20]} justify="center">
          {[1, 2, 3].map((key) => (
            <Col key={key} xs={24} sm={12} lg={8}>
              <Card style={{ borderRadius: 20 }}>
                <Skeleton.Image active style={{ width: "100%", height: 190 }} />
                <Skeleton
                  active
                  title
                  paragraph={{ rows: 6 }}
                  style={{ marginTop: 18 }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          padding: 16,
        }}
      >
        <Empty description="No pricing plans found." />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 16px 56px",
        background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Text
            style={{
              display: "block",
              color: "#22c55e",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 3,
              marginBottom: 10,
            }}
          >
            SUBSCRIPTIONS
          </Text>
          <Title level={2} style={{ ...headingStyle, marginBottom: 8 }}>
            Choose the plan that fits your practice
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Compare available plans, switch between monthly and yearly billing,
            and start checkout securely with Stripe.
          </Text>
        </div>

        {!email ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: 14 }}
            message="Login recommended"
            description="You can browse plans now, but you will need to login before starting a subscription."
          />
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <Text strong style={{ color: !isYearly ? "#22c55e" : "#6b7280" }}>
            Monthly
          </Text>
          <Switch checked={isYearly} onChange={setIsYearly} />
          <Text strong style={{ color: isYearly ? "#22c55e" : "#6b7280" }}>
            Yearly
          </Text>
        </div>

        <Row gutter={[20, 20]} justify="center" align="stretch">
          {plans.map((plan, index) => {
            const prices = Array.isArray(plan?.prices) ? plan.prices : [];
            const monthlyPrice = prices.find(
              (price) => price.interval === "month",
            );
            const yearlyPrice = prices.find(
              (price) => price.interval === "year",
            );
            const activePrice = isYearly ? yearlyPrice : monthlyPrice;
            const monthlyTotal = Number(monthlyPrice?.amount || 0) * 12;
            const yearlyTotal = Number(yearlyPrice?.amount || 0);
            const discountLabel = getDiscountLabel(monthlyTotal, yearlyTotal);
            const isPopular = index === 1;

            return (
              <Col
                key={plan?.id || plan?.name || index}
                xs={24}
                md={12}
                xl={8}
                style={{ display: "flex" }}
              >
                <Card
                  style={{
                    width: "100%",
                    borderRadius: 22,
                    border: isPopular
                      ? "1px solid rgba(34, 197, 94, 0.35)"
                      : "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: isPopular
                      ? "0 20px 50px rgba(34, 197, 94, 0.12)"
                      : "0 14px 40px rgba(15, 23, 42, 0.06)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                  styles={{
                    body: {
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    },
                  }}
                >
                  {isPopular ? (
                    <Tag
                      color="green"
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        borderRadius: 999,
                        paddingInline: 12,
                        paddingBlock: 4,
                      }}
                    >
                      Popular
                    </Tag>
                  ) : null}

                  {plan?.images?.[0] ? (
                    <div
                      style={{
                        height: 190,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 18,
                        borderRadius: 18,
                        background: "#f8fafc",
                        padding: 18,
                      }}
                    >
                      <img
                        src={plan.images[0]}
                        alt={plan?.name || "Plan"}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  ) : null}

                  <div style={{ textAlign: "center", marginBottom: 18 }}>
                    <Title
                      level={3}
                      style={{ ...headingStyle, marginBottom: 8 }}
                    >
                      {plan?.name || "Plan"}
                    </Title>
                    <Text type="secondary">
                      Flexible access for advisers who want a clean subscription
                      flow and secure billing.
                    </Text>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 18 }}>
                    <Title
                      level={1}
                      style={{ margin: 0, fontFamily: "Georgia,serif" }}
                    >
                      {activePrice ? toCurrency(activePrice.amount) : "--"}
                    </Title>
                    <Text type="secondary">
                      per{" "}
                      {activePrice?.interval || (isYearly ? "year" : "month")}
                    </Text>
                  </div>

                  {isYearly && discountLabel ? (
                    <div style={{ textAlign: "center", marginBottom: 18 }}>
                      <Tag
                        color="green"
                        style={{
                          borderRadius: 999,
                          paddingInline: 12,
                          paddingBlock: 4,
                        }}
                      >
                        {discountLabel}
                      </Tag>
                    </div>
                  ) : null}

                  <div
                    style={{
                      borderRadius: 16,
                      background: "#f8fafc",
                      padding: 18,
                      marginBottom: 20,
                    }}
                  >
                    <Text strong style={{ display: "block", marginBottom: 12 }}>
                      Features
                    </Text>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {(plan?.marketing_features || []).map(
                        (feature, featureIndex) => (
                          <li
                            key={`${plan?.id || plan?.name}-${featureIndex}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              marginBottom: 10,
                            }}
                          >
                            <CheckOutlined
                              style={{ color: "#22c55e", marginTop: 4 }}
                            />
                            <Text type="secondary">{feature}</Text>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div style={{ marginTop: "auto" }}>
                    <Button
                      type={isPopular ? "primary" : "default"}
                      block
                      size="large"
                      icon={<ArrowRightOutlined />}
                      disabled={!activePrice?.price_id}
                      loading={subscribingPriceId === activePrice?.price_id}
                      onClick={() =>
                        activePrice?.price_id &&
                        handleSubscribe(activePrice.price_id)
                      }
                    >
                      {email ? "Subscribe Now" : "Login to Subscribe"}
                    </Button>

                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        textAlign: "center",
                        marginTop: 12,
                        fontSize: 12,
                      }}
                    >
                      Secure payment processing powered by Stripe.
                    </Text>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
}
