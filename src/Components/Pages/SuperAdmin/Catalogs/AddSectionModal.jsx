import { useEffect, useMemo, useState } from "react";
import { App as AntdApp, Button, Form, Input, Select, Typography } from "antd";
import { MdAdd } from "react-icons/md";
import { useSetAtom } from "jotai";
import AppModal from "../../../Common/AppModal";
import useApi from "../../../../hooks/useApi";
import { catalogsDataAtom } from "../../../../store/authState";
import {
  getCatalogItemName,
  getCatalogSectionList,
  normalizeCatalogsData,
} from "./catalogHelpers";

const { Text, Title } = Typography;
const FORM_ID = "catalog-add-section-form";
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };

const SECTION_ADD_FORM_CONFIG = {
  FinancialInstitutions: {
    modalTitle: "Add Financial Institution",
    modalSubtitle:
      "Add a new bank, credit union, or building society to the catalog.",
    nameLabel: "Institution Name",
    namePlaceholder: "e.g. Commonwealth Bank",
    nameHelper: "Advisers will see this name in their discovery dropdowns.",
    typeHelper: "Helps advisers filter and group entries in their forms.",
    typeOptions: [
      { value: "Bank", label: "Bank" },
      { value: "Credit Union", label: "Credit Union" },
      { value: "Building Society", label: "Building Society" },
      { value: "Mutual Bank", label: "Mutual Bank" },
      { value: "Other", label: "Other" }, // for other types of institutions
    ],
  },
  InvestmentPlatforms: {
    modalTitle: "Add Investment Platform",
    modalSubtitle: "Add a new investment platform to the catalog.",
    nameLabel: "Platform Name",
    namePlaceholder: "e.g. Netwealth",
    nameHelper: "Advisers will see this name in their discovery dropdowns.",
    typeHelper: "Helps advisers filter and group entries in their forms.",
    typeOptions: [
      { value: "Wrap", label: "Wrap" },
      { value: "Master Trust", label: "Master Trust" },
      { value: "IDPS", label: "IDPS" },
      { value: "Investor Directed", label: "Investor Directed" },
    ],
  },
  InvestmentBonds: {
    modalTitle: "Add Investment Bond",
    modalSubtitle: "Add a new investment bond provider to the catalog.",
    nameLabel: "Bond Name",
    namePlaceholder: "e.g. Australian Unity",
    nameHelper: "Advisers will see this name in their discovery dropdowns.",
    typeHelper: "Helps advisers filter and group entries in their forms.",
    typeOptions: [
      { value: "Bank", label: "Bank" },
      { value: "Credit Union", label: "Credit Union" },
      { value: "Building Society", label: "Building Society" },
      { value: "Mutual Bank", label: "Mutual Bank" },
      { value: "Other", label: "Other" },
    ],
  },
  SuperannuationFunds: {
    modalTitle: "Add Superannuation Fund",
    modalSubtitle: "Add a new superannuation fund to the catalog.",
    nameLabel: "Fund Name",
    namePlaceholder: "e.g. Australian Super",
    nameHelper: "Advisers will see this name in their discovery dropdowns.",
    typeHelper: "Helps advisers filter and group entries in their forms.",
    typeOptions: [
      { value: "Industry", label: "Industry" },
      { value: "Retail", label: "Retail" },
      { value: "Public Sector", label: "Public Sector" },
      { value: "Corporate", label: "Corporate" },
    ],
  },
  AccountBasedPensions: {
    modalTitle: "Add Account Based Pension",
    modalSubtitle: "Add a new account based pension provider to the catalog.",
    nameLabel: "Pension Name",
    namePlaceholder: "e.g. AMP",
    nameHelper: "Advisers will see this name in their discovery dropdowns.",
    typeHelper: "Helps advisers filter and group entries in their forms.",
    typeOptions: [
      { value: "Bank", label: "Bank" },
      { value: "Credit Union", label: "Credit Union" },
      { value: "Building Society", label: "Building Society" },
      { value: "Mutual Bank", label: "Mutual Bank" },
      { value: "Other", label: "Other" },
    ],
  },
  Annuities: {
    modalTitle: "Add Annuity",
    modalSubtitle: "Add a new annuity provider to the catalog.",
    nameLabel: "Annuity Name",
    namePlaceholder: "e.g. Challenger",
    nameHelper: "Advisers will see this name in their discovery dropdowns.",
    typeHelper: "Helps advisers filter and group entries in their forms.",
    typeOptions: [
      { value: "Lifetime", label: "Lifetime" },
      { value: "Term", label: "Term" },
      { value: "Fixed-Term", label: "Fixed-Term" },
      { value: "Deferred Lifetime", label: "Deferred Lifetime" },
    ],
  },
  PersonalInsurances: {
    modalTitle: "Add Personal Insurance",
    modalSubtitle: "Add a new personal insurance provider to the catalog.",
    nameLabel: "Insurer Name",
    namePlaceholder: "e.g. TAL",
    nameHelper: "Advisers will see this name in their discovery dropdowns.",
    typeHelper: "Helps advisers filter and group entries in their forms.",
    typeOptions: [
      { value: "Bank", label: "Bank" },
      { value: "Credit Union", label: "Credit Union" },
      { value: "Building Society", label: "Building Society" },
      { value: "Mutual Bank", label: "Mutual Bank" },
      { value: "Other", label: "Other" },
    ],
  },
};

