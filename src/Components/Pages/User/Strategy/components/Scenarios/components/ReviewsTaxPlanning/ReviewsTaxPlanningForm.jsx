import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Input, message, Row, Select, Space, Tabs, Typography } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import useApi from "../../../../../../../../hooks/useApi.js";
import { discoveryDataAtom } from "../../../../../../../../store/authState";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
const { Text } = Typography;

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: 8, overflow: "hidden" },
    headerFontSize: 11,
    bodyFontSize: 12,
};

const SAPTO_OPTIONS = [
    { label: "Yes — Couple", value: "Yes — Couple" },
    { label: "Yes — Single", value: "Yes — Single" },
    { label: "No", value: "No" },
];

function SectionTitle({ children }) {
    return (
        <Text
            style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.8px",
                color: "#6b7280",
                textTransform: "uppercase",
                marginBottom: 8,
                marginTop: 12,
            }}
        >
            {children}
        </Text>
    );
}

function buildInitialProfile() {
    return {
        sapto: "Yes — Couple",
        incomeSources: [
            { key: "current", type: "Current", salary: "12", business: "21", centrelink: "211", rental: "2122", interest: "212", dividends: "212", otherInc: "212", cgt: "545", franking: "888" },
            { key: "proposed", type: "Proposed", salary: "35", business: "889", centrelink: "455", rental: "100", interest: "2000", dividends: "1000", otherInc: "2000", cgt: "1000", franking: "1000" },
        ],
        deductions: [
            { key: "current", type: "Current", salarySacrifice: "811", rentalExp: "5454", otherExp: "88", paygPaid: "44" },
            { key: "proposed", type: "Proposed", salarySacrifice: "32500", rentalExp: "5488", otherExp: "9895", paygPaid: "87" },
        ],
    };
}

