import { Button, Form, Input } from "antd";
import { useEffect } from "react";

export default function PersonalInsuranceLoadingExclusionModal({
  onClose,
  onSave,
  editing,
  value,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      description: value?.description || value?.loadingExclusiondescription || "",
    });
  }, [form, value]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={(values) => onSave?.(values)}
      style={{ paddingTop: 20 }}
    >
      <Form.Item name="description" label="Loading / Exclusion Description">
        <Input.TextArea
          disabled={!editing}
          autoSize={{ minRows: 6, maxRows: 10 }}
          placeholder="Enter loading or exclusion details"
        />
      </Form.Item>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <Button onClick={onClose}>{editing ? "Cancel" : "Close"}</Button>
        {editing ? (
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        ) : null}
      </div>
    </Form>
  );
}
