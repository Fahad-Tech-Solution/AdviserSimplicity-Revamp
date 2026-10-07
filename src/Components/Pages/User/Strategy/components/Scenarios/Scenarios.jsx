import { Button, Dropdown, Flex, Form, Input, message, Segmented, Space, Tag, Tooltip, Typography } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import DynamicDataTable from '../../../../../Common/DynamicDataTable'
import { useAtom, useAtomValue } from 'jotai'
import { clientReviewQuestion, SelectedClient, selectedClientsReview, SelectedReview, SelectedReviewAllData } from '../../../../../../store/authState'
import AppModal from '../../../../../Common/AppModal'
import useApi from '../../../../../../hooks/useApi'
import { formatAustralianDate } from '../../../../../../hooks/helpers'
import { useNavigate } from 'react-router-dom'
import { FaArrowRotateLeft, FaRegCircleCheck } from 'react-icons/fa6'
import { HiArrowPath } from 'react-icons/hi2'
import { MdOutlineDoDisturb } from 'react-icons/md'

const Scenarios = () => {
    let { Text, Title } = Typography
    let [searchText, setSearchText] = useState("")
    let [editScenario, setEditScenario] = useState(null)
    const [viewMode, setViewMode] = useState('Active') // 'Active' or 'Disabled'
    const [Loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [openDropdownRowId, setOpenDropdownRowId] = useState(null);
    const [reviews, setReviews] = useAtom(selectedClientsReview);
    const [selectedReview, setSelectedReview] = useAtom(SelectedReview);
    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);
    const [reviewQuestion, setReviewQuestion] = useAtom(clientReviewQuestion);
    const selectedClient = useAtomValue(SelectedClient);

    const Nav = useNavigate()
    const [form] = Form.useForm();
    let { post, patch, get } = useApi();

    useEffect(() => {
        if (selectedClient?._id) {
            fetchAllScenarios()
        }
    }, [selectedClient])

    // Synchronize form fields when opening modal in edit mode
    useEffect(() => {
        if (openModal) {
            if (editScenario?._id) {
                form.setFieldsValue({
                    scenarioName: editScenario.scenarioName
                });
            } else {
                form.resetFields();
            }
        }
    }, [openModal, editScenario, form]);

    const fetchAllScenarios = async () => {
        setLoading(true);
        try {
            let res = await get("reviewScenario/" + selectedClient?._id)
            if (res?.data) {
                setReviews(res.data);
            }
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to get data`
            );
        } finally {
            setLoading(false);
        }
    }

    function rowMatchesSearch(row, queryRaw) {
        const q = String(queryRaw ?? "").trim().toLowerCase();
        if (!q) return true;

        return Object.values(row).some((val) => {
            if (val == null) return false;
            return String(val).toLowerCase().includes(q);
        });
    }

    let menuGenerator = (row) => {
        const items = [
            {
                key: "Load this scenario",
                label: "📂 Load this scenario",
                disabled: row?.softDelete
            },
            { type: "divider" },
            {
                key: "rename",
                label: "✏️ Rename",
            },
            { type: "divider" },
            {
                key: "email",
                label: row?.isWhatChangeCompleted ? "✉️ What's changed already filled" : "✉️ Send What's changed",
                disabled: row?.isWhatChangeCompleted
            },
            { type: "divider" },
            {
                key: "delete",
                label: row?.softDelete ? "✅ Active" : "❎ Disabled",
            },
        ]

        return {
            items,
            onClick: ({ key }) => {
                switch (key) {
                    case "rename":
                        setEditScenario(row);
                        setOpenModal(true);
                        break;
                    case "Load this scenario":
                        loadingScenarios(row);
                        break;
                    case "delete":
                        deleteScenario(row);
                        break;
                    case "email":
                        SendWhatsChangeEmail(
                            {
                                "scenarioFK": row?._id || "",
                                "name": selectedClient?.client?.clientPreferredName || "",
                                "email": selectedClient?.client?.Email,
                                "url": window.location.origin + "/#/whats-change-questions"
                            }
                        );
                        break;
                    default:
                        message.error(`Not configured yet`);
                        break;
                }
            }
        }
    }

    async function SendWhatsChangeEmail(obj) {
        // 1. Display immediate loading message with a unique key
        const hideLoading = message.loading({
            content: `Sending email to "${obj.name}"...`,
            key: "email_status",
            duration: 0, // Prevents automatic dismissal before the API completes
        });

        try {
            const res = await post("reviewChange/email", obj);

            // 2. Replace loading message with success indicator
            message.success({
                content: `Email sent to "${obj.name}" successfully!`,
                key: "email_status",
                duration: 5,
            });
        } catch (error) {
            // 3. Replace loading message with error indicator
            message.error({
                content:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Some error occurred. Please try later.",
                key: "email_status",
                duration: 5,
            });
        }
    }



    let deleteScenario = async (row) => {
        setLoading(true);
        try {
            let res = await patch("reviewScenario/Delete", row);

            // Update local state by setting softDelete to true instead of filtering out
            setReviews((prevReviews) =>
                prevReviews.map((item) =>
                    item._id === row._id ? { ...item, softDelete: true } : item
                )
            );

            message.success(res?.message || "Scenario deleted successfully");
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to delete scenario`
            );
        } finally {
            setLoading(false);
        }
    };

    let loadingScenarios = async (row) => {
        try {
            let res = await get('reviewScenario/fullDetails/' + row._id);
            if (res?.data) {
                setSelectedReviewAllData(res.data);
                setSelectedReview(row);
                setReviewQuestion(res?.data?.reviewGoalQuestions || {});
                Nav("/user/review-routes/client-details");
            }
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to load scenario details`
            );
        }
    }

    let columns = [
        {
            title: "No#",
            dataIndex: "no",
            key: "no",
            width: 50,
            onCell: () => ({
                style: {
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#9ca3af",
                },
            }),
        },
        {
            title: "Scenario",
            dataIndex: "scenarioName",
            key: "scenarioName",
            render: (value, row) => {
                return (
                    <>
                        {value} {row?._id === selectedReview?._id && <Tag color={"green"}>Selected</Tag>}
                    </>
                )
            }
        },
        {
            title: "Last Module Edited",
            dataIndex: "updatedAt",
            key: "updatedAt",
            render: (value) => formatAustralianDate(value)
        },
        {
            title: "Date of Creation",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (value) => formatAustralianDate(value)
        },
        {
            title: "Operation",
            dataIndex: "operation",
            key: "operation",
            onCell: () => ({
                style: {
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#9ca3af",
                },
            }),
            render: (_, row) => {
                const rowId = row?._id ?? row?.key;
                return (
                    <Dropdown
                        trigger={["click"]}
                        open={openDropdownRowId === rowId}
                        onOpenChange={(visible) => {
                            setOpenDropdownRowId(visible ? rowId : null);
                        }}
                        menu={menuGenerator(row)}
                    >
                        <Tooltip title="Settings">
                            <Button
                                type="text"
                                shape="circle"
                                icon="⚙️"
                                style={{ fontSize: 18 }}
                            />
                        </Tooltip>
                    </Dropdown>
                );
            },
        },
    ];

    const tableData = useMemo(() => {
        // Filter based on active Segmented selection
        const isDisabledMode = viewMode === 'Disabled';

        return reviews
            .filter((item) => Boolean(item.softDelete) === isDisabledMode)
            .map((item, index) => ({
                ...item,
                key: item?._id || String(index + 1),
                no: index + 1,
            }));
    }, [reviews, viewMode]);

    const filteredTableData = useMemo(() => {
        const q = String(searchText ?? "").trim();
        const baseData = !q ? tableData : tableData.filter((row) => rowMatchesSearch(row, q));

        return baseData.map((row, index) => ({
            ...row,
            no: index + 1,
        }));
    }, [tableData, searchText]);

    const titleText =
        searchText.trim() && filteredTableData.length !== tableData.length
            ? `Showing ${filteredTableData.length} of ${tableData.length} reviews`
            : `Showing ${filteredTableData.length} reviews`;

    const handleClose = () => {
        form.resetFields();
        setEditScenario(null);
        setOpenModal(false);
    };

    const handleFinish = async (values) => {
        setSubmitting(true);
        try {
            let Payload = {
                clientFK: selectedClient?._id || "",
                scenarioName: values.scenarioName,
                ...(editScenario?._id && { _id: editScenario._id })
            };

            const res = editScenario?._id
                ? await patch("reviewScenario/update", Payload)
                : await post("reviewScenario/Add", Payload);

            const responseData = res?.data?.scenario || res?.data || res;

            if (editScenario?._id) {
                setReviews((prevReviews) =>
                    prevReviews.map((item) =>
                        item._id === editScenario._id ? { ...item, ...responseData } : item
                    )
                );
                message.success("Scenario renamed successfully");
            } else {
                setReviews((prevReviews) => [responseData, ...prevReviews]);
                message.success("Scenario added successfully");
            }

            handleClose();
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to save scenario details`
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 18,
                    marginTop: 18,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <Text
                        style={{
                            display: "block",
                            fontSize: 11,
                            letterSpacing: 3,
                            color: "#22c55e",
                            textTransform: "uppercase",
                            marginBottom: 6,
                            fontWeight: 400,
                        }}
                    >
                        ANNUAL REVIEW
                    </Text>
                    <Title
                        style={{
                            margin: 0,
                            fontFamily: "Georgia,serif",
                            fontWeight: 500,
                            fontSize: 28,
                        }}
                        onClick={() => { console.log(selectedClient) }}
                    >
                        Review
                    </Title>
                </div>
                <div>
                    <Space size={10} wrap>
                        <Input
                            allowClear
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search..."
                            prefix={"🔍"}
                            style={{ width: 210, borderRadius: 7 }}
                        />
                        <Button
                            type="primary"
                            style={{
                                borderRadius: 8,
                                fontWeight: 700,
                                padding: "17px 20px",
                                fontSize: 13,
                            }}
                            onClick={() => {
                                setEditScenario(null);
                                setOpenModal(true);
                            }}
                        >
                            Add New +
                        </Button>
                    </Space>
                </div>
            </div>
            <div style={{ width: "100%", display: 'flex', justifyContent: "space-between", alignItems: 'center', gap: 16 }}>
                <Segmented
                    value={viewMode}
                    onChange={setViewMode}
                    options={[
                        { label: 'Active', value: 'Active', icon: <FaRegCircleCheck style={{ color: '#52c41a' }} /> },
                        { label: 'Disabled', value: 'Disabled', icon: <MdOutlineDoDisturb style={{ color: '#ff4d4f' }} /> },
                    ]}
                    style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                />

                <Button
                    style={{
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13,
                    }}
                    onClick={() => {
                        fetchAllScenarios()
                    }}
                    icon={<HiArrowPath />}
                />
            </div>
            <div>
                <DynamicDataTable
                    columns={columns}
                    data={filteredTableData}
                    title={titleText}
                    total={filteredTableData.length}
                    pageSize={10}
                    bordered
                    size="small"
                    tableStyle={{ borderRadius: 12 }}
                    horizontalScroll={filteredTableData.length > 0}
                    tableProps={{
                        childrenColumnName: "__antdNestedRows__",
                        loading: {
                            spinning: Loading,
                            tip: "Loading Reviews...",
                        },
                        scroll: filteredTableData.length > 0 ? "" : { x: "max-content" },
                        locale: {
                            emptyText: `No ${viewMode.toLowerCase()} scenarios found.`,
                        },
                    }}
                />
            </div>

            <AppModal open={openModal} onClose={handleClose} width="420px">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    requiredMark={false}
                    styles={{
                        padding: "26px 28px"
                    }}
                >
                    <Flex vertical gap="middle">
                        {/* Header Section */}
                        <div>
                            <Title
                                level={2}
                                style={{
                                    margin: 0,
                                    fontFamily: "Georgia, serif",
                                    fontWeight: 500,
                                    fontSize: 28,
                                }}
                            >
                                {editScenario?._id ? "Edit Scenario" : "Add New Scenario"}
                            </Title>
                            <Text type="secondary">
                                {editScenario?._id
                                    ? "Update the scenario name below."
                                    : "Creates a new scenario from the current working data. You can then open any calculator to modify it."
                                }
                            </Text>
                        </div>

                        {/* Form Fields */}
                        <Form.Item
                            label=""
                            name="scenarioName"
                            rules={[{ required: true, message: 'Please enter a scenario name' }]}
                            style={{ marginBottom: 8 }}
                        >
                            <Input
                                placeholder="e.g. Proposed Scenario"
                                size="large"
                                autoFocus
                            />
                        </Form.Item>

                        {/* Action Buttons */}
                        <Flex justify="end">
                            <Space size="small">
                                <Button
                                    size="large"
                                    style={{
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        fontSize: 13,
                                    }}
                                    onClick={handleClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    style={{
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        fontSize: 13,
                                    }}
                                    loading={submitting}
                                >
                                    {editScenario?._id ? "Update Scenario" : "Add Scenario"}
                                </Button>
                            </Space>
                        </Flex>
                    </Flex>
                </Form>
            </AppModal>
        </div>
    )
}

export default Scenarios