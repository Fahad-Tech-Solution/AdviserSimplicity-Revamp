import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Space, Typography, Flex, Skeleton, Empty } from 'antd';
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

const { Text, Paragraph } = Typography;

const ArticleDetailPage = ({
  loading,
  filteredArticles = [],
  CATEGORY_COLORS = {},
  topicAndSubCategories = [],
}) => {
  const [searchParams] = useSearchParams();
  const [activeMode, setActiveMode] = useState('main'); // "main" | "analogy" | "example" | "simpler"

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

  // Speech State Management
  const [speechState, setSpeechState] = useState('stopped'); // 'speaking' | 'paused' | 'stopped'

  // Clean up speech synthesis when navigating away or unmounting
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle Speech Toggle (Play, Pause, Resume)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window) || !article) return;

    const synth = window.speechSynthesis;

    // 1. If currently PAUSED -> RESUME
    if (speechState === 'paused') {
      synth.resume();
      setSpeechState('speaking');
      return;
    }

    // 2. If currently SPEAKING -> PAUSE
    if (speechState === 'speaking') {
      synth.pause();
      setSpeechState('paused');
      return;
    }

    // 3. If STOPPED -> START FRESH
    synth.cancel(); // Clear any previous queue
    const textToRead =
      activeMode === 'analogy' && article.analogy
        ? article.analogy
        : article.explanation;

    const utterance = new SpeechSynthesisUtterance(textToRead);

    // Reset state back to 'stopped' when reading finishes naturally
    utterance.onend = () => setSpeechState('stopped');
    utterance.onerror = () => setSpeechState('stopped');

    synth.speak(utterance);
    setSpeechState('speaking');
  };

  // Handle Complete Stop
  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeechState('stopped');
    }
  };

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
          borderColor: '#dcfce7',
          backgroundColor: '#fbfdfb',
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
            <Button
              icon={
                speechState === 'speaking' ? (
                  <PauseCircleOutlined />
                ) : speechState === 'paused' ? (
                  <PlayCircleOutlined />
                ) : (
                  <SoundOutlined />
                )
              }
              onClick={handleToggleSpeech}
              style={{
                backgroundColor: speechState === 'paused' ? '#ca8a04' : '#1e293b',
                color: '#ffffff',
                borderRadius: 6,
                fontSize: 12,
                height: 32,
              }}
            >
              {speechState === 'speaking'
                ? 'Pause'
                : speechState === 'paused'
                  ? 'Resume'
                  : 'Read aloud'}
            </Button>

            {/* Optional Stop Button when speech is active or paused */}
            {speechState !== 'stopped' && (
              <Button
                icon={<StopOutlined />}
                onClick={handleStopSpeech}
                danger
                style={{
                  borderRadius: 6,
                  fontSize: 12,
                  height: 32,
                }}
              >
                Stop
              </Button>
            )}
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
                <Flex
                  key={idx}
                  justify="space-between"
                  align="center"
                  style={{
                    padding: '10px 0',
                    borderBottom:
                      idx === article.statBoxes.length - 1
                        ? 'none'
                        : '1px solid #f8fafc',
                  }}
                >
                  <Text style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                    {box.key}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
                    {box.value}
                  </Text>
                </Flex>
              ))}
            </div>
          </div>
        )}

        {/* Important Warning Callout */}
        <div style={{ marginBottom: 28 }}>
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
        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 18, marginBottom: 20 }}>
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
              icon={<BulbOutlined />}
              onClick={() => setActiveMode(activeMode === 'analogy' ? 'main' : 'analogy')}
              style={{
                borderRadius: 20,
                borderColor: activeMode === 'analogy' ? '#22c55e' : '#bbf7d0',
                backgroundColor: activeMode === 'analogy' ? '#f0fdf4' : '#ffffff',
                color: '#15803d',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Give an analogy
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setActiveMode(activeMode === 'example' ? 'main' : 'example')}
              style={{
                borderRadius: 20,
                borderColor: activeMode === 'example' ? '#22c55e' : '#bbf7d0',
                backgroundColor: activeMode === 'example' ? '#f0fdf4' : '#ffffff',
                color: '#15803d',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Show an example
            </Button>
            <Button
              icon={<SmileOutlined />}
              onClick={() => setActiveMode(activeMode === 'simpler' ? 'main' : 'simpler')}
              style={{
                borderRadius: 20,
                borderColor: activeMode === 'simpler' ? '#22c55e' : '#bbf7d0',
                backgroundColor: activeMode === 'simpler' ? '#f0fdf4' : '#ffffff',
                color: '#15803d',
                fontSize: 12,
                fontWeight: 500,
              }}
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
                  style={{
                    borderRadius: 16,
                    border: '1px solid #bbf7d0',
                    backgroundColor: '#ffffff',
                    color: '#166534',
                    padding: '4px 12px',
                    fontSize: 12,
                  }}
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