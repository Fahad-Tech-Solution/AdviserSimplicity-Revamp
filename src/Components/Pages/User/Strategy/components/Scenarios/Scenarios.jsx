import { Button, Dropdown, Flex, Form, Input, message, Space, Tooltip, Typography } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import DynamicDataTable from '../../../../../Common/DynamicDataTable'
import { useAtom, useAtomValue } from 'jotai'
import { SelectedClient, selectedClientsReview, SelectedReview, SelectedReviewAllData } from '../../../../../../store/authState'
import AppModal from '../../../../../Common/AppModal'
import useApi from '../../../../../../hooks/useApi'
import { formatAustralianDate } from '../../../../../../hooks/helpers'
import { useNavigate } from 'react-router-dom'

const Scenarios = () => {
    let { Text, Title, } = Typography
    let [searchText, setSearchText] = useState("")
    let [editScenario, setEditScenario] = useState({})
    const [Loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [openDropdownRowId, setOpenDropdownRowId] = useState(false);
    const [reviews, setReviews] = useAtom(selectedClientsReview);
    const [selectedReview, setSelectedReview] = useAtom(SelectedReview);
    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);
    const selectedClient = useAtomValue(SelectedClient);

    const Nav = useNavigate()

    let { post, patch, get } = useApi();

    useEffect(() => {
        fetchAllScenarios()
    }, [])

    const fetchAllScenarios = async () => {
        try {
            let res = get("reviewScenario/" + selectedClient?._id)
            if (res.data) {
                setReviews(res.data);
            }
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to get data`
            );
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

    let menuGenerator = (row, selectedClient) => {


        const items = [
            {
                key: "Load this scenario",
                label: "📂 Load this scenario",
            },

            { type: "divider" },
            {
                key: "rename",
                label: "✏️ Rename",
            },
            { type: "divider" },
            {
                key: "duplicate",
                label: "📑 Duplicate",
            },
            { type: "divider" },
            {
                key: "delete",
                label: "🗑️ Delete",
            },
        ]

        return {
            items,
            onClick: ({ key }) => {
                switch (key) {
                    case "rename":
                        setEditScenario(row)
                        break;
                    case "Load this scenario":
                        loadingScenarios(row)
                        break;
                    case "delete":
                        deleteScenario(row)
                        break;
                    default:
                        message.error(`Not configured yet`);
                        break;
                }
            }
        }
    }

    let deleteScenario = async (row) => {
        setLoading(true);
        try {
            // 1. Await the HTTP call
            await patch("reviewScenario/Delete", row);

            // 2. Filter out the deleted item from state
            setReviews((prevReviews) =>
                prevReviews.filter((item) => item._id !== row._id)
            );

            message.success("Scenario deleted successfully");
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to delete ${modalData?.title || "scenario"}`
            );
        } finally {
            setLoading(false);
        }
    };

    let loadingScenarios = async (row) => {
        try {
            let res = await get('reviewScenario/fullDetails/' + row._id);
            console.log(res);
            if (res?.data) {
                setSelectedReviewAllData(res.data)
                setSelectedReview(row);
                Nav("/user/review-routes/client-details")
            }

        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to delete ${modalData?.title || "scenario"}`
            );
        }
    }

    let columns = [
        {
            title: "No#",
            dataIndex: "no",
            key: "no",
            width: 50,
            onCell: (record) => ({
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
        },
        {
            title: "Last Module Edited",
            dataIndex: "updatedAt",
            key: "updatedAt",
            render: (value, row) => {
                let data = formatAustralianDate(value);
                return (data);
            }
        },
        {
            title: "Date of Creation",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (value, row) => {
                let data = formatAustralianDate(value);
                return (data);
            }
        },
        {
            title: "Operation",
            dataIndex: "operation",
            key: "operation",
            onCell: (record) => ({
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
                            if (!visible) {
                                setOpenDropdownRowId(null);
                            } else {
                                setOpenDropdownRowId(rowId);
                            }
                        }}
                        menu={menuGenerator(row)}
                    >
                        <Tooltip title="Settings">
                            <Button
                                type="text"
                                shape="circle"
                                icon={
                                    // <SettingOutlined style={{ color: "#374151", fontSize: 18 }} />
                                    "⚙️"
                                }
                                style={{ fontSize: 18 }}
                            />
                        </Tooltip>
                    </Dropdown>
                );
            },

        },
        // 	Last Module Edited	Date of Creation	Last Syncronized At	Operation
    ];

    const tableData = useMemo(
        () =>
            reviews.map((item, index) => ({
                ...item,
                key: item?._id || String(index + 1),
                no: index + 1,
            })),
        [reviews],
    );

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


    const [form] = Form.useForm();

    const handleClose = () => {
        form.resetFields();
        setOpenModal(false);
    };

    const handleFinish = async (values) => {
        setSubmitting(true)
        try {

            let Payload = {
                clientFK: selectedClient?._id || "",
                scenarioName: values.scenarioName,
                // Include ID when updating an existing scenario
                ...(editScenario?._id && { _id: editScenario._id })
            };

            // 1. Await the async API request
            const res = editScenario?._id
                ? await patch("reviewScenario/update", Payload)
                : await post("reviewScenario/Add", Payload);

            console.log("response:", res);

            // Extract created or updated scenario object from response
            const responseData = res?.data?.scenario || res;

            if (editScenario?._id) {
                // 2. Update mode: Replace existing scenario in the array
                setReviews((prevReviews) =>
                    prevReviews.map((item) =>
                        item._id === editScenario._id ? { ...item, ...responseData } : item
                    )
                );
                message.success("Scenario updated successfully");
            } else {
                // 3. Add mode: Append new scenario to the array
                setReviews((prevReviews) => [responseData, ...prevReviews]);
                message.success("Scenario added successfully");
            }

            handleClose();
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to save ${modalData?.title || "scenario details"}`
            );
        }
        finally {
            setSubmitting(false)
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
                    >
                        Review
                    </Title>
                </div>
                <div className="">
                    <Space size={10}>
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
                                setOpenModal(true)
                            }}
                        >
                            Add New +
                        </Button>
                    </Space>
                </div>
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
                            emptyText: "No scenarios yet. Click “Add New +” to create one.",
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
                                Add New Scenario
                            </Title>
                            <Text type="secondary">
                                Creates a new scenario from the current working data. You can then open any calculator to modify it.
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
                                    Add Scenario
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