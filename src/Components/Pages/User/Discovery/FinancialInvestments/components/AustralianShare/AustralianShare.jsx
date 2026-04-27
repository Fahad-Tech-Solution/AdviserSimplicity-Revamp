import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Row,
  Select,
  Space,
  Tooltip,
} from "antd";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { IoReload, IoWarning } from "react-icons/io5";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock";

const TABLE_PROPS = {
  showCount: false,
  noPagination: false,
  pageSize: 10,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function normalizeAsxCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function isValidAsxCode(value) {
  return /^[A-Z0-9]+\.AX$/.test(normalizeAsxCode(value));
}

function buildEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => ({
    ASXCode: entries?.[index]?.ASXCode || "",
    companyName: entries?.[index]?.companyName || "",
    sharePrice: entries?.[index]?.sharePrice || "",
    shares: entries?.[index]?.shares || "",
    costBase: entries?.[index]?.costBase || "",
    currentBalance: entries?.[index]?.currentBalance || "",
  }));
}

function buildInitialValues(ownerArray = []) {
  return {
    NumberOfMap: ownerArray.length || undefined,
    shares: ownerArray,
  };
}

function hasMeaningfulValues(initialValues = {}) {
  const rows = initialValues?.shares || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;

  return rows.some((row) =>
    [
      row?.ASXCode,
      row?.companyName,
      row?.sharePrice,
      row?.shares,
      row?.costBase,
      row?.currentBalance,
    ].some((value) => String(value ?? "").trim() !== ""),
  );
}

function calculateCurrentBalance(sharePrice, shares) {
  const price = parseCurrencyValue(sharePrice);
  const quantity = Number(String(shares ?? "").replace(/[^0-9.-]/g, "")) || 0;
  return price && quantity ? toCommaAndDollar(price * quantity) : "";
}

function resolveSorterKey(sorter) {
  return (
    sorter?.field ||
    sorter?.columnKey ||
    sorter?.column?.dataIndex ||
    sorter?.column?.key ||
    null
  );
}

async function fetchShareQuote(code) {
  const normalizedCode = normalizeAsxCode(code);
  if (!isValidAsxCode(normalizedCode)) return null;
  console.log("normalizedCode", normalizedCode);

  const settings = {
    headers: {
      "X-RapidAPI-Key": "5e10294d2amsh7867e98a73e61abp176da5jsn21b129bfc40a",
      "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
    },
  };

  const response = await axios.get(
    `https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes?region=AU&symbols=${encodeURIComponent(
      normalizedCode,
    )}`,
    settings,
  );

  const company = response?.data?.quoteResponse?.result?.[0];
  if (!company) return null;

  return {
    companyName: company.longName || company.shortName || "",
    sharePrice: company.regularMarketPrice
      ? toCommaAndDollar(company.regularMarketPrice)
      : "",
  };
}

