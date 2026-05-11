import { useMemo, useState } from "react";
import {
  Alert,
  App as AntdApp,
  Button,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Steps,
  Typography,
} from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { FaArrowRight } from "react-icons/fa";
import axios from "axios";
import useApi from "../../../../../hooks/useApi";
import { toSentenceCase } from "../../../../../hooks/helpers";

const { Title, Text } = Typography;

const APP_FIELD_OPTIONS = [
  { value: "salutation", label: "Salutation" },
  { value: "firstName", label: "First Name" },
  { value: "middleName", label: "Middle Name" },
  { value: "lastName", label: "Last Name" },
  { value: "preferredName", label: "Preferred Name" },
  { value: "fullLegalName", label: "Full Legal Name" },
  { value: "gender", label: "Gender" },
  { value: "dateOfBirth", label: "Date Of Birth" },
  { value: "age", label: "Age" },
  { value: "email", label: "Email" },
  { value: "phoneNumber", label: "Phone Number" },
  { value: "relationshipStatus", label: "Relationship Status" },
  { value: "occupation", label: "Occupation" },
  { value: "address", label: "Address" },
];

const STEP_ITEMS = [
  { title: "PAT" },
  { title: "Workspace" },
  { title: "Project" },
  { title: "Assignee" },
  { title: "Mapping" },
  { title: "Done" },
];

function mapSelectOptions(list = []) {
  return list.map((item) => ({
    value: item.gid,
    label: `${toSentenceCase(item.name || "Unnamed")} (${item.gid})`,
  }));
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.errors?.[0]?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
}

function SearchSelect({ value, options, placeholder, onChange, mode }) {
  return (
    <Select
      showSearch
      allowClear={mode === "multiple"}
      mode={mode}
      value={value}
      style={{ width: "100%" }}
      placeholder={placeholder}
      optionFilterProp="label"
      filterOption={(input, option) =>
        option?.label?.toLowerCase().includes(input.toLowerCase())
      }
      filterSort={(a, b) =>
        (a?.label ?? "")
          .toLowerCase()
          .localeCompare((b?.label ?? "").toLowerCase())
      }
      onChange={onChange}
      options={options}
      getPopupContainer={(trigger) => trigger.parentNode}
    />
  );
}

