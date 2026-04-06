import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { App as AntdApp, Button, Form, Space } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DynamicFormField from "../../../../../Common/DynamicFormField.jsx";
import ChildrenSection from "./ChildrenSection.jsx";
import SectionTable from "./SectionTable.jsx";
import {
  buildInitialValues,
  buildViewChildrenRows,
  buildViewContactRows,
  buildViewFinancialRows,
  buildViewPersonalRows,
  getPersonalDetailsFromDiscovery,
  mapSubmitValues,
} from "../utils/personalDetails.mapper.js";

/** @typedef {import("../utils/personalDetails.mapper.js").PersonalDetailsData} PersonalDetailsData */
/** @typedef {import("../utils/personalDetails.mapper.js").PersonalDetailsFormValues} PersonalDetailsFormValues */
/** @typedef {import("../utils/personalDetails.mapper.js").PersonalDetailsSubmitPayload} PersonalDetailsSubmitPayload */

const PRIMARY_GREEN = "#22c55e";
const FORM_WRAPPER_STYLE = { width: "100%" };
const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: false,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};
const FOOTER_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginTop: 28,
  paddingTop: 20,
  borderTop: "1px solid #f0f0f0",
};
const PRIMARY_ACTION_STYLE = {
  background: PRIMARY_GREEN,
  borderColor: PRIMARY_GREEN,
};
const NEXT_BUTTON_STYLE = {
  ...PRIMARY_ACTION_STYLE,
  fontWeight: 600,
};

const TITLE_OPTIONS = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Prof."];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const MARITAL_OPTIONS = [
  "Single",
  "Married",
  "De Facto",
  "Divorced",
  "Widowed",
  "Separated",
];
const EMPLOYMENT_OPTIONS = [
  "Employed",
  "Self-employed",
  "Unemployed",
  "Retired",
  "Centrelink Retiree",
  "Student",
  "Other",
];
const YES_NO = ["Yes", "No"];
const HEALTH_OPTIONS = ["good", "fair", "poor"];
const SMOKER_OPTIONS = ["Yes", "No"];
const RELATIONSHIP_OPTIONS = ["Son", "Daughter", "Step-child", "Other"];

const PERSON_ROWS = [
  { key: "client", row: "client" },
  { key: "partner", row: "partner" },
];

const PERSONAL_SECTION_CONFIG = [
  {
    title: "Preferred",
    viewKey: "preferred",
    clientField: "clientPreferredName",
    partnerField: "partnerPreferredName",
  },
  {
    title: "Title",
    viewKey: "title",
    clientField: "clientTitle",
    partnerField: "partnerTitle",
    type: "select",
    options: TITLE_OPTIONS,
  },
  {
    title: "First Name",
    viewKey: "firstName",
    clientField: "clientGivenName",
    partnerField: "partnerGivenName",
  },
  {
    title: "Middle Name",
    viewKey: "middleName",
    clientField: "clientMiddleName",
    partnerField: "partnerMiddleName",
  },
  {
    title: "Last Name",
    viewKey: "lastName",
    clientField: "clientLastName",
    partnerField: "partnerLastName",
  },
  {
    title: "Gender",
    viewKey: "gender",
    clientField: "clientGender",
    partnerField: "partnerGender",
    type: "select",
    options: GENDER_OPTIONS,
  },
  {
    title: "Date of Birth",
    viewKey: "dobOnly",
    clientField: "clientDOB",
    partnerField: "partnerDOB",
    type: "date",
    width: 120,
  },
  {
    title: "Age",
    viewKey: "ageOnly",
    clientField: "clientAge",
    partnerField: "partnerAge",
    type: "number",
    width: 72,
    disabled: true,
  },
  {
    title: "Marital Status",
    viewKey: "marital",
    clientField: "clientMaritalStatus",
    partnerField: "partnerMaritalStatus",
    type: "select",
    options: MARITAL_OPTIONS,
  },
];

const FINANCIAL_SECTION_CONFIG = [
  {
    title: "Preferred",
    viewKey: "preferred",
    width: 130,
    editMode: "preferred-readonly",
  },
  {
    title: "Work Status",
    viewKey: "workStatus",
    clientField: "clientEmploymentStatus",
    partnerField: "partnerEmploymentStatus",
    type: "select",
    options: EMPLOYMENT_OPTIONS,
  },
  {
    title: "Occupation",
    viewKey: "occupation",
    clientField: "clientOccupationID",
    partnerField: "partnerOccupationID",
  },
  {
    title: "Age to Retire",
    viewKey: "retire",
    clientField: "clientPlannedRetirementAge",
    partnerField: "partnerPlannedRetirementAge",
    type: "number",
  },
  {
    title: "Tax Resident",
    viewKey: "taxRes",
    clientField: "clientTaxResidentRadio",
    partnerField: "partnerTaxResidentRadio",
    type: "select",
    options: YES_NO,
  },
  {
    title: "Help Debt",
    viewKey: "helpDebt",
    clientField: "clientHELPSDebtRadio",
    partnerField: "partnerHELPSDebtRadio",
    type: "select",
    options: YES_NO,
  },
  {
    title: "Health",
    viewKey: "health",
    clientField: "clientHealth",
    partnerField: "partnerHealth",
    type: "select",
    options: HEALTH_OPTIONS,
  },
  {
    title: "Smoker",
    viewKey: "smoker",
    clientField: "clientSmoker",
    partnerField: "partnerSmoker",
    type: "select",
    options: SMOKER_OPTIONS,
  },
  {
    title: "Private Health Cover",
    viewKey: "phc",
    clientField: "clientPrivateHealthCoverRadio",
    partnerField: "partnerPrivateHealthCoverRadio",
    type: "select",
    options: YES_NO,
  },
];

