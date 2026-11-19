import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Select, Spin, message } from 'antd';
import {
    BankOutlined,
    CalculatorOutlined,
    DollarOutlined,
    EditOutlined,
    ReloadOutlined,
    RiseOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import useApi from '../../../../hooks/useApi';
import { RateReferenceObject } from '../../../../store/authState';
import { useAtom } from 'jotai';
import RateReferenceEditableTable from './RateReferenceEditableTable';
import RateReferenceSection from './RateReferenceSection';
import { FaPercent } from 'react-icons/fa';
import { GoDatabase } from 'react-icons/go';
import { FaArrowTrendUp } from 'react-icons/fa6';

const DEFAULT_EXPECTED_RETURNS = {
    Cash: '3.0',
    Conservative: '3.8',
    ModeratelyConservative: '4.5',
    Balanced: '5.0',
    Growth: '6.0',
    HighGrowth: '6.5',
};

const getExpectedReturns = (expectedReturn = {}) =>
    Object.fromEntries(
        Object.entries(DEFAULT_EXPECTED_RETURNS).map(([key, defaultValue]) => [
            key,
            expectedReturn[key] ?? defaultValue,
        ])
    );

const parseVal = (value) => parseFloat(String(value || '').replace(/[^0-9.-]+/g, '')) || 0;

const formatIncomeNumber = (value) => {
    const numeric = Number(value || 0);
    return numeric.toLocaleString('en-AU', {
        minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
        maximumFractionDigits: 2,
    });
};

const renderIncomeThreshold = (value) => {
    if (value === null || value === undefined || value === '') return '';

    const numeric = parseVal(value);
    return (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <strong>{formatIncomeNumber(numeric)}</strong>
            <span style={{ color: '#8a97a0', fontSize: 12, fontWeight: 500 }}>
                (${formatIncomeNumber(numeric * 26)} p.a.)
            </span>
        </span>
    );
};

const RateReference = () => {
    const [rateReference, setRateReference] = useAtom(RateReferenceObject);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('centrelink');
    const [financialYear, setFinancialYear] = useState(() => {
        try {
            return localStorage.getItem('rateRefFY') || '2026/27';
        } catch {
            return '2026/27';
        }
    });
    const [searchQueries, setSearchQueries] = useState({
        centrelink: '',
        tax: '',
        super: '',
        investment: '',
    });
    const [investmentReturns, setInvestmentReturns] = useState(DEFAULT_EXPECTED_RETURNS);
    const [isSavingReturns, setIsSavingReturns] = useState(false);
    const [isSavingContributionCaps, setIsSavingContributionCaps] = useState(false);
    const [centrelinkForm] = Form.useForm();
    const [investmentForm] = Form.useForm();
    const [superForm] = Form.useForm();
    const { get, patch } = useApi();

    const ref = rateReference?.rateReference || {};
    const tax = rateReference?.taxRatesSchema || {};
    const brackets = tax.incomeTaxBrackets || [];
    const medicare = tax.medicareLevy || {};
    const lito = tax.lowIncomeTaxOffset || {};
    const saptoS = tax.saptoSingle || {};
    const saptoC = tax.saptoCouple || {};

    const singleFortnightlyNum =
        parseVal(ref.fullPensionComponents?.basisPayment?.client) +
        parseVal(ref.fullPensionComponents?.pharmaceuticalBenefit?.client) +
        parseVal(ref.fullPensionComponents?.cleanEnergySupplement?.client);

    const coupleEachFortnightlyNum =
        parseVal(ref.fullPensionComponents?.basisPayment?.partner) +
        parseVal(ref.fullPensionComponents?.pharmaceuticalBenefit?.partner) +
        parseVal(ref.fullPensionComponents?.cleanEnergySupplement?.partner);
    const coupleCombinedFortnightlyNum = coupleEachFortnightlyNum * 2;

    const annualValue = (value) => Math.round(Number(value || 0) * 26).toLocaleString('en-AU');
    const moneyText = (value) => {
        const numeric = parseVal(value);
        if (!Number.isFinite(numeric)) return '$0.00';
        return `$${numeric.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fyOptions = useMemo(() => {
        const options = [];
        for (let y = 2026; y < 2026 + 30; y += 1) {
            options.push(`${y}/${String((y + 1) % 100).padStart(2, '0')}`);
        }
        return options;
    }, []);

    const initialExpectedReturns = getExpectedReturns(rateReference?.expectedReturn);

    const handleReturnChange = (key, value) => {
        setInvestmentReturns((prev) => ({
            ...prev,
            [key]: value === null || value === undefined ? '' : String(value),
        }));
    };

    const hasInvalidExpectedReturn = Object.keys(DEFAULT_EXPECTED_RETURNS).some(
        (key) => investmentReturns[key] === '' || !Number.isFinite(Number(investmentReturns[key]))
    );

    const hasExpectedReturnChanges = Object.keys(DEFAULT_EXPECTED_RETURNS).some(
        (key) => investmentReturns[key] === '' || Number(investmentReturns[key]) !== Number(initialExpectedReturns[key])
    );

    const handleResetDefaults = () => {
        setInvestmentReturns({ ...DEFAULT_EXPECTED_RETURNS });
    };

    const handleSaveExpectedReturns = async () => {
        if (hasInvalidExpectedReturn) return false;

        const expectedReturn = Object.fromEntries(
            Object.keys(DEFAULT_EXPECTED_RETURNS).map((key) => [key, Number(investmentReturns[key]).toFixed(1)])
        );

        setIsSavingReturns(true);
        try {
            await patch('/reviewRateReference/Update', { ...rateReference, expectedReturn });
            setRateReference((prev) => ({ ...prev, expectedReturn }));
            message.success('Expected returns updated successfully.');
            return true;
        } catch (error) {
            console.error('Error updating expected returns:', error);
            message.error('Failed to update expected returns. Please try again later.');
            return false;
        } finally {
            setIsSavingReturns(false);
        }
    };

    const handleSaveContributionCaps = async () => {
        try {
            const values = await superForm.validateFields();
            const nonConcessionalCapAmount = superForm.isFieldTouched(['bringForward', 'amount'])
                ? Number(values.bringForward.amount) / 3
                : Number(values.nonConcessional.amount);
            const contributionCaps = {
                ...ref.contributionCaps,
                concessionalCap: `$${Number(values.concessional.amount).toLocaleString('en-AU')}`,
                nonConcessionalCap: `$${nonConcessionalCapAmount.toLocaleString('en-AU', { maximumFractionDigits: 2 })}`,
            };
            const updatedRateReference = { ...ref, contributionCaps };

            setIsSavingContributionCaps(true);
            await patch('/reviewRateReference/Update', {
                ...rateReference,
                rateReference: updatedRateReference,
            });
            setRateReference((previous) => ({
                ...previous,
                rateReference: updatedRateReference,
            }));
            message.success('Contribution caps updated successfully.');
            return true;
        } catch (error) {
            if (error?.errorFields) return false;
            console.error('Error updating contribution caps:', error);
            message.error('Failed to update contribution caps. Please try again later.');
            return false;
        } finally {
            setIsSavingContributionCaps(false);
        }
    };

    useEffect(() => {
        const fetchRateReference = async () => {
            setIsLoading(true);
            try {
                const response = await get('/reviewRateReference');
                if (response && response.data) {
                    setRateReference(response.data);
                    setInvestmentReturns(getExpectedReturns(response.data.expectedReturn));
                }
            } catch (error) {
                console.error('Error fetching rate reference:', error);
                message.error('Failed to fetch rate reference. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRateReference();
    }, [get, setRateReference]);

    const centrelinkFullAgeRows = useMemo(
        () => [
            { key: 'single', formPath: 'single', rate: 'Single', fortnightly: singleFortnightlyNum, annual: singleFortnightlyNum * 26 },
            { key: 'each-couple', formPath: 'eachCouple', rate: 'Each in a couple', fortnightly: coupleEachFortnightlyNum, annual: coupleEachFortnightlyNum * 26 },
            { key: 'combined', formPath: 'combined', rate: 'Couple combined', fortnightly: coupleCombinedFortnightlyNum, annual: coupleCombinedFortnightlyNum * 26 },
        ],
        [singleFortnightlyNum, coupleEachFortnightlyNum, coupleCombinedFortnightlyNum]
    );

    const centrelinkAssetRows = useMemo(
        () => [
            {
                key: 'single',
                formPath: 'single',
                household: 'Single',
                homeownerLower: ref.assetsTestHomeowner?.client?.lower,
                homeownerUpper: ref.assetsTestHomeowner?.client?.upper,
                nonHomeownerLower: ref.assetsTestNonHomeowner?.client?.lower,
                nonHomeownerUpper: ref.assetsTestNonHomeowner?.client?.upper,
            },
            {
                key: 'couple-together',
                formPath: 'coupleTogether',
                household: 'A couple living together (combined)',
                homeownerLower: ref.assetsTestHomeowner?.partner?.lower,
                homeownerUpper: ref.assetsTestHomeowner?.partner?.upper,
                nonHomeownerLower: ref.assetsTestNonHomeowner?.partner?.lower,
                nonHomeownerUpper: ref.assetsTestNonHomeowner?.partner?.upper,
            },
            {
                key: 'couple-ill-health',
                formPath: 'coupleIllHealth',
                household: 'A couple living apart due to ill health (combined)',
                homeownerLower: ref.assetsTestHomeowner?.partner?.lower,
                homeownerUpper: ref.illnessSeparatedAssetCutOff?.homeownerUpper,
                nonHomeownerLower: ref.assetsTestNonHomeowner?.partner?.lower,
                nonHomeownerUpper: ref.illnessSeparatedAssetCutOff?.nonHomeownerUpper,
            },
        ],
        [ref]
    );

    const centrelinkIncomeRows = useMemo(
        () => [
            {
                key: 'single',
                formPath: 'single',
                situation: 'Single',
                fullPension: ref.incomeTestFreeAreas?.client,
                partPension: ref.incomeTestCutOffPoints?.client,
                reduction: 0.5,
            },
            {
                key: 'couple-together',
                formPath: 'coupleTogether',
                situation: 'A couple living together (combined)',
                fullPension: ref.incomeTestFreeAreas?.partner,
                partPension: ref.incomeTestCutOffPoints?.partner,
                reduction: 0.5,
            },
            {
                key: 'couple-ill-health',
                formPath: 'coupleIllHealth',
                situation: 'A couple living apart due to ill health (combined)',
                fullPension: ref.incomeTestFreeAreas?.partner,
                partPension: ref.incomeTestCutOffPoints?.illnessSeparatedCombined,
                reduction: 0.5,
            },
        ],
        [ref]
    );

    const centrelinkDeemingRows = useMemo(
        () => [
            { key: 'single', formPath: 'single', relationship: 'Single', threshold: ref.deemingRates?.clientThreshold, lowerRate: ref.deemingRates?.lowerRate, balanceRate: ref.deemingRates?.upperRate },
            { key: 'couple', formPath: 'couple', relationship: 'Couple', threshold: ref.deemingRates?.partnerThreshold, lowerRate: ref.deemingRates?.lowerRate, balanceRate: ref.deemingRates?.upperRate },
        ],
        [ref]
    );

    const assetTaperRows = useMemo(
        () => [
            {
                key: 'reduction-rate',
                formPath: 'assetsTaper',
                item: 'Reduction rate',
                description: 'per $1,000 over lower threshold',
                value: parseVal(ref.assetsTaper?.reductionRate),
            },
            {
                key: 'annual-equivalent',
                formPath: 'assetsTaperAnnual',
                item: 'Annual equivalent',
                value: parseVal(ref.assetsTaper?.reductionRate) * 26,
                isAnnual: true,
                editable: false,
            },
        ],
        [ref]
    );

    const centrelinkLihccRows = useMemo(
        () => [
            { key: 'single', formPath: 'single', rate: 'Single', perWeek: ref.lowIncomeHealthCareCard?.clientPerWeek, over8Weeks: ref.lowIncomeHealthCareCard?.clientPerWeek === null || ref.lowIncomeHealthCareCard?.clientPerWeek === undefined || ref.lowIncomeHealthCareCard.clientPerWeek === '' ? '' : parseVal(ref.lowIncomeHealthCareCard.clientPerWeek) * 8 },
            { key: 'couple-combined', formPath: 'coupleCombined', rate: 'Couple (combined)', perWeek: ref.lowIncomeHealthCareCard?.partnerCombinedPerWeek, over8Weeks: ref.lowIncomeHealthCareCard?.partnerCombinedPerWeek === null || ref.lowIncomeHealthCareCard?.partnerCombinedPerWeek === undefined || ref.lowIncomeHealthCareCard.partnerCombinedPerWeek === '' ? '' : parseVal(ref.lowIncomeHealthCareCard.partnerCombinedPerWeek) * 8 },
            { key: 'child', formPath: 'perChild', rate: '+ per dependent child', perWeek: ref.lowIncomeHealthCareCard?.perDependentChildPerWeek, over8Weeks: ref.lowIncomeHealthCareCard?.perDependentChildPerWeek === null || ref.lowIncomeHealthCareCard?.perDependentChildPerWeek === undefined || ref.lowIncomeHealthCareCard.perDependentChildPerWeek === '' ? '' : parseVal(ref.lowIncomeHealthCareCard.perDependentChildPerWeek) * 8 },
        ],
        [ref]
    );

    const investmentRows = useMemo(
        () => [
            { key: 'Cash', formPath: 'Cash', label: 'Cash', default: '3.00%', expectedReturn: investmentReturns.Cash },
            { key: 'Conservative', formPath: 'Conservative', label: 'Conservative', default: '3.80%', expectedReturn: investmentReturns.Conservative },
            { key: 'ModeratelyConservative', formPath: 'ModeratelyConservative', label: 'Moderately Conservative', default: '4.50%', expectedReturn: investmentReturns.ModeratelyConservative },
            { key: 'Balanced', formPath: 'Balanced', label: 'Balanced', default: '5.00%', expectedReturn: investmentReturns.Balanced },
            { key: 'Growth', formPath: 'Growth', label: 'Growth', default: '6.00%', expectedReturn: investmentReturns.Growth },
            { key: 'HighGrowth', formPath: 'HighGrowth', label: 'High Growth', default: '6.50%', expectedReturn: investmentReturns.HighGrowth },
        ],
        [investmentReturns]
    );

    const contributionCapRows = useMemo(
        () => [
            {
                key: 'concessional',
                formPath: 'concessional',
                label: 'Concessional cap',
                amount: parseVal(ref.contributionCaps?.concessionalCap),
                isAnnual: true,
            },
            {
                key: 'nonConcessional',
                formPath: 'nonConcessional',
                label: 'Non-concessional cap',
                amount: parseVal(ref.contributionCaps?.nonConcessionalCap),
                isAnnual: true,
            },
            {
                key: 'bringForward',
                formPath: 'bringForward',
                label: 'NCC bring-forward (3 yr)',
                amount: parseVal(ref.contributionCaps?.nonConcessionalCap) * 3,
            },
        ],
        [ref]
    );

    const contributionCapColumns = useMemo(
        () => [
            { title: 'Cap', dataIndex: 'label', key: 'label', width: 280, editable: false },
            {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                type: 'number',
                fieldProps: {
                    min: 0,
                    step: 500,
                    precision: 0,
                    formatter: (value) =>
                        value === null || value === undefined || value === ''
                            ? ''
                            : `$${Number(value).toLocaleString('en-AU')}`,
                    parser: (value) => value?.replace(/[$,\s]/g, '') ?? '',
                },
                rules: [{ required: true, message: 'Enter a contribution cap.' }],
                renderView: ({ value, record }) =>
                    `$${Number(value || 0).toLocaleString('en-AU')}${record.isAnnual ? ' p.a.' : ''}`,
                editable: (record) => record.editable !== false,
            },
        ],
        []
    );

    useEffect(() => {
        centrelinkForm.setFieldsValue({
            single: { fortnightly: singleFortnightlyNum, annual: singleFortnightlyNum * 26 },
            eachCouple: { fortnightly: coupleEachFortnightlyNum, annual: coupleEachFortnightlyNum * 26 },
            combined: { fortnightly: coupleCombinedFortnightlyNum, annual: coupleCombinedFortnightlyNum * 26 },
        });
    }, [centrelinkForm, singleFortnightlyNum, coupleEachFortnightlyNum, coupleCombinedFortnightlyNum]);

    useEffect(() => {
        superForm.setFieldsValue({
            concessional: { amount: contributionCapRows[0].amount },
            nonConcessional: { amount: contributionCapRows[1].amount },
            bringForward: { amount: contributionCapRows[2].amount },
        });
    }, [superForm, contributionCapRows]);

    useEffect(() => {
        investmentForm.setFieldsValue(
            Object.fromEntries(
                Object.keys(DEFAULT_EXPECTED_RETURNS).map((key) => [key, { expectedReturn: investmentReturns[key] ?? '' }])
            )
        );
    }, [investmentForm, investmentReturns]);

    const centrelinkFullAgeColumns = useMemo(
        () => [
            { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 180, editable: false },
            {
                title: 'Fortnightly',
                dataIndex: 'fortnightly',
                key: 'fortnightly',
                width: 170,
                type: 'number',
                fieldProps: {
                    min: 0,
                    step: 0.01,
                    precision: 2,
                    formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 2 })}`),
                    parser: (value) => value?.replace(/[$,\s]/g, '') ?? '',
                },
                renderView: ({ value }) => <span style={{ fontWeight: 600 }}>{moneyText(value)}</span>,
            },
            {
                title: 'Annual',
                dataIndex: 'annual',
                key: 'annual',
                width: 180,
                editable: false,
                renderView: ({ value }) => <span style={{ color: '#55636d', fontWeight: 500, }}>{annualValue(value)} p.a.</span>,
            },
        ],
        []
    );

    const assetColumns = useMemo(
        () => [
            { title: 'Household', dataIndex: 'household', key: 'household', width: 260, editable: false },
            { title: 'Lower', dataIndex: 'homeownerLower', key: 'homeownerLower', width: 120, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`), parser: (value) => value?.replace(/[$,\s]/g, '') ?? '' }, renderView: ({ value }) => <span>{value ? moneyText(value) : ''}</span> },
            { title: 'Upper', dataIndex: 'homeownerUpper', key: 'homeownerUpper', width: 120, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`), parser: (value) => value?.replace(/[$,\s]/g, '') ?? '' }, renderView: ({ value }) => <span>{value ? moneyText(value) : ''}</span> },
            { title: 'Lower', dataIndex: 'nonHomeownerLower', key: 'nonHomeownerLower', width: 120, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`), parser: (value) => value?.replace(/[$,\s]/g, '') ?? '' }, renderView: ({ value }) => <span>{value ? moneyText(value) : ''}</span> },
            { title: 'Upper', dataIndex: 'nonHomeownerUpper', key: 'nonHomeownerUpper', width: 120, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`), parser: (value) => value?.replace(/[$,\s]/g, '') ?? '' }, renderView: ({ value }) => <span>{value ? moneyText(value) : ''}</span> },
        ],
        []
    );

    const incomeColumns = useMemo(
        () => [
            { title: 'Situation', dataIndex: 'situation', key: 'situation', width: 220, editable: false },
            { title: 'Full pension', dataIndex: 'fullPension', key: 'fullPension', width: 200, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 2 })}`), parser: (value) => value?.replace(/[$,\s]/g, '') ?? '' }, renderView: ({ value }) => renderIncomeThreshold(value) },
            { title: 'Part pension', dataIndex: 'partPension', key: 'partPension', width: 200, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 2 })}`), parser: (value) => value?.replace(/[$,\s]/g, '') ?? '' }, renderView: ({ value }) => renderIncomeThreshold(value) },
            { title: 'Reduction', dataIndex: 'reduction', key: 'reduction', width: 120, type: 'number', fieldProps: { min: 0, step: 0.1, precision: 1 }, renderView: ({ value }) => <span>{value ?? 0}</span> },
        ],
        []
    );

    const deemingColumns = useMemo(
        () => [
            { title: 'Relationship', dataIndex: 'relationship', key: 'relationship', width: 200, editable: false },
            { title: 'Threshold', dataIndex: 'threshold', key: 'threshold', width: 150, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`), parser: (value) => value?.replace(/[$,\s]/g, '') ?? '' }, renderView: ({ value }) => <span>{value ? moneyText(value) : ''}</span> },
            { title: 'Lower rate', dataIndex: 'lowerRate', key: 'lowerRate', width: 150, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 2 })}%`), parser: (value) => value?.replace(/[%\s]/g, '') ?? '' }, renderView: ({ value }) => <span>{value ? `${value}` : ''}</span> },
            { title: 'Balance rate', dataIndex: 'balanceRate', key: 'balanceRate', width: 150, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 2 })}%`), parser: (value) => value?.replace(/[%\s]/g, '') ?? '' }, renderView: ({ value }) => <span>{value ? `${value}` : ''}</span> },
        ],
        []
    );

    const assetTaperColumns = useMemo(
        () => [
            {
                title: 'Item',
                dataIndex: 'item',
                key: 'item',
                width: 280,
                editable: false,
                renderView: ({ record }) => (
                    <span>
                        {record.item}
                        {record.description ? (
                            <span style={{ display: 'block', marginTop: 2, color: '#8a97a0', fontSize: 11.5 }}>
                                {record.description}
                            </span>
                        ) : null}
                    </span>
                ),
            },
            {
                title: 'Value',
                dataIndex: 'value',
                key: 'value',
                type: 'number',
                fieldProps: {
                    min: 0,
                    step: 0.5,
                    precision: 2,
                    formatter: (value) =>
                        value === null || value === undefined || value === ''
                            ? ''
                            : `$${Number(value).toFixed(2)}`,
                    parser: (value) => value?.replace(/[$,\s]/g, '') ?? '',
                },
                editable: (record) => record.editable !== false,
                renderView: ({ value, record }) =>
                    record.isAnnual
                        ? `$${Number(value || 0).toLocaleString('en-AU')} p.a.`
                        : `$${Number(value || 0).toFixed(2)} / fn`,
            },
        ],
        []
    );

    const lihccColumns = useMemo(
        () => [
            { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 220, editable: false },
            { title: 'Per week', dataIndex: 'perWeek', key: 'perWeek', width: 150, type: 'number', fieldProps: { formatter: (value) => (value === null || value === undefined || value === '' ? '' : `$${Number(value).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`), parser: (value) => value?.replace(/[$,\s]/g, '') ?? '' }, renderView: ({ value }) => <span>{value ? moneyText(value) : ''}</span> },
            { title: 'Over 8 wks', dataIndex: 'over8Weeks', key: 'over8Weeks', width: 180, editable: false, renderView: ({ value }) => <span style={{ color: '#55636d', fontWeight: 500, }}>{value ? `$${Number(value).toLocaleString('en-AU')} / 8 wk` : ''}</span> },
        ],
        []
    );

    const investmentColumns = useMemo(
        () => [
            { title: 'Risk profile', dataIndex: 'label', key: 'label', width: 220, editable: false },
            { title: 'Default', dataIndex: 'default', key: 'default', width: 120, editable: false },
            {
                title: 'Expected return p.a.',
                dataIndex: 'expectedReturn',
                key: 'expectedReturn',
                width: 180,
                type: 'number',
                fieldProps: {
                    min: 0,
                    max: 100,
                    step: 0.1,
                    precision: 1,
                    formatter: (value) => (value === null || value === undefined || value === '' ? '' : `${value}%`),
                    parser: (value) => value?.replace('%', '') ?? '',
                },
                onChange: (nextValue, record) => handleReturnChange(record.key, nextValue),
            },
        ],
        [handleReturnChange]
    );

    const renderTabHeader = (title, count, badgeText, shouldSearch = true) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '16px 20px 14px', borderBottom: '1px solid #eef1f2' }}>
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#3f8f3f' }}>
                {title} <span style={{ color: '#8a97a0', fontWeight: 500, letterSpacing: 0, textTransform: 'none', fontSize: 13, marginLeft: 4 }}>· {count} reference{count === 1 ? '' : 's'}</span>
            </h2>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {badgeText ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#3f8f3f', background: '#eef7ee', border: '1px solid #cfe7cf', padding: '7px 12px', borderRadius: 999 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5cb85c' }} />
                        {badgeText}
                    </span>
                ) : null}
                {/* {shouldSearch ? (
                    <div style={{ position: 'relative' }}>
                        <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a97a0' }} />
                        <Input
                            placeholder="Search…"
                            value={searchQueries[activeTab]}
                            onChange={(e) => setSearchQueries((prev) => ({ ...prev, [activeTab]: e.target.value }))}
                            style={{ width: 220, borderRadius: 9, paddingLeft: 34 }}
                        />
                    </div>
                ) : null} */}
            </div>
        </div>
    );

    const matchedCentrelinkSections = useMemo(() => {
        const query = searchQueries.centrelink.toLowerCase().trim();
        const sections = [
            { key: 'fullAgePension', title: 'Full Age Pension', subtitle: 'per fortnight', columns: centrelinkFullAgeColumns, data: centrelinkFullAgeRows },
            { key: 'assetTest', title: 'Asset Test Thresholds', subtitle: 'lower / upper by household', columns: assetColumns, data: centrelinkAssetRows },
            { key: 'incomeTest', title: 'Income Test', subtitle: 'per fortnight', columns: incomeColumns, data: centrelinkIncomeRows },
            { key: 'deeming', title: 'Deeming Rates', subtitle: '', columns: deemingColumns, data: centrelinkDeemingRows },
            { key: 'assetsTaper', title: 'Assets Taper', subtitle: '', columns: assetTaperColumns, data: assetTaperRows },
            { key: 'lihc', title: 'Low Income Health Care Card', subtitle: '8-week income test', columns: lihccColumns, data: centrelinkLihccRows },
        ];

        if (!query) return sections;
        return sections.filter((section) => `${section.title} ${section.subtitle}`.toLowerCase().includes(query));
    }, [searchQueries.centrelink, centrelinkForm, isEditing, centrelinkFullAgeColumns, centrelinkFullAgeRows, assetColumns, centrelinkAssetRows, incomeColumns, centrelinkIncomeRows, deemingColumns, centrelinkDeemingRows, assetTaperColumns, assetTaperRows, lihccColumns, centrelinkLihccRows]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Loading Rate Reference..." />
            </div>
        );
    }


    const handleSubmit = async () => {
        const saved = activeTab === 'super'
            ? await handleSaveContributionCaps()
            : await handleSaveExpectedReturns();
        if (saved) setIsEditing(false);
    };

    return (
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 16px 64px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1f2a33' }}>
            <style>{`
                .rate-ref-page .ant-table-thead > tr > th {
                    background: #5cb85c !important;
                    color: #fff !important;
                    border-right: 1px solid rgba(255,255,255,.25) !important;
                    font-size: 10.5px !important;
                    font-weight: 700 !important;
                    letter-spacing: .07em !important;
                    text-transform: uppercase !important;
                    padding: 10px 14px !important;
                }
                .rate-ref-page .ant-table-tbody > tr > td {
                    padding: 10px 14px !important;
                    border-top: 1px solid #eef1f2 !important;
                    vertical-align: middle !important;
                }
                .rate-ref-page .ant-table-tbody > tr:hover > td {
                    background: #fafcfb !important;
                }
                .rate-ref-page .ant-table {
                    border-collapse: collapse !important;
                }
                .rate-ref-panel {
                    background: #fff;
                }
                .rate-ref-section {
                    margin-top: 20px;
                }
                .rate-ref-section:first-child { margin-top: 18px; }
                .rate-ref-section h3 {
                    margin: 0 0 10px;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    color: #1f2a33;
                }
                .rate-ref-section h3 span {
                    color: #8a97a0;
                    font-weight: 500;
                    font-size: 12px;
                    margin-left: 8px;
                }
                .rate-ref-table-shell {
                    border: 1px solid #e4e8ea;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .rate-ref-header-title {
                    color: #4da24d;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: .18em;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                }
                .rate-ref-title {
                    font-family: Georgia, 'Times New Roman', serif;
                    font-size: 34px;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                    margin: 0 0 8px;
                    color: #1b2730;
                }
                .rate-ref-subtitle {
                    color: #55636d;
                    font-size: 14.5px;
                    margin: 0;
                    max-width: 640px;
                }
                .rate-ref-nav {
                    background: #fff;
                    border: 1px solid #e4e8ea;
                    border-radius: 14px;
                    box-shadow: 0 1px 2px rgba(16,24,32,.05);
                    padding: 10px;
                    display: flex;
                    gap: 6px;
                    margin: 22px 0;
                }
                .rate-ref-nav-item {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 16px 10px 14px;
                    border-radius: 11px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    text-align: center;
                    transition: all .15s ease;
                }
                .rate-ref-nav-item.active {
                    background: #eef7ee;
                    border-color: #cfe7cf;
                }
                .rate-ref-nav-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    background: #eff2f3;
                    color: #9aa6ae;
                    font-size: 18px;
                }
                .rate-ref-nav-item.active .rate-ref-nav-icon {
                    background: #5cb85c;
                    color: #fff;
                    box-shadow: 0 3px 10px rgba(76,161,76,.35);
                }
                .rate-ref-nav-label {
                    font-size: 13.5px;
                    font-weight: 600;
                    color: #55636d;
                }
                .rate-ref-nav-item.active .rate-ref-nav-label { color: #3f8f3f; }
                .rate-ref-nav-count {
                    background: #eef1f3;
                    color: #8a97a0;
                    border-radius: 999px;
                    font-size: 11.5px;
                    font-weight: 700;
                    padding: 2px 11px;
                    min-width: 24px;
                    text-align: center;
                }
                .rate-ref-nav-item.active .rate-ref-nav-count { background: #5cb85c; color: #fff; }
            `}</style>

            <div className="rate-ref-page">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
                    <div>
                        <div className="rate-ref-header-title">Admin</div>
                        <h1 className="rate-ref-title">Rate Reference</h1>
                        <p className="rate-ref-subtitle">Government and Centrelink rates used across the calculators. Turn on <strong>Edit rates</strong> to override any value — overrides are saved on this device.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', width: "50%" }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#55636d', whiteSpace: 'nowrap' }}>Financial year</span>
                            <div style={{ position: 'relative', display: 'inline-flex' }}>
                                <Select
                                    value={financialYear}
                                    onChange={(e) => {
                                        setFinancialYear(e.target.value);
                                        try {
                                            localStorage.setItem('rateRefFY', e.target.value);
                                        } catch {
                                            // no-op
                                        }
                                    }}
                                    style={{}}
                                >
                                    {fyOptions.map((fy) => <option key={fy} value={fy}>{fy}</option>)}
                                </Select>
                            </div>
                        </div>
                        {isEditing &&
                            <Button icon={<ReloadOutlined />} onClick={handleResetDefaults} style={{ height: 38, borderRadius: 9, fontWeight: 600, borderColor: '#e3e7ea' }}>Reset to defaults</Button>
                        }
                        <Button
                            icon={!isEditing && <EditOutlined />}
                            onClick={() => (isEditing ? handleSubmit() : setIsEditing(true))}
                            type={isEditing ? 'primary' : 'default'}
                            loading={isEditing && (activeTab === 'super' ? isSavingContributionCaps : isSavingReturns)}
                            disabled={isEditing && activeTab !== 'super' && hasInvalidExpectedReturn}
                            style={{ height: 38, borderRadius: 9, fontWeight: 600 }}
                        >
                            {isEditing ? 'Submit' : 'Edit rates'}
                        </Button>
                    </div>
                </div>

                <div className="rate-ref-nav">
                    {[
                        { key: 'centrelink', label: 'Centrelink', count: 6, icon: <BankOutlined /> },
                        { key: 'tax', label: 'Tax', count: 2, icon: <FaPercent /> },
                        { key: 'super', label: 'Super', count: 1, icon: <GoDatabase /> },
                        { key: 'investment', label: 'Investment', count: 1, icon: <FaArrowTrendUp /> },
                    ].map((tab) => (
                        <div key={tab.key} className={`rate-ref-nav-item ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                            <div className="rate-ref-nav-icon">{tab.icon}</div>
                            <div className="rate-ref-nav-label">{tab.label}</div>
                            <div className="rate-ref-nav-count">{tab.count}</div>
                        </div>
                    ))}
                </div>

                {activeTab === 'centrelink' && (
                    <div className="rate-ref-panel">
                        {renderTabHeader('Centrelink', 6, `${financialYear} financial year`)}
                        <Form form={centrelinkForm} component={false}>
                            <div style={{ padding: '6px 20px 20px' }}>
                                {matchedCentrelinkSections.map((section) => (
                                    <RateReferenceSection key={section.key} title={section.title} subtitle={section.subtitle}>
                                        <RateReferenceEditableTable
                                            editing={isEditing}
                                            columns={section.columns}
                                            data={section.data}
                                        />
                                    </RateReferenceSection>
                                ))}
                            </div>
                        </Form>
                    </div>
                )}

                {activeTab === 'tax' && (
                    <div className="rate-ref-panel">
                        {renderTabHeader('Tax', 2, '2024/25 brackets', false)}
                        <div style={{ padding: '6px 20px 20px' }}>
                            <div className="rate-ref-section">
                                <h3>Income Tax Brackets <span>resident individuals · 2024–25</span></h3>
                                <div className="rate-ref-table-shell">
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#5cb85c', color: '#fff' }}>
                                                <th style={{ textAlign: 'left', padding: '10px 14px', letterSpacing: '.07em', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Taxable income</th>
                                                <th style={{ textAlign: 'right', padding: '10px 14px', letterSpacing: '.07em', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Tax on this income</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {brackets.map((bracket, index) => (
                                                <tr key={index}>
                                                    <td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', fontWeight: 500 }}>{bracket.min} – {bracket.max}</td>
                                                    <td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', textAlign: 'right', color: '#55636d', fontWeight: 500 }}>
                                                        {index === 0 ? 'Nil (tax-free threshold)' : `${Number(bracket.rate) * 100}% of excess over ${bracket.min}`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="rate-ref-section">
                                <h3>Offsets &amp; Levies</h3>
                                <div className="rate-ref-table-shell">
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#5cb85c', color: '#fff' }}>
                                                <th style={{ textAlign: 'left', padding: '10px 14px', letterSpacing: '.07em', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Item</th>
                                                <th style={{ textAlign: 'right', padding: '10px 14px', letterSpacing: '.07em', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Detail</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', fontWeight: 500 }}>Medicare levy</td><td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', textAlign: 'right', color: '#55636d', fontWeight: 500 }}>Exempt &lt; {medicare.exemptBelow || ''} · phase-in to {medicare.fullRateAbove || ''} · {Number(medicare.fullRate || 0.02) * 100}% above</td></tr>
                                            <tr><td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', fontWeight: 500 }}>Low income tax offset (LITO)</td><td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', textAlign: 'right', color: '#55636d', fontWeight: 500 }}>Max {lito.maxOffset || ''} &lt; {lito.fullAtOrBelow || ''} · nil at {lito.phasesOutAt || ''}</td></tr>
                                            <tr><td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', fontWeight: 500 }}>SAPTO — single</td><td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', textAlign: 'right', color: '#55636d', fontWeight: 500 }}>Max {saptoS.maxOffset || ''} &lt; {saptoS.fullBelow || ''} · nil at {saptoS.nilAbove || ''}</td></tr>
                                            <tr><td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', fontWeight: 500 }}>SAPTO — couple (each)</td><td style={{ padding: '10px 14px', borderTop: '1px solid #eef1f2', textAlign: 'right', color: '#55636d', fontWeight: 500 }}>Max {saptoC.maxOffset || ''} &lt; {saptoC.fullBelow || ''} · nil at {saptoC.nilAbove || ''} each</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'super' && (
                    <div className="rate-ref-panel">
                        {renderTabHeader('Super', 1, `${financialYear} financial year`, false)}
                        <div style={{ padding: '6px 20px 20px' }}>
                            <Form form={superForm} component={false}>
                                <RateReferenceSection
                                    title="Contribution Caps"
                                    subtitle="annual, per member"
                                >
                                    <RateReferenceEditableTable
                                        editing={isEditing}
                                        columns={contributionCapColumns}
                                        data={contributionCapRows}
                                    />
                                </RateReferenceSection>
                            </Form>
                        </div>
                    </div>
                )}

                {activeTab === 'investment' && (
                    <div className="rate-ref-panel">
                        {renderTabHeader('Investment', 1, '', false)}
                        <div style={{ padding: '6px 20px 20px' }}>
                            <RateReferenceSection
                                title="Investment Returns by Risk Profile"
                                subtitle="expected p.a. after fees"
                                footer={
                                    <>
                                        <p style={{ marginTop: 14, color: '#8a97a0', fontSize: 12 }}>
                                            Used as the default return assumptions across projections. Edit a value to override, or <strong>Reset to defaults</strong> to restore.
                                        </p>
                                        {/* <div style={{ marginTop: 12 }}>
                                            {!hasExpectedReturnChanges ? (
                                                <Button icon={<ReloadOutlined />} onClick={handleResetDefaults} style={{ fontSize: 12, borderRadius: 6, color: '#475569' }}>Reset to defaults</Button>
                                            ) : (
                                                <Button type="primary" loading={isSavingReturns} disabled={hasInvalidExpectedReturn} onClick={handleSaveExpectedReturns} style={{ background: '#5cb85c', borderColor: '#5cb85c' }}>Submit</Button>
                                            )}
                                        </div> */}
                                    </>
                                }
                            >
                                <Form form={investmentForm} component={false}>
                                    <RateReferenceEditableTable
                                        editing={isEditing}
                                        columns={investmentColumns}
                                        data={investmentRows}
                                        rowPathKey="formPath"
                                    />
                                </Form>
                            </RateReferenceSection>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RateReference;