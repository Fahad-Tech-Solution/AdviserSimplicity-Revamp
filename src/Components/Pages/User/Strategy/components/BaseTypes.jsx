import {
    Card,
    Col,
    Empty,
    Input,
    Row,
    Skeleton,
    Tag,
    Typography,
    Badge,
} from "antd";
import { SearchOutlined, FileTextOutlined } from "@ant-design/icons";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
const { Title, Text, Paragraph } = Typography;

const BaseTypes = ({
    loading,
    filteredArticles,
    CATEGORY_COLORS,
    topicAndSubCategories,
    setSearchText
}) => {
    const navigate = useNavigate();
    return (
        <div>
            {loading ? (
                <Row gutter={[20, 20]}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Col xs={24} sm={12} lg={8} key={i}>
                            <Card style={{ borderRadius: 12 }}>
                                <Skeleton active paragraph={{ rows: 3 }} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : topicAndSubCategories.length === 0 ? (
                <Empty
                    description={
                        searchText
                            ? `No articles match "${searchText}"`
                            : "No articles yet"
                    }
                    style={{ marginTop: 60 }}
                />
            ) : (
                <Row gutter={[20, 20]}>
                    {topicAndSubCategories.map((item) => {
                        const documentsCount = filteredArticles.reduce((count, article) => {
                            return article.topic === item.value ? count + 1 : count;
                        }, 0);
                        return (
                            <Col xs={24} sm={12} lg={8} key={item._id}>
                                <Card
                                    className="interactive-card"
                                    hoverable
                                    onClick={() => {
                                        setSearchText("")
                                        navigate(`/user/strategy/knowledge-base/sub?topic=${encodeURIComponent(item.value)}`)
                                    }
                                    }
                                    styles={{ body: { padding: "20px 20px 10px 20px" } }}

                                >
                                    {/* Title */}
                                    <Title
                                        level={5}
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            lineHeight: 1.4,
                                            textAlign: "center"
                                        }}
                                    >
                                        {item.label}
                                    </Title>

                                    <Title
                                        level={5}
                                        style={{
                                            margin: "0px 0px 0px 0px",
                                            fontSize: 52,
                                            fontWeight: 700,
                                            lineHeight: 1.4,
                                            textAlign: "center"
                                        }}
                                    >
                                        {item.icon}
                                    </Title>

                                    <div style={{
                                        margin: "10px 0px 0px 0px",
                                        fontSize: 12,
                                        textAlign: "center",
                                        width: "100%",
                                        color: "#6b7280"
                                    }}>
                                        {documentsCount || 0} entries
                                    </div>


                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </div>
    )
}

export default BaseTypes