const CONTACT_SECTION_CONFIG = [
  {
    title: "Preferred",
    viewKey: "preferred",
    width: 130,
    editMode: "preferred-readonly",
  },
  {
    title: "Home Address",
    viewKey: "home",
    clientField: "clientHomeAddress",
    partnerField: "partnerHomeAddress",
    type: "textarea",
  },
  {
    title: "Postcode/Suburb",
    viewKey: "homePc",
    clientField: "clientPostcode",
    partnerField: "partnerPostcode",
    width: 110,
  },
  {
    title: "Postal Address",
    viewKey: "postal",
    clientField: "clientPostalAddress",
    partnerField: "partnerPostalAddress",
    type: "textarea",
  },
  {
    title: "Postcode/Suburb",
    viewKey: "postalPc",
    clientField: "clientPostalPostCode",
    partnerField: "partnerPostalPostCode",
    width: 110,
  },
  {
    title: "Mobile",
    viewKey: "mobile",
    clientField: "clientMobile",
    partnerField: "partnerMobile",
    width: 100,
  },
  {
    title: "Home Phone",
    viewKey: "homePhone",
    clientField: "clientHomePhone",
    partnerField: "partnerHomePhone",
    width: 100,
  },
  {
    title: "Work Phone",
    viewKey: "workPhone",
    clientField: "clientWorkPhone",
    partnerField: "partnerWorkPhone",
    width: 100,
  },
  {
    title: "Email",
    viewKey: "email",
    clientField: "Email",
    partnerField: "partnerEmail",
  },
];

const CHILDREN_VIEW_COLUMNS = [
  { title: "First Name", dataIndex: "firstName", key: "firstName" },
  { title: "Last Name", dataIndex: "lastName", key: "lastName" },
  { title: "DOB", dataIndex: "dob", key: "dob" },
  { title: "Age", dataIndex: "age", key: "age" },
  { title: "Gender", dataIndex: "gender", key: "gender" },
  { title: "Relationship", dataIndex: "relationship", key: "relationship" },
  { title: "Dependent", dataIndex: "dependent", key: "dependent" },
];
const PERSONAL_VIEW_COLUMNS = buildViewColumns(PERSONAL_SECTION_CONFIG);
const FINANCIAL_VIEW_COLUMNS = buildViewColumns(FINANCIAL_SECTION_CONFIG);
const CONTACT_VIEW_COLUMNS = buildViewColumns(CONTACT_SECTION_CONFIG);

/**
 * @typedef {Object} SectionColumnConfig
 * @property {string} title
 * @property {string} viewKey
 * @property {string} [clientField]
 * @property {string} [partnerField]
 * @property {string} [type]
 * @property {string[]} [options]
 * @property {boolean} [disabled]
 * @property {"preferred-readonly"} [editMode]
 * @property {number} [width]
 * @property {Record<string, any>} [fieldProps]
 */

/**
 * Render a form field cell for either the client or partner row.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} props.form
 * @param {"client"|"partner"} props.row
 * @param {SectionColumnConfig} props.config
 * @returns {JSX.Element}
 */
function FormFieldCell({ form, row, config }) {
  const name =
    row === "client"
      ? ["client", config.clientField]
      : ["partner", config.partnerField];

  return (
    <DynamicFormField
      form={form}
      name={name}
      type={config.type || "text"}
      options={config.options}
      disabled={config.disabled}
      formItemProps={{ style: { marginBottom: 0 }, label: null }}
      fieldProps={config.fieldProps}
    />
  );
}

/**
 * Render the preferred name as read-only text inside edit-mode tables.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} props.form
 * @param {"client"|"partner"} props.row
 * @returns {JSX.Element}
 */
function PreferredReadonlyCell({ form, row }) {
  return (
    <Form.Item noStyle shouldUpdate>
      {() => (
        <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
          {row === "client"
            ? form.getFieldValue(["client", "clientPreferredName"]) || "—"
            : form.getFieldValue(["partner", "partnerPreferredName"]) || "—"}
        </span>
      )}
    </Form.Item>
  );
}

/**
 * Convert section config into read-only table columns.
 *
 * @param {SectionColumnConfig[]} config
 * @returns {Array<Record<string, any>>}
 */
