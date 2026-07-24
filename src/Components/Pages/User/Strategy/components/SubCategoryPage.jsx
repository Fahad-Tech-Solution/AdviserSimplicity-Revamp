import { Card, Col, Row, Typography, Skeleton, Empty, Tag } from 'antd';
import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;

const SubCategoryPage = ({
    loading,
    filteredArticles = [],
    topicAndSubCategories = [],
    searchText = "", // Received as prop from AdviserKnowledgeBase
}) => {
    const [searchParams] = useSearchParams();
    const topic = searchParams.get('topic'); // e.g., "Super"
    const subCategory = searchParams.get('subCategory'); // e.g., "Super"
    const navigate = useNavigate();

    // Find the current topic object safely for normal category navigation
    const currentTopicObj = topicAndSubCategories.find((r) => r.value === topic);
    const subCategories = currentTopicObj?.subCategories || [];

    // ----------------------------------------------------
    // SKELETON LOADING STATE
    // ----------------------------------------------------
    if (loading) {
        return (
            <div>
                <Row gutter={[20, 20]}>
                    <Col md={24}>
                        <Skeleton.Button active size="small" style={{ width: 100, marginBottom: 12 }} />
                        <Card
                            style={{
                                borderRadius: 12,
                                border: "1px solid #f0f0f0",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                            styles={{
                                body: {
                                    padding: "15px 10px 15px 10px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                },
                            }}
                        >
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Card
                                    key={i}
                                    styles={{
                                        body: {
                                            padding: "10px 10px",
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        },
                                    }}
                                >
                                    <Skeleton.Input active size="small" style={{ width: 140 }} />
                                    <Skeleton.Button active size="small" shape="round" style={{ width: 32 }} />
                                </Card>
                            ))}
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    // ----------------------------------------------------
    // 1. ACTIVE SEARCH MODE (When searchText prop is present)
    // ----------------------------------------------------
    const trimmedSearch = searchText.trim().toLowerCase();

    if (trimmedSearch) {
        // Simple title matching
        const searchResults = filteredArticles.filter((article) =>
            article?.title?.toLowerCase().includes(trimmedSearch)
        );

        return (
            <div>
                <Row gutter={[20, 20]}>
                    <Col md={24}>
                        <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 12 }}>
                            <Link to="/user/strategy/knowledge-base" style={{ color: "#22c55e", textDecoration: "none" }}>
                                ← All topics
                            </Link>

                            <Text
                                style={{
                                    color: "#5c5b5b",
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                }}
                            >
                                Search results for "{searchText}" · {searchResults.length}
                            </Text>
                        </div>

                        <Card
                            style={{
                                borderRadius: 12,
                                height: "100%",
                                border: "1px solid #f0f0f0",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                            styles={{
                                body: {
                                    padding: "15px 10px 15px 10px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    maxHeight: "500vh",
                                    overflowY: "auto",
                                },
                            }}
                        >
                            {searchResults.length === 0 ? (
                                <Empty
                                    description={`No articles found matching "${searchText}"`}
                                    style={{ margin: "40px 0" }}
                                />
                            ) : (
                                searchResults.map((article) => {
                                    const articleId = article.id || article._id || article.title;

                                    return (
                                        <Card
                                            key={articleId}
                                            className="subCategory"
                                            hoverable
                                            onClick={() =>
                                                navigate(
                                                    `/user/strategy/knowledge-base/article?id=${encodeURIComponent(articleId)}`
                                                )
                                            }
                                            styles={{
                                                body: {
                                                    padding: "10px 10px",
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                },
                                            }}
                                        >
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        lineHeight: 1.4,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {article.title}
                                                </Text>
                                                {(article.topic || article.subcategory || article.Subcategory) && (
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        {[article.topic, article.subcategory || article.Subcategory]
                                                            .filter(Boolean)
                                                            .join(" › ")}
                                                    </Text>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    // ----------------------------------------------------
    // 2. FALLBACK IF NO TOPIC FOUND (Category Mode)
    // ----------------------------------------------------
    if (!currentTopicObj) {
        return (
            <Empty
                description={`No category found for "${topic || 'selected topic'}"`}
                style={{ marginTop: 60 }}
            />
        );
    }

    // ----------------------------------------------------
    // 3. NORMAL SUBCATEGORY / ARTICLE LISTING (UNTOUCHED)
    // ----------------------------------------------------
    return (
        <div>
            <Row gutter={[20, 20]}>
                <Col md={24}>
                    {!subCategory ? (
                        <>
                            <Link to={"/user/strategy/knowledge-base"} style={{ color: "#22c55e", textDecoration: "none",  fontWeight: 500, }}>← All topics</Link>
                            <Card
                                style={{
                                    borderRadius: 12,
                                    height: "100%",
                                    border: "1px solid #f0f0f0",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                }}
                                styles={{ body: { padding: "15px 10px 0px 10px", display: "flex", flexDirection: "column", gap: "10px" } }}
                            >
                                {subCategories.map((item) => {
                                    const documentsCount = filteredArticles.reduce((count, article) => {
                                        const matchesTopic = article.topic === topic;
                                        const matchesSub =
                                            article.Subcategory === item.value || article.subcategory === item.value;

                                        return matchesTopic && matchesSub ? count + 1 : count;
                                    }, 0);

                                    return (
                                        <Card
                                            key={item.value}
                                            className='subCategory'
                                            onClick={() =>
                                                navigate(`/user/strategy/knowledge-base/sub?topic=${encodeURIComponent(topic)}&subCategory=${encodeURIComponent(item.value)}`)
                                            }
                                            styles={{ body: { padding: "10px 10px 0px 10px", display: "flex", flexDirection: "row", } }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    lineHeight: 1.4,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                {item.label}
                                            </Text>
                                            <Tag style={{
                                                borderRadius: "18px", marginLeft: "auto", color: "#5c5b5b",
                                                fontSize: 14,
                                                lineHeight: 1.4,
                                                marginBottom: 8,
                                            }}>{documentsCount}</Tag>
                                        </Card>
                                    );
                                })}
                            </Card>
                        </>
                    ) : (
                        <>
                            <div className='d-flex justify-content-between align-items-center'>
                                <Link to={`/user/strategy/knowledge-base/sub?topic=${encodeURIComponent(topic)}`} style={{ color: "#22c55e", textDecoration: "none", fontWeight: 500, }}>← {topic}</Link>

                                <Text style={{
                                    color: "#5c5b5b",
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                    marginBottom: 8,
                                }}>
                                    {subCategory} · {filteredArticles.filter((article) => {
                                        const matchesTopic = article.topic === topic;
                                        const articleSubcategory = article.Subcategory || article.subcategory;
                                        const matchesSubcategory = articleSubcategory === subCategory;

                                        return matchesTopic && matchesSubcategory;
                                    }).length || 0}
                                </Text>
                            </div>
                            <Card
                                style={{
                                    borderRadius: 12,
                                    height: "100%",
                                    border: "1px solid #f0f0f0",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                }}
                                styles={{
                                    body: {
                                        padding: "15px 10px 0px 10px", display: "flex", flexDirection: "column", gap: "10px",
                                        maxHeight: "500vh", overflowY: "auto"
                                    }
                                }}
                            >
                                {filteredArticles.filter((article) => {
                                    const matchesTopic = article.topic === topic;
                                    const articleSubcategory = article.Subcategory || article.subcategory;
                                    const matchesSubcategory = articleSubcategory === subCategory;

                                    return matchesTopic && matchesSubcategory;
                                }).map((article) => {
                                    const articleId = article.id || article._id || article.title;

                                    return (
                                        <Card
                                            key={articleId}
                                            className="subCategory"
                                            hoverable
                                            onClick={() =>
                                                navigate(
                                                    `/user/strategy/knowledge-base/article?id=${encodeURIComponent(articleId)}`
                                                )
                                            }
                                            styles={{
                                                body: {
                                                    padding: "10px 10px 0px 10px",
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                },
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    lineHeight: 1.4,
                                                    marginBottom: 8,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {article.title}
                                            </Text>
                                        </Card>
                                    );
                                })}
                            </Card>
                        </>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default SubCategoryPage;