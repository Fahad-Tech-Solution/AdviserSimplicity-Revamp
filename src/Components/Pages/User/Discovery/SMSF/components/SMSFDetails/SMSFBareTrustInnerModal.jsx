import { Button, Col, Form, Divider, Row, Select, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function parseDigitsValue(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function buildInitialValues(value = {}) {
  const count =
    Number(value?.NumberOfDirectors) ||
    (Array.isArray(value?.directorNameArray)
      ? value.directorNameArray.length
      : 0);

  return {
    bareTrusteeName: value?.bareTrusteeName || "",
    ACN: parseDigitsValue(value?.ACN),
    NumberOfDirectors: count || undefined,
    directorNameArray: Array.from({ length: count }, (_, index) => ({
      directorName: value?.directorNameArray?.[index] || "",
    })),
  };
}

function buildDirectorRows(count, rows = []) {
  return Array.from({ length: count }, (_, index) => ({
    directorName: rows?.[index]?.directorName || "",
  }));
}

function buildTableRow({ count, bareTrusteeName, ACN, directorRows }) {
  const directorFields = {};

  Array.from({ length: count }, (_, index) => {
    directorFields[`director_${index}`] =
      directorRows?.[index]?.directorName || "";
    return null;
  });

  return [
    {
      key: "smsf-bare-trust",
      formPath: [],
      rowNumber: 1,
      bareTrusteeName,
      ACN,
      ...directorFields,
    },
  ];
}

function hasMeaningfulValues(initialValues = {}) {
  return [
    initialValues?.bareTrusteeName,
    initialValues?.ACN,
    ...(initialValues?.directorNameArray || []).map(
      (item) => item?.directorName,
    ),
  ].some((value) => String(value ?? "").trim() !== "");
}

export default function SMSFBareTrustInnerModal({ modalData }) {
  const renderTitleBlock = useTitleBlock();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  const directorOptions = useMemo(
    () => {
      console.log(modalData?.directorOptions, "modalData?.directorOptions, in Bare Trust Inner Modal");
      return (Array.isArray(modalData?.directorOptions)
        ? modalData.directorOptions
        : []
      )
        .filter((value) => String(value ?? "").trim() !== "")
        .map((value) => ({
          label: value,
          value,
        }));
    }
    , [modalData?.directorOptions]);

  const initialValues = useMemo(
    () => buildInitialValues(modalData?.value),
    [modalData?.value],
  );

  const countWatch = Form.useWatch("NumberOfDirectors", form);
  const directorRowsWatch = Form.useWatch("directorNameArray", form);
  const bareTrusteeNameWatch = Form.useWatch("bareTrusteeName", form);
  const acnWatch = Form.useWatch("ACN", form);
  const directorRows = Array.isArray(directorRowsWatch)
    ? directorRowsWatch
    : initialValues.directorNameArray;

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const mergedColumns = useMemo(
    () => [
      {
        title: "No#",
        dataIndex: "rowNumber",
        key: "rowNumber",
        width: 50,
        editable: false,
      },
      {
        title: "Bare Trustee Name",
        dataIndex: "bareTrusteeName",
        key: "bareTrusteeName",
        field: "bareTrusteeName",
        type: "text",
        placeholder: "Bare Trustee Name",
      },
      {
        title: "ACN",
        dataIndex: "ACN",
        key: "ACN",
        field: "ACN",
        type: "text",
        placeholder: "ACN",
        onChange: (value, _record, column, currentForm) => {
          currentForm.setFieldValue(
            column.field,
            parseDigitsValue(value?.target?.value ?? value),
          );
        },
      },
      ...Array.from({ length: Number(countWatch) || 0 }, (_, index) => ({
        title: `Director ${index + 1}`,
        dataIndex: `director_${index}`,
        key: `director_${index}`,
        type: "select",
        options: directorOptions,
        placeholder: `Select Director ${index + 1}`,
      })),
    ],
    [countWatch, directorOptions],
  );

  const tableData = useMemo(
    () =>
      buildTableRow({
        count: Number(countWatch) || 0,
        bareTrusteeName: bareTrusteeNameWatch ?? initialValues.bareTrusteeName,
        ACN: acnWatch ?? initialValues.ACN,
        directorRows,
      }),
    [
      countWatch,
      acnWatch,
      bareTrusteeNameWatch,
      directorRows,
      initialValues.ACN,
      initialValues.bareTrusteeName,
    ],
  );

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    const currentRows = form.getFieldValue("directorNameArray") || [];

    form.setFieldValue("NumberOfDirectors", nextValue);
    form.setFieldValue(
      "directorNameArray",
      buildDirectorRows(nextCount, currentRows),
    );
  };

  const handleConfirmAndExit = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);
    const countValue = Number(values?.NumberOfDirectors) || 0;
    const normalizedRows = buildDirectorRows(
      countValue,
      Array.isArray(values?.directorNameArray) ? values.directorNameArray : [],
    );

    modalData?.onSave?.({
      NumberOfDirectors: countValue,
      bareTrusteeName: values?.bareTrusteeName || "",
      ACN: parseDigitsValue(values?.ACN),
      directorNameArray: normalizedRows.map((item) => item?.directorName || ""),
    });

    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "0px 4px 0px 4px" }}>
      <div style={{ marginBottom: 12 }}>
        {renderTitleBlock({
          title: modalData?.title,
          icon: modalData?.icon || null,
          clossButton: true,
          onClose: () => modalData?.closeModal?.(),
          isEditing: editing,
        })}
        <Divider style={{ margin: "12px 0px 0px 0px" }} />
      </div>
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
          <Col xs={24} md={8}>
            <Form.Item
              label="Number of Directors :"
              name="NumberOfDirectors"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                disabled={!editing}
                onChange={handleCountChange}
                style={{ width: "100%", borderRadius: "8px" }}


                options={Array.from(
                  { length: Math.min(directorOptions.length || 6, 6) },
                  (_, index) => ({
                    value: index + 1,
                    label: index + 1,
                  }),
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues?.NumberOfDirectors !==
                currentValues?.NumberOfDirectors ||
                prevValues?.directorNameArray !==
                currentValues?.directorNameArray ||
                prevValues?.bareTrusteeName !==
                currentValues?.bareTrusteeName ||
                prevValues?.ACN !== currentValues?.ACN
              }
            >
              {() => (
                <EditableDynamicTable
                  form={form}
                  editing={editing}
                  columns={mergedColumns}
                  data={tableData}
                  tableProps={TABLE_PROPS}
                  getFieldName={(_record, column) => {
                    if (column.key?.startsWith("director_")) {
                      const index = Number(
                        String(column.key).replace("director_", ""),
                      );
                      return ["directorNameArray", index, "directorName"];
                    }

                    return [column.field || column.dataIndex || column.key];
                  }}
                />
              )}
            </Form.Item>
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
                    <Button onClick={() => modalData?.closeModal?.()}>
                      Cancel
                    </Button>
                    <Button type="primary" onClick={() => setEditing(true)}>
                      Edit <RiEdit2Fill />
                    </Button>
                  </>
                ) : (
                  <Button type="primary" onClick={handleConfirmAndExit}>
                    Confirm and Exit
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
