import React from "react";
import { Alert, Col, List, Space, Typography } from "antd";
import { RiErrorWarningLine } from "react-icons/ri";
import parse from "html-react-parser";
const { Title, Paragraph, Text } = Typography;

export default function ErrorSummaryAlert({ errorMessages = {}, ownerOptions = [], extractFrom = "", generalParagraphText = "" }) {
    if (!errorMessages || typeof errorMessages !== "object" || Object.keys(errorMessages).length === 0) {
        return null;
    }

    const getOwnerLabel = (key) => {
        return ownerOptions.find((option) => option.value === key)?.label || key;
    };

    return (
        <Col xs={24} md={24}>
            <Alert
                type="error"
                showIcon
                icon={<RiErrorWarningLine style={{ fontSize: 20 }} />}
                title={
                    <Title level={5} style={{ marginBottom: 4, color: "#cf1322" }}>
                        Error Message:
                    </Title>
                }
                description={
                    <div>
                        <Paragraph style={{ marginBottom: 8, fontSize: 13, color: "#434343" }}>
                            {parse(generalParagraphText)}
                        </Paragraph>

                        {/* Render Client Errors */}
                        {errorMessages?.client && errorMessages.client.length > 0 && (
                            <>
                                <Title level={5} style={{ marginBottom: 4, color: "#cf1322" }}>
                                    {getOwnerLabel("client")}
                                </Title>
                                <List
                                    size="small"
                                    split={false}
                                    dataSource={errorMessages.client}
                                    renderItem={(item, index) => (
                                        <List.Item style={{ padding: "4px 0" }}>
                                            <Space align="start">
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {index + 1} :
                                                </span>
                                                <Text style={{ fontSize: 13 }}>{item}.</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                            </>
                        )}

                        {/* Render Partner Errors */}
                        {errorMessages?.partner && errorMessages.partner.length > 0 && (
                            <>
                                <Title level={5} style={{ marginBottom: 4, color: "#cf1322", marginTop: 8 }}>
                                    {getOwnerLabel("partner")}
                                </Title>
                                <List
                                    size="small"
                                    split={false}
                                    dataSource={errorMessages.partner}
                                    renderItem={(item, index) => (
                                        <List.Item style={{ padding: "4px 0" }}>
                                            <Space align="start">
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {index + 1} :
                                                </span>
                                                <Text style={{ fontSize: 13 }}>{item}.</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                            </>
                        )}

                        {extractFrom == "general" && errorMessages?.[extractFrom] && errorMessages[extractFrom].length > 0 && (
                            <>

                                <List
                                    size="small"
                                    split={false}
                                    dataSource={errorMessages[extractFrom]}
                                    renderItem={(item, index) => (
                                        <List.Item style={{ padding: "4px 0" }}>
                                            <Space align="start">
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {index + 1} :
                                                </span>
                                                <Text style={{ fontSize: 13 }}>{item}.</Text>
                                            </Space>
                                        </List.Item>
                                    )}
                                />
                            </>
                        )}

                    </div>
                }
                style={{
                    borderRadius: 8,
                    border: "1px solid #ffccc7",
                    backgroundColor: "#fff2f0",
                }}
            />
        </Col>
    );
}