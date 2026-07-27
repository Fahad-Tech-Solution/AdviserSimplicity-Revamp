import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Space, Typography, Flex, Skeleton, Empty, Row, Col } from 'antd';
import {
  SoundOutlined,
  MailOutlined,
  BulbOutlined,
  EyeOutlined,
  SmileOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useSearchParams, Link } from 'react-router-dom';
import { useTextToSpeech } from '../../../../../hooks/useTextToSpeech';
import { HiMiniArrowPath } from "react-icons/hi2";

const { Text, Paragraph } = Typography;

const ArticleDetailPage = ({
  loading,
  filteredArticles = [],
  CATEGORY_COLORS = {},
  topicAndSubCategories = [],
}) => {
  const [searchParams] = useSearchParams();
  const [activeMode, setActiveMode] = useState('main'); // "main" | "analogy" | "example" | "simpler"

  // Inject Global Speech Functionality
  const { speechState, speak, toggle, stop } = useTextToSpeech();


  // Read URL query parameters
  const topic = searchParams.get('topic');
  const subCategory = searchParams.get('subCategory');
  const articleId = searchParams.get('id');

  // Find the target article from filteredArticles
  const article = filteredArticles.find((art) => {
    if (articleId) return art._id === articleId || art.id === articleId;

    // Fallback matching by topic and subcategory if ID is not directly passed
    const matchesTopic = !topic || art.topic === topic;
    const matchesSub = !subCategory || art.subcategory === subCategory || art.Subcategory === subCategory;
    return matchesTopic && matchesSub;
  });

  // Category Color Accent (uses prop with fallback green)
  const categoryColor = CATEGORY_COLORS[article?.cat] || '#22c55e';

  // 1. Skeleton Loading State
  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '10px' }}>
        <Skeleton.Button active size="small" style={{ width: 120, marginBottom: 16 }} />
        <Card style={{ borderRadius: 16, padding: '20px' }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  // 2. Empty / Not Found State
  if (!article) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
        <Link
          to={`/user/strategy/knowledge-base/sub?topic=${encodeURIComponent(topic || '')}`}
          style={{ color: '#22c55e', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
        >
          ← Back to articles
        </Link>
        <Empty description="Article not found" style={{ marginTop: 60 }} />
      </div>
    );
  }

  // 3. Main Rendered Content
  const mainContent =
    activeMode === 'analogy' && article.analogy
      ? article.analogy
      : article.explanation;




  return (
    <div style={{ padding: '10px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Navigation Back Link */}
      <Link
        to={`/user/strategy/knowledge-base/sub?topic=${encodeURIComponent(
          article.topic || topic || ''
        )}&subCategory=${encodeURIComponent(article.subcategory || subCategory || '')}`}
        style={{
          color: '#22c55e',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 12,
          fontWeight: 500,
        }}
      >
        ← Back to subcategory
      </Link>

      <Card
        style={{
          borderRadius: 16,
          borderColor: '#22c55e',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
        styles={{ body: { padding: '28px' } }}
      >
        {/* Header Row */}
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <Space align="center" size={8}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: categoryColor,
              }}
            >
              ANSWER
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
              {article.title}
            </Text>
          </Space>

          {/* Action Buttons */}
          <Space size={8}>
            {/* Play / Pause / Resume Button */}
            {speechState == "stopped" ?
              <Button
                icon={
                  <HiMiniArrowPath />
                }
                onClick={async () => { await stop(); toggle(article.explanation, article.title) }}
                style={{
                  backgroundColor: '#fff',
                  color: '#1e293b',
                  border: "1px solid #1e293b",
                  borderRadius: 6,
                  fontSize: 12,
                  height: 32,
                }}
              >
                Again
              </Button>

              :
              <Button
                icon={
                  speechState === 'speaking' ? (
                    <StopOutlined />
                  ) : (
                    <SoundOutlined />
                  )
                }
                onClick={() => speechState === 'speaking' ? stop() : toggle(article.explanation, article.title)}
                style={{
                  backgroundColor: speechState === 'speaking' ? '#ca043f' : '#1e293b',
                  color: '#ffffff',
                  borderRadius: 6,
                  fontSize: 12,
                  height: 32,
                }}
              >
                {speechState === 'speaking' ? 'Stop' : 'Read aloud'}
              </Button>
            }

            <Button
              icon={<MailOutlined />}
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                borderRadius: 6,
                fontSize: 12,
                height: 32,
              }}
            >
              Email
            </Button>
          </Space>
        </Flex>

        {/* Main Body Text */}
        <Paragraph
          style={{
            fontSize: 14.5,
            lineHeight: 1.6,
            color: '#334155',
            marginBottom: 24,
            whiteSpace: 'pre-line',
          }}
        >
          {mainContent}
        </Paragraph>

        {/* Snippet Section */}
        {article.snippet && (
          <div style={{ marginBottom: 20 }}>
            <Space align="center" style={{ marginBottom: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: categoryColor,
                }}
              />
              <Text style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                How it works
              </Text>
            </Space>
            <Paragraph style={{ color: '#475569', fontSize: 13.5, margin: 0, paddingLeft: 16 }}>
              {article.snippet}
            </Paragraph>
          </div>
        )}

        {/* Example / Analogy Section */}
        {article.analogy && (
          <div style={{ marginBottom: 20 }}>
            <Space align="center" style={{ marginBottom: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: categoryColor,
                }}
              />
              <Text style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                Example Strategy
              </Text>
            </Space>
            <Paragraph style={{ color: '#475569', fontSize: 13.5, margin: 0, paddingLeft: 16 }}>
              {article.analogy.slice(0, 300)}...
            </Paragraph>
          </div>
        )}

        {/* StatBoxes Table */}
        {article.statBoxes && article.statBoxes.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Space align="center" style={{ marginBottom: 10 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: categoryColor,
                }}
              />
              <Text style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                Quick Reference Guide
              </Text>
            </Space>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 8,
                border: '1px solid #f1f5f9',
                padding: '4px 16px',
              }}
            >
              {article.statBoxes.map((box, idx) => (
                <Row
                  key={idx}
                  gutter={[24, 24]}
                  className={`py-1 ${idx !== article.statBoxes.length - 1 && 'border-bottom'}`}
                >
                  <Col sm={12} className='py-1'>
                    <Text style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                      {box.key}
                    </Text>
                  </Col>
                  <Col sm={12} className='py-1'>
                    <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
                      {box.value}
                    </Text>
                  </Col>
                </Row>
              ))}
            </div>
          </div>
        )}

        {/* Important Warning Callout */}
        <div style={{ marginBottom: 18 }}>
          <Space align="center" style={{ marginBottom: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: categoryColor,
              }}
            />
            <Text style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
              Important
            </Text>
          </Space>
          <div
            style={{
              backgroundColor: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: 8,
              padding: '14px 18px',
              color: '#854d0e',
              fontSize: 13.5,
            }}
          >
            For any client considering strategy execution, consultation with an accountant & financial adviser is recommended.
          </div>
        </div>

        {/* WANT ME TO Section */}
        <div style={{ border: '1px dashed #cbd5e1', borderRadius: "12px", padding: "10px", marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.8px',
              color: '#64748b',
              display: 'block',
              marginBottom: 10,
            }}
          >
            WANT ME TO...
          </Text>
          <Space size={10} wrap>
            <Button
              icon={"💡"}
              onClick={() => setActiveMode(activeMode === 'analogy' ? 'main' : 'analogy')}
              className={`want-me-to ${activeMode === 'analogy' && "active"}`}
            >
              Give an analogy
            </Button>
            <Button
              icon={"📊"}
              onClick={() => setActiveMode(activeMode === 'example' ? 'main' : 'example')}
              className={`want-me-to ${activeMode === 'example' && "active"}`}
            >
              Show an example
            </Button>
            <Button
              icon={"✨"}
              onClick={() => setActiveMode(activeMode === 'simpler' ? 'main' : 'simpler')}
              className={`want-me-to ${activeMode === 'simpler' && "active"}`}
            >
              Make it simpler
            </Button>
          </Space>
        </div>

        {/* Related Keywords */}
        {article.keywords && article.keywords.length > 0 && (
          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 16 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.8px',
                color: '#64748b',
                display: 'block',
                marginBottom: 10,
              }}
            >
              RELATED TOPICS
            </Text>
            <Space size={8} wrap>
              {article.keywords.slice(0, 6).map((kw, idx) => (
                <Tag
                  key={idx}
                  className={`related-topic`}
                // style={{
                //   borderRadius: 16,
                //   border: '1px solid #bbf7d0',
                //   backgroundColor: '#ffffff',
                //   color: '#166534',
                //   padding: '4px 12px',
                //   fontSize: 12,
                // }}
                >
                  {kw}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ArticleDetailPage;