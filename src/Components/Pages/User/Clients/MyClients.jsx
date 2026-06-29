import { Button, Input, Space } from "antd";
import Text from "antd/es/typography/Text";
import Title from "antd/es/typography/Title";
import React, { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import {
  creatingNewClientAtom,
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
  goalsDataAtom,
  goalsSectionQuestionsAtom,
  MyClientsData,
  riskProfileDataAtom,
  SelectedClient,
} from "../../../../store/authState";
import HouseholdTable from "./HouseholdTable";
import useApi from "../../../../hooks/useApi";

const MyClients = () => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const setMyClientsData = useSetAtom(MyClientsData);
  const setCreatingNewClient = useSetAtom(creatingNewClientAtom);
  const setSelectedClient = useSetAtom(SelectedClient);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const setDiscoverySectionQuestions = useSetAtom(discoverySectionQuestionsAtom);
  const setGoalsData = useSetAtom(goalsDataAtom);
  const setGoalsSectionQuestions = useSetAtom(goalsSectionQuestionsAtom);
  const setRiskProfileData = useSetAtom(riskProfileDataAtom);
  const api = useApi();

  useEffect(() => {
    setCreatingNewClient(false);
  }, [setCreatingNewClient]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get("/user/Clients");
      setMyClientsData(response);
    };
    fetchData();
  });

  const handleAddNewClient = () => {
    setSelectedClient(null);
    setDiscoveryData({});
    setDiscoverySectionQuestions({});
    setGoalsData({});
    setGoalsSectionQuestions({});
    setRiskProfileData({});
    setCreatingNewClient(true);
    navigate("/user/discovery/personal-details");
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Text
            style={{
              display: "block",
              fontSize: 11,
              letterSpacing: 3,
              color: "#22c55e",
              textTransform: "uppercase",
              marginBottom: 6,
              fontWeight: 400,
            }}
          >
            Admin
          </Text>
          <Title
            style={{
              margin: 0,
              fontFamily: "Georgia,serif",
              fontWeight: 500,
              fontSize: 28,
            }}
          >
            My Clients
          </Title>
        </div>
        <div className="">
          <Space size={10}>
            <Input
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              //   prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              prefix={"🔍"}
              style={{ width: 210, borderRadius: 7 }}
            />
            <Button
              type="primary"
              style={{
                borderRadius: 8,
                fontWeight: 700,
                padding: "17px 20px",
                fontSize: 13,
              }}
              onClick={handleAddNewClient}
            >
              Add New +
            </Button>
          </Space>
        </div>
      </div>

      <HouseholdTable searchText={searchText} />
    </div>
  );
};

export default MyClients;
