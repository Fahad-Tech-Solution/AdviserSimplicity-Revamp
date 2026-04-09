import dayjs from "dayjs";
import { useMemo } from "react";
import DynamicDataTable from "./DynamicDataTable.jsx";
import DynamicFormField from "./DynamicFormField.jsx";

function toArrayPath(path) {
  if (Array.isArray(path)) return path;
  if (path === null || path === undefined || path === "") return [];
  return [path];
}

function resolveOptionsLabel(value, options = []) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { label: option, value: option }
      : option,
  );

  if (Array.isArray(value)) {
    return value
      .map(
        (item) =>
          normalizedOptions.find((option) => option?.value === item)?.label || item,
      )
      .join(", ");
  }

  return (
    normalizedOptions.find((option) => option?.value === value)?.label ?? value
  );
}

function formatCellValue(value, column, record) {
  if (typeof column.renderView === "function") {
    return column.renderView({ value, column, record });
  }

  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (column.type === "date") {
    const date = dayjs(value);
    return date.isValid() ? date.format("DD/MM/YYYY") : "--";
  }

  if (column.type === "checkbox" || column.type === "switch") {
    return value ? "Yes" : "No";
  }

  if (column.type === "select" || column.type === "multiselect") {
    return resolveOptionsLabel(value, column.options || []);
  }

  return String(value);
}

function resolveFieldName(record, column, rowPathKey, getFieldName) {
  if (typeof getFieldName === "function") {
    return getFieldName(record, column);
  }

  const rowPath = toArrayPath(record?.[rowPathKey]);
  const fieldKey = column.formField || column.dataIndex || column.key;

  return [...rowPath, fieldKey];
}

export default function EditableDynamicTable({
  form,
  editing = false,
  columns = [],
  data = [],
  rowPathKey = "formPath",
  getFieldName,
  tableProps = {},
}) {
  const resolvedColumns = useMemo(
    () =>
      (columns || []).map((column) => ({
        title: column.title,
        key: column.key || column.dataIndex,
        width: column.width,
        dataIndex: column.dataIndex,
        render: (_, record) => {
          const value = record?.[column.dataIndex];
          const fieldName = resolveFieldName(
            record,
            column,
            rowPathKey,
            getFieldName,
          );
          const resolvedAction = column.action
            ? {
                ...column.action,
                onClick: (payload) =>
                  column.action?.onClick?.({
                    ...payload,
                    record,
                    column,
                    form,
                    fieldName,
                    value: form?.getFieldValue?.(fieldName),
                  }),
              }
            : undefined;

          if (editing) {
            if (typeof column.renderEdit === "function") {
              return column.renderEdit({ record, column, form });
            }

            if (column.editable === false || column.justText) {
              return formatCellValue(value, column, record);
            }

            return (
              <DynamicFormField
                form={form}
                name={fieldName}
                type={column.type || "text"}
                options={column.options}
                placeholder={column.placeholder}
                rules={column.rules}
                disabled={column.disabled}
                hidden={column.hidden}
                dependencies={column.dependencies}
                valuePropName={column.valuePropName}
                action={resolvedAction}
                fieldProps={column.fieldProps}
                formItemProps={{
                  style: { marginBottom: 0 },
                  label: null,
                  ...column.formItemProps,
                }}
                onChange={(nextValue) =>
                  column.onChange?.(nextValue, record, column, form)
                }
              />
            );
          }

          return formatCellValue(value, column, record);
        },
      })),
    [columns, editing, form, getFieldName, rowPathKey],
  );

  return (
    <DynamicDataTable columns={resolvedColumns} data={data} {...tableProps} />
  );
}