export default function ReviewsTaxPlanningForm({ modalData }) {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState("client");
    const [editing, setEditing] = useState(true);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();

    const discoveryData = useAtomValue(discoveryDataAtom);
    const setDiscoveryData = useSetAtom(discoveryDataAtom);

    const sectionData = discoveryData?.[modalData?.key || "taxPlanning"] || {};
    const allowPartner = !["Single", "Widowed"].includes(
        discoveryData?.personalDetails?.client?.clientMaritalStatus,
    );

    const initialValues = useMemo(() => {
        return {
            client: sectionData?.client || buildInitialProfile(),
            partner: sectionData?.partner || buildInitialProfile(),
        };
    }, [sectionData]);

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setEditing(!sectionData?._id);
    }, [form, initialValues, sectionData?._id]);

    // Income Sources Table Columns
    const INCOME_SOURCES_COLUMNS = [
        { title: "Type", dataIndex: "type", key: "type", editable: false, width: 90 },
        { title: "Salary", dataIndex: "salary", key: "salary", field: "salary", type: "text" },
        { title: "Business", dataIndex: "business", key: "business", field: "business", type: "text" },
        { title: "Centrelink", dataIndex: "centrelink", key: "centrelink", field: "centrelink", type: "text" },
        { title: "Rental", dataIndex: "rental", key: "rental", field: "rental", type: "text" },
        { title: "Interest", dataIndex: "interest", key: "interest", field: "interest", type: "text" },
        { title: "Dividends", dataIndex: "dividends", key: "dividends", field: "dividends", type: "text" },
        { title: "Other Inc", dataIndex: "otherInc", key: "otherInc", field: "otherInc", type: "text" },
        { title: "CGT", dataIndex: "cgt", key: "cgt", field: "cgt", type: "text" },
        { title: "Franking", dataIndex: "franking", key: "franking", field: "franking", type: "text" },
    ];

    // Deductions Table Columns
    const DEDUCTIONS_COLUMNS = [
        { title: "Type", dataIndex: "type", key: "type", editable: false, width: 90 },
        { title: "Salary Sacrifice", dataIndex: "salarySacrifice", key: "salarySacrifice", field: "salarySacrifice", type: "text" },
        { title: "Rental Exp", dataIndex: "rentalExp", key: "rentalExp", field: "rentalExp", type: "text" },
        { title: "Other Exp", dataIndex: "otherExp", key: "otherExp", field: "otherExp", type: "text" },
        { title: "PAYG Paid", dataIndex: "paygPaid", key: "paygPaid", field: "paygPaid", type: "text" },
    ];

    const currentProfileData = Form.useWatch(activeTab, form) || initialValues[activeTab];

    // Safely extract table arrays
    const rawIncomeSources = currentProfileData?.incomeSources;
    const safeIncomeSources = Array.isArray(rawIncomeSources)
        ? rawIncomeSources
        : initialValues[activeTab]?.incomeSources || [];

    const rawDeductions = currentProfileData?.deductions;
    const safeDeductions = Array.isArray(rawDeductions)
        ? rawDeductions
        : initialValues[activeTab]?.deductions || [];

    const handleFinish = async (values) => {
        const payload = {
            ...sectionData,
            client: values.client,
            partner: allowPartner ? values.partner : {},
        };

        try {
            setSaving(true);
            const saved = sectionData?._id
                ? await patch("/taxPlanning/Update", payload)
                : await post("/taxPlanning/Add", payload);

            setDiscoveryData((prev) => ({
                ...(prev && typeof prev === "object" ? prev : {}),
                [modalData?.key || "taxPlanning"]: saved || payload,
            }));

            message.success(`Tax planning inputs ${sectionData?._id ? "updated" : "saved"} successfully`);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to save tax planning inputs");
        } finally {
            setSaving(false);
        }
    };

    const tabItems = [
        { key: "client", label: "Client" },
        ...(allowPartner ? [{ key: "partner", label: "Partner" }] : []),
    ];

    return (
        <div style={{ padding: "8px 4px 0px 4px" }}>
            <Form
                form={form}
                initialValues={initialValues}
                onFinish={handleFinish}
                colon={false}
                requiredMark={false}
            >
                {/* Client / Partner Tab selector */}
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    style={{ marginBottom: 16 }}
                />

                <Row gutter={[16, 12]}>
                    {/* Section 1: Tax Settings */}
                    <Col xs={24}>
                        <SectionTitle>TAX SETTINGS</SectionTitle>
                        <div
                            style={{
                                backgroundColor: "#fff",
                                border: "1px solid #f0f0f0",
                                borderRadius: 8,
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "center",
                                gap: 20,
                            }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                                Apply SAPTO:
                            </Text>
                            <Form.Item
                                name={[activeTab, "sapto"]}
                                style={{ margin: 0 }}
                            >
                                <Select
                                    disabled={!editing}
                                    options={SAPTO_OPTIONS}
                                    style={{ width: 180 }}
                                />
                            </Form.Item>
                        </div>
                    </Col>

                    {/* Section 2: Income Sources */}
                    <Col xs={24}>
                        <SectionTitle>INCOME SOURCES</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={INCOME_SOURCES_COLUMNS}
                            data={safeIncomeSources.map((row) => ({
                                ...row,
                                formPath: [activeTab, "incomeSources"],
                            }))}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 3: Deductions */}
                    <Col xs={24}>
                        <SectionTitle>DEDUCTIONS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={DEDUCTIONS_COLUMNS}
                            data={safeDeductions.map((row) => ({
                                ...row,
                                formPath: [activeTab, "deductions"],
                            }))}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Footer Actions */}
                    <Col xs={24}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 12,
                                marginTop: 20,
                            }}
                        >
                            <Space>
                                <Button onClick={() => modalData?.closeModal?.()}>
                                    Close
                                </Button>
                                {!editing ? (
                                    <Button
                                        type="primary"
                                        htmlType="button"
                                        style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit <RiEdit2Fill />
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
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
}