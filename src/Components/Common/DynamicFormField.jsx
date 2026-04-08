import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Spin,
  Switch,
} from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";
import axios from "axios";
import { useEffect, useRef, useState } from "react";

const { TextArea, Password } = Input;
const GEONAMES_USERNAME = "usamasaeed3k";

function resolveMaybeFunction(value, form) {
  return typeof value === "function" ? value(form) : value;
}

function isFunction(value) {
  return typeof value === "function";
}

function composeEventHandlers(...handlers) {
  return (...args) => {
    handlers.forEach((handler) => {
      if (typeof handler === "function") {
        handler(...args);
      }
    });
  };
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

function PostcodeSearchSelect({
  placeholder,
  value,
  onChange,
  disabled,
  ...fieldProps
}) {
  const [optionsData, setOptionsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!value) return;
    setOptionsData((prev) =>
      prev.some((item) => item.value === value)
        ? prev
        : [{ value, label: value }, ...prev],
    );
  }, [value]);

  const handleSearch = async (query) => {
    if (!query) {
      setOptionsData(value ? [{ value, label: value }] : []);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const res = await axios.get(
        `https://secure.geonames.org/postalCodeSearchJSON?placename=${encodeURIComponent(
          query,
        )}&country=AU&maxRows=10&username=${GEONAMES_USERNAME}`,
      );

      if (currentRequestId !== requestIdRef.current) return;

      const mapped = (res.data.postalCodes || []).map((place) => ({
        value: `${place.placeName} (${place.postalCode})`,
        label: `${place.placeName} (${place.postalCode})`,
      }));

      setOptionsData(
        value && !mapped.some((item) => item.value === value)
          ? [{ value, label: value }, ...mapped]
          : mapped,
      );
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Error fetching postcodes:", error);
      setOptionsData(value ? [{ value, label: value }] : []);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <Select
      showSearch
      allowClear
      value={value || undefined}
      placeholder={placeholder || "Type suburb or postcode..."}
      onSearch={handleSearch}
      onChange={onChange}
      filterOption={false}
      notFoundContent={loading ? <Spin size="small" /> : null}
      options={optionsData}
      style={{ width: "100%" }}
      disabled={disabled}
      getPopupContainer={() => document.body}
      dropdownStyle={{ minWidth: 200 }} // Increase only popup width
      {...fieldProps}
    />
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
      return (
        <TextArea
          placeholder={placeholder}
          autoSize={{ minRows: 2 }}
          {...fieldProps}
        />
      );

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

    case "postalcode-search":
      return <PostcodeSearchSelect placeholder={placeholder} {...fieldProps} />;

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
  onChange,
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
            onChange: composeEventHandlers(fieldProps.onChange, onChange),
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
      {() =>
        renderField(
          resolveMaybeFunction(disabled, form),
          resolveMaybeFunction(hidden, form),
        )
      }
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
