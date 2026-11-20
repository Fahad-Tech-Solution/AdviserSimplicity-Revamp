import React, { useState, useEffect } from 'react';
import {
    Steps,
    Button,
    Input,
    Typography,
    Space,
    message,
    Card,
    Alert,
    Radio,
} from 'antd';
import { AiOutlineLock } from 'react-icons/ai';
import { MdOutlineEmail } from 'react-icons/md';
import { HiMiniKey } from 'react-icons/hi2';
import { ClockCircleOutlined } from '@ant-design/icons';
import useApi from '../../../../../hooks/useApi';
import { IoQrCodeOutline } from 'react-icons/io5';

const { Text, Title, Paragraph } = Typography;

// ---- Adjust these to match your backend ----
const ENDPOINTS = {
    CHECK_PASSWORD: '/auth/login-v2', // verifies current password (also sends email OTP)
    SEND_EMAIL_OTP: '/auth/login-request-email-otp', // used when MFA is enabled and user picks email
    VERIFY_OTP: '/auth/login-verify-otp',
    VERIFY_EMAIL_OTP: '/auth/login-verify-email-otp',
    VERIFY_AUTH_APP: '/auth/login-verify-authenticator',
    CHANGE_PASSWORD: '/auth/update-password',
};

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

// stage: 'password' | 'choose' | 'email' | 'app' | 'newPassword'
const stageToStep = {
    password: 0,
    choose: 1,
    email: 1,
    app: 1,
    newPassword: 2,
};

