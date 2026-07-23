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
import useApi from "../../../../hooks/useApi";

const { Title, Text, Paragraph } = Typography;

const CATEGORY_COLORS = {
  Compliance: "#f59e0b",
  "Investment Strategy": "#22c55e",
  "Client Communication": "#3b82f6",
  "Estate Planning": "#8b5cf6",
  Superannuation: "#06b6d4",
  Insurance: "#ef4444",
};

/**
 * Fallback content shown if the API call fails or hasn't been wired up yet.
 * Safe to delete once GET /knowledgeBase/getAll is live.
 */
const FALLBACK_ARTICLES = [
  {
    _id: "1",
    title: "Understanding Contribution Caps for FY26",
    category: "Superannuation",
    excerpt:
      "A quick reference for concessional and non-concessional caps, and how to flag clients approaching their limits.",
    updatedAt: "2026-07-14",
  },
  {
    _id: "2",
    title: "Best Practice Client Review Checklist",
    category: "Client Communication",
    excerpt:
      "Structure annual review conversations so nothing falls through the cracks — from goals to insurance to estate docs.",
    updatedAt: "2026-07-10",
  },
  {
    _id: "3",
    title: "SOA Disclosure Requirements, Explained",
    category: "Compliance",
    excerpt:
      "What must be included in a Statement of Advice under current regulatory guidance, with common pitfalls to avoid.",
    updatedAt: "2026-06-28",
  },
  {
    _id: "4",
    title: "Diversification Models for Conservative Clients",
    category: "Investment Strategy",
    excerpt:
      "A comparison of asset allocation approaches suited to clients with low risk tolerance nearing retirement.",
    updatedAt: "2026-06-21",
  },
  {
    _id: "5",
    title: "Powers of Attorney: A Client-Facing Primer",
    category: "Estate Planning",
    excerpt:
      "Plain-language talking points to help clients understand enduring power of attorney and when to set one up.",
    updatedAt: "2026-06-15",
  },
  {
    _id: "6",
    title: "Income Protection vs TPD: Choosing the Right Cover",
    category: "Insurance",
    excerpt:
      "Side-by-side guidance on when to recommend income protection, TPD, or both, based on client circumstances.",
    updatedAt: "2026-06-02",
  },
];

const AdviserKnowledgeBase = () => {
  const [searchText, setSearchText] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const navigate = useNavigate();

  const fetchKnowledgeEntries = async () => {
    try {
      const res = await get("/knowledgeBase/getAll");
      console.log("Fetched knowledge entries:", res.data);
      const data = res?.data || [];
      setEntries(Array.isArray(data) && data.length ? data : FALLBACK_ARTICLES);
    } catch (err) {
      console.error("Failed to fetch library indices", err);
      setEntries(FALLBACK_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entries.length === 0) {
      fetchKnowledgeEntries();
    }
  }, []);

  const filteredArticles = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((item) =>
      [item.title, item.category, item.excerpt]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [entries, searchText]);

  return (
    <div style={{ padding: "24px 8px" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          Knowledge Base
        </Title>
        <Text type="secondary">
          Reference guides, checklists, and best practice notes for advisers.
        </Text>
      </div>

      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 16 }}>
        <Input
          size="large"
          placeholder="Search topics, subcategories, and en..."
          prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{
            maxWidth: 480,
            borderRadius: 8,
          }}
        />
        <Badge count={filteredArticles.length} showZero style={{ backgroundColor: "#1890ff" }}>
          <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13 }}>
            Entries
          </Tag>
        </Badge>
      </div>

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
      ) : filteredArticles.length === 0 ? (
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
          {filteredArticles.map((item) => {
            const accent = CATEGORY_COLORS[item.category] || "#22c55e";
            return (
              <Col xs={24} sm={12} lg={8} key={item._id}>
                <Card
                  hoverable
                  onClick={() =>
                    navigate(`/user/strategy/knowledge-base/${item._id}`)
                  }
                  style={{
                    borderRadius: 12,
                    height: "100%",
                    border: "1px solid #f0f0f0",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                  styles={{ body: { padding: 20 } }}
                >
                  {/* Category Tag at top */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Tag
                      color={accent}
                      style={{
                        margin: 0,
                        borderRadius: 20,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 14px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {item.category || "General"}
                    </Tag>
                    {item.entryCount && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.entryCount} entries
                      </Text>
                    )}
                  </div>

                  {/* Title */}
                  <Title
                    level={5}
                    style={{
                      marginBottom: 10,
                      fontSize: 16,
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.title}
                  </Title>

                  {/* Excerpt/Description */}
                  <Paragraph
                    type="secondary"
                    style={{
                      fontSize: 13,
                      marginBottom: 16,
                      lineHeight: 1.6,
                      color: "#6b7280",
                    }}
                    ellipsis={{ rows: 2 }}
                  >
                    {item.excerpt || item.description || "No description available"}
                  </Paragraph>

                  {/* Footer with date and file icon */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f3f4f6",
                      paddingTop: 12,
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <FileTextOutlined
                        style={{
                          fontSize: 14,
                          color: accent,
                          opacity: 0.7,
                        }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.documentsCount || 0} docs
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Updated{" "}
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </Text>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default AdviserKnowledgeBase;