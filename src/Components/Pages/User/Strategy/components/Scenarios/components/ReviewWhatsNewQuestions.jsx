import React, { useMemo, useState } from 'react';
import { Card, Radio, Input, Button, Alert, Space, Typography, Form, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { FaCheck } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import useApi from '../../../../../../../hooks/useApi'; // Adjust path as needed
import Ok from '../../../../../../../assets/svg/Ok-pana.svg';
import Advantages from '../../../../../../../assets/svg/Advantages-pana.svg';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const reviewQuestions = [
    {
        id: 'q-income',
        key: 'income',
        icon: '💵',
        label: 'Has your income changed?',
        detail: 'Has your income changed, including salary, pension, Centrelink payments or rental income?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Notes (optional)…', rows: 2 }
    },
    {
        id: 'q-employment',
        key: 'employment',
        icon: '💼',
        label: 'Has your employment changed?',
        detail: 'Have there been any changes to your employment status, hours worked, or employer?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Notes (optional)…', rows: 2 }
    },
    {
        id: 'q-health',
        key: 'health',
        icon: '❤️',
        label: 'Has your health changed?',
        detail: 'Have there been any changes to your health or the health of your immediate family?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Notes (optional)…', rows: 2 }
    },
    {
        id: 'q-dependants',
        key: 'dependants',
        icon: '👨‍👩‍👧',
        label: 'Have your dependants changed?',
        detail: 'Have there been any changes to your dependants, such as children leaving home or a new family member?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Notes (optional)…', rows: 2 }
    },
    {
        id: 'q-goals',
        key: 'goals',
        icon: '🎯',
        label: 'Have your goals or objectives changed?',
        detail: 'Have your short-term or long-term financial goals changed? Are there any major upcoming expenses to plan for?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Notes (optional)…', rows: 2 }
    },
    {
        id: 'q-income-need',
        key: 'incomeNeed',
        icon: '📈',
        label: 'Do you need more income from your investments?',
        detail: 'Do you currently need to draw more income from your investments to meet your living expenses?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Notes (optional)…', rows: 2 }
    },
    {
        id: 'q-happy',
        key: 'happyWithInvestments',
        icon: '✅',
        label: 'Are you happy with your current investments?',
        detail: 'Are you satisfied with your current investment strategy and portfolio performance?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Notes (optional)…', rows: 2 }
    },
    {
        id: 'q-insurance',
        key: 'insurance',
        icon: '🛡️',
        label: 'Are you happy with your current insurance?',
        detail: 'Are you satisfied with your current levels of insurance coverage and premiums?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Notes on cover type, sum insured, beneficiaries or any recommended changes…', rows: 2 }
    },
    {
        id: 'q-address',
        key: 'address',
        icon: '🏠',
        label: 'Has your address changed?',
        detail: 'Have you moved or changed your residential or postal address since the last review?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'New address…', rows: 2 }
    },
    {
        id: 'q-inheritance',
        key: 'inheritance',
        icon: '💰',
        label: 'Do you expect to receive an inheritance in the next 12 months?',
        detail: 'Have you or do you expect to receive an inheritance or significant windfall in the next 12 months?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Estimated amount, timing or other details…', rows: 2 }
    },
    {
        id: 'q-lifestyle',
        key: 'lifestyleSpending',
        icon: '🚗',
        label: 'Do you need any money for a new car, home renovations or a holiday?',
        detail: 'Are you planning any major lifestyle purchases or experiences in the next 12 months that you may need to draw funds for?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'What are you planning and how much do you need?…', rows: 2 }
    },
    {
        id: 'q-homeloan',
        key: 'homeLoan',
        icon: '🏦',
        label: 'Do you still have a home loan?',
        detail: 'Do you currently have an outstanding mortgage or home loan on your primary residence or any other property?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Approximate balance and remaining term…', rows: 2 }
    },
    {
        id: 'q-extrasuper',
        key: 'extraSuper',
        icon: '💹',
        label: 'Are you putting extra money into super?',
        detail: 'Are you currently making any additional contributions into superannuation beyond your employer\'s Superannuation Guarantee (SG) payments?',
        options: ['Yes', 'No'],
        notes: { placeholder: 'Amount and contribution type…', rows: 2 }
    }
];

