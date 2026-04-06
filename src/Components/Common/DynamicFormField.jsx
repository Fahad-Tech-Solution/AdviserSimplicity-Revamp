import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
} from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";

const { TextArea, Password } = Input;

function resolveMaybeFunction(value, form) {
  return typeof value === "function" ? value(form) : value;
}

function isFunction(value) {
  return typeof value === "function";
}

function buildOptions(options = []) {
  return options.map((option) =>
    typeof option === "string"
      ? { label: option, value: option }
      : {
          label: option.label ?? option.value,
          value: option.value,
          disabled: option.disabled,
        },
  );
}

function getInputNode({
  type = "text",
  placeholder,
  options = [],
  fieldProps = {},
  action,
}) {
  const normalizedOptions = buildOptions(options);

  switch (type) {
    case "password":
      return <Password placeholder={placeholder} {...fieldProps} />;

    case "number":
      return (
        <InputNumber
          placeholder={placeholder}
          style={{ width: "100%" }}
          {...fieldProps}
        />
      );

    case "textarea":
      return <TextArea placeholder={placeholder} autoSize={{ minRows: 2 }} {...fieldProps} />;

    case "select":
      return (
        <Select
          placeholder={placeholder}
          options={normalizedOptions}
          allowClear
          showSearch
          optionFilterProp="label"
          {...fieldProps}
        />
      );

    case "multiselect":
      return (
        <Select
          mode="multiple"
          placeholder={placeholder}
          options={normalizedOptions}
          allowClear
          optionFilterProp="label"
          {...fieldProps}
        />
      );

    case "date":
      return (
        <DatePicker
          placeholder={placeholder}
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
          {...fieldProps}
        />
      );

    case "radio":
      return <Radio.Group options={normalizedOptions} {...fieldProps} />;

    case "checkbox":
      return <Checkbox {...fieldProps}>{placeholder}</Checkbox>;

    case "switch":
      return <Switch {...fieldProps} />;

    case "input-action":
      return (
        <Input
          placeholder={placeholder}
          addonAfter={
            <Button
              type="primary"
              size="small"
              icon={action?.icon || <ArrowUpOutlined />}
              onClick={action?.onClick}
              disabled={action?.disabled}
              style={{
                background: "#22c55e",
                borderColor: "#22c55e",
                boxShadow: "none",
              }}
            />
          }
          {...fieldProps}
        />
      );

    case "text":
    default:
      return <Input placeholder={placeholder} {...fieldProps} />;
  }
}

export default function DynamicFormField({
  form,
  name,
  label,
  type = "text",
  placeholder,
  rules = [],
  options = [],
  formItemProps = {},
  fieldProps = {},
  disabled = false,
  hidden = false,
  dependencies,
  valuePropName,
  action,
}) {
  const finalValuePropName =
    valuePropName ||
    (type === "checkbox" ? "checked" : type === "switch" ? "checked" : "value");

  const renderField = (computedDisabled, computedHidden) => {
    if (computedHidden) {
      return null;
    }

    return (
      <Form.Item
        name={name}
        label={label}
        rules={rules}
        dependencies={dependencies}
        valuePropName={finalValuePropName}
        {...formItemProps}
      >
        {getInputNode({
          type,
          placeholder,
          options,
          action,
          fieldProps: {
            disabled: computedDisabled,
            ...fieldProps,
          },
        })}
      </Form.Item>
    );
  };

  const hasDynamicVisibility = isFunction(hidden);
  const hasDynamicDisabled = isFunction(disabled);

  if (!hasDynamicVisibility && !hasDynamicDisabled) {
    return renderField(disabled, hidden);
  }

  return (
    <Form.Item noStyle shouldUpdate>
      {() => renderField(resolveMaybeFunction(disabled, form), resolveMaybeFunction(hidden, form))}
    </Form.Item>
  );
}

export function DynamicFormFields({ form, fields = [] }) {
  return fields.map((field) => (
    <DynamicFormField
      key={Array.isArray(field.name) ? field.name.join(".") : field.name}
      form={form}
      {...field}
    />
  ));
}
