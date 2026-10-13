import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, Alert, Divider, Typography, Row, Col, message } from 'antd';

const { Title, Text } = Typography;

const formatGroupedInputValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatCurrencyInput = (value) => {
    const formattedValue = formatGroupedInputValue(value);
    return formattedValue ? `$${formattedValue}` : '';
};

const formatPercentageInput = (value) => {
    const formattedValue = formatGroupedInputValue(value);
    return formattedValue ? `${formattedValue}%` : '';
};

const parseFormattedInput = (value) => value?.replace(/[$,%\s]/g, '') ?? '';

const currencyInputProps = {
    formatter: formatCurrencyInput,
    parser: parseFormattedInput,
};

const percentageInputProps = {
    formatter: formatPercentageInput,
    parser: parseFormattedInput,
};

// Helper to strip currency/percent formatting and convert strings like "$1,300,000" or "1.25%" to numbers
const parseNumber = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.-]+/g, '');
        return cleaned ? parseFloat(cleaned) : undefined;
    }
    return undefined;
};

// Map nested initial values to flat form fields with parsed numbers
const mapInitialValues = (initial) => {
    if (!initial) return {};

    return {
        // Full Pension Components
        'bp-client': parseNumber(initial.fullPensionComponents?.basisPayment?.client),
        'bp-partner': parseNumber(initial.fullPensionComponents?.basisPayment?.partner),
        'pb-client': parseNumber(initial.fullPensionComponents?.pharmaceuticalBenefit?.client),
        'pb-partner': parseNumber(initial.fullPensionComponents?.pharmaceuticalBenefit?.partner),
        'ce-client': parseNumber(initial.fullPensionComponents?.cleanEnergySupplement?.client),
        'ce-partner': parseNumber(initial.fullPensionComponents?.cleanEnergySupplement?.partner),

        // Assets Test Homeowner
        'ath-client-lower': parseNumber(initial.assetsTestHomeowner?.client?.lower),
        'ath-client-upper': parseNumber(initial.assetsTestHomeowner?.client?.upper),
        'ath-partner-lower': parseNumber(initial.assetsTestHomeowner?.partner?.lower),
        'ath-partner-upper': parseNumber(initial.assetsTestHomeowner?.partner?.upper),

        // Assets Test Non-Homeowner
        'atnh-client-lower': parseNumber(initial.assetsTestNonHomeowner?.client?.lower),
        'atnh-client-upper': parseNumber(initial.assetsTestNonHomeowner?.client?.upper),
        'atnh-partner-lower': parseNumber(initial.assetsTestNonHomeowner?.partner?.lower),
        'atnh-partner-upper': parseNumber(initial.assetsTestNonHomeowner?.partner?.upper),

        // Illness Separated
        'is-homeownerUpper': parseNumber(initial.illnessSeparatedAssetCutOff?.homeownerUpper),
        'is-nonHomeownerUpper': parseNumber(initial.illnessSeparatedAssetCutOff?.nonHomeownerUpper),

        // Income Test Free Areas
        'itfa-client': parseNumber(initial.incomeTestFreeAreas?.client),
        'itfa-partner': parseNumber(initial.incomeTestFreeAreas?.partner),

        // Income Test Cut Off Points
        'itco-client': parseNumber(initial.incomeTestCutOffPoints?.client),
        'itco-partner': parseNumber(initial.incomeTestCutOffPoints?.partner),
        'itco-illnessSeparatedCombined': parseNumber(initial.incomeTestCutOffPoints?.illnessSeparatedCombined),

        // Deeming Rates
        'dr-clientThreshold': parseNumber(initial.deemingRates?.clientThreshold),
        'dr-partnerThreshold': parseNumber(initial.deemingRates?.partnerThreshold),
        'dr-lowerRate': parseNumber(initial.deemingRates?.lowerRate),
        'dr-upperRate': parseNumber(initial.deemingRates?.upperRate),

        // Assets Taper
        'at-reductionRate': parseNumber(initial.assetsTaper?.reductionRate),

        // Contribution Caps
        'cc-concessionalCap': parseNumber(initial.contributionCaps?.concessionalCap),
        'cc-nonConcessionalCap': parseNumber(initial.contributionCaps?.nonConcessionalCap),

        // Low Income Health Care Card
        'lihcc-clientPerWeek': parseNumber(initial.lowIncomeHealthCareCard?.clientPerWeek),
        'lihcc-partnerCombinedPerWeek': parseNumber(initial.lowIncomeHealthCareCard?.partnerCombinedPerWeek),
        'lihcc-perDependentChildPerWeek': parseNumber(initial.lowIncomeHealthCareCard?.perDependentChildPerWeek),
    };
};