export default function AustralianShare({ modalData }) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [updatingData, setUpdatingData] = useState(false);
  const [sortState, setSortState] = useState({
    columnKey: null,
    order: null,
  });
  const renderTitleBlock = useTitleBlock();

  const ownerArray =
    modalData?.parentForm?.getFieldValue?.([
      modalData?.ownerKey,
      "currentBalanceArray",
    ]) || [];
  const initialValues = useMemo(
    () => buildInitialValues(ownerArray),
    [ownerArray],
  );

  const count = Form.useWatch("NumberOfMap", form);
  const shares = Form.useWatch("shares", form) || initialValues.shares || [];

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  useEffect(() => {
    if (!editing) return;
    setSortState({
      columnKey: null,
      order: null,
    });
  }, [editing]);

  const detailRows = useMemo(
    () =>
      buildEntries(Number(count) || 0, shares).map((item, index) => ({
        key: `${modalData?.ownerKey || "owner"}-share-${index}`,
        formPath: ["shares", index],
        rowNumber: index + 1,
        ...item,
      })),
    [count, modalData?.ownerKey, shares],
  );

  const sortedDetailRows = useMemo(() => {
    if (editing || !sortState?.columnKey || !sortState?.order) {
      return detailRows;
    }

    const compareText = (left, right) => {
      if (left && right) return String(left).localeCompare(String(right));
      if (left) return -1;
      if (right) return 1;
      return 0;
    };

    const sorters = {
      ASXCode: (a, b) => compareText(a?.ASXCode, b?.ASXCode),
      companyName: (a, b) => compareText(a?.companyName, b?.companyName),
      sharePrice: (a, b) =>
        parseCurrencyValue(a?.sharePrice) - parseCurrencyValue(b?.sharePrice),
      currentBalance: (a, b) =>
        parseCurrencyValue(a?.currentBalance) -
        parseCurrencyValue(b?.currentBalance),
    };

    const compare = sorters[sortState.columnKey];
    if (typeof compare !== "function") {
      return detailRows;
    }

    const multiplier = sortState.order === "descend" ? -1 : 1;
    return [...detailRows].sort((a, b) => compare(a, b) * multiplier);
  }, [detailRows, editing, sortState]);

  const previousDataExists = useMemo(
    () => (initialValues?.shares || []).length > 0,
    [initialValues],
  );

  const refreshShareRow = async (index, currentForm, currentShares) => {
    const code = currentShares?.[index]?.ASXCode;
    if (!isValidAsxCode(code)) return;

    const quote = await fetchShareQuote(code);
    if (!quote) return;

    currentForm.setFieldValue(
      ["shares", index, "ASXCode"],
      normalizeAsxCode(code),
    );
    currentForm.setFieldValue(
      ["shares", index, "companyName"],
      quote.companyName,
    );
    currentForm.setFieldValue(
      ["shares", index, "sharePrice"],
      quote.sharePrice,
    );
    currentForm.setFieldValue(
      ["shares", index, "currentBalance"],
      calculateCurrentBalance(quote.sharePrice, currentShares?.[index]?.shares),
    );
  };

  const handleRefreshAll = async () => {
    try {
      setUpdatingData(true);
      const currentShares = form.getFieldValue("shares") || [];
      const countValue = Number(form.getFieldValue("NumberOfMap")) || 0;

      for (let index = 0; index < countValue; index += 1) {
        // Sequential keeps request pressure low and preserves row order updates.
        // eslint-disable-next-line no-await-in-loop
        await refreshShareRow(index, form, currentShares);
      }
    } catch (error) {
      console.error("Failed to refresh Australian share quotes", error);
    } finally {
      setUpdatingData(false);
    }
  };

  const syncParentValues = (nextEntries) => {
    const totalBalance = nextEntries.reduce(
      (total, item) => total + parseCurrencyValue(item?.currentBalance),
      0,
    );
    const totalCostBase = nextEntries.reduce(
      (total, item) => total + parseCurrencyValue(item?.costBase),
      0,
    );

    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalanceArray"],
      nextEntries,
    );
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalance"],
      totalBalance ? toCommaAndDollar(totalBalance) : "",
    );
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "costBase"],
      totalCostBase ? toCommaAndDollar(totalCostBase) : "",
    );
  };

  const handleRemoveRow = (rowIndex) => {
    const currentShares = form.getFieldValue("shares") || [];
    const nextEntries = currentShares.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("shares", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);

    if (!editing) {
      syncParentValues(nextEntries);
    }
  };

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 50,
      editable: false,
    },
    {
      title: (
        <>
          ASX Code{" "}
          <Tooltip title="Correct format: use ASX code followed by .AX, for example QAN.AX">
            <FaInfoCircle />
          </Tooltip>
        </>
      ),
      dataIndex: "ASXCode",
      key: "ASXCode",
      field: "ASXCode",
      type: "text",
      placeholder: "ASX Code",
      onChange: async (value, record, column, currentForm) => {
        const nextCode = normalizeAsxCode(value?.target?.value);
        currentForm.setFieldValue([...record.formPath, column.field], nextCode);

        if (!isValidAsxCode(nextCode)) {
          currentForm.setFieldValue([...record.formPath, "companyName"], "");
          currentForm.setFieldValue([...record.formPath, "sharePrice"], "");
          currentForm.setFieldValue([...record.formPath, "currentBalance"], "");
          return;
        }

        try {
          const quote = await fetchShareQuote(nextCode);
          if (!quote) return;

          currentForm.setFieldValue(
            [...record.formPath, "companyName"],
            quote.companyName,
          );
          currentForm.setFieldValue(
            [...record.formPath, "sharePrice"],
            quote.sharePrice,
          );
          currentForm.setFieldValue(
            [...record.formPath, "currentBalance"],
            calculateCurrentBalance(
              quote.sharePrice,
              currentForm.getFieldValue([...record.formPath, "shares"]),
            ),
          );
        } catch (error) {
          console.error("Failed to fetch ASX quote", error);
        }
      },
      sorter: (a, b) => {
        if (a.ASXCode && b.ASXCode) {
          return a.ASXCode.localeCompare(b.ASXCode);
        }
        if (a.ASXCode) return -1;
        if (b.ASXCode) return 1;
        return 0;
      },
      sortOrder:
        sortState.columnKey === "ASXCode" ? sortState.order : undefined,
    },
    {
      title: "Company Name",
      dataIndex: "companyName",
      key: "companyName",
      field: "companyName",
      type: "text",
      placeholder: "Company Name",
      disabled: true,
      // INSERT_YOUR_CODE
      sorter: (a, b) => {
        if (a.companyName && b.companyName) {
          return a.companyName.localeCompare(b.companyName);
        }
        if (a.companyName) return -1;
        if (b.companyName) return 1;
        return 0;
      },
      sortOrder:
        sortState.columnKey === "companyName" ? sortState.order : undefined,
    },
    {
      title: "Share Price",
      dataIndex: "sharePrice",
      key: "sharePrice",
      field: "sharePrice",
      type: "text",
      placeholder: "Share Price",
      disabled: true,
      onChange: (value, record, column, currentForm) => {
        const nextPrice = formatCurrencyValue(value?.target?.value);
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          nextPrice,
        );
        currentForm.setFieldValue(
          [...record.formPath, "currentBalance"],
          calculateCurrentBalance(
            nextPrice,
            currentForm.getFieldValue([...record.formPath, "shares"]),
          ),
        );
      },
      sorter: (a, b) => {
        // Remove $ and commas for comparison, handle empty/null gracefully
        const getNumeric = (val) => {
          if (!val) return 0;
          return Number(String(val).replace(/[^0-9.-]+/g, ""));
        };
        return getNumeric(a.sharePrice) - getNumeric(b.sharePrice);
      },
      sortOrder:
        sortState.columnKey === "sharePrice" ? sortState.order : undefined,
    },
    {
      title: "Shares",
      dataIndex: "shares",
      key: "shares",
      field: "shares",
      type: "number",
      placeholder: "Number of Shares",
      onChange: (value, record, column, currentForm) => {
        const nextShares = value?.target?.value ?? value;
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          nextShares,
        );
        currentForm.setFieldValue(
          [...record.formPath, "currentBalance"],
          calculateCurrentBalance(
            currentForm.getFieldValue([...record.formPath, "sharePrice"]),
            nextShares,
          ),
        );
      },
    },
    {
      title: "Cost Base",
      dataIndex: "costBase",
      key: "costBase",
      field: "costBase",
      type: "text",
      placeholder: "Cost Base",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          formatCurrencyValue(value?.target?.value),
        );
      },
    },
    {
      title: "Current Balance",
      dataIndex: "currentBalance",
      key: "currentBalance",
      field: "currentBalance",
      type: "text",
      placeholder: "Current Balance",
      disabled: true,
      sorter: (a, b) => {
        // Remove all currency formatting and compare as numbers
        const getNumeric = (val) =>
          Number(String(val ?? "").replace(/[^0-9.-]+/g, "")) || 0;
        return getNumeric(a.currentBalance) - getNumeric(b.currentBalance);
      },
      sortOrder:
        sortState.columnKey === "currentBalance" ? sortState.order : undefined,
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      editable: false,
      renderView: () => "--",
      renderEdit: ({ record }) => (
        <Button
          type="text"
          danger
          aria-label={`Remove row ${record?.rowNumber}`}
          onClick={() => handleRemoveRow((record?.rowNumber || 1) - 1)}
        >
          🗑️
        </Button>
      ),
    },
  ];

  const handleCountChange = (nextValue) => {
    const numericValue = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue("shares", buildEntries(numericValue, shares));
  };

  const handleConfirmAndExit = async () => {
    const values = await form.validateFields();
    const countValue = Number(values?.NumberOfMap) || 0;
    const savedEntries = buildEntries(countValue, values?.shares || []);
    syncParentValues(savedEntries);

    setEditing(false);
    modalData?.closeModal?.();
  };

  const handleTableChange = (_pagination, _filters, sorter) => {
    const nextSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setSortState({
      columnKey: resolveSorterKey(nextSorter),
      order: nextSorter?.order || null,
    });
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
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          {previousDataExists && editing ? (
            <Col xs={24}>
              <Alert
                type="warning"
                showIcon
                icon={<IoWarning />}
                message={
                  <Space
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      onClick={() => {
                        console.log("All values", form.getFieldsValue());
                      }}
                    >
                      Please press this button to update share price
                    </span>
                    <Button
                      type="default"
                      icon={<IoReload />}
                      onClick={handleRefreshAll}
                      loading={updatingData}
                    />
                  </Space>
                }
              />
            </Col>
          ) : null}

          <Col xs={24} md={12}>
            <Form.Item
              label="Number of Australian Shares/ETFs"
              name="NumberOfMap"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from(
                  { length: modalData?.tableRows || 50 },
                  (_, index) => ({
                    value: index + 1,
                    label: index + 1,
                  }),
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={sortedDetailRows}
              tableProps={{
                ...TABLE_PROPS,
                onChange: handleTableChange,
              }}
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
