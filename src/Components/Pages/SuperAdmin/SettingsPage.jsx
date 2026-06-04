import { Typography } from "antd";

const { Text, Title } = Typography;
const headingStyle = { fontFamily: "Georgia, serif" };


export default function SettingsPage() {
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
                type="secondary"
                style={{
                    fontFamily: "Arial, serif",
                    fontWeight: 700,
                    letterSpacing: "3px",
                    fontSize: "11px",
                    color: "#22c55e",
                }}
            >
                ADMIN
            </Text>

            <div
                style={{
                    display: "flex",
                    alignItems: "start",
                    flexDirection: "column",
                    marginTop: 8,
                    marginBottom: 8,
                }}
            >
                <Title
                    level={3}
                    style={{ ...headingStyle, margin: 0, fontWeight: "500" }}
                >
                    Settings
                </Title>
                <Text
                    style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontFamily: "Arial, sans-serif",
                        maxWidth: "580px",
                        marginTop: 4,
                    }}
                >
                    Platform configuration, branding, integrations, and security policies.
                </Text>
            </div>

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: 12,
                    padding: "24px 16px",
                }}
            >
                <div style={{ fontSize: 48, fontWeight: 700, opacity: 0.35, padding: 0, margin: 0 }}>⚙️</div>
                <Title
                    level={4}
                    style={{
                        ...headingStyle,
                        margin: 0,
                        fontWeight: 500,
                        fontSize: 22,
                        color: "#374151",
                    }}
                >
                    Settings coming soon
                </Title>
                <Text
                    style={{
                        margin: 0,
                        maxWidth: 420,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "#9ca3af",
                        fontFamily: "Arial, sans-serif",
                        width: "35%",
                    }}
                >
                    Branding, email templates, SSO, role permissions, and webhook configuration will appear here.
                </Text>
            </div>
        </div>
    );
}