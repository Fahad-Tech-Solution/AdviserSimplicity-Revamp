import { Button, Form, Input, Typography } from "antd";
import { Link } from "react-router-dom";
import logo from "../../assets/svg/Enter OTP-pana.svg";

const { Title, Text } = Typography;

export default function ForgetPasswordForm() {
  return (
    <div className="row g-0 h-100 ">
      <div className="text-center col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
        <Title
          level={3}
          style={{ marginBottom: 4, fontFamily: "Georgia,serif" }}
          className="text-center"
        >
          Forgot Password
        </Title>
        <Text type="secondary" className="text-center w-100">
          Enter your email for reset instructions.
        </Text>

        <Form layout="vertical" requiredMark={false} style={{ marginTop: 18 }}>
          <Form.Item label="Email" name="email">
            <Input size="large" placeholder="someone@example.com" />
          </Form.Item>
          <Button type="primary" size="large" block>
            Continue
          </Button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <Link to="/auth/login" style={{ color: "#36b446" }}>
            Back to login
          </Link>
        </div>
      </div>
      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        <img
          src={logo}
          alt="Forgot password illustration"
          style={{ width: "100%", maxHeight: 420, objectFit: "contain", padding: 18 }}
        />
      </div>
    </div>
  );
}