export default function ConnectAsana({ onSuccess }) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [showPatId, setShowPatId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [saved, setSaved] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [projectCustomFields, setProjectCustomFields] = useState([]);

  const values = Form.useWatch([], form) || {};
  const selectedFields = values?.fieldsMap || [];
  const fieldMappings = values?.fieldMappings || {};

  const allMappingsSelected = useMemo(
    () =>
      selectedFields.length > 0 &&
      selectedFields.every((gid) => Boolean(fieldMappings?.[gid])),
    [fieldMappings, selectedFields],
  );

  const fetchWorkspaces = async (patID) => {
    setLoading(true);
    setApiError("");
    setWorkspaces([]);

    try {
      const res = await axios.get("https://app.asana.com/api/1.0/workspaces", {
        headers: { Authorization: `Bearer ${patID}` },
      });
      setWorkspaces(res?.data?.data || []);
      setStep(1);
    } catch (error) {
      setApiError(
        getErrorMessage(
          error,
          "Failed to fetch workspaces. Please check your PAT ID.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (patID, workspaceId) => {
    setLoading(true);
    setApiError("");
    setProjects([]);

    try {
      const res = await axios.get(
        `https://app.asana.com/api/1.0/projects?workspace=${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${patID}` },
        },
      );
      setProjects(res?.data?.data || []);
      setStep(2);
    } catch (error) {
      setApiError(
        getErrorMessage(
          error,
          "Failed to fetch projects. Please check your PAT ID and workspace.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (patID, workspaceId) => {
    setLoading(true);
    setApiError("");
    setWorkspaceUsers([]);

    try {
      const res = await axios.get(
        `https://app.asana.com/api/1.0/users?workspace=${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${patID}` },
        },
      );
      setWorkspaceUsers(res?.data?.data || []);
      setStep(3);
    } catch (error) {
      setApiError(
        getErrorMessage(
          error,
          "Failed to fetch users. Please check your workspace access.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (patID, projectId) => {
    setLoading(true);
    setApiError("");
    setProjectCustomFields([]);

    try {
      const res = await axios.get(
        `https://app.asana.com/api/1.0/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${patID}` },
        },
      );
      setProjectCustomFields(res?.data?.data?.custom_field_settings || []);
      setStep(4);
    } catch (error) {
      setApiError(
        getErrorMessage(
          error,
          "Failed to fetch project details. Please check your project access.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const storeAllData = async () => {
    const currentValues = form.getFieldsValue(true);

    const customFields = Object.fromEntries(
      (currentValues?.fieldsMap || [])
        .map((gid) => {
          const mappedField = currentValues?.fieldMappings?.[gid];
          const customFieldObj = projectCustomFields.find(
            (item) => item?.custom_field?.gid === gid,
          );

          if (!mappedField || !customFieldObj) return null;
          return [mappedField, customFieldObj];
        })
        .filter(Boolean),
    );

    const payload = {
      custom_fields: customFields,
      patID: currentValues?.patID,
      workspace: currentValues?.workspace,
      projects: currentValues?.project ? [currentValues.project] : [],
      assignee: currentValues?.assignee,
    };

    setLoading(true);
    setApiError("");
    setSaved(false);

    try {
      await api.post("/api/CDFAsana/Add", payload);
      setSaved(true);
      setStep(5);
      message.success("Asana details stored successfully.");
      onSuccess?.(payload);
    } catch (error) {
      setApiError(
        getErrorMessage(error, "Failed to submit data. Please check your input."),
      );
    } finally {
      setLoading(false);
    }
  };

  const goNext = async () => {
    const currentValues = form.getFieldsValue(true);

    if (step === 0) {
      try {
        await form.validateFields(["patID"]);
        await fetchWorkspaces(currentValues?.patID);
      } catch {
        return;
      }
      return;
    }

    if (step === 1) {
      if (!currentValues?.workspace) {
        message.warning("Please select a workspace first.");
        return;
      }
      await fetchProjects(currentValues?.patID, currentValues?.workspace);
      return;
    }

    if (step === 2) {
      if (!currentValues?.project) {
        message.warning("Please select a project first.");
        return;
      }
      await fetchUsers(currentValues?.patID, currentValues?.workspace);
      return;
    }

    if (step === 3) {
      if (!currentValues?.assignee) {
        message.warning("Please select an assignee first.");
        return;
      }
      await fetchProjectDetails(currentValues?.patID, currentValues?.project);
      return;
    }

    if (step === 4) {
      if (!selectedFields.length) {
        message.warning("Please select at least one custom field.");
        return;
      }

      if (!allMappingsSelected) {
        message.warning("Please map each selected Asana field to an app field.");
        return;
      }

      await storeAllData();
    }
  };

  const goBack = () => {
    if (step === 0 || loading || step === 5) return;
    setApiError("");
    setStep((current) => current - 1);
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <Steps
        current={step}
        size="small"
        items={STEP_ITEMS}
        labelPlacement="vertical"
        responsive
        style={{ marginBottom: 20 }}
      />

      <Form
        layout="vertical"
        form={form}
        initialValues={{
          patID: "",
          workspace: undefined,
          project: undefined,
          assignee: undefined,
          fieldsMap: [],
          fieldMappings: {},
        }}
      >
        {step === 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 8 }}>
                How to fetch your Asana PAT ID?
              </Title>
              <ul style={{ paddingLeft: 18, marginBottom: 0, color: "#4b5563" }}>
                <li>Log in to your Asana account.</li>
                <li>Open `My Profile Settings`, then `Apps`.</li>
                <li>Use `Manage Developer Apps` to generate a new token.</li>
                <li>Copy the PAT ID and paste it below.</li>
              </ul>
            </div>

            <Form.Item
              label="Asana PAT ID"
              name="patID"
              rules={[
                { required: true, message: "PAT ID is required." },
                {
                  min: 10,
                  message: "PAT ID must be at least 10 characters.",
                },
              ]}
            >
              <Input
                size="large"
                type={showPatId ? "text" : "password"}
                placeholder="Enter your Asana PAT ID"
                suffix={
                  <span onClick={() => setShowPatId((prev) => !prev)}>
                    {showPatId ? (
                      <EyeInvisibleOutlined style={{ cursor: "pointer" }} />
                    ) : (
                      <EyeOutlined style={{ cursor: "pointer" }} />
                    )}
                  </span>
                }
              />
            </Form.Item>
          </>
        )}

        {step === 1 && (
          <>
            <Title level={5}>Find your Asana workspaces</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              Select the workspace you want to connect.
            </Text>
            <Form.Item label="Workspace" name="workspace">
              <SearchSelect
                value={values?.workspace}
                options={mapSelectOptions(workspaces)}
                placeholder="Search to select a workspace"
                onChange={(value) => {
                  form.setFieldsValue({
                    workspace: value,
                    project: undefined,
                    assignee: undefined,
                    fieldsMap: [],
                    fieldMappings: {},
                  });
                }}
              />
            </Form.Item>
            {!loading && !apiError && workspaces.length === 0 && (
              <Alert type="info" showIcon message="No workspaces found for this PAT ID." />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Title level={5}>Find your Asana projects</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              Choose the project where data should be sent.
            </Text>
            <Form.Item label="Project" name="project">
              <SearchSelect
                value={values?.project}
                options={mapSelectOptions(projects)}
                placeholder="Search to select a project"
                onChange={(value) => {
                  form.setFieldsValue({
                    project: value,
                    assignee: undefined,
                    fieldsMap: [],
                    fieldMappings: {},
                  });
                }}
              />
            </Form.Item>
            {!loading && !apiError && projects.length === 0 && (
              <Alert type="info" showIcon message="No projects found for this workspace." />
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Title level={5}>Select an assignee</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              Choose the Asana user who should receive tasks.
            </Text>
            <Form.Item label="Assignee" name="assignee">
              <SearchSelect
                value={values?.assignee}
                options={mapSelectOptions(workspaceUsers)}
                placeholder="Search to select an assignee"
                onChange={(value) => form.setFieldValue("assignee", value)}
              />
            </Form.Item>
            {!loading && !apiError && workspaceUsers.length === 0 && (
              <Alert
                type="info"
                showIcon
                message="No users found in the selected workspace."
              />
            )}
          </>
        )}

        {step === 4 && (
          <>
            <Title level={5}>Asana custom field mapping</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              Select custom fields from Asana and map them to app fields.
            </Text>
            <Form.Item label="Asana Custom Fields" name="fieldsMap">
              <SearchSelect
                mode="multiple"
                value={selectedFields}
                options={projectCustomFields.map((item) => ({
                  value: item?.custom_field?.gid,
                  label: `${toSentenceCase(item?.custom_field?.name || "Unnamed")} (${item?.custom_field?.gid})`,
                }))}
                placeholder="Search to select custom fields"
                onChange={(value = []) => {
                  const previousMappings = form.getFieldValue("fieldMappings") || {};
                  const nextMappings = Object.fromEntries(
                    value
                      .filter((gid) => previousMappings?.[gid])
                      .map((gid) => [gid, previousMappings[gid]]),
                  );

                  form.setFieldsValue({
                    fieldsMap: value,
                    fieldMappings: nextMappings,
                  });
                }}
              />
            </Form.Item>

            {!loading && !apiError && projectCustomFields.length === 0 && (
              <Alert
                type="info"
                showIcon
                message="No custom fields found in the selected Asana project."
                style={{ marginBottom: 12 }}
              />
            )}

            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {selectedFields.map((gid) => {
                const field = projectCustomFields.find(
                  (item) => item?.custom_field?.gid === gid,
                );

                return (
                  <div
                    key={gid}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 24px minmax(0, 1fr)",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: "#f8fafc",
                      border: "1px solid rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <div>
                      <Text strong>
                        {field?.custom_field?.name || "Unknown Field"}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ display: "block", fontSize: 12 }}
                      >
                        {gid}
                      </Text>
                    </div>

                    <FaArrowRight style={{ color: "#6b7280" }} />

                    <Form.Item
                      name={["fieldMappings", gid]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        placeholder="Select app field"
                        options={APP_FIELD_OPTIONS}
                        getPopupContainer={(trigger) => trigger.parentNode}
                      />
                    </Form.Item>
                  </div>
                );
              })}
            </Space>
          </>
        )}

        {step === 5 && (
          <>
            <Title level={5}>Asana details saved</Title>
            {saved && (
              <Alert
                type="success"
                showIcon
                message="Success"
                description="Asana details stored successfully."
              />
            )}
            {!saved && apiError && (
              <Alert
                type="error"
                showIcon
                message="Error"
                description={apiError}
              />
            )}
          </>
        )}

        {apiError && step !== 5 && (
          <Alert
            type="error"
            showIcon
            message="Error"
            description={apiError}
            style={{ marginBottom: 16 }}
          />
        )}

        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px 0 12px",
            }}
          >
            <Spin size="large" />
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 20,
          }}
        >
          <Button onClick={goBack} disabled={step === 0 || loading || step === 5}>
            Back
          </Button>

          {step < 5 ? (
            <Button type="primary" onClick={goNext} loading={loading}>
              {step === 4 ? "Save" : "Continue"}
            </Button>
          ) : null}
        </div>
      </Form>
    </div>
  );
}