import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Input,
  message,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { CheckOutlined, CopyOutlined, EditOutlined, KeyOutlined, LogoutOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useAtomValue, useSetAtom } from "jotai";
import { loggedInUser } from "../../../../store/authState";
import profileBanner from "../../../../assets/image/Adviser-Simplicity-Profile-Green-Banner.png";
import { Link } from "react-router-dom";
import { capitalizeFirst } from "../../../../hooks/helpers";
import useAuthSession from "../../../../hooks/useAuthSession";
import { MdOutlineInfo } from "react-icons/md";
import { IoSearchOutline } from "react-icons/io5";
import AppModal from "../../../Common/AppModal";
import { useMemo, useState } from "react";
import ConnectAsana from "./components/ConnectAsana";
import TwoFactorAuth from "./components/TwoFactorAuth";
import { FaTrash } from "react-icons/fa";
import useApi from "../../../../hooks/useApi";
import PasswordUpdate from "./components/PasswordUpdate";

const { Title, Text } = Typography;

const pageHeadingStyle = { fontFamily: "Georgia, serif" };

function getInitials(user = {}) {
  const first = user?.firstName?.charAt(0) || "";
  const last = user?.lastName?.charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "U";
}

function getFullName(user = {}) {
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return fullName || "User";
}

function getRoleLabel(user = {}) {
  const role = user?.roleID;

  if (typeof role === "string") return role;
  if (role && typeof role === "object") {
    return role?.name || role?.title || role?.roleName || role?._id || "User";
  }

  return "User";
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DetailItem({ label, value, subtle = false }) {
  return (
    <div
      style={{
        borderRadius: 16,
        height: "100%",
        background: subtle ? "rgba(34, 197, 94, 0.06)" : "#f8fafc",
        border: subtle
          ? "1px solid rgba(34, 197, 94, 0.18)"
          : "1px solid rgba(15, 23, 42, 0.08)",
        padding: "10px 15px",
      }}
    >
      <Text
        type="secondary"
        style={{
          display: "block",
          fontSize: 9,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#111827",
          wordBreak: "break-word",
          lineHeight: 1.5,
        }}
      >
        {value || "Not available"}
      </Text>
    </div>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "16px 18px",
        background: "#fff",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
      }}
    >
      <Text
        type="secondary"
        style={{
          display: "block",
          fontSize: 9,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#111827",
          fontFamily: "Georgia, serif",
        }}
      >
        {value}
      </Text>
    </div>
  );
}

