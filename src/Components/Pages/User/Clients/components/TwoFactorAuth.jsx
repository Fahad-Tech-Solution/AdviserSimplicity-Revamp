import React, { useState, useEffect } from 'react';
import {
  Steps,
  Button,
  Input,
  Typography,
  Space,
  QRCode,
  message,
  Tag,
  Card,
  Alert,
} from 'antd';
import { FaQrcode } from 'react-icons/fa';
import { HiMiniKey } from 'react-icons/hi2';
import { AiOutlineLock } from 'react-icons/ai';
import { IoCopyOutline } from 'react-icons/io5';
import { MdOutlineEmail } from 'react-icons/md';
import useApi from '../../../../../hooks/useApi';
import { ClockCircleOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

// Mock Secret (Replace with your backend payload)
const MOCK_SECRET_KEY = 'JBSWY3DPEHPK3PXP';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};


const TwoFactorAuth = ({ onComplete, userEmail = 'user@example.com', user }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [password, setPassword] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [ErrorAlert, setErrorAlert] = useState({});
  const [verifiedOtpRes, setVerifiedOtpRes] = useState({});
  const api = useApi();



  // Timer effect counting down every 1 second (1000ms)
  useEffect(() => {
    if (ErrorAlert.retryAfter > 0) {
      const timer = setInterval(() => {
        setErrorAlert((prev) => (prev.retryAfter > 0 ? { ...prev, retryAfter: prev.retryAfter - 1 } : {}));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [ErrorAlert]);


  // Timer for Email OTP resend countdown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);


  // Step 0 -> Step 1: Verify password, then send Email OTP
  const handleVerifyPassword = async () => {
    if (!password) {
      message.error('Please enter your password');
      return;
    }

    setPasswordLoading(true);
    try {
      const payload = {
        email: userEmail,
        passwordHash: password,
        roleName: user?.roleID?.description || "Adviser",
      };

      const res = await api.post('/auth/login-v2', payload);

      // Assuming your backend responds successfully when the password is correct
      setPasswordLoading(false);
      message.success('Password confirmed! Please check your email for the security code.');
      setCurrentStep(1);
      setCountdown(30);
    } catch (error) {
      setPasswordLoading(false);
      // Display backend error message if available, or fallback to a generic message
      const errorMsg = error?.response?.data?.message || 'Invalid password or verification failed.';
      message.error(errorMsg);

      if (error?.response?.data?.code === "OTP_RESEND_COOLDOWN") {
        setErrorAlert(error?.response?.data)
      }
    }
  };

  // Step 1 -> Step 2: Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode.length !== 6) {
      message.error('Please enter a valid 6-digit email code');
      return;
    }

    setEmailLoading(true);
    try {
      const payload = {
        email: userEmail,
        otp: emailOtpCode, // Adjust the key to match your backend expectation (e.g., 'otp', 'emailOtp', or 'code')
        roleName: user?.roleID?.description || "Adviser",
      };

      const res = await api.post('/auth/login-verify-otp', payload);
      if (res?.success) {
        setVerifiedOtpRes(res)
        setEmailLoading(false);
        message.success('Email verified successfully!');
        setCurrentStep(2);
        getQRCode(res)
      }
    } catch (error) {
      setEmailLoading(false);
      const errorMsg = error?.response?.data?.message || 'Invalid or expired verification code.';
      message.error(errorMsg);
    }
  };

  const getQRCode = async (prevRes) => {
    try {
      let res = await api.post("/auth/authenticator/setup", {
        email: userEmail,
        roleName: user?.roleID?.description || "Adviser",
      }, { headers: { Authorization: `Bearer ${prevRes.enrollmentToken}` } })

      setVerifiedOtpRes(prev => ({ ...prev, ...res }))

    } catch (error) {
      setEmailLoading(false);
      const errorMsg = error?.response?.data?.message || 'Invalid or expired verification code.';
      message.error(errorMsg);
    }
  }

  const handleResendEmailOtp = async () => {
    if (!password) {
      message.error('Password is required to resend the code.');
      return;
    }

    try {
      const payload = {
        email: userEmail,
        passwordHash: password,
        roleName: user?.roleID?.description || "Adviser",
      };

      // Trigger the login-v2 API again to generate and resend the email OTP
      await api.post('/auth/login-v2', payload);

      setCountdown(30);
      message.success(`A new verification code has been dispatched to ${userEmail}.`);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || 'Failed to resend verification code.';
      message.error(errorMsg);
    }
  };

  // Step 3: Verify Authenticator App OTP, finalize registration
  const handleVerifyAuthenticator = async () => {
    if (otpCode.length !== 6) {
      message.error('Please enter a valid 6-digit authenticator code');
      return;
    }

    setLoading(true);
    try {
      // Assuming verifiedOtpRes stores the response from the previous verification step
      const enrollmentToken = verifiedOtpRes?.enrollmentToken || '';

      const payload = {
        email: userEmail,
        token: otpCode,
        roleName: user?.roleID?.description || 'Adviser',
      };

      const config = {
        headers: {
          Authorization: `Bearer ${enrollmentToken}`,
        },
      };

      const res = await api.post('/auth/authenticator/verify-setup', payload, config);

      setLoading(false);
      message.success('2FA is now registered successfully!');
      if (onComplete) onComplete();
      
    } catch (error) {
      setLoading(false);
      const errorMsg = error?.response?.data?.message || 'Invalid authenticator code. Please try again.';
      message.error(errorMsg);
    }
  };

  const steps = [
    { title: 'Password', icon: <AiOutlineLock /> },
    { title: 'Email OTP', icon: <MdOutlineEmail /> },
    { title: 'Scan QR', icon: <FaQrcode /> },
    { title: 'Verify App', icon: <HiMiniKey /> },
  ];

  return (
    <div style={{ padding: '8px 4px' }}>
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} size="small" />


      {ErrorAlert?.retryAfter > 0 &&
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 16, marginBottom: 16 }}
          message={error || "Too many failed login attempts"}
          description={
            loginAttemptsFailed > 0 ? (
              <Space size="small" style={{ marginTop: 4 }}>
                <ClockCircleOutlined />
                <span>Remaining cooling time:</span>
                <Text type="danger" strong>
                  {formatTime(loginAttemptsFailed)}
                </Text>
              </Space>
            ) : null
          }
        />
      }


      {/* STEP 0: Enter Password */}
      {currentStep === 0 && (
        <div style={{ textAlign: 'center' }}>
          <Paragraph type="secondary">
            For your security, please confirm your password to start setting up two-factor authentication.
          </Paragraph>

          <div style={{ margin: '28px auto', maxWidth: 360 }}>
            <Input.Password
              size="large"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleVerifyPassword}
              autoFocus
            />
          </div>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              loading={passwordLoading}
              disabled={!password}
              onClick={handleVerifyPassword}
            >
              Verify Password & Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 1: Email OTP Verification */}
      {currentStep === 1 && (
        <Card
          bordered={false}
          style={{ background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center' }}
        >
          <div style={{ marginBottom: 12 }}>
            <MdOutlineEmail style={{ fontSize: 36, color: '#22c55e' }} />
          </div>
          <Title level={4} style={{ marginTop: 0, marginBottom: 8 }}>
            Check Your Email
          </Title>
          <Paragraph type="secondary" style={{ maxWidth: 360, margin: '0 auto 20px auto' }}>
            We've sent a one-time security confirmation code to <Text strong>{userEmail}</Text>. Enter it below to continue.
          </Paragraph>

          <div style={{ margin: '20px 0' }}>
            <Input.OTP
              length={6}
              value={emailOtpCode}
              onChange={(value) => setEmailOtpCode(value)}
              size="large"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Didn't get the email? </Text>
            <Button
              type="link"
              size="small"
              disabled={countdown > 0}
              onClick={handleResendEmailOtp}
              style={{ padding: 0, color: countdown > 0 ? "" : "#22c55e" }}
              styles={{ color: '#22c55e' }}
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
            </Button>
          </div>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(0)}>Back</Button>
            <Button
              type="primary"
              loading={emailLoading}
              disabled={emailOtpCode.length !== 6}
              onClick={handleVerifyEmailOtp}
            >
              Verify Email & Continue
            </Button>
          </Space>
        </Card>
      )}

      {/* STEP 2: Scan QR Code */}
      {currentStep === 2 && (
        <div style={{ textAlign: 'center' }}>
          <Paragraph type="secondary" style={{ marginBottom: 16 }} onClick={() => console.log(verifiedOtpRes)}>
            Open your authenticator app (e.g., Google Authenticator, Authy) and scan the QR code below.
          </Paragraph>

          <Space direction="vertical" align="center" size="middle">
            <div style={{ background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #f0f0f0' }}>
              <img
                src={verifiedOtpRes.qrCode || ""}
                alt={verifiedOtpRes.qrCode || "test"}
                style={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "contain",
                  padding: 18,
                }}
              />
            </div>
          </Space>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button type="primary" onClick={() => setCurrentStep(3)}>
              Next: Verify Code
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Enter Authenticator OTP Code */}
      {currentStep === 3 && (
        <div style={{ textAlign: 'center' }}>
          <Paragraph type="secondary">
            Enter the 6-digit verification code generated by your authenticator app to confirm setup.
          </Paragraph>

          <div style={{ margin: '28px 0' }}>
            <Input.OTP
              length={6}
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
              size="large"
              autoFocus
            />
          </div>

          <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(2)}>Back</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={otpCode.length !== 6}
              onClick={handleVerifyAuthenticator}
            >
              Verify & Activate 2FA
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;