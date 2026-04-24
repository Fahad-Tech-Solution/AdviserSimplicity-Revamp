import { Button, Col, Form, Row, Select, Space, message } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal.jsx";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import useApi from "../../../../../../../hooks/useApi.js";
import SmsfPensionAccountsInnerModal from "./SmsfPensionAccountsInnerModal.jsx";

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

function getMemberRowFromPhase(phase, member) {
  const list = phase?.[member];
  if (Array.isArray(list) && list.length > 0) {
    return list[0];
  }
  return {};
}

function buildPensionDataForMembers(selectedMembers, phase) {
  return (selectedMembers || []).map((member) => {
    const saved = getMemberRowFromPhase(phase, member);
    return {
      member,
      pensionBenefitsTotal: saved?.pensionBenefitsTotal || "",
      pensionBenefitsTotalArray: saved?.pensionBenefitsTotalArray || [],
    };
  });
}

function hasPensionSectionData(phase = {}) {
  if (phase?.member?.length) return true;
  return ["client", "partner", "joint"].some((key) => {
    const arr = phase?.[key];
    return Array.isArray(arr) && arr.length > 0;
  });
}

export default function PensionAccountModal({ modalData }) {
  const [form] = Form.useForm();
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [accountsModalData, setAccountsModalData] = useState(null);

  const sectionKey = modalData?.key || "SMSFPensionPhase";
  const sectionData = discoveryData?.[sectionKey] || {};
  const phase = sectionData;

  const showPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName || "Client";
  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName || "Partner";

  const memberLabel = useCallback(
    (member) => {
      if (member === "client") return clientName;
      if (member === "partner") return partnerName;
      if (member === "joint") return `${clientName} & ${partnerName}`;
      return member;
    },
    [clientName, partnerName],
  );

  const selectedMembersWatch = Form.useWatch("selectedMembers", form);
  const pensionDataWatch = Form.useWatch("pensionData", form);

  const initialMembers = useMemo(() => {
    let members = phase?.member?.length ? [...phase.member] : ["client"];
    if (!showPartner) {
      members = members.filter((m) => m !== "partner");
    }
    return members.length ? members : ["client"];
  }, [phase?.member, showPartner]);

  const initialValues = useMemo(
    () => ({
      selectedMembers: initialMembers,
      pensionData: buildPensionDataForMembers(initialMembers, phase),
    }),
    [initialMembers, phase],
  );

  const selectedMembers =
    Array.isArray(selectedMembersWatch) && selectedMembersWatch.length > 0
      ? selectedMembersWatch
      : initialValues.selectedMembers || [];

  const pensionData =
    Array.isArray(pensionDataWatch) && pensionDataWatch.length > 0
      ? pensionDataWatch
      : initialValues.pensionData || [];

  useEffect(() => {
    form.setFieldsValue(initialValues);
    const hasData = hasPensionSectionData(phase);
    const rowsMeaningful = (initialValues.pensionData || []).some(
      (row) =>
        (row?.pensionBenefitsTotalArray || []).length > 0 ||
        String(row?.pensionBenefitsTotal || "").trim() !== "",
    );
    setEditing(!sectionData?.clientFK || !hasData || !rowsMeaningful);
  }, [form, initialValues, phase, sectionData?.clientFK]);

  const handleMemberSelectionChange = useCallback(
    (nextMembers) => {
      const list = nextMembers || [];
      const current = form.getFieldValue("pensionData") || [];
      const phaseNow = discoveryData?.[sectionKey] || {};

      const filtered = current.filter((row) => list.includes(row.member));
      const nextPensionData = [...filtered];
      list.forEach((member) => {
        if (!nextPensionData.some((row) => row.member === member)) {
          const saved = getMemberRowFromPhase(phaseNow, member);
          nextPensionData.push({
            member,
            pensionBenefitsTotal: saved?.pensionBenefitsTotal || "",
            pensionBenefitsTotalArray: saved?.pensionBenefitsTotalArray || [],
          });
        }
      });
      const ordered = list
        .map((m) => nextPensionData.find((r) => r.member === m))
        .filter(Boolean);

      form.setFieldValue("selectedMembers", list);
      form.setFieldValue("pensionData", ordered);
    },
    [discoveryData, form, sectionKey],
  );

  const openAccountsModal = useCallback(
    (memberIndex) => {
      const members = form.getFieldValue("selectedMembers") || [];
      const member = members[memberIndex];
      const row = form.getFieldValue(["pensionData", memberIndex]) || {};
      setAccountsModalData({
        component: <SmsfPensionAccountsInnerModal />,
        title: `${memberLabel(member)}_Pension Benefits`,
        width: 700,
        memberIndex,
        memberLabel: memberLabel(member),
        parentForm: form,
        initialAccounts: row?.pensionBenefitsTotalArray || [],
        closeModal: () => {
          setAccountsModalOpen(false);
          setEditing(true);
        },
      });
      setAccountsModalOpen(true);
    },
    [form, memberLabel],
  );

  const rows = useMemo(() => {
    const members = selectedMembers || [];
    return members.map((member, index) => ({
      key: `smsf-pension-phase-${member}-${index}`,
      formPath: ["pensionData", index],
      memberIndex: index,
      memberDisplay: memberLabel(member),
      pensionBenefitsTotal: pensionData?.[index]?.pensionBenefitsTotal || "",
    }));
  }, [memberLabel, pensionData, selectedMembers]);

  const columns = useMemo(
    () => [
      {
        title: "Member",
        dataIndex: "memberDisplay",
        key: "memberDisplay",
        editable: false,
      },
      {
        title: "Pension Benefits",
        dataIndex: "pensionBenefitsTotal",
        key: "pensionBenefitsTotal",
        field: "pensionBenefitsTotal",
        disabled: true,
        type: "input-action",
        placeholder: "Pension Benefits",
        action: {
          name: "Open pension accounts",
          onClick: ({ record }) => openAccountsModal(record?.memberIndex ?? 0),
        },
      },
    ],
    [openAccountsModal],
  );

  const memberOptions = useMemo(() => {
    const opts = [{ value: "client", label: clientName }];
    if (showPartner) opts.push({ value: "partner", label: partnerName });
    return opts;
  }, [clientName, partnerName, showPartner]);

  const handleFinish = async () => {
    const values = form.getFieldsValue(true);

    if (!(values.selectedMembers || []).length) {
      message.warning("Select at least one member");
      return;
    }

    const pensionData = values.pensionData || [];
    const submissionData = {
      ...sectionData,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      member: values.selectedMembers || [],
    };

    pensionData.forEach((item) => {
      const newEntry = {
        pensionBenefitsTotal: item.pensionBenefitsTotal || "",
        pensionBenefitsTotalArray: item.pensionBenefitsTotalArray || [],
      };
      if (item.member === "client") submissionData.client = [newEntry];
      else if (item.member === "partner") submissionData.partner = [newEntry];
      else if (item.member === "joint") submissionData.joint = [newEntry];
    });

    if (submissionData.client) {
      submissionData.clientTotal = toCommaAndDollar(
        submissionData.client.reduce(
          (total, entry) =>
            total + parseCurrencyValue(entry?.pensionBenefitsTotal),
          0,
        ),
      );
    }
    if (submissionData.partner) {
      submissionData.partnerTotal = toCommaAndDollar(
        submissionData.partner.reduce(
          (total, entry) =>
            total + parseCurrencyValue(entry?.pensionBenefitsTotal),
          0,
        ),
      );
    }
    if (submissionData.joint) {
      submissionData.jointTotal = toCommaAndDollar(
        submissionData.joint.reduce(
          (total, entry) =>
            total + parseCurrencyValue(entry?.pensionBenefitsTotal),
          0,
        ),
      );
    }

    try {
      setSaving(true);
      const saved = sectionData?.clientFK
        ? await patch(`/api/${sectionKey}/Update`, submissionData)
        : await post(`/api/${sectionKey}/Add`, submissionData);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [sectionKey]: saved || submissionData,
      }));

      message.success(
        `${modalData?.title || "Pension account"} saved successfully`,
      );
      setEditing(false);
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to save ${modalData?.title || "pension account"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <AppModal
        open={accountsModalOpen}
        onClose={() => setAccountsModalOpen(false)}
        title={accountsModalData?.title || "Pension accounts"}
        width={accountsModalData?.width || 1200}
      >
        {renderModalContent(accountsModalData)}
      </AppModal>

      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
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
          <Col xs={24} md={14}>
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
                    onClick={(e) => {
                      e?.preventDefault?.();
                      e?.stopPropagation?.();
                      form.submit();
                    }}
                  >
                    Save
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