const ReviewAddQuestions = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [alreadyFilled, setAlreadyFilled] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { post } = useApi();
    const location = useLocation();

    // Extract search query parameters from URL
    const clientDetails = useMemo(() => {
        if (!location?.search) return {};
        const params = new URLSearchParams(location.search);
        // form.reset()
        return Object.fromEntries(params.entries());
    }, [location?.search]);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);

            // Construct payload matching required schema
            const payload = {
                token: clientDetails?.ref || "",

                // Radio Answers
                income: values?.income || "No",
                employment: values?.employment || "No",
                health: values?.health || "No",
                dependants: values?.dependants || "No",
                goals: values?.goals || "No",
                incomeNeed: values?.incomeNeed || "No",
                happyWithInvestments: values?.happyWithInvestments || "No",
                insurance: values?.insurance || "No",
                address: values?.address || "No",
                inheritance: values?.inheritance || "No",
                lifestyleSpending: values?.lifestyleSpending || "No",
                homeLoan: values?.homeLoan || "No",
                extraSuper: values?.extraSuper || "No",

                // Text Notes
                income_notes: values?.income_notes || "",
                employment_notes: values?.employment_notes || "",
                health_notes: values?.health_notes || "",
                dependants_notes: values?.dependants_notes || "",
                goals_notes: values?.goals_notes || "",
                incomeNeed_notes: values?.incomeNeed_notes || "",
                happyWithInvestments_notes: values?.happyWithInvestments_notes || "",
                insurance_notes: values?.insurance_notes || "",
                address_notes: values?.address_notes || "",
                inheritance_notes: values?.inheritance_notes || "",
                lifestyleSpending_notes: values?.lifestyleSpending_notes || "",
                homeLoan_notes: values?.homeLoan_notes || "",
                extraSuper_notes: values?.extraSuper_notes || "",
            };

            const response = await post("whatChange/external/Add", payload);
            const resData = response?.data || response;
            console.log(resData)
            // Check if already filled
            if (resData?.alreadyFilled) {
                setAlreadyFilled(true);
                message.warning("You have already submitted responses for this review.");
                return;
            }

            setIsSubmitted(true);
            message.success("Response submitted successfully!");
        } catch (error) {
            // Check response errors if server returns alreadyfilled inside response data
            if (error?.response?.data?.alreadyFilled) {
                setAlreadyFilled(true);
                message.warning("You have already submitted responses for this review.");
            } else {
                message.error(
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to submit answers. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    if (alreadyFilled) {
        return (
            <div style={{ maxWidth: 720, margin: '150px auto', padding: '0' }}>
                <div className='d-flex justify-content-center align-items-center'>
                    <img src={Advantages} style={{ maxWidth: 720, maxHeight: 500, }} />
                </div>
                <Alert
                    message="Already Filled"
                    description="You have already completed and submitted your responses for this review. Thank you!"
                    type="info"
                    showIcon
                    style={{ borderRadius: 10, padding: 24 }}
                />
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div style={{ maxWidth: 720, margin: '150px auto', padding: '0' }}>
                <div className='d-flex justify-content-center align-items-center'>
                    <img src={Ok} style={{ maxWidth: 720, maxHeight: 500, }} />
                </div>
                <Alert
                    message="Thank You!"
                    description="Your responses have been successfully submitted."
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                    style={{ borderRadius: 10, padding: 24 }}
                />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', fontFamily: 'sans-serif' }}>

            {/* Header Box */}
            <div style={{
                background: 'linear-gradient(135deg, #1a3a1a, #3db549)',
                color: '#fff',
                borderRadius: 14,
                padding: '24px 28px',
                marginBottom: 20
            }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block' }}>
                    Annual Review Questionnaire
                </Text>
                <Title level={2} style={{ color: '#fff', margin: '4px 0 6px 0', fontSize: 24 }}>
                    {clientDetails?.name || "Client"} Review
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                    Denaro Wealth &nbsp;·&nbsp; Annual Review
                </Text>
            </div>

            {/* Intro Box */}
            <div style={{
                background: '#fff',
                border: '1px solid #e0e8e0',
                borderRadius: 10,
                padding: '16px 20px',
                marginBottom: 20,
                fontSize: 13,
                color: '#555',
                lineHeight: 1.6
            }}>
                Dear {clientDetails?.name || "Client"},<br />
                Please answer the questions below regarding any changes to your circumstances. Once completed, click <strong>Submit Answers</strong>.
            </div>

            {/* Ant Design Form Wrapper */}
            <Form form={form} onFinish={handleSubmit} layout="vertical">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {reviewQuestions.map((q, index) => (
                        <Form.Item key={q.id} style={{ marginBottom: 0 }}>
                            <Form.Item noStyle shouldUpdate={(prev, curr) => prev[q.key] !== curr[q.key]}>
                                {() => {
                                    const selectedValue = form.getFieldValue(q.key);

                                    return (
                                        <Card
                                            bodyStyle={{ padding: '16px 20px' }}
                                            style={{
                                                borderRadius: 10,
                                                borderColor: '#e0e8e0',
                                                boxShadow: 'none'
                                            }}
                                        >
                                            {/* Label Header with Badge Index */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    backgroundColor: '#3db549',
                                                    color: '#fff',
                                                    fontSize: 11,
                                                    fontWeight: 800
                                                }}>
                                                    {index + 1}
                                                </span>
                                                <Text strong style={{ fontSize: 14, color: '#1a3a1a' }}>
                                                    {q.label}
                                                </Text>
                                            </div>

                                            {/* Detailed Context */}
                                            <Paragraph style={{ fontSize: 12, color: '#666', marginBottom: 12, paddingLeft: 32 }}>
                                                {q.detail}
                                            </Paragraph>

                                            {/* Options & Controls Container */}
                                            <div style={{ paddingLeft: 32 }}>
                                                <Form.Item
                                                    name={q.key}
                                                    initialValue="No"
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Radio.Group style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                        {q.options.map((option) => {
                                                            const isSelected = selectedValue === option;
                                                            return (
                                                                <Radio.Button
                                                                    key={option}
                                                                    value={option}
                                                                    style={{
                                                                        borderRadius: 20,
                                                                        padding: '0 18px',
                                                                        height: 32,
                                                                        lineHeight: '30px',
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        borderColor: isSelected ? '#3db549' : '#ddd',
                                                                        backgroundColor: isSelected ? '#3db549' : '#ffffff',
                                                                        color: isSelected ? '#ffffff' : '#555',
                                                                        boxShadow: 'none'
                                                                    }}
                                                                >
                                                                    {isSelected && <FaCheck style={{ marginRight: 6 }} />}
                                                                    {option}
                                                                </Radio.Button>
                                                            );
                                                        })}
                                                    </Radio.Group>
                                                </Form.Item>

                                                {/* Notes Field (Appears when "Yes" is selected) */}
                                                {selectedValue === "Yes" && (
                                                    <Form.Item name={`${q.key}_notes`} style={{ marginTop: 12, marginBottom: 0 }}>
                                                        <TextArea
                                                            rows={q.notes.rows}
                                                            placeholder={q.notes.placeholder}
                                                            style={{ borderRadius: 8, fontSize: 12, borderColor: '#ddd' }}
                                                        />
                                                    </Form.Item>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                }}
                            </Form.Item>
                        </Form.Item>
                    ))}
                </Space>

                {/* Form Action Area */}
                <div style={{
                    background: '#fff',
                    border: '1px solid #e0e8e0',
                    borderRadius: 10,
                    padding: 20,
                    textAlign: 'center',
                    marginTop: 20
                }}>
                    <Text style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 12 }}>
                        Please answer all questions before submitting.
                    </Text>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={loading}
                        style={{
                            backgroundColor: '#3db549',
                            borderColor: '#3db549',
                            borderRadius: 8,
                            fontWeight: 700,
                            padding: '0 36px'
                        }}
                        icon={"✓"}
                    >
                        Submit Answers
                    </Button>
                </div>
            </Form>
            <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 20 }}>
                Prepared by Denaro Wealth — Confidential
            </div>
        </div>
    );
};

export default ReviewAddQuestions;