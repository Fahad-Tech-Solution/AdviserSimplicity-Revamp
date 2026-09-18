import React, { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Col, Form, Input, message, Row, Space, Tabs, Typography } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { discoveryDataAtom } from "../../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../../hooks/helpers.js";
import useApi from "../../../../../../../../hooks/useApi.js";

const { Text } = Typography;

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: 12, overflow: "hidden" },
    headerFontSize: 11,
    bodyFontSize: 12,
};

function parseCurrencyValue(value) {
    if (value === null || value === undefined || value === "") return undefined;
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
    const numeric = parseCurrencyValue(value);
    return numeric !== undefined ? toCommaAndDollar(numeric) : "";
}

function parseDigitsValue(value) {
    return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
    return value?.target?.value ?? value;
}

function formatNumericInput(value, { currency = false } = {}) {
    const digits = parseDigitsValue(getChangedValue(value));
    if (!digits) return "";
    return currency ? toCommaAndDollar(digits) : formatNumber(Number(digits));
}

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
        assumptions: {
            investmentReturn: "5",
            inflation: "2.5",
        },
        existingCover: [
            {
                key: "1",
                name: "sadawd",
                lifeCover: "$1,000,000",
                lifePremium: "$1,200",
                tpdCover: "$1,000,000",
                tpdPremium: "$1,500",
                traumaCover: "$100,000",
                traumaPremium: "$1,200",
                ipCover: "$3,600",
                ipPremium: "$4,500",
                totalPremium: "$8,400",
            },
        ],
        lumpsumNeeds: [
            { key: "1", coverType: "Life", homeMortgage: "$50", investmentLoans: "$0", personalLoans: "$0", creditCards: "$0", funeral: "$30,000", medical: "$0", emergencyFunds: "$0", capitalNeeds: "$0", other: "$0" },
            { key: "2", coverType: "TPD", homeMortgage: "$50", investmentLoans: "$0", personalLoans: "$0", creditCards: "$0", funeral: "$0", medical: "$100,000", emergencyFunds: "$0", capitalNeeds: "$50,000", other: "$0" },
            { key: "3", coverType: "Trauma", homeMortgage: "$0", investmentLoans: "$0", personalLoans: "$0", creditCards: "$0", funeral: "$0", medical: "$100,000", emergencyFunds: "$0", capitalNeeds: "$0", other: "$0" },
        ],
        incomeReplacement: [
            { key: "1", grossIncome: "$12", currentNetIncome: "$12", life: "$12", lifeYears: "39", tpd: "$12", tpdYears: "34", taxTpdInSuper: true, trauma: "$12", traumaYears: "2" },
        ],
        incomeProtection: [
            { key: "1", annualIncome: "$12", pctIncome: "70", pctSuper: "12", waitingPeriod: "30 days", benefitPeriod: "To age 65", incomeBenefitCovered: "$1/mo", ipIncomeBenefit: "$8/yr", superContributionsCover: "$0/mo", netMonthlyAfterTax: "$1/mo" },
        ],
        realisableAssets: [
            { key: "1", coverType: "Life", superannuation: "$120", cash: "$0", investmentProperties: "$0", sharePortfolio: "$0", otherAssets: "$0" },
            { key: "2", coverType: "TPD", superannuation: "$120", cash: "$0", investmentProperties: "$0", sharePortfolio: "$0", otherAssets: "$0" },
            { key: "3", coverType: "Trauma", superannuation: "$0", cash: "$0", investmentProperties: "$0", sharePortfolio: "$0", otherAssets: "$0" },
        ],
    };
}

export default function InsuranceNeedsForm({ modalData }) {
    const [form] = Form.useForm();
    const [activeProfileTab, setActiveProfileTab] = useState("client");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();

    const discoveryData = useAtomValue(discoveryDataAtom);
    const setDiscoveryData = useSetAtom(discoveryDataAtom);

    const sectionData = discoveryData?.[modalData?.key || "insuranceNeeds"] || {};
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

    // Section 1: Existing Cover & Premiums
    const EXISTING_COVER_COLUMNS = [
        { title: "Name", dataIndex: "name", key: "name", field: "name", type: "text" },
        { title: "Life Cover ($)", dataIndex: "lifeCover", key: "lifeCover", field: "lifeCover", type: "text" },
        { title: "Life Premium ($/yr)", dataIndex: "lifePremium", key: "lifePremium", field: "lifePremium", type: "text" },
        { title: "TPD Cover ($)", dataIndex: "tpdCover", key: "tpdCover", field: "tpdCover", type: "text" },
        { title: "TPD Premium ($/yr)", dataIndex: "tpdPremium", key: "tpdPremium", field: "tpdPremium", type: "text" },
        { title: "Trauma Cover ($)", dataIndex: "traumaCover", key: "traumaCover", field: "traumaCover", type: "text" },
        { title: "Trauma Premium ($/yr)", dataIndex: "traumaPremium", key: "traumaPremium", field: "traumaPremium", type: "text" },
        { title: "IP ($/mo)", dataIndex: "ipCover", key: "ipCover", field: "ipCover", type: "text" },
        { title: "IP Premium ($/yr)", dataIndex: "ipPremium", key: "ipPremium", field: "ipPremium", type: "text" },
        { title: "Total Premium ($/yr)", dataIndex: "totalPremium", key: "totalPremium", field: "totalPremium", editable: false },
    ];

    // Section 2: Lumpsum Needs
    const LUMPSUM_NEEDS_COLUMNS = [
        { title: "Cover Type", dataIndex: "coverType", key: "coverType", editable: false, width: 100 },
        { title: "Home Mortgage", dataIndex: "homeMortgage", key: "homeMortgage", field: "homeMortgage", type: "text" },
        { title: "Investment Loans", dataIndex: "investmentLoans", key: "investmentLoans", field: "investmentLoans", type: "text" },
        { title: "Personal Loans", dataIndex: "personalLoans", key: "personalLoans", field: "personalLoans", type: "text" },
        { title: "Credit Cards", dataIndex: "creditCards", key: "creditCards", field: "creditCards", type: "text" },
        { title: "Funeral", dataIndex: "funeral", key: "funeral", field: "funeral", type: "text" },
        { title: "Medical", dataIndex: "medical", key: "medical", field: "medical", type: "text" },
        { title: "Emergency Funds", dataIndex: "emergencyFunds", key: "emergencyFunds", field: "emergencyFunds", type: "text" },
        { title: "Capital Needs", dataIndex: "capitalNeeds", key: "capitalNeeds", field: "capitalNeeds", type: "text" },
        { title: "Other", dataIndex: "other", key: "other", field: "other", type: "text" },
    ];

    // Section 3: Income Replacement
    const INCOME_REPLACEMENT_COLUMNS = [
        { title: "Gross Income (p.a.)", dataIndex: "grossIncome", key: "grossIncome", field: "grossIncome", type: "text" },
        { title: "Current Net Income After Tax (p.a.) (computed)", dataIndex: "currentNetIncome", key: "currentNetIncome", editable: false },
        { title: "Life", dataIndex: "life", key: "life", field: "life", type: "text" },
        { title: "Years", dataIndex: "lifeYears", key: "lifeYears", field: "lifeYears", type: "text" },
        { title: "TPD", dataIndex: "tpd", key: "tpd", field: "tpd", type: "text" },
        { title: "Years", dataIndex: "tpdYears", key: "tpdYears", field: "tpdYears", type: "text" },
        {
            title: "Tax TPD in Super",
            dataIndex: "taxTpdInSuper",
            key: "taxTpdInSuper",
            render: (text, record, index) => (
                <Form.Item
                    name={[activeProfileTab, "incomeReplacement", index, "taxTpdInSuper"]}
                    valuePropName="checked"
                    style={{ margin: 0 }}
                >
                    <Checkbox disabled={!editing} />
                </Form.Item>
            ),
        },
        { title: "Trauma", dataIndex: "trauma", key: "trauma", field: "trauma", type: "text" },
        { title: "Years", dataIndex: "traumaYears", key: "traumaYears", field: "traumaYears", type: "text" },
    ];

    // Section 4: Income Protection Details
    const INCOME_PROTECTION_COLUMNS = [
        { title: "Annual Income ($)", dataIndex: "annualIncome", key: "annualIncome", field: "annualIncome", type: "text" },
        { title: "% Income", dataIndex: "pctIncome", key: "pctIncome", field: "pctIncome", type: "text" },
        { title: "% Super", dataIndex: "pctSuper", key: "pctSuper", field: "pctSuper", type: "text" },
        { title: "Waiting Period", dataIndex: "waitingPeriod", key: "waitingPeriod", field: "waitingPeriod", type: "text" },
        { title: "Benefit Period", dataIndex: "benefitPeriod", key: "benefitPeriod", field: "benefitPeriod", type: "text" },
        { title: "Income Benefit Covered ($/mo) (computed)", dataIndex: "incomeBenefitCovered", key: "incomeBenefitCovered", editable: false },
        { title: "IP Income Benefit (p.a.) (annual gross)", dataIndex: "ipIncomeBenefit", key: "ipIncomeBenefit", editable: false },
        { title: "Super Contributions Cover ($/mo) (computed)", dataIndex: "superContributionsCover", key: "superContributionsCover", editable: false },
        { title: "Net Monthly After Tax (IP income net)", dataIndex: "netMonthlyAfterTax", key: "netMonthlyAfterTax", editable: false },
    ];

    // Section 5: Realisable Assets
    const REALISABLE_ASSETS_COLUMNS = [
        { title: "Cover Type", dataIndex: "coverType", key: "coverType", editable: false, width: 100 },
        { title: "Superannuation", dataIndex: "superannuation", key: "superannuation", field: "superannuation", type: "text" },
        { title: "Cash", dataIndex: "cash", key: "cash", field: "cash", type: "text" },
        { title: "Investment Properties (equity)", dataIndex: "investmentProperties", key: "investmentProperties", field: "investmentProperties", type: "text" },
        { title: "Share Portfolio / Managed Funds", dataIndex: "sharePortfolio", key: "sharePortfolio", field: "sharePortfolio", type: "text" },
        { title: "Other Realisable Assets", dataIndex: "otherAssets", key: "otherAssets", field: "otherAssets", type: "text" },
    ];

    const currentProfileData = Form.useWatch(activeProfileTab, form) || initialValues[activeProfileTab];

    const handleFinish = async (values) => {
        const payload = {
            ...sectionData,
            client: values.client,
            partner: allowPartner ? values.partner : {},
        };

        try {
            setSaving(true);
            const saved = sectionData?._id
                ? await patch("/insuranceNeeds/Update", payload)
                : await post("/insuranceNeeds/Add", payload);

            setDiscoveryData((prev) => ({
                ...(prev && typeof prev === "object" ? prev : {}),
                [modalData?.key || "insuranceNeeds"]: saved || payload,
            }));

            message.success(`Insurance details ${sectionData?._id ? "updated" : "saved"} successfully`);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to save insurance details");
        } finally {
            setSaving(false);
        }
    };

    const tabItems = [
        { key: "client", label: "Client" },
        ...(allowPartner ? [{ key: "partner", label: "Partner" }] : []),
    ];

    return (
        <div style={{ padding: "8px 4px" }}>
            <Form
                form={form}
                initialValues={initialValues}
                onFinish={handleFinish}
                colon={false}
                requiredMark={false}
            >
                <Tabs
                    activeKey={activeProfileTab}
                    onChange={setActiveProfileTab}
                    items={tabItems}
                    style={{ marginBottom: 12 }}
                />

                <Row gutter={[16, 8]}>
                    {/* ASSUMPTIONS */}
                    <Col xs={24}>
                        <SectionTitle>ASSUMPTIONS</SectionTitle>
                        <div
                            style={{
                                backgroundColor: "#fafafa",
                                border: "1px solid #f0f0f0",
                                borderRadius: 8,
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 24,
                            }}
                        >
                            <Space align="center">
                                <Text style={{ fontSize: 13, fontWeight: 500 }}>Investment Return:</Text>
                                <Form.Item
                                    name={[activeProfileTab, "assumptions", "investmentReturn"]}
                                    style={{ margin: 0 }}
                                >
                                    <Input disabled={!editing} style={{ width: 60, textAlign: "center" }} />
                                </Form.Item>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>% p.a.</Text>
                            </Space>

                            <Space align="center">
                                <Text style={{ fontSize: 13, fontWeight: 500 }}>Inflation:</Text>
                                <Form.Item
                                    name={[activeProfileTab, "assumptions", "inflation"]}
                                    style={{ margin: 0 }}
                                >
                                    <Input disabled={!editing} style={{ width: 60, textAlign: "center" }} />
                                </Form.Item>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>% p.a.</Text>
                            </Space>
                        </div>
                    </Col>

                    {/* EXISTING COVER & PREMIUMS (ANNUAL) */}
                    <Col xs={24}>
                        <SectionTitle>EXISTING COVER & PREMIUMS (ANNUAL)</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={EXISTING_COVER_COLUMNS}
                            data={(currentProfileData?.existingCover || []).map((row) => ({
                                ...row,
                                formPath: [activeProfileTab, "existingCover"],
                            }))}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* LUMPSUM NEEDS */}
                    <Col xs={24}>
                        <SectionTitle>LUMPSUM NEEDS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={LUMPSUM_NEEDS_COLUMNS}
                            data={(currentProfileData?.lumpsumNeeds || []).map((row) => ({
                                ...row,
                                formPath: [activeProfileTab, "lumpsumNeeds"],
                            }))}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* INCOME REPLACEMENT */}
                    <Col xs={24}>
                        <SectionTitle>INCOME REPLACEMENT</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={INCOME_REPLACEMENT_COLUMNS}
                            data={(currentProfileData?.incomeReplacement || []).map((row) => ({
                                ...row,
                                formPath: [activeProfileTab, "incomeReplacement"],
                            }))}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* INCOME PROTECTION DETAILS */}
                    <Col xs={24}>
                        <SectionTitle>INCOME PROTECTION DETAILS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={INCOME_PROTECTION_COLUMNS}
                            data={(currentProfileData?.incomeProtection || []).map((row) => ({
                                ...row,
                                formPath: [activeProfileTab, "incomeProtection"],
                            }))}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* REALISABLE ASSETS */}
                    <Col xs={24}>
                        <SectionTitle>REALISABLE ASSETS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={REALISABLE_ASSETS_COLUMNS}
                            data={(currentProfileData?.realisableAssets || []).map((row) => ({
                                ...row,
                                formPath: [activeProfileTab, "realisableAssets"],
                            }))}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Action Buttons */}
                    <Col xs={24}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 12,
                                marginTop: 16,
                            }}
                        >
                            <Space>
                                <Button onClick={() => modalData?.closeModal?.()}>Close</Button>
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