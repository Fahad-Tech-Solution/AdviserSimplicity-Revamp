import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, message, Row, Select, Space, Tabs, Typography } from "antd";
import { useAtom, useAtomValue } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import useApi from "../../../../../../../../hooks/useApi.js";
import { SelectedClient, SelectedReviewAllData } from "../../../../../../../../store/authState.js";
import { useGetReviewName } from "../../../../../../../../hooks/useUserDashboardData.js";
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



const INCOME_FIELDS = [
    ["salary", "Salary"],
    ["business", "Business"],
    ["centrelink", "Centrelink"],
    ["rental", "Rental"],
    ["interest", "Interest"],
    ["dividends", "Dividends"],
    ["otherInc", "Other Income"],
    ["cgt", "CGT"],
    ["franking", "Franking Credits"],
];

const DEDUCTION_FIELDS = [
    ["salarySacrifice", "Salary Sacrifice"],
    ["rentalExp", "Rental Expenses"],
    ["otherExp", "Other Expenses"],
    ["paygPaid", "PAYG Paid"],
];

const EMPTY_PROFILE = {
    applySAPTO: "No",
    incomeSources: {
        current: Object.fromEntries(INCOME_FIELDS.map(([key]) => [key, ""])),
        proposed: Object.fromEntries(INCOME_FIELDS.map(([key]) => [key, ""])),
    },
    deductions: {
        current: Object.fromEntries(DEDUCTION_FIELDS.map(([key]) => [key, ""])),
        proposed: Object.fromEntries(DEDUCTION_FIELDS.map(([key]) => [key, ""])),
    },
};

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

function buildInitialProfile(profile = {}) {
    return {
        applySAPTO: profile?.applySAPTO ?? EMPTY_PROFILE.applySAPTO,
        incomeSources: {
            current: { ...EMPTY_PROFILE.incomeSources.current, ...profile?.incomeSources?.current },
            proposed: { ...EMPTY_PROFILE.incomeSources.proposed, ...profile?.incomeSources?.proposed },
        },
        deductions: {
            current: { ...EMPTY_PROFILE.deductions.current, ...profile?.deductions?.current },
            proposed: { ...EMPTY_PROFILE.deductions.proposed, ...profile?.deductions?.proposed },
        },
    };
}

export default function ReviewsTaxPlanningForm({ modalData }) {
    const [form] = Form.useForm();
    const [activeProfileTab, setActiveProfileTab] = useState("client");
    const [isEditingEnabled, setIsEditingEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const { patch } = useApi();
    const getReviewName = useGetReviewName();
    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);
    const selectedClient = useAtomValue(SelectedClient);

    const sectionData = useMemo(
        () => selectedReviewAllData?.taxPlanningDetails || {},
        [selectedReviewAllData?.taxPlanningDetails],
    );

    const allowPartner = selectedReviewAllData?.personalDetails?.owner?.includes("partner");

    const SAPTO_OPTIONS = [
        ...(allowPartner ? [{ label: "Yes — Couple", value: "Yes — Couple" }] : []),
        { label: "Yes — Single", value: "Yes — Single" },
        { label: "No", value: "No" },
    ];
    const editing = !sectionData?._id || isEditingEnabled;

    const initialValues = useMemo(() => {
        return {
            client: buildInitialProfile(sectionData?.client),
            partner: buildInitialProfile(sectionData?.partner),
        };
    }, [sectionData]);

    useEffect(() => {
        form.setFieldsValue(initialValues);
    }, [form, initialValues]);

    const watchedProfileData = Form.useWatch(activeProfileTab, {
        form,
        preserve: true,
    });
    const currentProfileData = editing
        ? watchedProfileData ?? initialValues[activeProfileTab]
        : initialValues[activeProfileTab];
    const incomeSourcesColumns = [
        { title: "Type", dataIndex: "type", key: "type", editable: false, width: 100 },
        ...INCOME_FIELDS.map(([key, title]) => ({
            title,
            dataIndex: key,
            key,
            field: key,
            type: "text",
        })),
    ];
    const deductionsColumns = [
        { title: "Type", dataIndex: "type", key: "type", editable: false, width: 100 },
        ...DEDUCTION_FIELDS.map(([key, title]) => ({
            title,
            dataIndex: key,
            key,
            field: key,
            type: "text",
        })),
    ];
    const scenarioRows = (section) =>
        ["current", "proposed"].map((scenario) => ({
            key: scenario,
            type: scenario === "current" ? "Current" : "Proposed",
            ...currentProfileData?.[section]?.[scenario],
            formPath: [activeProfileTab, section, scenario],
        }));
    const incomeSourcesRows = scenarioRows("incomeSources");
    const deductionsRows = scenarioRows("deductions");

    const handleFinish = async (values) => {
        try {
            setSaving(true);
            const formValues = form.getFieldsValue(true);
            const scenarioFK = selectedReviewAllData?.scenario?._id || sectionData?.scenarioFK;
            if (!scenarioFK) {
                message.error("Load a review scenario before saving tax planning inputs.");
                return;
            }

            const payload = {
                ...(sectionData?._id ? { _id: sectionData._id } : {}),
                scenarioFK,
                client: buildInitialProfile(formValues.client ?? values.client),
                partner: allowPartner
                    ? buildInitialProfile(formValues.partner ?? values.partner)
                    : {},
            };
            const response = await patch("/review/taxPlanning/Update", payload);
            const savedData = response?.data?.data || response?.data || response || payload;

            setSelectedReviewAllData((previous) => ({
                ...(previous && typeof previous === "object" ? previous : {}),
                taxPlanningDetails: savedData,
            }));

            message.success("Tax planning inputs updated successfully");
            setIsEditingEnabled(false);
            modalData?.closeModal?.();
        } catch (error) {
            console.error("Error updating tax planning inputs:", error);
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update tax planning inputs",
            );
        } finally {
            setSaving(false);
        }
    };

    const tabItems = [
        { key: "client", label: getReviewName("client") },
        ...(allowPartner ? [{ key: "partner", label: getReviewName("partner") }] : []),
    ];

    return (
        <div style={{ padding: "8px 4px 0px 4px" }}>
            <Form
                form={form}
                initialValues={initialValues}
                preserve
                onFinish={handleFinish}
                colon={false}
                requiredMark={false}
            >
                {/* Client / Partner Tab selector */}
                <Tabs
                    activeKey={activeProfileTab}
                    onChange={setActiveProfileTab}
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
                                name={[activeProfileTab, "applySAPTO"]}
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
                            columns={incomeSourcesColumns}
                            data={incomeSourcesRows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 3: Deductions */}
                    <Col xs={24}>
                        <SectionTitle>DEDUCTIONS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={deductionsColumns}
                            data={deductionsRows}
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
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setIsEditingEnabled(true);
                                        }}
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