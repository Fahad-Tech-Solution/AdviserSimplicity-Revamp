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
import { Route, Router, Routes, useNavigate } from "react-router-dom";
import useApi from "../../../../hooks/useApi";
import { BsHouse } from "react-icons/bs";

import "./KnowledgeBaseCss.css"
import { SelectedCategory } from "../../SuperAdmin/KnowledgeBasePage/knowledgeBaseData";
import { KnowledgeBaseEntriesAtom } from "../../../../store/authState";
import { useAtom } from "jotai";
import BaseTypes from "./components/BaseTypes";
import SubCategoryPage from "./components/SubCategoryPage";
import ArticleDetailView from "./components/ArticleDetailView";
import NattyAiSpeakingCard from "../../../Common/NattyAiSpeakingCard";

const { Title, Text, Paragraph } = Typography;

const topicAndSubCategories = SelectedCategory;


const CATEGORY_COLORS = {
  Compliance: "#f59e0b",
  "Investment Strategy": "#22c55e",
  "Client Communication": "#3b82f6",
  "Estate Planning": "#8b5cf6",
  Superannuation: "#06b6d4",
  Insurance: "#ef4444",
};


const AdviserKnowledgeBase = () => {
  const [searchText, setSearchText] = useState("");
  const [entries, setEntries] = useAtom(KnowledgeBaseEntriesAtom);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const navigate = useNavigate();

  const fetchKnowledgeEntries = async () => {
    try {
      const res = await get("/knowledgeBase/getAll");
      console.log("Fetched knowledge entries:", res.data);
      const data = res?.data || [];
      setEntries(Array.isArray(data) && data.length ? data : []);
    } catch (err) {
      console.error("Failed to fetch library indices", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entries.length === 0) {
      fetchKnowledgeEntries();
    }
    else {
      setLoading(false);
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
  }, [entries]);

  const routesConfig = [
    {
      path: "/",
      component: BaseTypes
    },
    {
      path: "/sub",
      component: SubCategoryPage
    },
    {
      path: "/article",
      component: ArticleDetailView
    }
  ]

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    // Redirect to `/sub` whenever user types and isn't already on `/sub`
    if (value.trim() && !location.pathname.endsWith("/sub")) {
      navigate("/user/strategy/knowledge-base/sub");
    }
  };

  let [readableArticle, setReadableArticle] = useState()

  return (
    <Row gutter={[24, 24]} style={{ padding: "24px 8px" }} className="KnowledgeBasePage">
      <Col
        md={16}
      // md={24}
      >
        <div style={{ marginBottom: 24 }}>
          <Tag className="custom-home-tag"
            icon={
              <BsHouse />
            }
            onClick={() => {
              setSearchText("")
              navigate("/user/strategy/knowledge-base")
            }}
          >
            &nbsp;&nbsp;Main Screen
          </Tag>
        </div>

        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 16 }}>
          <Input
            size="large"
            placeholder="Search topics, subcategories, and en..."
            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
            value={searchText}
            onChange={handleSearchChange}
            allowClear
            style={{
              maxWidth: 480,
              borderRadius: 10,
            }}
          />
          <Badge count={filteredArticles.length} showZero style={{ backgroundColor: "#ff1852" }}>
            <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13 }}>
              Entries
            </Tag>
          </Badge>
        </div>
        <Routes>
          {routesConfig.map((item, index) => {
            // Component variable ki shakal mein
            const Component = item.component;

            return (
              <Route
                key={index}
                path={item.path}
                /* Direct props pass karne ka tareeqa */
                element={<Component
                  loading={loading}
                  filteredArticles={filteredArticles}
                  CATEGORY_COLORS={CATEGORY_COLORS}
                  topicAndSubCategories={topicAndSubCategories}
                  searchText={searchText}
                  setSearchText={setSearchText}
                />}
              />
            );
          })}
        </Routes>

      </Col>
      <Col
        md={8}>
        <NattyAiSpeakingCard
          loading={loading}
          filteredArticles={filteredArticles}
          CATEGORY_COLORS={CATEGORY_COLORS}
          topicAndSubCategories={topicAndSubCategories}
          searchText={searchText}
          setSearchText={setSearchText}
        />
      </Col>
    </Row>
  );
};

export default AdviserKnowledgeBase;