const PasswordUpdate = ({ onComplete, userEmail = 'user@example.com', user }) => {
    const [stage, setStage] = useState('password');
    const [method, setMethod] = useState('email'); // 'email' | 'app'

    const [password, setPassword] = useState('');
    const [emailOtpCode, setEmailOtpCode] = useState('');
    const [appOtpCode, setAppOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    const [countdown, setCountdown] = useState(0);
    const [ErrorAlert, setErrorAlert] = useState({});
    const [verifiedRes, setVerifiedRes] = useState({});
    // Set only when login-v2 answers with action: "MFAScreen" (authenticator enabled)
    const [mfaToken, setMfaToken] = useState('');

    const api = useApi();
    const roleName = user?.roleID?.description || 'Adviser';
    const mfaConfig = mfaToken ? { headers: { Authorization: `Bearer ${mfaToken}` } } : {};

    // Rate-limit cooldown timer
    useEffect(() => {
        if (ErrorAlert.retryAfter > 0) {
            const timer = setInterval(() => {
                setErrorAlert((prev) =>
                    prev.retryAfter > 0 ? { ...prev, retryAfter: prev.retryAfter - 1 } : {}
                );
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [ErrorAlert]);

    // Email OTP resend countdown
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const showError = (error, fallback) => {
        message.error(error?.response?.data?.message || fallback);
        if (error?.response?.status === 429) setErrorAlert(error?.response?.data);
    };

    // ---------- Step 0: verify current password ----------
    const handleVerifyPassword = async () => {
        if (!password) {
            message.error('Please enter your current password');
            return;
        }
        setPasswordLoading(true);
        try {
            const res = await api.post(ENDPOINTS.CHECK_PASSWORD, {
                email: userEmail,
                passwordHash: password,
                roleName,
            });
            setPasswordLoading(false);

            if (res?.action === 'MFAScreen') {
                // Authenticator enabled: keep the MFA token and let the user choose
                setMfaToken(res?.mfaToken || '');
                message.success('Password confirmed! Choose how you want to verify.');
                setStage('choose');
            } else {
                // No authenticator: login-v2 already emailed the OTP
                setMfaToken('');
                message.success('Password confirmed! Please check your email for the security code.');
                setMethod('email');
                setCountdown(30);
                setStage('email');
            }
        } catch (error) {
            setPasswordLoading(false);
            showError(error, 'Invalid password or verification failed.');
        }
    };

    // ---------- Step 1a: send email OTP ----------
    const sendEmailOtp = async () => {
        if (mfaToken) {
            // MFA flow: dedicated endpoint
            await api.post(ENDPOINTS.SEND_EMAIL_OTP, { email: userEmail, roleName });
        } else {
            // Non-MFA flow: login-v2 generates and sends the email OTP
            await api.post(ENDPOINTS.CHECK_PASSWORD, {
                email: userEmail,
                passwordHash: password,
                roleName,
            });
        }
        setCountdown(30);
    };

    // ---------- Step 1: choose method ----------
    const handleContinueWithMethod = async () => {
        if (method === 'app') {
            setStage('app');
            return;
        }
        setSendLoading(true);
        try {
            await sendEmailOtp();
            message.success(`A verification code has been sent to ${userEmail}.`);
            setStage('email');
        } catch (error) {
            showError(error, 'Failed to send verification code.');
        } finally {
            setSendLoading(false);
        }
    };

    const handleResendEmailOtp = async () => {
        try {
            await sendEmailOtp();
            message.success(`A new verification code has been sent to ${userEmail}.`);
        } catch (error) {
            showError(error, 'Failed to resend verification code.');
        }
    };

    // ---------- Step 1b: verify email OTP ----------
    const handleVerifyEmailOtp = async () => {
        if (emailOtpCode.length !== 6) {
            message.error('Please enter a valid 6-digit email code');
            return;
        }
        setVerifyLoading(true);
        try {
            const res = await api.post(
                (mfaToken ?
                    ENDPOINTS.VERIFY_EMAIL_OTP :
                    ENDPOINTS.VERIFY_OTP),
                { email: userEmail, otp: emailOtpCode, roleName },
                mfaConfig
            );
            if (res?.action == "dashboard") {
                setVerifiedRes(res);
                message.success('Email verified successfully!');
                setStage('newPassword');
            }
        } catch (error) {
            showError(error, 'Invalid or expired verification code.');
        } finally {
            setVerifyLoading(false);
        }
    };

    // ---------- Step 1c: verify authenticator app code ----------
    const handleVerifyAuthApp = async () => {
        if (appOtpCode.length !== 6) {
            message.error('Please enter a valid 6-digit authenticator code');
            return;
        }
        setVerifyLoading(true);
        try {
            const res = await api.post(
                ENDPOINTS.VERIFY_AUTH_APP,
                {
                    email: userEmail,
                    token: String(appOtpCode ?? '').replace(/\D/g, ''),
                    roleName,
                },
                mfaConfig
            );
            if (res?.success !== false) {
                setVerifiedRes(res || {});
                message.success('Authenticator verified successfully!');
                setStage('newPassword');
            }
        } catch (error) {
            showError(error, 'Invalid authenticator code. Please try again.');
        } finally {
            setVerifyLoading(false);
        }
    };

    // ---------- Step 2: set new password ----------
    const newPasswordTooShort = newPassword && newPassword.length < 8;
    const sameAsOld = newPassword && newPassword === password;
    const mismatch = confirmPassword && newPassword !== confirmPassword;
    const canSubmit =
        newPassword.length >= 8 && newPassword === confirmPassword && newPassword !== password;

    const handleUpdatePassword = async () => {
        if (!canSubmit) return;
        setUpdateLoading(true);
        try {
            await api.patch(ENDPOINTS.CHANGE_PASSWORD, {

                email: userEmail,
                currentPassword: password?.trim(),
                newPassword: newPassword?.trim(),
            });
            message.success('Password updated successfully!');
            if (onComplete) onComplete();
        } catch (error) {
            showError(error, 'Failed to update password.');
        } finally {
            setUpdateLoading(false);
        }
    };

    const steps = [
        { title: 'Password', icon: <AiOutlineLock /> },
        { title: 'Verify', icon: <MdOutlineEmail /> },
        { title: 'New Password', icon: <HiMiniKey /> },
    ];

    const backFromVerify = () => {
        setEmailOtpCode('');
        setAppOtpCode('');
        setStage(mfaToken ? 'choose' : 'password');
    };

    return (
        <div style={{ padding: '8px 4px' }}>
            <Steps current={stageToStep[stage]} items={steps} style={{ marginBottom: 24 }} size="small" />

            {ErrorAlert?.retryAfter > 0 && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginTop: 16, marginBottom: 16 }}
                    message={ErrorAlert?.message || 'Too many failed attempts'}
                    description={
                        <Space size="small" style={{ marginTop: 4 }}>
                            <ClockCircleOutlined />
                            <span>Remaining cooling time:</span>
                            <Text type="danger" strong>
                                {formatTime(ErrorAlert.retryAfter)}
                            </Text>
                        </Space>
                    }
                />
            )}

            {/* STAGE: current password */}
            {stage === 'password' && (
                <div style={{ textAlign: 'center' }}>
                    <Paragraph type="secondary">
                        For your security, please confirm your current password to continue.
                    </Paragraph>

                    <div style={{ margin: '28px auto', maxWidth: 360 }}>
                        <Input.Password
                            size="large"
                            placeholder="Enter your current password"
                            value={password}
                            status={password && password.length < 8 ? 'error' : ''}
                            onChange={(e) => setPassword(e.target.value)}
                            onPressEnter={() => {
                                if (password.length >= 8) handleVerifyPassword();
                            }}
                            autoFocus
                        />
                        {password && password.length < 8 && (
                            <Text type="danger" style={{ display: 'block', marginTop: 6, textAlign: 'left' }}>
                                Minimum 8 characters
                            </Text>
                        )}
                    </div>

                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                        <Button
                            type="primary"
                            loading={passwordLoading}
                            disabled={!password || password.length < 8}
                            onClick={handleVerifyPassword}
                        >
                            Verify Password & Continue
                        </Button>
                    </div>
                </div>
            )}

            {/* STAGE: choose verification method (only if authenticator enabled) */}
            {stage === 'choose' && (
                <div style={{ textAlign: 'center' }}>
                    <Paragraph type="secondary">
                        Choose how you would like to verify your identity.
                    </Paragraph>

                    <div style={{ margin: '24px auto', maxWidth: 360 }}>
                        <Radio.Group
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Radio.Button
                                    value="email"
                                    style={{ width: '100%', height: 'auto', padding: '12px 16px', textAlign: 'left' }}
                                >
                                    <Space>
                                        <MdOutlineEmail style={{ fontSize: 35, verticalAlign: 'middle' }} />
                                        <span>
                                            <Text strong>Email code</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                We'll send a code to {userEmail}
                                            </Text>
                                        </span>
                                    </Space>
                                </Radio.Button>
                                <Radio.Button
                                    value="app"
                                    style={{ width: '100%', height: 'auto', padding: '12px 16px', textAlign: 'left' }}
                                >
                                    <Space>
                                        <IoQrCodeOutline style={{ fontSize: 35, verticalAlign: 'middle' }} />
                                        <span>
                                            <Text strong>Authenticator app</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Use the 6-digit code from your app
                                            </Text>
                                        </span>
                                    </Space>
                                </Radio.Button>
                            </Space>
                        </Radio.Group>
                    </div>

                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Button onClick={() => setStage('password')}>Back</Button>
                        <Button type="primary" loading={sendLoading} onClick={handleContinueWithMethod}>
                            Continue
                        </Button>
                    </Space>
                </div>
            )}

            {/* STAGE: email OTP */}
            {stage === 'email' && (
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
                        We've sent a one-time security code to <Text strong>{userEmail}</Text>. Enter it below to continue.
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
                            style={{ padding: 0, color: countdown > 0 ? '' : '#22c55e' }}
                        >
                            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                        </Button>
                    </div>

                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Button onClick={backFromVerify}>Back</Button>
                        <Button
                            type="primary"
                            loading={verifyLoading}
                            disabled={emailOtpCode.length !== 6}
                            onClick={handleVerifyEmailOtp}
                        >
                            Verify Email & Continue
                        </Button>
                    </Space>
                </Card>
            )}

            {/* STAGE: authenticator app OTP */}
            {stage === 'app' && (
                <div style={{ textAlign: 'center' }}>
                    <Paragraph type="secondary">
                        Enter the 6-digit code shown in your authenticator app.
                    </Paragraph>

                    <div style={{ margin: '28px 0' }}>
                        <Input.OTP
                            length={6}
                            value={appOtpCode}
                            onChange={(value) => setAppOtpCode(value)}
                            size="large"
                            autoFocus
                        />
                    </div>

                    <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 16 }}>
                        <Button onClick={backFromVerify}>Back</Button>
                        <Button
                            type="primary"
                            loading={verifyLoading}
                            disabled={appOtpCode.length !== 6}
                            onClick={handleVerifyAuthApp}
                        >
                            Verify & Continue
                        </Button>
                    </Space>
                </div>
            )}

            {/* STAGE: new password + confirm */}
            {stage === 'newPassword' && (
                <div style={{ textAlign: 'center' }}>
                    <Paragraph type="secondary">
                        Identity verified. Enter your new password below.
                    </Paragraph>

                    <div style={{ margin: '24px auto', maxWidth: 360, textAlign: 'left' }}>
                        <Input.Password
                            size="large"
                            placeholder="New password"
                            value={newPassword}
                            status={newPasswordTooShort || sameAsOld ? 'error' : ''}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoFocus
                        />
                        {newPasswordTooShort && (
                            <Text type="danger" style={{ display: 'block', marginTop: 6 }}>
                                Minimum 8 characters
                            </Text>
                        )}
                        {!newPasswordTooShort && sameAsOld && (
                            <Text type="danger" style={{ display: 'block', marginTop: 6 }}>
                                New password must be different from the current one
                            </Text>
                        )}

                        <Input.Password
                            size="large"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            status={mismatch ? 'error' : ''}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onPressEnter={handleUpdatePassword}
                            style={{ marginTop: 16 }}
                        />
                        {mismatch && (
                            <Text type="danger" style={{ display: 'block', marginTop: 6 }}>
                                Passwords do not match
                            </Text>
                        )}
                    </div>

                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                        <Button
                            type="primary"
                            loading={updateLoading}
                            disabled={!canSubmit}
                            onClick={handleUpdatePassword}
                        >
                            Update Password
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordUpdate;