import { useAtomValue, useSetAtom } from "jotai";
import { Button, Col, Form, Row, Select, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal.jsx";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import SwitchPopupDisplay from "../../../../../../Common/SwitchPopupDisplay.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import useApi from "../../../../../../../hooks/useApi.js";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import ContributionsModal from "../../../FinancialInvestments/components/SuperFunds/ContributionsModal.jsx";

import SMSFAccumulationBenefitsModal from "./SMSFAccumulationBenefitsModal.jsx";
import BeneficiariesModal from "../../../FinancialInvestments/components/SuperFunds/BeneficiariesModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function buildRowForMember(sectionData, member) {
  const details = Array.isArray(sectionData?.[member])
    ? sectionData[member][0] || {}
    : {};
  return {
    member,
    accumulationBenefits: details?.accumulationBenefits || "",
    accumulationBenefitsArray: details?.accumulationBenefitsArray || {},
    contributions: details?.contributions || "No",
    contributionsArray: Array.isArray(details?.contributionsArray)
      ? details.contributionsArray
      : [],
    contributionsStartYear: details?.contributionsStartYear || undefined,
    nominatedBeneficiaries: details?.nominatedBeneficiaries || "No",
    nominatedBeneficiariesDetails: details?.nominatedBeneficiariesDetails || {},
  };
}

function buildRowsForMembers(selectedMembers, sectionData) {
  return (selectedMembers || []).map((member) =>
    buildRowForMember(sectionData, member),
  );
}

function hasMeaningfulValues(initialValues = {}) {
  const rows = initialValues?.smsfAccumulation || [];
  return (
    (initialValues?.selectedMembers || []).length > 0 ||
    rows.some((row) =>
      [
        row?.accumulationBenefits,
        row?.contributions,
        row?.nominatedBeneficiaries,
      ].some((value) => String(value ?? "").trim() !== "" && value !== "No"),
    )
  );
}

