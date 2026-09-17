import React from 'react';
import { Card, Radio, Input, Button, Alert, Space, Typography, Form } from 'antd';
import { MailOutlined, InfoCircleFilled } from '@ant-design/icons';
import parse from "html-react-parser";
import { FaCheck } from 'react-icons/fa';

const { Text } = Typography;
const { TextArea } = Input;

const reviewQuestions = [
    {
        id: 'q-income',
        key: 'income',
        icon: '💵',
        label: 'Has income changed?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-income-notes',
            placeholder: 'Notes…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-employment',
        key: 'employment',
        icon: '💼',
        label: 'Has employment changed?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-employment-notes',
            placeholder: 'Notes…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-health',
        key: 'health',
        icon: '❤️',
        label: 'Has health changed?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-health-notes',
            placeholder: 'Notes…',
            rows: 2,
            defaultVisible: false
        },
        alertsContainerId: 'rq-health-alerts',
        alert: {
            description: `
    <div class="rq-alert rq-alert-warn" style="margin-bottom:.65rem">
      <div>
        A change in health can trigger a number of important financial planning actions. Please work through each of the following considerations with the client before proceeding.<br><br>

        <strong style="color:#92400e">⚠️ Terminal Illness — Early Super Access</strong><br>
        If the client has received a medical diagnosis with a life expectancy of <strong>less than 24 months</strong>, they may be eligible to access their entire superannuation balance as a <strong>tax-free lump sum</strong> under the <em>Terminal Medical Condition</em> condition of release. Two registered medical practitioners (one being a specialist in the relevant field) must certify the diagnosis. This can significantly improve quality of life, allow debt repayment, estate planning, and gifting while the client is alive.<br>
        <strong>Action:</strong> Obtain medical certificates from treating specialists and contact the super fund to initiate a terminal illness claim.<br><br>

        <strong style="color:#92400e">🛡️ Trauma Insurance Claim</strong><br>
        If the client has been diagnosed with a defined <em>Trauma Event</em> — such as cancer, heart attack, stroke, coronary artery bypass surgery, kidney failure, major organ transplant, or other listed conditions — they may be eligible to make a <strong>Trauma (Critical Illness) insurance claim</strong>. Trauma insurance pays a lump sum upon diagnosis of a listed condition, regardless of whether the client can work. This is one of the most commonly overlooked claim opportunities.<br>
        <strong>Action:</strong> Review the client's trauma policy for listed events, confirm the diagnosis qualifies, and lodge a claim with the insurer immediately — do not delay as policies may have waiting periods or specific notification requirements.<br><br>

        <strong style="color:#92400e">🦽 TPD Insurance Claim</strong><br>
        If the health change has resulted in the client being <strong>permanently unable to work</strong> in their own occupation or any occupation (depending on the policy definition), a <strong>Total and Permanent Disability (TPD)</strong> claim may be available. TPD cover is often held both inside superannuation and as a standalone policy. Both should be checked.<br>
        <strong>Action:</strong> Review the TPD definition in the policy (own occupation vs any occupation), gather supporting medical evidence, and lodge claims with both the super fund and any retail insurer.<br><br>

        <strong style="color:#92400e">💼 Income Protection Claim</strong><br>
        If the health change has caused the client to be <strong>off work or unable to earn income</strong>, an <strong>Income Protection (IP)</strong> claim may be available. IP policies typically pay up to 70% of pre-disability income after a waiting period (commonly 30, 60, or 90 days). Check whether the client has IP cover inside super and/or a retail policy.<br>
        <strong>Action:</strong> Confirm the waiting period has elapsed or is approaching, obtain medical certificates from the treating GP, and notify the insurer as soon as possible. Delays in notification can affect claim eligibility.<br><br>

        <strong style="color:#92400e">❤️ Life Insurance & Beneficiary Review</strong><br>
        A serious health diagnosis is a prompt to <strong>review life insurance coverage and beneficiary nominations</strong>. Confirm that binding death benefit nominations are in place and up to date across all super funds and retail policies. If the client's health has deteriorated, any existing life cover should be preserved — do not allow policies to lapse.<br>
        <strong>Action:</strong> Review all in-force policies, confirm nominations, and ensure premiums are being met. Explore whether any policy has a <em>guaranteed future insurability</em> or <em>continuation option</em> that should be exercised before the policy expires.<br><br>

        <strong style="color:#92400e">📋 Estate Planning & Powers of Attorney</strong><br>
        A change in health is an important trigger to review <strong>Wills, Enduring Powers of Attorney, and Advance Care Directives</strong>. Ensure the client's wishes are documented and legally in place while they have legal capacity to make these decisions.<br>
        <strong>Action:</strong> Refer the client to their solicitor to review or update estate planning documents urgently if not already in place.
      </div>
    </div>`,
            title: "Health Change Noted — Critical Strategy Review Required",
            icon: "🏥",
            showOnOption: "Yes",
            type: "warning"
        },
    },
    {
        id: 'q-dependants',
        key: 'dependants',
        icon: '👨‍👩‍👧',
        label: 'Have dependants changed?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-dependants-notes',
            placeholder: 'Notes…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-goals',
        key: 'goals',
        icon: '🎯',
        label: 'Have goals or objectives changed?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-goals-notes',
            placeholder: 'Notes…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-income-need',
        key: 'incomeNeed',
        icon: '📈',
        label: 'Does the client need more income from investments?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-income-need-notes',
            placeholder: 'Notes…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-happy',
        key: 'happyWithInvestments',
        icon: '✅',
        label: 'Is the client happy with their current investments?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-happy-notes',
            placeholder: 'Notes…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-insurance',
        key: 'insurance',
        icon: '🛡️',
        label: 'Is the client happy with their current levels of insurance and premiums?',
        type: 'radio-toggle',
        options: ['Yes — Retain', 'No — Review', 'N/A'],
        notes: {
            id: 'rq-insurance-notes',
            placeholder: 'Notes on cover type, sum insured, beneficiaries or any recommended changes…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-address',
        key: 'address',
        icon: '🏠',
        label: 'Has your address changed?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-address-notes',
            placeholder: 'New address…',
            rows: 2,
            defaultVisible: false
        },
        alertsContainerId: 'rq-address-alerts'
    },
    {
        id: 'q-inheritance',
        key: 'inheritance',
        icon: '💰',
        label: 'Have you or do you expect to receive an inheritance in the next 12 months?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-inheritance-notes',
            placeholder: 'Estimated amount, timing or other details…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-lifestyle',
        key: 'lifestyleSpending',
        icon: '🚗',
        label: 'Do you need any money for a new car, home renovations or a holiday?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-lifestyle-notes',
            placeholder: 'What are you planning and how much do you need?…',
            rows: 2,
            defaultVisible: false
        }
    },
    {
        id: 'q-homeloan',
        key: 'homeLoan',
        icon: '🏦',
        label: 'Do you still have a home loan?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-homeloan-notes',
            placeholder: 'Approximate balance and remaining term…',
            rows: 2,
            defaultVisible: false
        },
        alertsContainerId: 'rq-homeloan-alerts'
    },
    {
        id: 'q-extrasuper',
        key: 'extraSuper',
        icon: '💹',
        label: 'Are you putting extra money into super?',
        type: 'radio-toggle',
        options: ['Yes', 'No'],
        notes: {
            id: 'rq-extrasuper-notes',
            placeholder: 'Amount and contribution type…',
            rows: 2,
            defaultVisible: false
        },
        alertsContainerId: 'rq-extrasuper-alerts',
        alert: {
            description: `
    <div class="rq-alert rq-alert-green">
      <div>
        Making extra contributions into superannuation is one of the most effective ways to build long-term retirement wealth in a low-tax environment. There are two key strategies to consider:<br><br>
        &nbsp;• <strong>Salary Sacrifice</strong> — Arrange with your employer to redirect a portion of your pre-tax salary directly into super. Contributions are taxed at just <strong>15%</strong> (compared to your marginal tax rate of up to 47%), creating an immediate tax saving. The annual concessional contributions cap is <strong>$32,500</strong> (including employer SG contributions).<br><br>
        &nbsp;• <strong>Personal Concessional Contributions</strong> — If salary sacrifice is not available through your employer, you can make personal contributions and claim a tax deduction by lodging a <em>Notice of Intent to Claim</em> with your super fund. The same <strong>$32,500</strong> concessional cap applies.<br><br>
        Both strategies also allow you to utilise the <strong>carry-forward unused concessional contributions</strong> rule — if your Total Super Balance is below $500,000, unused cap amounts from the previous 5 years can be brought forward, potentially allowing a contribution significantly above $32,500 in a single year.<br><br>
        <strong>Action required:</strong> Review the client's current employer SG contribution rate, assessable income, and unused concessional cap carry-forward balance to identify the optimal additional contribution amount for this financial year.
      </div>
    </div>`,
            title: "Opportunity — Additional Super Contributions",
            icon: "💡",
            type: "success",
            showOnOption: "No"
        },
    }
];

