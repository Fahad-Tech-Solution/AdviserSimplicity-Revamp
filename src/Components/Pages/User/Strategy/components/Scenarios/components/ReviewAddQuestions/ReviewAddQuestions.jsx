import React, { useEffect, useMemo } from 'react'
import AppModal from '../../../../../../../Common/AppModal'
import { Button, Col, Divider, Form, message, Row, Typography } from 'antd'
import { addReviewSectionsModalOpen, clientReviewQuestion, SelectedReviewAllData } from '../../../../../../../../store/authState'
import { useAtom } from 'jotai'
import useApi from '../../../../../../../../hooks/useApi'
import AdviceGoalCard from '../../../../../../../Common/AdviceGoalCard'

const ReviewAddQuestions = () => {
    let { Text, Title } = Typography
    const [AddReviewSectionsModalOpen, setAddReviewSectionsModalOpen] = useAtom(addReviewSectionsModalOpen);
    const [reviewQuestion, setReviewQuestion] = useAtom(clientReviewQuestion);
    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);

    let { post, patch } = useApi();
    const [form] = Form.useForm();

    const initialValues = useMemo(() => {
        return selectedReviewAllData?.reviewGoalQuestions || reviewQuestion || {};
    }, [selectedReviewAllData, reviewQuestion]);

    // FIX 1: Sync form values whenever modal opens or initialValues change
    useEffect(() => {
        if (AddReviewSectionsModalOpen && initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [AddReviewSectionsModalOpen, initialValues, form]);

    const handleClose = () => {
        form.resetFields();
        setAddReviewSectionsModalOpen(false);
    };

    const onFinish = async (values) => {
        try {

            let payload = {
                scenarioFK: selectedReviewAllData?.scenario?._id || "",
                superProjection: values?.superProjection || "No",
                retirementAdequacy: values?.retirementAdequacy || "No",
                agePensionAssessment: values?.agePensionAssessment || "No",
                loanSimulator: values?.loanSimulator || "No",
                insuranceNeeds: values?.insuranceNeeds || "No",
                taxPlanning: values?.taxPlanning || "No",
                _id: selectedReviewAllData?.reviewGoalQuestions?._id || undefined
            };

            let res = selectedReviewAllData?.reviewGoalQuestions?._id
                ? await patch("reviewQuestions/update", payload)
                : await post("reviewQuestions/Add", payload);

            // Ensure response data extracted correctly (check if backend wraps result inside res.data.data)
            const updatedData = res?.data?.data || res?.data || payload;

            // FIX 2: Keep state synchronized with the same updated object
            setSelectedReviewAllData(prev => ({
                ...prev,
                reviewGoalQuestions: updatedData
            }));

            setReviewQuestion(updatedData);

            handleClose();
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Some error occurred. Please try later.`
            );
        }
    };

    const selectedSections = [
        { icon: "🐷", title: "Super Projection", key: 'superProjection' },
        { icon: "💸", title: "Retirement Adequacy", key: 'retirementAdequacy' },
        { icon: "🏛️", title: "Age Pension Assessment", key: 'agePensionAssessment' },
        { icon: "🏡", title: "Loan Simulator", key: 'loanSimulator' },
        { icon: "🛡️", title: "Insurance Needs", key: 'insuranceNeeds' },
        { icon: "🧾", title: "Tax Planning", key: 'taxPlanning' },
    ];

    return (
        <AppModal
            open={AddReviewSectionsModalOpen}
            onClose={handleClose}
            width={"800px"}
        >
            <Form
                form={form}
                onFinish={onFinish}
            >
                <div className="mb-3">
                    <Title style={{ fontSize: "22px", margin: "0px", padding: "0px" }}>
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
                                        <Form.Item name={section.key} noStyle>
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
                                        </Form.Item>
                                    </Col>
                                );
                            })
                        }
                    </Form.Item>
                </Row>

                <Divider />

                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues !== currentValues}
                >
                    {() => {
                        const formValues = form.getFieldsValue(true);
                        const enabledCount = selectedSections.filter(
                            (s) => formValues[s.key] === "Yes"
                        ).length;

                        const isAllSelected = selectedSections.every(
                            (s) => formValues[s.key] === "Yes"
                        );

                        return (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    width: "100%",
                                }}
                            >
                                <Text>
                                    {enabledCount} of {selectedSections.length} sections enabled
                                </Text>

                                <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                                    <Button
                                        onClick={() => {
                                            const targetValue = isAllSelected ? "No" : "Yes";
                                            const updatedValues = {};
                                            selectedSections.forEach((s) => {
                                                updatedValues[s.key] = targetValue;
                                            });
                                            form.setFieldsValue(updatedValues);
                                        }}
                                    >
                                        {isAllSelected ? "Unselect all" : "Select all"}
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
    );
};

export default ReviewAddQuestions;