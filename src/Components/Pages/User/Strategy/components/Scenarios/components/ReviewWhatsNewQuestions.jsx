import React, { useState } from 'react';
import { Card, Radio, Input, Button, Alert, Space, Typography, Form, message } from 'antd';
import { MailOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import parse from "html-react-parser";
import { FaCheck } from 'react-icons/fa';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

// Merged configuration matching the HTML structure and detailed descriptions
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
        notes: { placeholder: 'Notes (optional)…', rows: 2 },
        alert: {
            title: "Health Change Noted — Critical Strategy Review Required",
            icon: "🏥",
            showOnOption: "Yes",
            type: "warning",
            description: `
    <div class="rq-alert rq-alert-warn" style="margin-bottom:.65rem">
      <div>
        A change in health can trigger a number of important financial planning actions. Please work through each of the following considerations with the client before proceeding.<br><br>
        <strong style="color:#92400e">⚠️ Terminal Illness — Early Super Access</strong><br>
        If the client has received a medical diagnosis with a life expectancy of <strong>less than 24 months</strong>, they may be eligible to access their entire superannuation balance as a <strong>tax-free lump sum</strong>.<br><br>
        <strong style="color:#92400e">🛡️ Trauma & TPD Claims</strong><br>
        Review the client's trauma policy for listed events, and check Total and Permanent Disability (TPD) cover held both inside and outside super.<br><br>
        <strong style="color:#92400e">📋 Estate Planning</strong><br>
        Review Wills, Enduring Powers of Attorney, and Advance Care Directives.
      </div>
    </div>`
        }
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
        options: ['Yes — retain strategy', 'No — review required'],
        notes: { placeholder: 'Notes (optional)…', rows: 2 }
    },
    {
        id: 'q-insurance',
        key: 'insurance',
        icon: '🛡️',
        label: 'Are you happy with your current insurance?',
        detail: 'Are you satisfied with your current levels of insurance coverage and premiums?',
        options: ['Yes — retain cover', 'No — review required', 'N/A'],
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
        notes: { placeholder: 'Amount and contribution type…', rows: 2 },
        alert: {
            title: "Opportunity — Additional Super Contributions",
            icon: "💡",
            type: "success",
            showOnOption: "No",
            description: `
    <div class="rq-alert rq-alert-green">
      <div>
        Making extra contributions into superannuation is one of the most effective ways to build long-term retirement wealth.<br><br>
        • <strong>Salary Sacrifice</strong> — Redirect pre-tax salary (contributions taxed at 15%).<br>
        • <strong>Personal Concessional Contributions</strong> — Claim a tax deduction on personal payments.<br><br>
        Review current limits and carry-forward rules for maximum impact.
      </div>
    </div>`
        }
    }
];

const ReviewWhatsNewQuestions = () => {
    const [form] = Form.useForm();
    const [generatedCode, setGeneratedCode] = useState('');
    const [copied, setCopied] = useState(false);

    // Converts form results to Base64 Reply Code matching the HTML logic[cite: 2]
    const handleSubmit = (values) => {
        // Collect answers into key-value map
        const answersPayload = {};

        reviewQuestions.forEach((q) => {
            const val = values[q.key];
            if (val) {
                answersPayload[q.id] = val;
            }
            const noteVal = values[`${q.key}_notes`];
            if (noteVal && noteVal.trim()) {
                answersPayload[`${q.id}_notes`] = noteVal.trim();
            }
        });

        try {
            const jsonString = JSON.stringify(answersPayload);
            const encodedCode = "RQ:" + btoa(unescape(encodeURIComponent(jsonString)));
            setGeneratedCode(encodedCode);
            message.success("Reply Code generated successfully!");
        } catch (err) {
            message.error("Failed to generate code.");
        }
    };

    const handleCopyCode = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        message.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', fontFamily: 'sans-serif' }}>

            {/* Header Box[cite: 2] */}
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
                    Client Review
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                    Denaro Wealth &nbsp;·&nbsp; Annual Review
                </Text>
            </div>

            {/* Intro Box[cite: 2] */}
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
                Dear Client,<br />
                Please answer the questions below before your annual review with <strong>Denaro Wealth</strong>. Once complete, click <strong>Submit Answers</strong> and email the Reply Code back to your adviser.
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
                                            {/* Label Header with Badge Index[cite: 2] */}
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

                                            {/* Detailed Context[cite: 2] */}
                                            <Paragraph style={{ fontSize: 12, color: '#666', marginBottom: 12, paddingLeft: 32 }}>
                                                {q.detail}
                                            </Paragraph>

                                            {/* Options & Controls Container */}
                                            <div style={{ paddingLeft: 32 }}>
                                                <Form.Item
                                                    name={q.key}
                                                    rules={[{ required: true, message: 'Please select an answer' }]}
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

                                                {/* Notes Field (Appears on affirmative/review selections)[cite: 2] */}
                                                {(selectedValue?.includes("Yes") || selectedValue?.includes("No — review")) && (
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
                        style={{
                            backgroundColor: '#3db549',
                            borderColor: '#3db549',
                            borderRadius: 8,
                            fontWeight: 700,
                            padding: '0 36px'
                        }}
                    >
                        ✓ Submit Answers
                    </Button>

                    {/* Generated Reply Code Area[cite: 2] */}
                    {generatedCode && (
                        <div style={{ marginTop: 20, textAlign: 'left', background: '#f0fdf0', padding: 16, borderRadius: 8, border: '1.5px solid #3db549' }}>
                            <Text strong style={{ fontSize: 12, color: '#1a3a1a', display: 'block', marginBottom: 6 }}>
                                Your Reply Code — send this to your adviser:
                            </Text>

                            <TextArea
                                value={generatedCode}
                                readOnly
                                rows={3}
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                    backgroundColor: '#fff',
                                    marginBottom: 8
                                }}
                            />

                            <Button
                                icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                                onClick={handleCopyCode}
                                style={{
                                    backgroundColor: '#e8f5e9',
                                    color: '#2d6a2d',
                                    borderColor: '#3db549',
                                    fontWeight: 700,
                                    borderRadius: 6
                                }}
                            >
                                {copied ? 'Copied!' : 'Copy Code'}
                            </Button>

                            <Text style={{ fontSize: 11, color: '#666', display: 'block', marginTop: 8 }}>
                                Email or text this code to your adviser.
                            </Text>
                        </div>
                    )}
                </div>
            </Form>

            <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 20 }}>
                Prepared by Denaro Wealth — Confidential
            </div>
        </div>
    );
};

export default ReviewWhatsNewQuestions;