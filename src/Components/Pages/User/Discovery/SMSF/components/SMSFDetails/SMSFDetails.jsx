import { useAtomValue, useSetAtom } from "jotai";
import { Button, Col, Form, Row, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal.jsx";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import SwitchPopupDisplay from "../../../../../../Common/SwitchPopupDisplay.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import useApi from "../../../../../../../hooks/useApi.js";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import BusinessTrustTrusteeInnerModal from "../../../BusinessEntities/coponents/BusinessTrustSection/BusinessTrustTrusteeInnerModal.jsx";
import SMSFBareTrustInnerModal from "./SMSFBareTrustInnerModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const TRUSTEE_TYPE_OPTIONS = [
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

function normalizeDirectorRows(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    directorName: String(item?.directorName ?? "").trim(),
  }));
}

function normalizeBareTrust(value = {}) {
  const count =
    Number(value?.NumberOfDirectors) ||
    (Array.isArray(value?.directorNameArray) ? value.directorNameArray.length : 0);

  return {
    NumberOfDirectors: count,
    bareTrusteeName: value?.bareTrusteeName || "",
    ACN: parseDigitsValue(value?.ACN),
    directorNameArray: Array.isArray(value?.directorNameArray)
      ? value.directorNameArray.map((item) => String(item ?? "").trim())
      : [],
  };
}

function buildEmptySmsfOwner() {
  return {
    fundName: "",
    ABN: "",
    registeredOffice: "",
    placeOfBusiness: "",
    establishmentDate: "",
    trusteeType: undefined,
    trusteeName: "",
    ACN: "",
    bareTrust: "No",
    nameOfAccountant: "",
    directorsOfCorporateTrustee: [],
    directorsOfBareTrust: {
      NumberOfDirectors: 0,
      bareTrusteeName: "",
      ACN: "",
      directorNameArray: [],
    },
  };
}

function normalizeSmsfOwner(entry = {}) {
  return {
    fundName: entry?.fundName || "",
    ABN: parseDigitsValue(entry?.ABN),
    registeredOffice: entry?.registeredOffice || "",
    placeOfBusiness: entry?.placeOfBusiness || "",
    establishmentDate: normalizeDateValue(entry?.establishmentDate),
    trusteeType: entry?.trusteeType || undefined,
    trusteeName: entry?.trusteeName || "",
    ACN: parseDigitsValue(entry?.ACN),
    bareTrust: entry?.bareTrust === "Yes" ? "Yes" : "No",
    nameOfAccountant: entry?.nameOfAccountant || "",
    directorsOfCorporateTrustee: normalizeDirectorRows(
      entry?.directorsOfCorporateTrustee,
    ),
    directorsOfBareTrust: normalizeBareTrust(entry?.directorsOfBareTrust),
  };
}

function hasMeaningfulValues(initialValues = {}) {
  return [
    initialValues?.fundName,
    initialValues?.ABN,
    initialValues?.registeredOffice,
    initialValues?.placeOfBusiness,
    initialValues?.establishmentDate,
    initialValues?.trusteeType,
    initialValues?.trusteeName,
    initialValues?.ACN,
    initialValues?.nameOfAccountant,
    initialValues?.bareTrust === "Yes" ? "Yes" : "",
    ...(initialValues?.directorsOfCorporateTrustee || []).map(
      (item) => item?.directorName,
    ),
    initialValues?.directorsOfBareTrust?.bareTrusteeName,
    initialValues?.directorsOfBareTrust?.ACN,
    ...(initialValues?.directorsOfBareTrust?.directorNameArray || []),
  ].some((value) => String(value ?? "").trim() !== "");
}

