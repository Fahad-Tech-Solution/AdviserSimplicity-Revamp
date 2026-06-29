import { useAtomValue, useSetAtom } from "jotai";
import { Button, Col, Form, Row, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../Common/AppModal.jsx";
import EditableDynamicTable from "../../../../../Common/EditableDynamicTable.jsx";
import { renderModalContent } from "../../../../../Common/renderModalContent.jsx";
import useApi from "../../../../../../hooks/useApi.js";
import { discoveryDataAtom } from "../../../../../../store/authState.js";
import BusinessTrustTrusteeInnerModal from "../../BusinessEntities/coponents/BusinessTrustSection/BusinessTrustTrusteeInnerModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const TRUST_TYPE_OPTIONS = [
  { value: "Discretionary", label: "Discretionary" },
  { value: "Other", label: "Other" },
];

const TRUSTEE_TYPE_OPTIONS = [
  { value: "Select", label: "Select" },
  { value: "Corporate", label: "Corporate" },
  { value: "Individual", label: "Individual" },
];

function parseDigitsValue(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
  return value?.target?.value ?? value;
}

function normalizeDateValue(value) {
  if (!value) return "";
  if (typeof value?.format === "function") {
    return value.format("DD/MM/YYYY");
  }
  return String(value);
}

function buildEmptyTrustDetails() {
  return {
    trustName: "",
    trustType: undefined,
    ABN: "",
    registeredOffice: "",
    placeOfBusiness: "",
    establishmentDate: "",
    trusteeType: undefined,
    trusteeName: "",
    ACN: "",
    nameOfAccountant: "",
    directorsOfCorporateTrustee: [],
  };
}

function normalizeDirectorRows(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    directorName: String(item?.directorName ?? "").trim(),
  }));
}

function normalizeTrustDetails(entry = {}) {
  return {
    trustName: entry?.trustName || "",
    trustType: entry?.trustType || undefined,
    ABN: parseDigitsValue(entry?.ABN),
    registeredOffice: entry?.registeredOffice || "",
    placeOfBusiness: entry?.placeOfBusiness || "",
    establishmentDate: normalizeDateValue(entry?.establishmentDate),
    trusteeType: entry?.trusteeType || "Select",
    trusteeName: entry?.trusteeName || "",
    ACN: parseDigitsValue(entry?.ACN),
    nameOfAccountant: entry?.nameOfAccountant || "",
    directorsOfCorporateTrustee: normalizeDirectorRows(
      entry?.directorsOfCorporateTrustee,
    ),
  };
}

function hasMeaningfulValues(initialValues = {}) {
  return [
    initialValues?.trustName,
    initialValues?.trustType,
    initialValues?.ABN,
    initialValues?.registeredOffice,
    initialValues?.placeOfBusiness,
    initialValues?.establishmentDate,
    initialValues?.trusteeType,
    initialValues?.trusteeName,
    initialValues?.ACN,
    initialValues?.nameOfAccountant,
  ].some((value) => String(value ?? "").trim() !== "");
}