const RateReferenceEditForm = ({ initialValue, onClose, onSave }) => {
    const [form] = Form.useForm();
    let [isLoading, setIsLoading] = useState(false);

    // Re-set form values if initialValue changes
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue(mapInitialValues(initialValue));
        }
    }, [initialValue, form]);

    // Calculate dynamic sums for totals
    const clientBase = Form.useWatch('bp-client', form) || 0;
    const clientPharm = Form.useWatch('pb-client', form) || 0;
    const clientClean = Form.useWatch('ce-client', form) || 0;
    const clientTotal = clientBase + clientPharm + clientClean;

    const partnerBase = Form.useWatch('bp-partner', form) || 0;
    const partnerPharm = Form.useWatch('pb-partner', form) || 0;
    const partnerClean = Form.useWatch('ce-partner', form) || 0;
    const partnerTotal = partnerBase + partnerPharm + partnerClean;

    const onFinish = async (values) => {
        try {
            setIsLoading(true)
            // Re-construct the nested object payload to match the original structure
            const formattedPayload = {
                illnessSeparatedAssetCutOff: {
                    homeownerUpper: `$${(values['is-homeownerUpper'] || 0).toLocaleString()}`,
                    nonHomeownerUpper: `$${(values['is-nonHomeownerUpper'] || 0).toLocaleString()}`,
                },
                incomeTestFreeAreas: {
                    client: `$${(values['itfa-client'] || 0).toLocaleString()}`,
                    partner: `$${(values['itfa-partner'] || 0).toLocaleString()}`,
                },
                incomeTestCutOffPoints: {
                    client: `$${(values['itco-client'] || 0).toFixed(2)}`,
                    partner: `$${(values['itco-partner'] || 0).toFixed(2)}`,
                    illnessSeparatedCombined: `$${(values['itco-illnessSeparatedCombined'] || 0).toFixed(2)}`,
                },
                deemingRates: {
                    clientThreshold: `$${(values['dr-clientThreshold'] || 0).toLocaleString()}`,
                    partnerThreshold: `$${(values['dr-partnerThreshold'] || 0).toLocaleString()}`,
                    lowerRate: `${values['dr-lowerRate'] || 0}%`,
                    upperRate: `${values['dr-upperRate'] || 0}%`,
                },
                assetsTaper: {
                    reductionRate: `$${values['at-reductionRate'] || 0}`,
                },
                contributionCaps: {
                    concessionalCap: `$${(values['cc-concessionalCap'] || 0).toLocaleString()}`,
                    nonConcessionalCap: `$${(values['cc-nonConcessionalCap'] || 0).toLocaleString()}`,
                },
                lowIncomeHealthCareCard: {
                    clientPerWeek: `$${(values['lihcc-clientPerWeek'] || 0).toLocaleString()}`,
                    partnerCombinedPerWeek: `$${(values['lihcc-partnerCombinedPerWeek'] || 0).toLocaleString()}`,
                    perDependentChildPerWeek: `$${(values['lihcc-perDependentChildPerWeek'] || 0).toLocaleString()}`,
                },
                fullPensionComponents: {
                    basisPayment: {
                        client: `$${(values['bp-client'] || 0).toFixed(2)}`,
                        partner: `$${(values['bp-partner'] || 0).toFixed(2)}`,
                    },
                    pharmaceuticalBenefit: {
                        client: `$${(values['pb-client'] || 0).toFixed(2)}`,
                        partner: `$${(values['pb-partner'] || 0).toFixed(2)}`,
                    },
                    cleanEnergySupplement: {
                        client: `$${(values['ce-client'] || 0).toFixed(2)}`,
                        partner: `$${(values['ce-partner'] || 0).toFixed(2)}`,
                    },
                },
                assetsTestHomeowner: {
                    client: {
                        lower: `$${(values['ath-client-lower'] || 0).toLocaleString()}`,
                        upper: `$${(values['ath-client-upper'] || 0).toLocaleString()}`,
                    },
                    partner: {
                        lower: `$${(values['ath-partner-lower'] || 0).toLocaleString()}`,
                        upper: `$${(values['ath-partner-upper'] || 0).toLocaleString()}`,
                    },
                },
                assetsTestNonHomeowner: {
                    client: {
                        lower: `$${(values['atnh-client-lower'] || 0).toLocaleString()}`,
                        upper: `$${(values['atnh-client-upper'] || 0).toLocaleString()}`,
                    },
                    partner: {
                        lower: `$${(values['atnh-partner-lower'] || 0).toLocaleString()}`,
                        upper: `$${(values['atnh-partner-upper'] || 0).toLocaleString()}`,
                    },
                },
            };

            if (onSave) await onSave(formattedPayload);
        } catch (error) {
            console.error('Error saving rate reference:', error);
            message.error('Failed to save rate reference. Please try again later.');
        }
        finally {
            setIsLoading(false)
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

                {/* Full Pension Component Breakdown */}
                <div>
                    <Title onClick={() => { console.log(initialValue) }} level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Full Pension (per fortnight) — Component Breakdown
                    </Title>
                    <Row gutter={[12, 12]} align="middle">
                        <Col span={10}><Text strong style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Component</Text></Col>
                        <Col span={7} style={{ textAlign: 'right' }}><Text strong style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Client ($/fn)</Text></Col>
                        <Col span={7} style={{ textAlign: 'right' }}><Text strong style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Partner ($/fn)</Text></Col>

                        {/* Basis Payment */}
                        <Col span={10}><Text style={{ fontSize: '0.85rem' }}>Basis Payment</Text></Col>
                        <Col span={7}>
                            <Form.Item name="bp-client" style={{ marginBottom: 0 }}>
                                <InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.01} precision={2} />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item name="bp-partner" style={{ marginBottom: 0 }}>
                                <InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.01} precision={2} />
                            </Form.Item>
                        </Col>

                        {/* Pharmaceutical Benefit */}
                        <Col span={10}><Text style={{ fontSize: '0.85rem' }}>Pharmaceutical Benefit</Text></Col>
                        <Col span={7}>
                            <Form.Item name="pb-client" style={{ marginBottom: 0 }}>
                                <InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.01} precision={2} />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item name="pb-partner" style={{ marginBottom: 0 }}>
                                <InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.01} precision={2} />
                            </Form.Item>
                        </Col>

                        {/* Clean Energy Supplement */}
                        <Col span={10}><Text style={{ fontSize: '0.85rem' }}>Clean Energy Supplement</Text></Col>
                        <Col span={7}>
                            <Form.Item name="ce-client" style={{ marginBottom: 0 }}>
                                <InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.01} precision={2} />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item name="ce-partner" style={{ marginBottom: 0 }}>
                                <InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.01} precision={2} />
                            </Form.Item>
                        </Col>

                        {/* Total — Auto Calculated */}
                        <Col span={10}><Text strong style={{ color: '#006d77' }}>Total Full Pension ($/fn)</Text></Col>
                        <Col span={7}>
                            <InputNumber
                                {...currencyInputProps}
                                value={clientTotal}

                                readOnly
                                precision={2}
                                style={{ width: '100%', background: '#f0faf1', fontWeight: 700, color: '#006d77' }}
                            />
                        </Col>
                        <Col span={7}>
                            <InputNumber
                                {...currencyInputProps}
                                value={partnerTotal}

                                readOnly
                                precision={2}
                                style={{ width: '100%', background: '#f0faf1', fontWeight: 700, color: '#006d77' }}
                            />
                        </Col>
                    </Row>
                </div>

                <Divider style={{ margin: '4px 0' }} />

                {/* Assets Test — Homeowner */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Assets Test Thresholds — Homeowner ($)
                    </Title>
                    <Row gutter={12}>
                        <Col span={6}><Form.Item label="Client Lower" name="ath-client-lower"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Client Upper" name="ath-client-upper"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Partner Lower" name="ath-partner-lower"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Partner Upper" name="ath-partner-upper"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Assets Test — Non-Homeowner */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Assets Test Thresholds — Non-Homeowner ($)
                    </Title>
                    <Row gutter={12}>
                        <Col span={6}><Form.Item label="Client Lower" name="atnh-client-lower"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Client Upper" name="atnh-client-upper"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Partner Lower" name="atnh-partner-lower"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Partner Upper" name="atnh-partner-upper"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Assets Test — Illness-Separated Couple */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Illness-Separated Couple — Asset Cut-off ($)
                    </Title>
                    <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '10px' }}>
                        Each partner is paid the <strong>single</strong> rate, so the cut-off is higher than an ordinary couple. Free areas are the couple lower thresholds above.
                    </Text>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item label="Homeowner Upper" name="is-homeownerUpper"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                        <Col span={12}><Form.Item label="Non-Homeowner Upper" name="is-nonHomeownerUpper"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Income Test Free Areas */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Income Test Free Areas ($/fn)
                    </Title>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item label="Client ($/fn)" name="itfa-client"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={12}><Form.Item label="Partner Combined ($/fn)" name="itfa-partner"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={1} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Income Test Cut Off Points */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Income Test — Fortnightly Cut-off Point ($/fn)
                    </Title>
                    <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '10px' }}>
                        Fortnightly income at which the pension reduces to $0.
                    </Text>
                    <Row gutter={12}>
                        <Col span={8}><Form.Item label="Client" name="itco-client"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.10} precision={2} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Partner" name="itco-partner"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.10} precision={2} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Illness-sep. (combined)" name="itco-illnessSeparatedCombined"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.10} precision={2} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Deeming Rates */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Deeming
                    </Title>
                    <Row gutter={12}>
                        <Col span={6}><Form.Item label="Client Threshold ($)" name="dr-clientThreshold"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={100} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Partner Threshold ($)" name="dr-partnerThreshold"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={100} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Lower Rate (%)" name="dr-lowerRate"><InputNumber {...percentageInputProps} style={{ width: '100%' }} step={0.01} precision={2} /></Form.Item></Col>
                        <Col span={6}><Form.Item label="Upper Rate (%)" name="dr-upperRate"><InputNumber {...percentageInputProps} style={{ width: '100%' }} step={0.01} precision={2} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Assets Taper */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Assets Taper
                    </Title>
                    <Row gutter={12}>
                        <Col span={8}>
                            <Form.Item label="Reduction ($ per $1,000/fn)" name="at-reductionRate">
                                <InputNumber {...currencyInputProps} style={{ width: '100%' }} step={0.5} />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Contribution Caps */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        💼 Contribution Caps (annual, per member)
                    </Title>
                    <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '10px' }}>
                        Annual limits used by the Super Projections and contribution calculators.
                    </Text>
                    <Row gutter={12}>
                        <Col span={12}><Form.Item label="Concessional Cap ($)" name="cc-concessionalCap"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={500} /></Form.Item></Col>
                        <Col span={12}><Form.Item label="Non-Concessional Cap ($)" name="cc-nonConcessionalCap"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={1000} /></Form.Item></Col>
                    </Row>
                </div>

                {/* Low-Income Health Care Card */}
                <div>
                    <Title level={5} style={{ color: '#006d77', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        💳 Low-Income Health Care Card (8-Week Test)
                    </Title>
                    <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '10px' }}>
                        Per-week income limits — multiplied by 8 to give the 8-week threshold the LIHCC uses.
                    </Text>
                    <Row gutter={12}>
                        <Col span={8}><Form.Item label="Client ($/week)" name="lihcc-clientPerWeek"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Partner Combined ($/week)" name="lihcc-partnerCombinedPerWeek"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={1} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="Per dependent child ($/week)" name="lihcc-perDependentChildPerWeek"><InputNumber {...currencyInputProps} style={{ width: '100%' }} step={1} /></Form.Item></Col>
                    </Row>
                </div>

                <Alert
                    message={
                        <span>
                            Rates are saved to your browser and used for all calculations.
                        </span>
                    }
                    type="warning"
                    showIcon
                    style={{ background: '#fff8e1', border: '1px solid #f5c518' }}
                />

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    {onClose && <Button onClick={onClose}>Cancel</Button>}
                    <Button loading={isLoading} type="primary" htmlType="submit">Save Changes</Button>
                </div>

            </div>
        </Form>
    );
};

export default RateReferenceEditForm;