export default function SMSFDetails({ modalData }) {
  const [form] = Form.useForm();
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);

  const sectionKey = modalData?.key || "SMSFDetails";
  const sectionData = discoveryData?.[sectionKey] || {};

  const initialValues = useMemo(
    () => normalizeSmsfOwner(sectionData?.SMSFOwner || buildEmptySmsfOwner()),
    [sectionData?.SMSFOwner, sectionData?.clientFK],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?.clientFK || !hasMeaningfulValues(initialValues));
  }, [form, initialValues, sectionData?.clientFK]);

  const formSnapshot = Form.useWatch([], form);
  const fundName = Form.useWatch("fundName", form) ?? initialValues.fundName;
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
  const bareTrust = Form.useWatch("bareTrust", form) ?? initialValues.bareTrust;
  const nameOfAccountant =
    Form.useWatch("nameOfAccountant", form) ?? initialValues.nameOfAccountant;

  const rows = useMemo(
    () => [
      {
        key: "smsf-details-row",
        rowNumber: 1,
        formPath: [],
        fundName,
        ABN,
        registeredOffice,
        placeOfBusiness,
        establishmentDate,
        trusteeType,
        trusteeName,
        ACN,
        bareTrust,
        nameOfAccountant,
      },
    ],
    [
      ABN,
      ACN,
      bareTrust,
      establishmentDate,
      formSnapshot,
      fundName,
      nameOfAccountant,
      placeOfBusiness,
      registeredOffice,
      trusteeName,
      trusteeType,
    ],
  );

  const corporateDirectorOptions = useMemo(
    () =>
      (form.getFieldValue("directorsOfCorporateTrustee") || [])
        .map((item) => String(item?.directorName ?? "").trim())
        .filter(Boolean),
    [form, formSnapshot],
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
        editing,
        valueArray: activeForm.getFieldValue("directorsOfCorporateTrustee") || [],
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
        maxCount: 6,
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
      });
    },
    [editing, form],
  );

  const openBareTrustInnerModal = useCallback(
    ({ form: currentForm } = {}) => {
      const activeForm = currentForm || form;

      setDetailModalOpen(true);
      setDetailModalData({
        type: "bareTrustInner",
        title: "Directors Of Bare Trust",
        width: 900,
        component: <SMSFBareTrustInnerModal />,
        editing,
        value: activeForm.getFieldValue("directorsOfBareTrust") || {},
        directorOptions: corporateDirectorOptions,
        onSave: (nextValue) => {
          activeForm.setFieldValue("directorsOfBareTrust", normalizeBareTrust(nextValue));
          activeForm.setFieldsValue({
            directorsOfBareTrust: activeForm.getFieldValue("directorsOfBareTrust"),
          });
        },
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
      });
    },
    [corporateDirectorOptions, editing, form],
  );

  const columns = useMemo(
    () => [
      {
        title: "No#",
        dataIndex: "rowNumber",
        key: "rowNumber",
        width: 50,
        editable: false,
      },
      {
        title: "Fund Name",
        dataIndex: "fundName",
        key: "fundName",
        field: "fundName",
        type: "text",
        placeholder: "Fund Name",
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
        placeholder: "Trustee Type",
        action: {
          name: "Open Trustee Name",
          onClick: (payload) => openTrusteeInnerModal(payload),
        },
        onChange: (value, _record, column, currentForm) => {
          currentForm.setFieldValue(column.field, value);
          if (value === "Individual") {
            currentForm.setFieldValue("trusteeName", "");
            currentForm.setFieldValue("ACN", "");
          }
        },
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
        title: "Bare Trust",
        dataIndex: "bareTrust",
        key: "bareTrust",
        field: "bareTrust",
        type: "yesNoSwitchWithButton",
        action: {
          name: "Open Bare Trust",
          onClick: (payload) => openBareTrustInnerModal(payload),
        },
        renderView: ({ value, record }) => (
          <SwitchPopupDisplay
            value={value}
            onClick={() => openBareTrustInnerModal({ record, form })}
          />
        ),
      },
      {
        title: "Name of Accountant",
        dataIndex: "nameOfAccountant",
        key: "nameOfAccountant",
        field: "nameOfAccountant",
        type: "text",
        placeholder: "Name of Accountant",
      },
    ],
    [form, openBareTrustInnerModal, openTrusteeInnerModal],
  );

  const handleConfirmAndExit = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);
    const normalizedOwner = normalizeSmsfOwner(values);

    const payload = {
      ...sectionData,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      SMSFOwner: normalizedOwner,
    };

    try {
      setSaving(true);
      const saved = sectionData?.clientFK
        ? await patch("/api/SMSFDetails/Update", payload)
        : await post("/api/SMSFDetails/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [sectionKey]: saved && typeof saved === "object" ? saved : payload,
      }));

      message.success(`${modalData?.title || "SMSF details"} saved successfully`);
      setEditing(false);
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to save ${modalData?.title || "SMSF details"}`,
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
        title={detailModalData?.title}
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