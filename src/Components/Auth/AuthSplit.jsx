import { Typography } from "antd";

const { Title, Text } = Typography;

/**
 * Shared two-column layout used by the new auth screens
 * (same look as LoginForm / VerifyOtpForm).
 */
export default function AuthSplit({ title, subtitle, image, alt, aside, children }) {
  return (
    <div className="row g-0 h-100">
      <div className="col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
        <Title
          level={3}
          style={{ marginBottom: 4, fontFamily: "Georgia,serif" }}
          className="text-center"
        >
          {title}
        </Title>
        {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
        {children}
      </div>

      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        {aside ?? (
          <img
            src={image}
            alt={alt}
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "contain",
              padding: 18,
            }}
          />
        )}
      </div>
    </div>
  );
}