export default function ProfilePage() {
  const session = useAtomValue(loggedInUser);
  const setSession = useSetAtom(loggedInUser);
  const { logout } = useAuthSession();
  const user = session?.user || {};
  const permissions = user?.roleID?.permissions ?? session?.permissions ?? [];
  const fullName = getFullName(user);
  const roleLabel = getRoleLabel(user);
  const email = session?.email || user?.email || "No email available";
  let baseRoute = window.location.origin;

  const { post, patch } = useApi()

  const isMfaEnabled = useMemo(() => {
    return user?.isAuthenticatorEnabled || false
  }, [user, session, setSession])

  const [isLoading, setIsLoading] = useState(false);


  const profileLink = baseRoute === "https://as.denarowealth.com.au" ?
    "https://cdf.denarowealth.com.au/?referralId=" + user?.referralID + "&build=Prod1" :
    "https://cdf.denarowealth.com.au/?referralId=" + user?.referralID + "&build=dev1"
  // "No profile link available";

  const [open, setOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState({ key: "" });

  const OpenModal = () => {
    setOpen(true);
    setModalDetails({ key: "connectAsana", title: "Connect your Asana", subtitle: "Connect your Asana account to get started" });
  };

  const RemoveAuthApp = async () => {
    try {
      setIsLoading(true);

      // Add 'await' here so it waits for the API response
      const res = await patch("/auth/recover-authenticator");

      if (res) {
        // Update isAuthenticatorEnabled inside the nested 'user' object
        setSession(prev => ({
          ...prev,
          user: {
            ...prev.user,
            isAuthenticatorEnabled: false,
          },
        }));
        message.success(res?.message || "removed Auth App");
      }
    } catch (error) {
      console.log(error);
      message.error(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to process your request",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title={modalDetails.title || "Modal Title"}
        subtitle={modalDetails.subtitle || "Modal Subtitle"}
        width={800}
        destroyOnClose
      >
        {modalDetails.key === "connectAsana" ? <ConnectAsana /> : modalDetails.key === "updatePassword" ?
          <PasswordUpdate
            onComplete={() => {
              setSession(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  isAuthenticatorEnabled: true,
                },
              }));
              setOpen(false)
            }} userEmail={user?.email} user={user}
          />
          : <TwoFactorAuth onComplete={() => {
            setSession(prev => ({
              ...prev,
              user: {
                ...prev.user,
                isAuthenticatorEnabled: true,
              },
            }));
            setOpen(false)
          }} userEmail={user?.email} user={user} />}
      </AppModal>

      <div
        style={{
          position: "relative",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            height: 190,
            borderRadius: 18,
            overflow: "hidden",
            backgroundImage: `url(${profileBanner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        <Card
          style={{
            position: "relative",
            margin: "-45px auto 0",
            width: "calc(100% - 80px)",
            maxWidth: 980,
            borderRadius: 12,
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: "14px 18px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Space size={12} align="center">
              <Avatar
                size={42}
                src={user?.profileImage}
                style={{
                  background:
                    "linear-gradient(135deg, #22c55e, rgb(22, 163, 74))",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                {!user?.profileImage && getInitials(user)}
              </Avatar>

              <div style={{ lineHeight: 1.35 }}>
                <Text
                  style={{
                    display: "block",
                    color: "#111827",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {fullName}
                </Text>
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    fontSize: 12,
                    wordBreak: "break-word",
                  }}
                >
                  {email}
                </Text>

                {roleLabel !== "superAdmin" && (
                  <Link
                    to={profileLink}
                    target="_blank"
                    style={{
                      display: "block",
                      fontSize: 11,
                      wordBreak: "break-all",
                      textDecoration: "none",
                      cursor: "pointer",
                      color: "#22c55e",
                    }}
                  >
                    {profileLink}
                  </Link>
                )}
              </div>
            </Space>

            <Space wrap>
              <Button icon={<EditOutlined />}>Edit</Button>
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={() =>
                  roleLabel === "superAdmin"
                    ? logout("/auth/admin-login")
                    : logout("/auth/login")
                }
              >
                Logout
              </Button>
            </Space>
          </div>
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            style={{
              borderRadius: 18,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
              marginBottom: "10px",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <Text
                type="secondary"
                style={{
                  display: "block",
                  fontSize: 11,
                  letterSpacing: 2.5,
                  color: "#22c55e",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                PERSONAL DETAILS
              </Text>
              <Title level={5} style={{ ...pageHeadingStyle, margin: 0 }}>
                Account information
              </Title>
              <Text
                type="secondary"
                style={{
                  display: "block",
                  marginTop: 6,
                  lineHeight: 1.6,
                  fontSize: 12,
                }}
              >
                Here are your account details.
              </Text>
            </div>

            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <DetailItem
                  label="First Name"
                  value={capitalizeFirst(user?.firstName)}
                  subtle
                />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem
                  label="Last Name"
                  value={capitalizeFirst(user?.lastName)}
                  subtle
                />
              </Col>
              <Col xs={24}>
                <DetailItem label="Email Address" value={email} />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem label="Role" value={roleLabel} />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem
                  label="Account Created"
                  value={formatDate(user?.createdAt)}
                />
              </Col>
            </Row>
          </Card>

          <Card
            style={{
              borderRadius: 18,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Card Header */}
            <div style={{ marginBottom: 18 }}>
              <Text
                type="secondary"
                style={{
                  display: "block",
                  fontSize: 11,
                  letterSpacing: 2.5,
                  color: "#22c55e",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Account Security
              </Text>
              <Title level={4} style={{ ...pageHeadingStyle, margin: 0 }}>
                Sign-in & Authentication
              </Title>
              <Text
                type="secondary"
                style={{
                  display: "block",
                  marginTop: 4,
                  lineHeight: 1.5,
                  fontSize: 12,
                }}
              >
                Manage your two-factor authentication and account password.
              </Text>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Section 2: Update Password */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: "#f8fafc",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <Title level={5} style={{ ...pageHeadingStyle, margin: 0, fontSize: 15 }}>
                    Password
                  </Title>
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginTop: 4,
                      lineHeight: 1.5,
                      fontSize: 12,
                    }}
                  >
                    Update your password regularly to keep your account credentials secure.
                  </Text>
                </div>

                <Button
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    height: 38,
                    fontWeight: 500,
                    borderColor: "rgba(15, 23, 42, 0.16)",
                  }}
                  icon={<KeyOutlined />}
                  onClick={() => {
                    setModalDetails({
                      key: "updatePassword",
                      title: "Update Password",
                      subtitle:
                        "Enter your current password and choose a strong new password.",
                    });
                    setOpen(true);
                  }}
                >
                  Update Password
                </Button>
              </div>

              {/* Section 1: Authenticator App (2FA) */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: isMfaEnabled ? "rgba(34, 197, 94, 0.04)" : "#f8fafc",
                  border: isMfaEnabled
                    ? "1px solid rgba(34, 197, 94, 0.22)"
                    : "1px solid rgba(15, 23, 42, 0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <Title level={5} style={{ ...pageHeadingStyle, margin: 0, fontSize: 15 }}>
                      Authenticator App (2FA)
                    </Title>
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        marginTop: 4,
                        lineHeight: 1.5,
                        fontSize: 12,
                      }}
                    >
                      Protect your financial portal with TOTP apps like Google Authenticator or Authy.
                    </Text>
                  </div>

                  {isMfaEnabled ? (
                    <Tag
                      color="success"
                      icon={<CheckOutlined />}
                      style={{ margin: 0, borderRadius: 6 }}
                    >
                      Protected
                    </Tag>
                  ) : (
                    <Tag color="default" style={{ margin: 0, borderRadius: 6 }}>
                      Unprotected
                    </Tag>
                  )}
                </div>



                {isMfaEnabled ? (
                  <Button
                    color="danger"
                    variant="solid"
                    style={{ width: "100%", borderRadius: 8, height: 38, fontWeight: 500 }}
                    onClick={RemoveAuthApp}
                    loading={isLoading}
                    icon={<FaTrash />}
                  >
                    Remove Authenticator app
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      height: 38,
                      fontWeight: 500,
                      backgroundColor: "#22c55e",
                      borderColor: "#22c55e",
                    }}
                    onClick={() => {
                      setModalDetails({
                        key: "twoFactorAuth",
                        title: "Enable Two-Factor Authentication",
                        subtitle:
                          "Add an extra layer of security to your account by enabling two-factor authentication (2FA).",
                      });
                      setOpen(true);
                    }}
                    icon={<SafetyCertificateOutlined />}
                  >
                    Set Up Authenticator
                  </Button>
                )}
              </div>


            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          {roleLabel !== "superAdmin" && (
            <Card
              style={{
                borderRadius: 18,
                border: "1px solid rgba(0, 0, 0, 0.08)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                marginBottom: "10px",
              }}
            >
              <div>
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    fontSize: 11,
                    letterSpacing: 2.5,
                    color: "#22c55e",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  INTEGRATION
                </Text>
                <Title level={5} style={{ ...pageHeadingStyle, margin: 0 }}>
                  Connect your Asana.{" "}
                  <Tooltip title="Your Asana token is securely encrypted. If you wish to update it, click the magnifying glass icon.">
                    <MdOutlineInfo />
                  </Tooltip>
                </Title>
              </div>
              <div style={{ marginTop: 10 }}>
                <Input.Group compact className="d-flex flex-row ">
                  <Input placeholder="Asana increpted PAT..." disabled />
                  <Button
                    icon={<IoSearchOutline />}
                    onClick={OpenModal}
                  ></Button>
                </Input.Group>
              </div>
            </Card>
          )}

          <Card
            style={{
              borderRadius: 18,
              height: "auto",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <Text
                type="secondary"
                style={{
                  display: "block",
                  fontSize: 11,
                  letterSpacing: 2.5,
                  color: "#22c55e",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                ACCESS OVERVIEW
              </Text>
              <Title level={5} style={{ ...pageHeadingStyle, margin: 0 }}>
                Permissions and session summary
              </Title>
              <Text
                type="secondary"
                style={{
                  display: "block",
                  marginTop: 6,
                  lineHeight: 1.6,
                  fontSize: 12,
                }}
              >
                Review the current role, permission coverage, and session-linked
                contact details for this account.
              </Text>
            </div>

            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <SummaryMetric label="Current Role" value={roleLabel} />
              </Col>
              <Col xs={24} md={12}>
                <SummaryMetric
                  label="Member Since"
                  value={formatDate(user?.createdAt)}
                />
              </Col>
            </Row>

            {roleLabel !== "superAdmin" && (
              <>
                <Divider style={{ marginBlock: 20 }} />

                <div
                  style={{
                    borderRadius: 18,
                    background: "rgba(34, 197, 94, 0.05)",
                    border: "1px solid rgba(34, 197, 94, 0.14)",
                    padding: 18,
                  }}
                >
                  <Text
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Permissions
                  </Text>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 14 }}
                  >
                    These permissions are coming from the role stored in the
                    active login session.
                  </Text>

                  {permissions.length > 0 ? (
                    <Space size={[8, 8]} wrap>
                      {permissions.map((permission) => (
                        <Tag
                          key={permission}
                          color="processing"
                          style={{
                            borderRadius: 999,
                            paddingInline: 12,
                            paddingBlock: 4,
                            textTransform: "capitalize",
                            background: "#22c55e",
                            color: "#fff",
                          }}
                        >
                          {permission}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary">
                      No permissions available in session.
                    </Text>
                  )}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