function FieldLabel({ children, required = false }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
      {children}
      {required ? (
        <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
      ) : null}
    </span>
  );
}

function normalizeSavedPlatform(res, payload, editingRecord, isEdit) {
  const record = res?.platform ?? res?.data ?? res;

  if (
    record &&
    typeof record === "object" &&
    (record._id || record.id || record.platformName)
  ) {
    const platformName =
      record.platformName ?? payload.platformName ?? getCatalogItemName(record);
    return {
      ...record,
      _id: record._id ?? record.id,
      platformName,
      name: platformName,
      institutionName: platformName,
      productName: platformName,
      type: record.platformType ?? record.type ?? payload.platformType,
    };
  }

  if (isEdit) {
    const platformName =
      payload.platformName ?? getCatalogItemName(editingRecord);
    return {
      ...editingRecord,
      _id: editingRecord._id ?? editingRecord.id,
      platformName,
      name: platformName,
      type: editingRecord.type ?? payload.platformType,
    };
  }

  const platformName = payload.platformName;
  return {
    _id: `cat-${Date.now()}`,
    platformName,
    name: platformName,
    institutionName: platformName,
    productName: platformName,
    type: payload.platformType,
    createdAt: new Date().toISOString(),
  };
}

function upsertCatalogItem(
  setCatalogsData,
  catalogDataKey,
  saved,
  { isEdit, editingRecord },
) {
  setCatalogsData((prev) => {
    const normalized = normalizeCatalogsData(prev);
    const list = getCatalogSectionList(prev, catalogDataKey);
    const savedId = saved._id ?? saved.id;

    if (isEdit) {
      const editId = editingRecord?._id ?? editingRecord?.id;
      return {
        ...normalized,
        [catalogDataKey]: list.map((item) =>
          (item._id ?? item.id) === editId ? { ...item, ...saved } : item,
        ),
      };
    }

    return {
      ...normalized,
      [catalogDataKey]: [saved, ...list],
    };
  });
}

function buildFormConfig(sectionConfig = {}, isEdit = false) {
  const {
    catalogDataKey = "",
    catalogTitle = "Catalog",
    addButtonLabel = "Add Item",
    deleteSuccessLabel = "Item",
    defaultType = "",
    showTypeColumn = true,
  } = sectionConfig;

  const preset = SECTION_ADD_FORM_CONFIG[catalogDataKey] ?? {};

  const addTitle = preset.modalTitle ?? `Add ${deleteSuccessLabel}`;

  return {
    modalTitle: isEdit ? addTitle.replace(/^Add /, "Edit ") : addTitle,
    modalSubtitle: isEdit
      ? `Update this ${deleteSuccessLabel.toLowerCase()} in the catalog.`
      : (preset.modalSubtitle ??
        `Add a new entry to the ${catalogTitle.toLowerCase()} catalog.`),
    nameLabel: preset.nameLabel ?? "Name",
    namePlaceholder: preset.namePlaceholder ?? "Enter name",
    nameHelper:
      preset.nameHelper ??
      "Advisers will see this name in their discovery dropdowns.",
    typeHelper:
      preset.typeHelper ??
      "Helps advisers filter and group entries in their forms.",
    typeOptions:
      preset.typeOptions ??
      (defaultType ? [{ value: defaultType, label: defaultType }] : []),
    submitLabel: isEdit ? "Save changes" : addButtonLabel,
    catalogDataKey,
    showTypeColumn,
    defaultType,
  };
}

