import { Button, Col, Form, message, Row, Select, Space } from "antd";
import dayjs from "dayjs";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { discoveryDataAtom } from "../../../../../../store/authState";
import {
  formatNumber,
  toCommaAndDollar,
} from "../../../../../../hooks/helpers";
import { useOwnerOptions } from "../../../../../../hooks/useUserDashboardData";
import useApi from "../../../../../../hooks/useApi.js";
import EditableDynamicTable from "../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../Common/AppModal.jsx";
import LeaveEntitlements from "./LeaveEntitlements.jsx";
import SalaryDetail from "./SalaryDetail.jsx";
import SalaryPackageModal from "./SalaryPackageModal.jsx";
import { renderModalContent } from "../../../../../Common/renderModalContent.jsx";

const OWNER_SELECT_CLASS = "employment-owner-select";
const EMPLOYMENT_STATUS_OPTIONS = [
  "Full Time",
  "Part Time",
  "Casual",
  "Contract",
  "On Leave",
];

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function toDayjsValue(value) {
  if (!value) return undefined;
  const date = dayjs(value);
  return date.isValid() ? date : undefined;
}

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function parseDigitsValue(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function buildInitialPerson(person = {}, totalValue = "") {
  return {
    occupation: person?.occupation || "",
    employmentStatus: person?.employmentStatus || undefined,
    nameOfCompany: person?.nameOfCompany || "",
    startDate: toDayjsValue(person?.startDate),
    hoursWorked: person?.hoursWorked
      ? formatNumber(Number(person.hoursWorked))
      : "",
    grossSalary: formatCurrencyValue(
      person?.SalaryPackageModal?.grossSalary || totalValue,
    ),
    SalaryPackageModal: person?.SalaryPackageModal || {},
    salaryPackagingModal: person?.SalaryPackagingModal || {},
    LeaveEntitlementsModal: person?.LeaveEntitlementsModal || {},
    salaryPackagingRadio: person?.salaryPackagingRadio || undefined,
    leaveEntitlementsRadio: person?.leaveEntitlementsRadio || undefined,
    choiceOfFund: person?.choiceOfFund || undefined,
  };
}

function buildInitialValues(sectionData, allowPartner) {
  const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : [];
  const owner = allowPartner
    ? rawOwner
    : rawOwner.filter((value) => value === "client");

  return {
    owner,
    client: buildInitialPerson(sectionData?.client, sectionData?.clientTotal),
    partner: buildInitialPerson(
      sectionData?.partner,
      sectionData?.partnerTotal,
    ),
  };
}

export default function EmploymentModal({ modalData }) {
  const [form] = Form.useForm();
  const ownerOptions = useOwnerOptions();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openModalData, setOpenModalData] = useState(null);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);

  const EMPLOYMENT_TABLE_COLUMNS = [
    { title: "Owner", key: "owner", kind: "owner", width: 120 },
    {
      title: "Occupation",
      key: "occupation",
      dataIndex: "occupation",
      field: "occupation",
      type: "text",
      width: 140,
    },
    {
      title: "Employment Status",
      key: "employmentStatus",
      dataIndex: "employmentStatus",
      field: "employmentStatus",
      type: "select",
      options: EMPLOYMENT_STATUS_OPTIONS,
      width: 150,
    },
    {
      title: "Name of Company",
      key: "nameOfCompany",
      dataIndex: "nameOfCompany",
      field: "nameOfCompany",
      type: "text",
      width: 160,
    },
    {
      title: "Start Date",
      key: "startDate",
      dataIndex: "startDate",
      field: "startDate",
      type: "date",
      width: 200,
    },
    {
      title: "Hours Worked",
      key: "hoursWorked",
      dataIndex: "hoursWorked",
      field: "hoursWorked",
      type: "number",
      min: 0,
      step: 0.5,
      width: 110,
    },
    {
      title: "Salary Detail",
      key: "grossSalary",
      dataIndex: "grossSalary",
      field: "grossSalary",
      type: "modalPopup",
      action: {
        key: "salaryDetail",
        name: "Open Salary Detail",
        showLabel: false,
        onClick: ({ record, form }) => {
          const ownerKey = record?.formPath;
          const ownerLabel = record?.ownerLabel || ownerKey;

          setOpenModal(true);
          setOpenModalData({
            title: `${ownerLabel} Salary Detail`,
            component: <SalaryDetail />,
            icon: null,
            key: "salaryDetail",
            width: 900,
            closeModal: () => setOpenModal(false),
            parentForm: form,
            ownerKey,
            ownerLabel,
            totalValue: form.getFieldValue([ownerKey, "grossSalary"]) || "",
          });
        },
      },
      width: 120,
    },
    {
      title: "Salary Packaging",
      key: "salaryPackagingRadio",
      dataIndex: "salaryPackagingRadio",
      field: "salaryPackagingRadio",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Salary Packaging",
        key: "salaryPackaging",
        onClick: ({ record, form }) => {
          const ownerKey = record?.formPath;
          const ownerLabel = record?.ownerLabel || ownerKey;

          setOpenModal(true);
          setOpenModalData({
            title: `${ownerLabel} Salary Packaging`,
            component: <SalaryPackageModal />,
            icon: null,
            key: "salaryPackaging",
            width: 900,
            closeModal: () => setOpenModal(false),
            parentForm: form,
            ownerKey,
            ownerLabel,
          });
        },
      },
    },
    {
      title: "Leave Entitlements",
      key: "leaveEntitlementsRadio",
      dataIndex: "leaveEntitlementsRadio",
      field: "leaveEntitlementsRadio",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Leave Entitlements",
        key: "leaveEntitlements",
        onClick: ({ record, form }) => {
          const ownerKey = record?.formPath;
          const ownerLabel = record?.ownerLabel || ownerKey;

          setOpenModal(true);
          setOpenModalData({
            title: `${ownerLabel} Leave Entitlements`,
            component: <LeaveEntitlements />,
            icon: null,
            key: "leaveEntitlements",
            width: 900,
            closeModal: () => setOpenModal(false),
            parentForm: form,
            ownerKey,
            ownerLabel,
          });
        },
      },
    },
    {
      title: "Choice of Fund",
      key: "choiceOfFund",
      dataIndex: "choiceOfFund",
      field: "choiceOfFund",
      type: "yesNoSwitch",
    },
  ];

  const sectionData = discoveryData?.[modalData?.key] || {};
  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const availableOwnerOptions = useMemo(
    () =>
      allowPartner
        ? ownerOptions
        : ownerOptions.filter((option) => option.value === "client"),
    [allowPartner, ownerOptions],
  );
  const initialValues = useMemo(
    () => buildInitialValues(sectionData, allowPartner),
    [allowPartner, sectionData],
  );
  const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;
  const tableColumns = useMemo(
    () =>
      EMPLOYMENT_TABLE_COLUMNS.map((column) =>
        column.kind === "owner"
          ? {
              ...column,
              dataIndex: "ownerLabel",
              editable: false,
            }
          : column,
      ),
    [],
  );
  const rows = useMemo(
    () =>
      (selectedOwners || [])
        .filter((owner) => allowPartner || owner === "client")
        .map((owner) => ({
          key: owner,
          formPath: owner,
          ownerLabel:
            availableOwnerOptions.find((option) => option.value === owner)
              ?.label || owner,
          occupation: form.getFieldValue([owner, "occupation"]),
          employmentStatus: form.getFieldValue([owner, "employmentStatus"]),
          nameOfCompany: form.getFieldValue([owner, "nameOfCompany"]),
          startDate: form.getFieldValue([owner, "startDate"]),
          hoursWorked: form.getFieldValue([owner, "hoursWorked"]),
          grossSalary: form.getFieldValue([owner, "grossSalary"]),
          salaryPackagingRadio: form.getFieldValue([
            owner,
            "salaryPackagingRadio",
          ]),
          leaveEntitlementsRadio: form.getFieldValue([
            owner,
            "leaveEntitlementsRadio",
          ]),
          choiceOfFund: form.getFieldValue([owner, "choiceOfFund"]),
        })),
    [allowPartner, availableOwnerOptions, form, selectedOwners],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    if (!allowPartner && selectedOwners?.includes("partner")) {
      form.setFieldValue(
        "owner",
        selectedOwners.filter((owner) => owner === "client"),
      );
    }
  }, [allowPartner, form, selectedOwners]);

  const handleFinish = async (values) => {
    const owner = Array.isArray(values.owner) ? values.owner : [];
    const clientSelected = owner.includes("client");
    const partnerSelected = allowPartner && owner.includes("partner");

    const nextSectionData = {
      ...sectionData,
      owner,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      client: clientSelected
        ? {
            ...(sectionData?.client || {}),
            occupation: values?.client?.occupation || "",
            employmentStatus: values?.client?.employmentStatus || "",
            nameOfCompany: values?.client?.nameOfCompany || "",
            startDate: values?.client?.startDate?.toISOString?.() || "",
            hoursWorked: parseDigitsValue(values?.client?.hoursWorked),
            choiceOfFund: values?.client?.choiceOfFund || "",
            salaryPackagingRadio: values?.client?.salaryPackagingRadio || "",
            SalaryPackagingModal: {
              ...(sectionData?.client?.SalaryPackagingModal || {}),
              ...(values?.client?.SalaryPackagingModal || {}),
            },
            LeaveEntitlementsModal: {
              ...(sectionData?.client?.LeaveEntitlementsModal || {}),
              ...(values?.client?.LeaveEntitlementsModal || {}),
            },
            leaveEntitlementsRadio:
              values?.client?.leaveEntitlementsRadio || "",
            SalaryPackageModal: {
              ...(sectionData?.client?.SalaryPackageModal || {}),
              ...(values?.client?.SalaryPackageModal || {}),
              grossSalary: formatCurrencyValue(
                values?.client?.SalaryPackageModal?.grossSalary ||
                  values?.client?.grossSalary,
              ),
            },
          }
        : {},
      partner: partnerSelected
        ? {
            ...(sectionData?.partner || {}),
            occupation: values?.partner?.occupation || "",
            employmentStatus: values?.partner?.employmentStatus || "",
            nameOfCompany: values?.partner?.nameOfCompany || "",
            startDate: values?.partner?.startDate?.toISOString?.() || "",
            hoursWorked: parseDigitsValue(values?.partner?.hoursWorked),
            choiceOfFund: values?.partner?.choiceOfFund || "",
            salaryPackagingRadio: values?.partner?.salaryPackagingRadio || "",
            SalaryPackagingModal: {
              ...(sectionData?.partner?.SalaryPackagingModal || {}),
              ...(values?.partner?.SalaryPackagingModal || {}),
            },
            LeaveEntitlementsModal: {
              ...(sectionData?.partner?.LeaveEntitlementsModal || {}),
              ...(values?.partner?.LeaveEntitlementsModal || {}),
            },
            leaveEntitlementsRadio:
              values?.partner?.leaveEntitlementsRadio || "",
            SalaryPackageModal: {
              ...(sectionData?.partner?.SalaryPackageModal || {}),
              ...(values?.partner?.SalaryPackageModal || {}),
              grossSalary: formatCurrencyValue(
                values?.partner?.SalaryPackageModal?.grossSalary ||
                  values?.partner?.grossSalary,
              ),
            },
          }
        : {},
      clientTotal: clientSelected
        ? formatCurrencyValue(
            values?.client?.SalaryPackageModal?.grossSalary ||
              values?.client?.grossSalary,
          )
        : "",
      partnerTotal: partnerSelected
        ? formatCurrencyValue(
            values?.partner?.SalaryPackageModal?.grossSalary ||
              values?.partner?.grossSalary,
          )
        : "",
    };

    console.log("nextSectionData", nextSectionData);

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch("/api/incomeFromOwnBusiness/Update", nextSectionData)
        : await post("/api/incomeFromOwnBusiness/Add", nextSectionData);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || nextSectionData,
      }));

      message.success(
        `${modalData?.title || "Employment"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Employment"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px" }}>
      <AppModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={openModalData?.title || "N/A"}
        width={openModalData?.width || 1000}
      >
        {renderModalContent(openModalData)}
      </AppModal>

      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
        colon={false}
        requiredMark={false}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Owner"
              name="owner"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: "Owner is required" }]}
            >
              <Select
                options={availableOwnerOptions}
                mode="multiple"
                placeholder="Select owner"
                style={{ width: "100%" }}
                styles={{
                  items: {
                    fontSize: "11px",
                  },
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={tableColumns}
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
                    key={"edit"}
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    key={"save"}
                    loading={saving}
                    disabled={saving}
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