const WhatsChanged = () => {
    const [form] = Form.useForm();

    const handleSubmit = (values) => {
        console.log("Form Submitted Values:", values);
    };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>

            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>📝</span>
                <Text strong style={{ color: '#2b8a3e', fontSize: 13, letterSpacing: '0.5px' }}>
                    ANNUAL REVIEW QUESTIONS
                </Text>
            </div>

            {/* Top Alert Banner */}
            <Alert
                message="No age-related strategies triggered at this time. Complete the questions below before proceeding."
                type="info"
                showIcon
                icon={<InfoCircleFilled style={{ color: '#1890ff' }} />}
                style={{
                    borderRadius: 8,
                    backgroundColor: '#e6f7ff',
                    borderColor: '#91d5ff',
                    color: '#1890ff',
                    marginBottom: 16
                }}
            />

            {/* Ant Design Form Wrapper */}
            <Form form={form} onFinish={handleSubmit} layout="vertical">
                {/* Dynamic List of Cards */}
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {reviewQuestions.map((q) => (
                        <Form.Item key={q.id} style={{ marginBottom: 0 }}>
                            {/* Form.Item DependOn for dynamic UI updates without manual useState */}
                            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues[q.key] !== currentValues[q.key]}>
                                {() => {
                                    const selectedValue = form.getFieldValue(q.key);

                                    return (
                                        <Card
                                            bodyStyle={{ padding: '14px 20px' }}
                                            style={{
                                                borderRadius: 12,
                                                borderColor: '#e8e8e8',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                                {/* Icon */}
                                                <div style={{ fontSize: 24, lineHeight: '32px' }}>{q.icon}</div>

                                                {/* Content */}
                                                <div style={{ flex: 1 }}>
                                                    <Text strong style={{ fontSize: 14, color: '#1f2937', display: 'block', marginBottom: 8 }}>
                                                        {q.label}
                                                    </Text>

                                                    {/* Radio Form Item */}
                                                    <Form.Item name={q.key} style={{ marginBottom: 0 }}>
                                                        <Radio.Group style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                            {q.options.map((option) => (
                                                                <Radio.Button
                                                                    key={option}
                                                                    value={option}
                                                                    style={{
                                                                        borderRadius: 20,
                                                                        padding: '0 18px',
                                                                        height: 32,
                                                                        lineHeight: '30px',
                                                                        fontSize: 13,
                                                                        borderColor: selectedValue === option ? '#22c55e' : '#d9d9d9',
                                                                        backgroundColor: selectedValue === option ? '#22c55e' : '#ffffff',
                                                                        color: selectedValue === option ? '#ffffff' : '#595959',
                                                                        boxShadow: 'none'
                                                                    }}
                                                                >
                                                                    {selectedValue === option && (selectedValue === "Yes" || selectedValue === "Yes — Retain") && <FaCheck />} {option}
                                                                </Radio.Button>
                                                            ))}
                                                        </Radio.Group>
                                                    </Form.Item>

                                                    {/* Notes TextArea Form Item */}
                                                    {(selectedValue === "Yes" || selectedValue === "No — Review") && (
                                                        <Form.Item name={`${q.key}_notes`} style={{ marginTop: 12, marginBottom: 0 }}>
                                                            <TextArea
                                                                id={q.notes.id}
                                                                rows={q.notes.rows}
                                                                placeholder={q.notes.placeholder}
                                                                style={{ borderRadius: 6 }}
                                                            />
                                                        </Form.Item>
                                                    )}

                                                    {/* Alert Message */}
                                                    {q?.alert && selectedValue === q?.alert?.showOnOption && (
                                                        <div style={{ marginTop: 12 }}>
                                                            <Alert
                                                                type={q?.alert?.type}
                                                                description={parse(q?.alert.description)}
                                                                title={
                                                                    <div style={{ fontWeight: 700 }}>
                                                                        {q?.alert?.title}
                                                                    </div>
                                                                }
                                                                icon={
                                                                    <div style={{ marginTop: 15 }}>
                                                                        {q?.alert?.icon}
                                                                    </div>
                                                                }
                                                                showIcon={true}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Alert Container for conditional alerts */}
                                                    {q.alertsContainerId && (
                                                        <div id={q.alertsContainerId} style={{ marginTop: 12 }} />
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                }}
                            </Form.Item>
                        </Form.Item>
                    ))}
                </Space>

                {/* Bottom Action Buttons */}
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Button
                        icon={<MailOutlined />}
                        size="large"
                        style={{
                            borderRadius: 8,
                            fontSize: 14,
                            borderColor: '#d9d9d9',
                            color: '#434343'
                        }}
                    >
                        Email Questions to Client
                    </Button>

                    <Button
                        type='primary'
                        htmlType='submit'
                        size="large"
                        style={{ borderRadius: 8 }}
                    >
                        Submit
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default WhatsChanged;