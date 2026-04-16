import { Button, Col, Form, Row, Select, Tabs } from "antd";
import { useAtomValue } from "jotai";
import React, { useMemo, useState } from "react";
import { discoveryDataAtom } from "../../../../../../store/authState.js";
import EditableDynamicTable from "../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { GoArrowUpRight } from "react-icons/go";
import PersonalInsuranceGroupCoverModal from "./PersonalInsuranceGroupCoverModal.jsx";
import { renderModalContent } from "../../../../../Common/renderModalContent.jsx";
import AppModal from "../../../../../Common/AppModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function OwnerTabContent({ form, ownerKey, ownerLabel, editing }) {
  let [openModal, setOpenModal] = useState(false);
  let [modalData, setModalData] = useState(null);

  const columns = [];

  const rows = useMemo(() => {
    return [];
  }, []);

  const onOpenGroupCover = () => {
    setOpenModal(true);
    setModalData({
      title: ownerLabel + "_Group Cover Details",
      component: PersonalInsuranceGroupCoverModal,
      icon: "🏢",
      key: "groupCover",
      width: 1000,
      parentForm: form,
      closeModal: () => setOpenModal(false),
    });
  };

  return (
    <Row gutter={[16, 0]}>
      <AppModal
        open={openModal}
        onClose={modalData?.closeModal}
        title={modalData?.title}
        width={modalData?.width}
      >
        {renderModalContent(modalData)}
      </AppModal>

      <Col xs={24} md={6}>
        <Form.Item name="NumberOfMaps" label="Number of Maps">
          <Select
            options={Array.from({ length: 10 }, (_, index) => ({
              value: index + 1,
              label: index + 1,
            }))}
            disabled={!editing}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Insurance Cover (Group) :" name="groupCover">
          <Button
            key="groupCover"
            type={"primary"}
            size={"small"}
            style={{ width: "40%", padding: 0 }}
            onClick={() => onOpenGroupCover(ownerKey)}
          >
            <GoArrowUpRight />
          </Button>
        </Form.Item>
      </Col>
      <Col xs={24} md={24}>
        <EditableDynamicTable
          form={form}
          editing={editing}
          columns={columns}
          data={rows}
          tableProps={TABLE_PROPS}
        />
      </Col>
    </Row>
  );
}

export default function PersonalInsuranceModal({ modalData }) {
  const discoveryData = useAtomValue(discoveryDataAtom);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("client");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName ||
    discoveryData?.personaldetails?.client?.clientPreferredName ||
    "Client";

  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName ||
    discoveryData?.personaldetails?.partner?.partnerPreferredName ||
    "Partner";

  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  let PersonalInsuranceData = discoveryData?.personalInsurance || {};

  const superAnnuationIssues =
    discoveryData?.superAnnuationIssues &&
    Object.keys(discoveryData?.superAnnuationIssues).length > 0
      ? discoveryData.superAnnuationIssues
      : { client: [], joint: [], partner: [] };

  const groupInsuranceDetailsAll = ["client", "partner", "joint"].reduce(
    (acc, key) => {
      acc[key] = (superAnnuationIssues[key] || [])
        .filter((item) => item.groupInsurance === "Yes")
        .map((item) => item || {});
      return acc;
    },
    {},
  );

  let initialValues = useMemo(() => {
    let groupCoverDetails = groupInsuranceDetailsAll[activeTab]?.[0] || {};
    return {
      numberOfPolicies:
        PersonalInsuranceData?.[activeTab]?.numberOfPolicies || 0,
      policies: PersonalInsuranceData?.[activeTab]?.PersonalInsurance || [],
      groupCover: groupCoverDetails || {},
    };
  }, [PersonalInsuranceData, activeTab]);

  const handleFinish = async (values) => {
    console.log(values);
  };

  return (
    <div style={{ padding: 0 }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        requiredMark={false}
        colon={false}
        layout="horizontal"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={24}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "client",
                  label: clientName,
                  children: (
                    <OwnerTabContent
                      form={form}
                      ownerKey="client"
                      ownerLabel={clientName}
                      editing={editing}
                    />
                  ),
                },
                ...(allowPartner
                  ? [
                      {
                        key: "partner",
                        label: partnerName,
                        children: (
                          <OwnerTabContent
                            form={form}
                            ownerKey="partner"
                            ownerLabel={partnerName}
                            editing={editing}
                          />
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Col>
          <Col xs={24}>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
              {!editing ? (
                <Button
                  key="edit"
                  type="primary"
                  htmlType="button"
                  onClick={() => setEditing(true)}
                >
                  Edit <RiEdit2Fill />
                </Button>
              ) : (
                <Button
                  key="save"
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  disabled={saving}
                >
                  Save
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
