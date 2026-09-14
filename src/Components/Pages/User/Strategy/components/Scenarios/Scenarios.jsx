import { Button, Dropdown, Flex, Form, Input, Space, Tooltip, Typography } from 'antd'
import React, { useMemo, useState } from 'react'
import { FaUpload } from 'react-icons/fa'
import DynamicDataTable from '../../../../../Common/DynamicDataTable'
import { useAtom } from 'jotai'
import { selectedClientsReview } from '../../../../../../store/authState'
import { DeleteFilled, FileTextOutlined, } from "@ant-design/icons";
import AppModal from '../../../../../Common/AppModal'

const Scenarios = () => {
    let { Text, Title, } = Typography
    let [searchText, setSearchText] = useState("")
    const [Loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [openDropdownRowId, setOpenDropdownRowId] = useState(false);
    const [reviews, setReviews] = useAtom(selectedClientsReview);


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
            onClick: ({ key }) => { }
        }
    }



    let columns = [
        {
            title: "No#",
            dataIndex: "no",
            key: "no",
            width: 10,
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
            // width: 50,
        },
        {
            title: "Last Module Edited",
            dataIndex: "updatedAt",
            key: "updatedAt",
            // width: 50,
        },
        {
            title: "Date of Creation",
            dataIndex: "createdAt",
            key: "createdAt",
            // width: 50,
        },
        {
            title: "Operation",
            dataIndex: "operation",
            key: "operation",
            // width: 50,
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

    const handleFinish = (values) => {
        if (onSubmit) {
            onSubmit(values);
        }
        handleClose();
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
                    className="household-table"
                    bordered
                    size="small"
                    tableStyle={{ borderRadius: 12 }}
                    tableProps={{
                        childrenColumnName: "__antdNestedRows__",
                        loading: {
                            spinning: Loading,
                            tip: "Loading Reviews...",
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