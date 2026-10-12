import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, Alert, Divider, Typography, Row, Col, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

// Helper to strip currency/percentage formatting and convert strings like "$23,365" or "0.1" to numbers
const parseNumber = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        if (val === '∞' || val === 'null' || val === '' || !val) return null;
        const cleaned = val.replace(/[^0-9.-]+/g, '');
        return cleaned ? parseFloat(cleaned) : undefined;
    }
    return undefined;
};

// Map nested initial values to flat form fields with parsed numbers
const mapInitialValues = (initial) => {
    if (!initial) return {};

    const brackets = initial.incomeTaxBrackets?.map((b) => ({
        min: parseNumber(b.min),
        max: b.max === '∞' || b.max === null ? null : parseNumber(b.max),
        rate: parseNumber(b.rate),
        baseTax: parseNumber(b.baseTax),
    })) || [];

    return {
        brackets,
        'medicare-low': parseNumber(initial.medicareLevy?.exemptBelow),
        'medicare-full': parseNumber(initial.medicareLevy?.fullRateAbove),
        'medicare-reduced-rate': parseNumber(initial.medicareLevy?.shadeInRate),
        'medicare-full-rate': parseNumber(initial.medicareLevy?.fullRate),

        'lito-max': parseNumber(initial.lowIncomeTaxOffset?.maxOffset),
        'lito-full-thresh': parseNumber(initial.lowIncomeTaxOffset?.fullAtOrBelow),
        'lito-band1-end': parseNumber(initial.lowIncomeTaxOffset?.band1EndsAt),
        'lito-band1-rate': parseNumber(initial.lowIncomeTaxOffset?.band1Taper),
        'lito-taper-end': parseNumber(initial.lowIncomeTaxOffset?.phasesOutAt),
        'lito-band2-rate': parseNumber(initial.lowIncomeTaxOffset?.band2Taper),

        'sapto-single-max': parseNumber(initial.saptoSingle?.maxOffset),
        'sapto-single-lower': parseNumber(initial.saptoSingle?.fullBelow),
        'sapto-single-upper': parseNumber(initial.saptoSingle?.nilAbove),

        'sapto-couple-max': parseNumber(initial.saptoCouple?.maxOffset),
        'sapto-couple-lower': parseNumber(initial.saptoCouple?.fullBelow),
        'sapto-couple-upper': parseNumber(initial.saptoCouple?.nilAbove),
        'sapto-taper': parseNumber(initial.saptoCouple?.taperRate),
    };
};

