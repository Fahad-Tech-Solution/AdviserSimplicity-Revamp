import React from 'react'
import AppModal from '../../../../../../../Common/AppModal'
import { Button, Col, Divider, Flex, Form, Input, Row, Space, Typography } from 'antd'
import { addReviewSectionsModalOpen, clientReviewQuestion } from '../../../../../../../../store/authState'
import { useAtom } from 'jotai'
import useApi from '../../../../../../../../hooks/useApi'
import AdviceGoalCard from '../../../../../../../Common/AdviceGoalCard'

const ReviewAddQuestions = () => {
    let { Text, Title, } = Typography
    const [AddReviewSectionsModalOpen, setAddReviewSectionsModalOpen] = useAtom(addReviewSectionsModalOpen);
    const [reviewQuestion, setReviewQuestion] = useAtom(clientReviewQuestion);

    let { post, patch } = useApi();
    const [form] = Form.useForm();

    const handleClose = () => {
        form.resetFields();
        setAddReviewSectionsModalOpen(false);
    };

    const onFinish = async (values) => {
        try {
            console.log("selectedClient:", selectedClient)
            let Payload = {
                clientFK: selectedClient?._id || "",
                scenarioName: values.scenarioName
            }

            let res = editScenario?._id ? patch("api/reviewScenario/update", Payload)
                : post("api/reviewScenario/Add", Payload);


            console.log("response:", res)



            handleClose();
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Some error accrued Please try later`,
            );
        }


    };


    const selectedSections = [
        {
            icon: "🐷",
            title: "Super Projection",
            key: 'superProjection'
        },
        {
            icon: "💸",
            title: "Retirement Adequacy",
            key: 'retirementAdequacy'
        },
        {
            icon: "🏛️",
            title: "Age Pension Assessment",
            key: 'agePensionAssessment'
        },
        {
            icon: "🏡",
            title: "Loan Simulator",
            key: 'loanSimulator'
        },
        {
            icon: "🛡️",
            title: "Insurance Needs",
            key: 'insuranceNeeds'
        },
        {
            icon: "🧾",
            title: "Tax Planning",
            key: 'taxPlanning'
        },
    ]

    return (

        <AppModal
            open={AddReviewSectionsModalOpen}
            onClose={handleClose}
            width={"800px"}
        >
            <Form
                form={form}
                initialValues={reviewQuestion}
                onFinish={onFinish}
            >
                <div className="mb-3">
                    <Title style={{
                        fontSize: "22px",
                        margin: "0px",
                        padding: "0px"
                    }}>
                        Add Section
                    </Title>
                    <Text>
                        Choose which calculators appear in this review. Hidden ones won't appear in the sidebar or stepper.
                    </Text>
                </div>

                <Row gutter={[16, 16]}>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues !== currentValues}
                    >
                        {() =>
                            selectedSections.map((section) => {
                                const currentStatus = form.getFieldValue(section.key) || "No";

                                return (
                                    <Col md={8} key={section.key}>
                                        <AdviceGoalCard
                                            label={section.title}
                                            Icon={section.icon}
                                            status={currentStatus}
                                            info={section.info}
                                            onClick={() => {
                                                form.setFieldValue(
                                                    section.key,
                                                    currentStatus === "Yes" ? "No" : "Yes"
                                                );
                                            }}
                                        />
                                    </Col>
                                );
                            })
                        }
                    </Form.Item>
                </Row>

                <Divider />

                {/* Dynamic Footer with Live Reactive Counts */}
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues !== currentValues}
                >
                    {() => {
                        // Pass true to get all store values (including initialValues)
                        const formValues = form.getFieldsValue(true);
                        const enabledCount = Object.values(formValues).filter((val) => val === "Yes").length;
                        const totalCount = Object.keys(formValues).length;

                        return (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    width: "100%",
                                }}
                            >
                                <Text onClick={() => { console.log(formValues) }}>
                                    {enabledCount} of {totalCount} sections enabled
                                </Text>

                                <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                                    <Button
                                        onClick={() => {
                                            const isAllSelected = Object.values(formValues).every((val) => val === "Yes");
                                            const targetValue = isAllSelected ? "No" : "Yes";

                                            const updatedValues = {};
                                            Object.keys(formValues).forEach((key) => {
                                                updatedValues[key] = targetValue;
                                            });

                                            form.setFieldsValue(updatedValues);
                                        }}
                                    >
                                        {Object.values(formValues).every((val) => val === "Yes") ? "Unselect all" : "Select all"}
                                    </Button>
                                    <Button type="primary" onClick={() => form.submit()}>
                                        Save and Exit
                                    </Button>
                                </div>
                            </div>
                        );
                    }}
                </Form.Item>
            </Form>
        </AppModal>
    )
}

export default ReviewAddQuestions