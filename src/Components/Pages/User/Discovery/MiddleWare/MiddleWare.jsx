import { Button, Col, Form, Row, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../Common/EditableDynamicTable";
import { renderModalContent } from "../../../../Common/renderModalContent";
import useTitleBlock from "../../../../../hooks/useTitleBlock";
import AppModal from "../../../../Common/AppModal";
import { discoveryDataAtom } from "../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../hooks/helpers";
import useApi from "../../../../../hooks/useApi";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
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

function buildOwnerLabel(type, discoveryData) {
  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName ||
    discoveryData?.personaldetails?.client?.clientPreferredName ||
    "Client";
  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName ||
    discoveryData?.personaldetails?.partner?.partnerPreferredName ||
    "Partner";

  if (type === "client") return clientName;
  if (type === "partner") return partnerName;
  return `${clientName} & ${partnerName}`;
}

function buildInitialValues(sectionData = {}) {
  return {
    client: {
      currentBalanceArray: sectionData?.client || [],
      currentBalance: sectionData?.clientCurrentBalance || "",
      costBase: sectionData?.clientCostBaseTemp || "",
    },
    partner: {
      currentBalanceArray: sectionData?.partner || [],
      currentBalance: sectionData?.partnerCurrentBalance || "",
      costBase: sectionData?.partnerCostBaseTemp || "",
    },
    joint: {
      currentBalanceArray: sectionData?.joint || [],
      currentBalance: sectionData?.jointCurrentBalance || "",
      costBase: sectionData?.jointCostBaseTemp || "",
    },
  };
}

function calculateTotalBalance(entries = []) {
  return entries.reduce(
    (sum, item) => sum + parseCurrencyValue(item?.currentBalance),
    0,
  );
}

function calculateDisplayTotal(primaryBalance, jointBalance) {
  const primary = parseCurrencyValue(primaryBalance);
  const joint = parseCurrencyValue(jointBalance);
  return formatCurrencyValue(primary + joint / 2);
}

const MiddleWare = ({ modalData }) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();

  const headingStyle = { fontFamily: "Georgia,serif" };
  const renderTitleBlock = useTitleBlock({
    titleStyle: headingStyle,
  });

  const MIDDLEWARE_CONFIG = {
    bankAccountFinance: {
      addEndpoint: "/api/bankAccountFinance/Add",
      updateEndpoint: "/api/bankAccountFinance/Update",
      countLabel: "Number of Bank Accounts",
      width: 680,
    },
    termDepositsFinance: {
      addEndpoint: "/api/termDepositsFinance/Add",
      updateEndpoint: "/api/termDepositsFinance/Update",
      countLabel: "Number of Term Deposits",
      width: 680,
    },
    australianShareMarket: {
      addEndpoint: "/api/australianShareMarket/Add",
      updateEndpoint: "/api/australianShareMarket/Update",
      countLabel: "Number of Australian Shares/ETFs",
      width: 800,
    },
  };

  const config =
    MIDDLEWARE_CONFIG[modalData?.key] || MIDDLEWARE_CONFIG.bankAccountFinance;
  config.pageLimit = modalData?.tableRows || 10;
  const hasCostBase = modalData?.key === "australianShareMarket";

  const showPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );
  const sectionData = discoveryData?.[modalData?.key] || {};

  const initialValues = useMemo(
    () => buildInitialValues(sectionData),
    [sectionData],
  );

  const clientCurrentBalance = Form.useWatch(
    ["client", "currentBalance"],
    form,
  );
  const partnerCurrentBalance = Form.useWatch(
    ["partner", "currentBalance"],
    form,
  );
  const jointCurrentBalance = Form.useWatch(["joint", "currentBalance"], form);
  const clientCostBase = Form.useWatch(["client", "costBase"], form);
  const partnerCostBase = Form.useWatch(["partner", "costBase"], form);
  const jointCostBase = Form.useWatch(["joint", "costBase"], form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?._id);
  }, [form, initialValues, sectionData?._id]);

  const openInnerModal = useCallback(
    ({ record, form: currentForm }) => {
      setDetailModalOpen(true);
      setDetailModalData({
        title: `${record?.owner || "Owner"} ${modalData?.title || ""}`.trim(),
        component: modalData?.innerComponent || null,
        icon: modalData?.icon || null,
        width: config.width || 680,
        ownerKey: record?.formPath?.[0],
        ownerLabel: record?.owner,
        parentForm: currentForm,
        sectionKey: modalData?.key,
        tableRows: modalData?.tableRows || 10,
        closeModal: () => setDetailModalOpen(false),
      });
    },
    [modalData?.innerComponent, modalData?.key, modalData?.title],
  );

  const tableColumns = useMemo(() => {
    const columns = [
      {
        title: "Owner",
        dataIndex: "owner",
        key: "owner",
        editable: false,
      },
      {
        title: "Current Balance",
        dataIndex: "currentBalance",
        key: "currentBalance",
        field: "currentBalance",
        disabled: true,
        type: "input-action",
        placeholder: "Current Balance",
        action: {
          name: "Open Current Balance",
          onClick: openInnerModal,
        },
      },
    ];

    if (hasCostBase) {
      columns.push({
        title: "Cost Base",
        dataIndex: "costBase",
        key: "costBase",
        field: "costBase",
        disabled: true,
        type: "text",
        placeholder: "Cost Base",
      });
    }

    return columns;
  }, [hasCostBase, openInnerModal]);

  const rowData = useMemo(() => {
    const rows = [
      {
        key: "client",
        formPath: ["client"],
        owner: buildOwnerLabel("client", discoveryData),
        currentBalance:
          clientCurrentBalance ?? initialValues?.client?.currentBalance,
        costBase: clientCostBase ?? initialValues?.client?.costBase,
      },
    ];

    if (showPartner) {
      rows.push(
        {
          key: "partner",
          formPath: ["partner"],
          owner: buildOwnerLabel("partner", discoveryData),
          currentBalance:
            partnerCurrentBalance ?? initialValues?.partner?.currentBalance,
          costBase: partnerCostBase ?? initialValues?.partner?.costBase,
        },
        {
          key: "joint",
          formPath: ["joint"],
          owner: buildOwnerLabel("joint", discoveryData),
          currentBalance:
            jointCurrentBalance ?? initialValues?.joint?.currentBalance,
          costBase: jointCostBase ?? initialValues?.joint?.costBase,
        },
      );
    }

    return rows;
  }, [
    clientCurrentBalance,
    clientCostBase,
    discoveryData,
    initialValues,
    jointCurrentBalance,
    jointCostBase,
    partnerCurrentBalance,
    partnerCostBase,
    showPartner,
  ]);

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = {
      ...formValues,
      ...values,
      client: {
        ...(formValues?.client || {}),
        ...(values?.client || {}),
      },
      partner: {
        ...(formValues?.partner || {}),
        ...(values?.partner || {}),
      },
      joint: {
        ...(formValues?.joint || {}),
        ...(values?.joint || {}),
      },
    };

    const payload = {
      ...sectionData,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        discoveryData?.personaldetails?._id ||
        undefined,
      client: sourceValues?.client?.currentBalanceArray || [],
      partner: showPartner
        ? sourceValues?.partner?.currentBalanceArray || []
        : [],
      joint: showPartner ? sourceValues?.joint?.currentBalanceArray || [] : [],
      clientCurrentBalance: sourceValues?.client?.currentBalance || "",
      partnerCurrentBalance: showPartner
        ? sourceValues?.partner?.currentBalance || ""
        : "",
      jointCurrentBalance: showPartner
        ? sourceValues?.joint?.currentBalance || ""
        : "",
      clientTotal: showPartner
        ? calculateDisplayTotal(
            sourceValues?.client?.currentBalance,
            sourceValues?.joint?.currentBalance,
          )
        : sourceValues?.client?.currentBalance || "",
      partnerTotal: showPartner
        ? calculateDisplayTotal(
            sourceValues?.partner?.currentBalance,
            sourceValues?.joint?.currentBalance,
          )
        : "",
      ...(hasCostBase
        ? {
            clientCostBaseTemp: sourceValues?.client?.costBase || "",
            partnerCostBaseTemp: showPartner
              ? sourceValues?.partner?.costBase || ""
              : "",
            jointCostBaseTemp: showPartner
              ? sourceValues?.joint?.costBase || ""
              : "",
          }
        : {}),
    };

    try {
      setSaving(true);

      const saved = sectionData?._id
        ? await patch(config.updateEndpoint, payload)
        : await post(config.addEndpoint, payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Financial section"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Financial section"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={renderTitleBlock({
          title: detailModalData?.title,
          icon: detailModalData?.icon,
        })}
        width={detailModalData?.width}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        layout="vertical"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={tableColumns}
              data={rowData}
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
                <Button onClick={() => modalData?.closeModal?.()}>
                  Cancel
                </Button>
                {!editing ? (
                  <Button
                    type="primary"
                    htmlType="button"
                    key="edit"
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    key="save"
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    disabled={saving}
                  >
                    Save
                  </Button>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default MiddleWare;