const TaxRates = ({ initialValue, onClose, onSave }) => {
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);

    // Re-set form values if initialValue changes
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue(mapInitialValues(initialValue));
        }
    }, [initialValue, form]);

    const onFinish = async (values) => {
        try {
            setIsLoading(true);

            // Reconstruct income tax brackets payload
            const formattedBrackets = (values.brackets || []).map((b) => ({
                min: `$${(b.min || 0).toLocaleString()}`,
                max: b.max === null || b.max === undefined ? '∞' : `$${b.max.toLocaleString()}`,
                rate: String(b.rate ?? 0),
                baseTax: `$${(b.baseTax || 0).toLocaleString()}`,
            }));

            // Re-construct the full nested object payload to match the expected structure
            const formattedPayload = {
                medicareLevy: {
                    exemptBelow: `$${(values['medicare-low'] || 0).toLocaleString()}`,
                    fullRateAbove: `$${(values['medicare-full'] || 0).toLocaleString()}`,
                    shadeInRate: String(values['medicare-reduced-rate'] ?? 0),
                    fullRate: String(values['medicare-full-rate'] ?? 0),
                },
                lowIncomeTaxOffset: {
                    maxOffset: `$${(values['lito-max'] || 0).toLocaleString()}`,
                    fullAtOrBelow: `$${(values['lito-full-thresh'] || 0).toLocaleString()}`,
                    band1EndsAt: `$${(values['lito-band1-end'] || 0).toLocaleString()}`,
                    band1Taper: String(values['lito-band1-rate'] ?? 0),
                    phasesOutAt: `$${(values['lito-taper-end'] || 0).toLocaleString()}`,
                    band2Taper: String(values['lito-band2-rate'] ?? 0),
                },
                saptoSingle: {
                    maxOffset: `$${(values['sapto-single-max'] || 0).toLocaleString()}`,
                    fullBelow: `$${(values['sapto-single-lower'] || 0).toLocaleString()}`,
                    nilAbove: `$${(values['sapto-single-upper'] || 0).toLocaleString()}`,
                },
                saptoCouple: {
                    maxOffset: `$${(values['sapto-couple-max'] || 0).toLocaleString()}`,
                    fullBelow: `$${(values['sapto-couple-lower'] || 0).toLocaleString()}`,
                    nilAbove: `$${(values['sapto-couple-upper'] || 0).toLocaleString()}`,
                    taperRate: String(values['sapto-taper'] ?? 0),
                },
                incomeTaxBrackets: formattedBrackets,
            };

            if (onSave) await onSave(formattedPayload);
        } catch (error) {
            console.error('Error saving tax rates:', error);
            message.error('Failed to save tax rates. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={mapInitialValues(initialValue)}
            onFinish={onFinish}
            style={{ padding: '8px' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                <Alert
                    message={
                        <span>
                            💡 Edit any value below — all changes are saved to your browser and used by the Tax Calculator. Add/remove brackets by adjusting the inputs (leave Max blank for the top bracket = ∞).
                        </span>
                    }
                    type="warning"
                    showIcon
                    style={{ background: '#fff8e1', border: '1px solid #f5c518' }}
                />

                {/* Income Tax Brackets */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                        Income Tax Brackets
                    </Title>

                    <Form.List name="brackets">
                        {(fields, { add, remove }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Row gutter={8} style={{ fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
                                    <Col span={6}>Min ($)</Col>
                                    <Col span={6}>Max ($, blank=∞)</Col>
                                    <Col span={5}>Rate (e.g. 0.30)</Col>
                                    <Col span={5}>Base Tax ($)</Col>
                                    <Col span={2}></Col>
                                </Row>

                                {fields.map(({ key, name, ...restField }) => (
                                    <Row gutter={8} key={key} align="middle">
                                        <Col span={6}>
                                            <Form.Item {...restField} name={[name, 'min']} style={{ marginBottom: 0 }}>
                                                <InputNumber style={{ width: '100%' }} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item {...restField} name={[name, 'max']} style={{ marginBottom: 0 }}>
                                                <InputNumber placeholder="∞" style={{ width: '100%' }} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={5}>
                                            <Form.Item {...restField} name={[name, 'rate']} style={{ marginBottom: 0 }}>
                                                <InputNumber style={{ width: '100%' }} step={0.01} precision={4} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={5}>
                                            <Form.Item {...restField} name={[name, 'baseTax']} style={{ marginBottom: 0 }}>
                                                <InputNumber style={{ width: '100%' }} step={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2} style={{ textAlign: 'center' }}>
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                        </Col>
                                    </Row>
                                ))}

                                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: '4px' }}>
                                    Add Bracket
                                </Button>
                            </div>
                        )}
                    </Form.List>
                </div>

                <Divider style={{ margin: '4px 0' }} />

                {/* Medicare Levy */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                        Medicare Levy
                    </Title>
                    <Row gutter={12}>
                        <Col span={6}><Form.Item label="Exempt below ($)" name="medicare-low"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Full rate above ($)" name="medicare-full"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Shade-in rate (e.g. 0.10)" name="medicare-reduced-rate"><InputNumber style={{ width: '100%' }} step={0.01} precision={4} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Full rate (e.g. 0.02)" name="medicare-full-rate"><InputNumber style={{ width: '100%' }} step={0.001} precision={4} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Low Income Tax Offset (LITO) */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                        Low Income Tax Offset (LITO)
                    </Title>
                    <Row gutter={12}>
                        <Col span={8}><Form.Item label="Max offset ($)" name="lito-max"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Full at or below ($)" name="lito-full-thresh"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Band 1 ends at ($)" name="lito-band1-end"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Band 1 taper (e.g. 0.05)" name="lito-band1-rate"><InputNumber style={{ width: '100%' }} step={0.001} precision={4} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Phases out at ($)" name="lito-taper-end"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Band 2 taper (e.g. 0.015)" name="lito-band2-rate"><InputNumber style={{ width: '100%' }} step={0.001} precision={4} /></Form.Item></Col>
                    </Row>
                </div>

                {/* SAPTO — Single */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                        SAPTO — Single
                    </Title>
                    <Row gutter={12}>
                        <Col span={8}><Form.Item label="Max offset ($)" name="sapto-single-max"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Full below ($)" name="sapto-single-lower"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Nil above ($)" name="sapto-single-upper"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                    </Row>
                </div>

                {/* SAPTO — Couple */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                        SAPTO — Couple (each)
                    </Title>
                    <Row gutter={12}>
                        <Col span={6}><Form.Item label="Max offset ($)" name="sapto-couple-max"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Full below ($)" name="sapto-couple-lower"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Nil above ($)" name="sapto-couple-upper"><InputNumber style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Taper rate (e.g. 0.125)" name="sapto-taper"><InputNumber style={{ width: '100%' }} step={0.001} precision={4} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    {onClose && <Button onClick={onClose}>Cancel</Button>}
                    <Button loading={isLoading} type="primary" htmlType="submit">Save Changes</Button>
                </div>

            </div>
        </Form>
    );
};

export default TaxRates;