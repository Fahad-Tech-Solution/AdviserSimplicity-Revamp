import { Button, Card, Space, Typography } from "antd";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
const { Title, Text } = Typography;
const headingStyle = { fontFamily: "Georgia, serif" };

function StatusCard({
  icon,
  iconBg,
  iconColor,
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px 16px",
        background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
      }}
    >
      <motion.div
        animate={{
          translateY: [-3,  3, -3, 3, -3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        drag
        dragConstraints={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        dragElastic={0.5}
        dragMomentum={false}
        dragTransition={{
          bounceStiffness: 100,
          bounceDamping: 10,
        }}
        dragListener={false}
      >
 
        <Card
          //add floating animation to the card with framer motion

          style={{
            width: "100%",
            maxWidth: 620,
            borderRadius: 24,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.1)",
            //   overflow: "hidden",
          }}
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          {/* <div
          style={{
            height: 110,
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.5), transparent 35%), linear-gradient(135deg,rgb(13, 228, 92),rgb(166, 245, 195))",
          }}
        /> */}

          <div
            style={{
              padding: "0 28px 32px",
              marginTop: -34,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: iconBg,
                color: iconColor,
                fontSize: 30,
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
              }}
            >
              {icon}
            </div>

            <Text
              style={{
                display: "block",
                marginTop: 18,
                color: "#22c55e",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 3,
              }}
            >
              {eyebrow}
            </Text>

            <Title
              level={2}
              style={{
                ...headingStyle,
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              {title}
            </Title>

            <Text
              type="secondary"
              style={{
                display: "block",
                maxWidth: 420,
                margin: "0 auto",
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              {subtitle}
            </Text>

            <Space
              size={12}
              wrap
              style={{
                marginTop: 28,
                justifyContent: "center",
              }}
            >
              {primaryAction}
              {secondaryAction}
            </Space>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function StripeRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");

  if (status === "success" || status === "renew") {
    return (
      <StatusCard
        icon={<CheckCircleFilled />}
        iconBg="rgba(34, 197, 94, 0.14)"
        iconColor="#16a34a"
        eyebrow="PAYMENT COMPLETE"
        title="Payment Successful!"
        subtitle="Thank you for your purchase. Your subscription is now active and your account is ready for the next step."
        primaryAction={
          <Button
            type="primary"
            size="large"
            onClick={() =>
              navigate(status === "renew" ? "/user" : "/auth/change-password")
            }
          >
            {status === "renew" ? "Go to Dashboard" : "Continue Setup"}
          </Button>
        }
        secondaryAction={
          <Button size="large" onClick={() => navigate("/auth/pricing-table")}>
            View Plans
          </Button>
        }
      />
    );
  }

  if (status === "cancel") {
    return (
      <StatusCard
        icon={<CloseCircleFilled />}
        iconBg="rgba(239, 68, 68, 0.12)"
        iconColor="#dc2626"
        eyebrow="PAYMENT CANCELLED"
        title="Payment Cancelled"
        subtitle="Your checkout was cancelled before completion. You can review the plans again and restart the subscription whenever you're ready."
        primaryAction={
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/auth/pricing-table")}
          >
            Go Back to Pricing
          </Button>
        }
        secondaryAction={
          <Button size="large" onClick={() => navigate("/auth/login")}>
            Back to Login
          </Button>
        }
      />
    );
  }

  return (
    <StatusCard
      icon={<ClockCircleFilled />}
      iconBg="rgba(59, 130, 246, 0.12)"
      iconColor="#2563eb"
      eyebrow="PROCESSING"
      title="Awaiting Payment Result"
      subtitle="We are waiting for Stripe to confirm the final result of your checkout. This page will reflect the correct outcome once the redirect is complete."
      primaryAction={
        <Button
          type="primary"
          size="large"
          onClick={() => navigate("/auth/pricing-table")}
        >
          Back to Pricing
        </Button>
      }
      secondaryAction={
        <Button size="large" onClick={() => navigate("/auth/login")}>
          Go to Login
        </Button>
      }
    />
  );
}
