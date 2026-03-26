import { Button, Form, Input, Typography } from "antd";
import { Link } from "react-router-dom";
import logo from "../../assets/svg/Privacy policy-rafiki.svg";

const { Title, Text } = Typography;

export default function RegisterForm() {
  return (
    <div className="row g-0 h-100">
      <div className="text-center col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
        <Title
          level={3}
          style={{ marginBottom: 4, fontFamily: "Georgia,serif" }}
          className="text-center"
        >
          Register
        </Title>
        <Text type="secondary" className="text-center">
          Create your account.
        </Text>

        <Form layout="vertical" requiredMark={false} style={{ marginTop: 18 }}>
          <Form.Item label="Email" name="email" className="mb-0 mt-2">
            <Input size="large" placeholder="someone@example.com" />
          </Form.Item>
          <Form.Item label="Password" name="password" className=" mt-2">
            <Input.Password size="large" placeholder="Create password" />
          </Form.Item>
          <Button type="primary" size="large" block>
            Create Account
          </Button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <Text type="secondary">Already have an account? </Text>
          <Link to="/auth/login" style={{ color: "#36b446" }}>
            Login
          </Link>
        </div>
      </div>
      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        <img
          src={logo}
          alt="Register illustration"
          style={{ width: "100%", maxHeight: 420, objectFit: "contain", padding: 18 }}
        />
      </div>
    </div>
  );
}