export default function SMSFAccumulationAccount({ modalData }) {
  const [form] = Form.useForm();
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);

  const sectionKey = modalData?.key || "SMSFAccumulationDetails";
  const sectionData = discoveryData?.[sectionKey] || {};
  const showPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );
  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName || "Client";
  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName || "Partner";

  const memberLabel = useCallback(
    (member) => (member === "partner" ? partnerName : clientName),
    [clientName, partnerName],
  );

  const initialMembers = useMemo(() => {
    const savedMembers = Array.isArray(sectionData?.member)
      ? sectionData.member
      : [];
    const filteredSaved = showPartner
      ? savedMembers
      : savedMembers.filter((member) => member === "client");

    if (filteredSaved.length > 0) {
      return filteredSaved;
    }

    return ["client"];
  }, [sectionData?.member, showPartner]);

  const initialValues = useMemo(
    () => ({
      selectedMembers: initialMembers,
      smsfAccumulation: buildRowsForMembers(initialMembers, sectionData),
    }),
    [initialMembers, sectionData],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?.clientFK || !hasMeaningfulValues(initialValues));
  }, [form, initialValues, sectionData?.clientFK]);

  const selectedMembersWatch = Form.useWatch("selectedMembers", form);
  const accumulationRowsWatch = Form.useWatch("smsfAccumulation", form);

  const selectedMembers =
    Array.isArray(selectedMembersWatch) && selectedMembersWatch.length > 0
      ? selectedMembersWatch
      : initialValues.selectedMembers || [];

  const accumulationRows =
    Array.isArray(accumulationRowsWatch) && accumulationRowsWatch.length > 0
      ? accumulationRowsWatch
      : initialValues.smsfAccumulation || [];

  const memberOptions = useMemo(() => {
    const options = [{ value: "client", label: clientName }];
    if (showPartner) {
      options.push({ value: "partner", label: partnerName });
    }
    return options;
  }, [clientName, partnerName, showPartner]);

  const handleMemberSelectionChange = useCallback(
    (nextMembers) => {
      const list = Array.isArray(nextMembers) ? nextMembers : [];
      const currentRows = form.getFieldValue("smsfAccumulation") || [];

      const rowsByMember = new Map(
        currentRows.map((row) => [row?.member, row]),
      );

      const nextRows = list.map((member) => {
        const existingRow = rowsByMember.get(member);
        return existingRow || buildRowForMember(sectionData, member);
      });

      form.setFieldValue("selectedMembers", list);
      form.setFieldValue("smsfAccumulation", nextRows);
    },
    [form, sectionData],
  );

  const openDetailModal = useCallback(
    (type, { record, form: currentForm }) => {
      const rowValues = currentForm.getFieldValue(record?.formPath) || {};
      const memberName = memberLabel(rowValues?.member);

      const detailMap = {
        accumulationBenefits: {
          title: `${memberName}_Accumulation Benefits`,
          width: 1280,
          component: <SMSFAccumulationBenefitsModal />,
        },
        contributions: {
          title: `${memberName}_Contributions`,
          width: 1000,
          component: <ContributionsModal />,
        },
        nominatedBeneficiaries: {
          title: `${memberName}_Beneficiaries`,
          width: 800,
          component: <BeneficiariesModal />,
        },
      };

      setDetailModalOpen(true);
      setDetailModalData({
        parentForm: currentForm,
        fieldPath: record?.formPath || [],
        initialValues: rowValues,
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
        ...(detailMap[type] || {}),
      });
    },
    [memberLabel],
  );

  const rows = useMemo(
    () =>
      selectedMembers.map((member, index) => ({
        key: `smsf-accumulation-${member}-${index}`,
        rowNumber: index + 1,
        formPath: ["smsfAccumulation", index],
        member,
        memberDisplay: memberLabel(member),
        accumulationBenefits:
          accumulationRows?.[index]?.accumulationBenefits || "",
        contributions: accumulationRows?.[index]?.contributions || "No",
        nominatedBeneficiaries:
          accumulationRows?.[index]?.nominatedBeneficiaries || "No",
      })),
    [accumulationRows, memberLabel, selectedMembers],
  );

  const columns = useMemo(
    () => [
      {
        title: "No#",
        dataIndex: "rowNumber",
        key: "rowNumber",
        width: 60,
        editable: false,
      },
      {
        title: "Member",
        dataIndex: "memberDisplay",
        key: "memberDisplay",
        editable: false,
      },
      {
        title: "Accumulation Benefits",
        dataIndex: "accumulationBenefits",
        key: "accumulationBenefits",
        field: "accumulationBenefits",
        disabled: true,
        type: "input-action",
        placeholder: "Accumulation Benefits",
        action: {
          name: "Open Accumulation Benefits",
          onClick: (payload) =>
            openDetailModal("accumulationBenefits", payload),
        },
      },
      {
        title: "Contributions",
        dataIndex: "contributions",
        key: "contributions",
        field: "contributions",
        type: "yesNoSwitchWithButton",
        action: {
          name: "Open Contributions",
          onClick: (payload) => openDetailModal("contributions", payload),
        },
        renderView: ({ value, record }) => (
          <SwitchPopupDisplay
            value={value}
            onClick={() => openDetailModal("contributions", { record, form })}
          />
        ),
      },
      {
        title: "Beneficiaries",
        dataIndex: "nominatedBeneficiaries",
        key: "nominatedBeneficiaries",
        field: "nominatedBeneficiaries",
        type: "yesNoSwitchWithButton",
        action: {
          name: "Open Beneficiaries",
          onClick: (payload) =>
            openDetailModal("nominatedBeneficiaries", payload),
        },
        renderView: ({ value, record }) => (
          <SwitchPopupDisplay
            value={value}
            onClick={() =>
              openDetailModal("nominatedBeneficiaries", { record, form })
            }
          />
        ),
      },
    ],
    [form, openDetailModal],
  );

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const members = Array.isArray(values?.selectedMembers)
      ? values.selectedMembers
      : [];
    const accumulationData = Array.isArray(values?.smsfAccumulation)
      ? values.smsfAccumulation
      : [];

    if (members.length === 0) {
      message.warning("Select at least one member");
      return;
    }

    const payload = {
      ...sectionData,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      member: members,
    };

    members.forEach((member, index) => {
      const row = accumulationData[index] || {};
      const memberPayload = {
        accumulationBenefits: row?.accumulationBenefits || "",
        accumulationBenefitsArray: row?.accumulationBenefitsArray || {},
        contributions: row?.contributions || "No",
        contributionsArray: Array.isArray(row?.contributionsArray)
          ? row.contributionsArray
          : [],
        contributionsStartYear: row?.contributionsStartYear || undefined,
        nominatedBeneficiaries: row?.nominatedBeneficiaries || "No",
        nominatedBeneficiariesDetails: row?.nominatedBeneficiariesDetails || {},
      };

      payload[member] = [memberPayload];
      payload[`${member}Total`] = row?.accumulationBenefits || "";
    });

    if (!members.includes("client")) {
      payload.client = [];
      payload.clientTotal = "";
    }
    if (!members.includes("partner")) {
      payload.partner = [];
      payload.partnerTotal = "";
    }

    try {
      setSaving(true);
      const saved = sectionData?.clientFK
        ? await patch("/api/SMSFAccumulationDetails/Update", payload)
        : await post("/api/SMSFAccumulationDetails/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [sectionKey]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "SMSF accumulation account"} saved successfully`,
      );
      setEditing(false);
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to save ${modalData?.title || "SMSF accumulation account"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailModalData?.title}
        width={detailModalData?.width || 1000}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

      <Form
        form={form}
        initialValues={initialValues}
        requiredMark={false}
        colon={false}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Form.Item label="Members of SMSF" name="selectedMembers">
              <Select
                mode="multiple"
                placeholder="Select members"
                disabled={!editing}
                options={memberOptions}
                onChange={handleMemberSelectionChange}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={rows}
              tableProps={TABLE_PROPS}
            />
          </Col>

          <Col xs={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Space>
                <Button onClick={() => modalData?.closeModal?.()}>
                  Cancel
                </Button>
                {!editing ? (
                  <Button
                    type="primary"
                    htmlType="button"
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="button"
                    loading={saving}
                    disabled={saving}
                    onClick={handleConfirmAndExit}
                  >
                    Confirm and Exit
                  </Button>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