export default function AddSectionModal({
  open,
  onClose,
  onSuccess,
  sectionConfig = {},
  editingRecord = null,
}) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const setCatalogsData = useSetAtom(catalogsDataAtom);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(editingRecord?._id ?? editingRecord?.id);
  const editingKey = editingRecord?._id ?? editingRecord?.id ?? null;

  const formConfig = useMemo(
    () => buildFormConfig(sectionConfig, isEdit),
    [sectionConfig, isEdit],
  );

  const {
    modalTitle,
    modalSubtitle,
    nameLabel,
    namePlaceholder,
    nameHelper,
    typeHelper,
    typeOptions,
    submitLabel,
    catalogDataKey,
    showTypeColumn,
    defaultType,
  } = formConfig;

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      form.setFieldsValue({
        name: getCatalogItemName(editingRecord),
        platformType:
          editingRecord?.platformType ??
          editingRecord?.type ??
          typeOptions[0]?.value ??
          defaultType,
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      platformType: typeOptions[0]?.value ?? defaultType ?? undefined,
    });
  }, [
    open,
    catalogDataKey,
    defaultType,
    editingKey,
    editingRecord,
    form,
    isEdit,
    typeOptions,
  ]);

  const handleFinish = async (values) => {
    if (!catalogDataKey) return;

    const platformName = String(values.name ?? "").trim();
    if (!platformName) return;

    const section = sectionConfig.apiSection ?? catalogDataKey;
    const platformType = values.platformType ?? defaultType;

    setSubmitting(true);
    try {
      let res;

      if (isEdit) {
        res = await api.patch("/api/platform/Update", {
          platformName,
          platformType,
          section,
          softDelete: false,
          _id: editingRecord._id ?? editingRecord.id,
        });
        message.success(
          `${sectionConfig.deleteSuccessLabel ?? "Item"} updated.`,
        );
      } else {
        res = await api.post("/api/platform/Add", {
          platformName,
          platformType,
          section,
        });
        message.success(`${sectionConfig.deleteSuccessLabel ?? "Item"} added.`);
      }

      const payload = { platformName, platformType, section };
      const saved = normalizeSavedPlatform(res, payload, editingRecord, isEdit);

      upsertCatalogItem(setCatalogsData, catalogDataKey, saved, {
        isEdit,
        editingRecord,
      });

      form.resetFields();
      onSuccess?.(saved, { isEdit });
      onClose?.();
    } catch (err) {
      message.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title=""
      width={520}
      destroyOnClose
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            paddingTop: 8,
          }}
        >
          <Button
            onClick={onClose}
            disabled={submitting}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              height: 38,
              paddingInline: 18,
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form={FORM_ID}
            loading={submitting}
            icon={<MdAdd size={16} />}
            style={{
              background: PRIMARY_GREEN,
              borderColor: PRIMARY_GREEN,
              fontWeight: 700,
              borderRadius: 8,
              height: 38,
              paddingInline: 18,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div
        className="catalog-add-section-modal"
        style={{ padding: "4px 0 8px" }}
      >
        <style>
          {`
            .catalog-add-section-modal .ant-form-item-label {
              padding-bottom: 4px !important;
            }
            .catalog-add-section-modal .ant-form-item {
              margin-bottom: 18px !important;
            }
            .catalog-add-section-modal .ant-form-item-extra {
              margin-top: 6px;
              min-height: 0;
            }
            .catalog-add-section-modal .ant-input,
            .catalog-add-section-modal .ant-select-selector {
              border-radius: 8px !important;
              min-height: 40px !important;
            }
            .catalog-add-section-modal .ant-input {
              padding: 8px 12px !important;
            }
            .catalog-add-section-modal .ant-select-selector {
              padding: 4px 12px !important;
            }
            .catalog-add-section-modal .ant-input:focus,
            .catalog-add-section-modal .ant-input-focused,
            .catalog-add-section-modal .ant-select-focused .ant-select-selector {
              border-color: ${PRIMARY_GREEN} !important;
              box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.12) !important;
            }
          `}
        </style>

        {!isEdit ? (
          <Text
            style={{
              display: "block",
              color: PRIMARY_GREEN,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "2.5px",
              marginBottom: 6,
            }}
          >
            NEW
          </Text>
        ) : null}

        <Title
          level={3}
          style={{
            ...headingStyle,
            margin: 0,
            fontWeight: 500,
            fontSize: 26,
          }}
        >
          {modalTitle}
        </Title>

        <Text
          style={{
            display: "block",
            marginTop: 6,
            marginBottom: 20,
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {modalSubtitle}
        </Text>

        <div
          style={{
            height: 1,
            background: "#e5e7eb",
            marginBottom: 8,
          }}
        />

        <Form
          id={FORM_ID}
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={<FieldLabel required>{nameLabel}</FieldLabel>}
            rules={[
              { required: true, message: `Enter ${nameLabel.toLowerCase()}` },
            ]}
            extra={
              <Text
                style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.45 }}
              >
                {nameHelper}
              </Text>
            }
          >
            <Input placeholder={namePlaceholder} />
          </Form.Item>

          {showTypeColumn ? (
            <Form.Item
              name="platformType"
              label={
                <FieldLabel required>
                  {" "}
                  {catalogDataKey === "PersonalInsurances"
                    ? "Product Name"
                    : "Type"}
                </FieldLabel>
              }
              rules={[{ required: true, message: "Select a type" }]}
              extra={
                <Text
                  style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.45 }}
                >
                  {typeHelper}
                </Text>
              }
            >
              {catalogDataKey === "PersonalInsurances" ? (
                <Input placeholder="Enter product name" />
              ) : (
                <Select
                  placeholder="Select type..."
                  options={typeOptions}
                  popupMatchSelectWidth
                />
              )}
            </Form.Item>
          ) : null}
        </Form>

        <div
          style={{
            height: 1,
            background: "#e5e7eb",
            marginTop: 4,
          }}
        />
      </div>
    </AppModal>
  );
}