export default function FamilyInvestmentTrust({ modalData }) {
  const [form] = Form.useForm();
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);

  const sectionKey = modalData?.key || "familyDetails";
  const sectionData = discoveryData?.[sectionKey] || {};

  const initialValues = useMemo(
    () =>
      normalizeTrustDetails(
        sectionData?.familyTrustOwner || buildEmptyTrustDetails(),
      ),
    [sectionData?.clientFK, sectionData?.familyTrustOwner],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?.clientFK || !hasMeaningfulValues(initialValues));
  }, [form, initialValues, sectionData?.clientFK]);

  const formSnapshot = Form.useWatch([], form);
  const trustName = Form.useWatch("trustName", form) ?? initialValues.trustName;
  const trustType = Form.useWatch("trustType", form) ?? initialValues.trustType;
  const ABN = Form.useWatch("ABN", form) ?? initialValues.ABN;
  const registeredOffice =
    Form.useWatch("registeredOffice", form) ?? initialValues.registeredOffice;
  const placeOfBusiness =
    Form.useWatch("placeOfBusiness", form) ?? initialValues.placeOfBusiness;
  const establishmentDate =
    Form.useWatch("establishmentDate", form) ?? initialValues.establishmentDate;
  const trusteeType =
    Form.useWatch("trusteeType", form) ?? initialValues.trusteeType;
  const trusteeName =
    Form.useWatch("trusteeName", form) ?? initialValues.trusteeName;
  const ACN = Form.useWatch("ACN", form) ?? initialValues.ACN;
  const nameOfAccountant =
    Form.useWatch("nameOfAccountant", form) ?? initialValues.nameOfAccountant;

  const rows = useMemo(
    () => [
      {
        key: "family-trust-details",
        rowNumber: 1,
        formPath: [],
        trustName,
        trustType,
        ABN,
        registeredOffice,
        placeOfBusiness,
        establishmentDate,
        trusteeType,
        trusteeName,
        ACN,
        nameOfAccountant,
      },
    ],
    [
      ABN,
      ACN,
      establishmentDate,
      formSnapshot,
      nameOfAccountant,
      placeOfBusiness,
      registeredOffice,
      trustName,
      trustType,
      trusteeName,
      trusteeType,
    ],
  );

  const openTrusteeInnerModal = useCallback(
    ({ form: currentForm } = {}) => {
      const activeForm = currentForm || form;
      const nextTrusteeType = activeForm.getFieldValue("trusteeType");
      if (!nextTrusteeType) return;

      const isCorporate = nextTrusteeType === "Corporate";
      setDetailModalOpen(true);
      setDetailModalData({
        type: "trusteeInner",
        title: isCorporate ? "Company Directors" : "Trustee Name",
        countLabel: isCorporate
          ? "Number of Directors :"
          : "Number of Trustees :",
        columnHead: isCorporate ? "Director Name" : "Trustee Name",
        width: 500,
        component: <BusinessTrustTrusteeInnerModal />,
        noCancelButton: true,
        switchToEditMode: () => setEditing(true),
        editing,
        valueArray:
          activeForm.getFieldValue("directorsOfCorporateTrustee") || [],
        onSave: (nextRows) => {
          activeForm.setFieldValue(
            "directorsOfCorporateTrustee",
            normalizeDirectorRows(nextRows),
          );
          activeForm.setFieldsValue({
            directorsOfCorporateTrustee: activeForm.getFieldValue(
              "directorsOfCorporateTrustee",
            ),
          });
        },
        maxCount: 4,
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
      });
    },
    [editing, form],
  );

  const columns = useMemo(
    () => {
      const baseColumns = [
      {
        title: "No#",
        dataIndex: "rowNumber",
        key: "rowNumber",
        width: 50,
        editable: false,
      },
      {
        title: "Trust Name",
        dataIndex: "trustName",
        key: "trustName",
        field: "trustName",
        type: "text",
        placeholder: "Trust Name",
      },
      {
        title: "Trust Type",
        dataIndex: "trustType",
        key: "trustType",
        field: "trustType",
        type: "select",
        options: TRUST_TYPE_OPTIONS,
        placeholder: "Select Trust Type",
      },
      {
        title: "ABN",
        dataIndex: "ABN",
        key: "ABN",
        field: "ABN",
        type: "text",
        placeholder: "ABN",
        onChange: (value, _record, column, currentForm) => {
          currentForm.setFieldValue(
            column.field,
            parseDigitsValue(getChangedValue(value)),
          );
        },
      },
      {
        title: "Registered Office",
        dataIndex: "registeredOffice",
        key: "registeredOffice",
        field: "registeredOffice",
        type: "textarea",
        placeholder: "Registered Office",
      },
      {
        title: "Place Of Business",
        dataIndex: "placeOfBusiness",
        key: "placeOfBusiness",
        field: "placeOfBusiness",
        type: "textarea",
        placeholder: "Place Of Business",
      },
      {
        title: "Establishment Date",
        dataIndex: "establishmentDate",
        key: "establishmentDate",
        field: "establishmentDate",
        type: "date",
        placeholder: "dd/mm/yyyy",
      },
      {
        title: "Trustee Type",
        dataIndex: "trusteeType",
        key: "trusteeType",
        field: "trusteeType",
        type: "select-action",
        options: TRUSTEE_TYPE_OPTIONS,
        placeholder: "Select Trustee Type",
        action: {
          name: "Open Trustee Names",
          onClick: (payload) => openTrusteeInnerModal(payload),
        },
        // onChange: (value, _record, column, currentForm) => {
        //   currentForm.setFieldValue(column.field, value);
        //   if (value === "Individual") {
        //     currentForm.setFieldValue("trusteeName", "");
        //     currentForm.setFieldValue("ACN", "");
        //   }
        // },
      },
      {
        title: "Trustee Name",
        dataIndex: "trusteeName",
        key: "trusteeName",
        field: "trusteeName",
        type: "text",
        placeholder: "Trustee Name",
        disabled: ({ form: currentForm }) =>
          currentForm.getFieldValue("trusteeType") === "Individual",
      },
      {
        title: "ACN",
        dataIndex: "ACN",
        key: "ACN",
        field: "ACN",
        type: "text",
        placeholder: "ACN",
        disabled: ({ form: currentForm }) =>
          currentForm.getFieldValue("trusteeType") === "Individual",
        onChange: (value, _record, column, currentForm) => {
          currentForm.setFieldValue(
            column.field,
            parseDigitsValue(getChangedValue(value)),
          );
        },
      },
      {
        title: "Name of Accountant",
        dataIndex: "nameOfAccountant",
        key: "nameOfAccountant",
        field: "nameOfAccountant",
        type: "text",
        placeholder: "Name of Accountant",
      },
    ];
      if (trusteeType === "Individual" || trusteeType === "Select") {
        return baseColumns.filter(
          (col) => col.key !== "trusteeName" && col.key !== "ACN",
        );
      }

      return baseColumns;
    },
    [openTrusteeInnerModal, trusteeType],
  );

  const handleConfirmAndExit = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);
    const normalizedTrust = normalizeTrustDetails(values);

    const payload = {
      ...sectionData,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      familyTrustOwner: normalizedTrust,
    };

    try {
      setSaving(true);
      const saved = sectionData?.clientFK
        ? await patch("/familyDetails/Update", payload)
        : await post("/familyDetails/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [sectionKey]: {
          ...(saved && typeof saved === "object" ? saved : payload),
        },
      }));

      message.success(
        `${modalData?.title || "Family trust details"} saved successfully`,
      );
      setEditing(false);
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to save ${modalData?.title || "Family trust details"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (editing && hasMeaningfulValues(initialValues)) {
      form.setFieldsValue(initialValues);
      setEditing(false);
      return;
    }
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        noCancelButton={detailModalData?.noCancelButton || false}
        width={detailModalData?.width || 720}
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
                {!editing ? (
                  <>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button type="primary" onClick={() => setEditing(true)}>
                      Edit <RiEdit2Fill />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button
                      type="primary"
                      onClick={handleConfirmAndExit}
                      loading={saving}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