function buildViewColumns(config) {
  return config.map((item) => ({
    title: item.title,
    dataIndex: item.viewKey,
    key: item.viewKey,
    width: item.width,
  }));
}

/**
 * Convert section config into editable table columns.
 *
 * @param {SectionColumnConfig[]} config
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} form
 * @returns {Array<Record<string, any>>}
 */
function buildEditColumns(config, form) {
  return config.map((item) => {
    const base = {
      title: item.title,
      key: item.viewKey,
      width: item.width,
    };

    if (item.editMode === "preferred-readonly") {
      return {
        ...base,
        render: (_, record) => (
          <PreferredReadonlyCell form={form} row={record.row} />
        ),
      };
    }

    return {
      ...base,
      render: (_, record) => (
        <FormFieldCell form={form} row={record.row} config={item} />
      ),
    };
  });
}

/**
 * Personal details table/form container.
 *
 * Keeps the existing API contract and payload mapping unchanged while
 * coordinating read-only and edit-mode table sections.
 *
 * @param {Object} props
 * @param {Record<string, any>} props.discoveryData
 * @param {() => void} [props.onBack]
 * @param {() => void} [props.onNext]
 * @param {(payload: PersonalDetailsSubmitPayload) => Promise<void> | void} [props.onSave]
 * @returns {JSX.Element}
 */
export default function PersonalDetailsFrom({
  discoveryData,
  onBack,
  onNext,
  onSave,
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  /** @type {PersonalDetailsData | null} */
  const pd = useMemo(
    () => getPersonalDetailsFromDiscovery(discoveryData),
    [discoveryData],
  );

  /** @type {PersonalDetailsFormValues} */
  const initialValues = useMemo(() => buildInitialValues(pd), [pd]);
  const viewPersonalRows = useMemo(() => buildViewPersonalRows(pd), [pd]);
  const viewFinancialRows = useMemo(() => buildViewFinancialRows(pd), [pd]);
  const viewContactRows = useMemo(() => buildViewContactRows(pd), [pd]);
  const viewChildrenRows = useMemo(() => buildViewChildrenRows(pd), [pd]);

  const personalEditColumns = useMemo(
    () => buildEditColumns(PERSONAL_SECTION_CONFIG, form),
    [form],
  );
  const financialEditColumns = useMemo(
    () => buildEditColumns(FINANCIAL_SECTION_CONFIG, form),
    [form],
  );
  const contactEditColumns = useMemo(
    () => buildEditColumns(CONTACT_SECTION_CONFIG, form),
    [form],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const finish = useCallback(
    async (values) => {
      const payload = mapSubmitValues(values);

      try {
        if (onSave) {
          await onSave(payload);
        } else {
          message.success("Personal details saved (hook up API when ready).");
        }
        setEditing(false);
      } catch (error) {
        message.error(error?.message || "Save failed.");
      }
    },
    [message, onSave],
  );

  const handleEditBack = useCallback(() => {
    form.setFieldsValue(initialValues);
    setEditing(false);
  }, [form, initialValues]);
  const handleStartEditing = useCallback(() => setEditing(true), []);

  return (
    <div style={FORM_WRAPPER_STYLE}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={finish}
        key={pd?._id || "pd"}
      >
        <SectionTable
          title="PERSONAL DETAILS"
          editing={editing}
          viewColumns={PERSONAL_VIEW_COLUMNS}
          editColumns={personalEditColumns}
          viewData={viewPersonalRows}
          editData={PERSON_ROWS}
          tableProps={TABLE_PROPS}
        />

        <SectionTable
          title="FINANCIAL AND HEALTH"
          editing={editing}
          viewColumns={FINANCIAL_VIEW_COLUMNS}
          editColumns={financialEditColumns}
          viewData={viewFinancialRows}
          editData={PERSON_ROWS}
          tableProps={TABLE_PROPS}
        />

        <SectionTable
          title="CONTACT DETAILS"
          editing={editing}
          viewColumns={CONTACT_VIEW_COLUMNS}
          editColumns={contactEditColumns}
          viewData={viewContactRows}
          editData={PERSON_ROWS}
          tableProps={TABLE_PROPS}
        />

        <ChildrenSection
          form={form}
          editing={editing}
          viewColumns={CHILDREN_VIEW_COLUMNS}
          viewData={viewChildrenRows}
          tableProps={TABLE_PROPS}
          genderOptions={GENDER_OPTIONS}
          relationshipOptions={RELATIONSHIP_OPTIONS}
          yesNoOptions={YES_NO}
        />

        <div style={FOOTER_STYLE}>
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={editing ? handleEditBack : onBack}
            >
              Back
            </Button>
            {!editing ? (
              <Button icon={<EditOutlined />} onClick={handleStartEditing}>
                Edit
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                style={PRIMARY_ACTION_STYLE}
              >
                Save
              </Button>
            )}
          </Space>
          {!editing && (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={onNext}
              style={NEXT_BUTTON_STYLE}
            >
              Next
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}

