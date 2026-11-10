import React, { useEffect, useState } from 'react';
import { Card, Button, InputNumber, Space, message, Spin } from 'antd';
import {
    EditOutlined,
    ReloadOutlined,
    BookOutlined,
    CalculatorOutlined,
    RiseOutlined
} from '@ant-design/icons';
import useApi from '../../../../hooks/useApi';
import AppModal from '../../../Common/AppModal';
import useTitleBlock from '../../../../hooks/useTitleBlock';
import RateReferenceEditForm from './RateReferenceEditForm/RateReferenceEditForm';
import { RateReferenceObject } from '../../../../store/authState';
import { useAtom } from 'jotai';
import TaxRates from './TaxRates/TaxRates';

const DEFAULT_EXPECTED_RETURNS = {
    Cash: '3.0',
    Conservative: '3.8',
    ModeratelyConservative: '4.5',
    Balanced: '5.0',
    Growth: '6.0',
    HighGrowth: '6.5'
};

const getExpectedReturns = (expectedReturn = {}) =>
    Object.fromEntries(
        Object.entries(DEFAULT_EXPECTED_RETURNS).map(([key, defaultValue]) => [
            key,
            expectedReturn[key] ?? defaultValue
        ])
    );

const RateReference = () => {

    let [rateReference, setRateReference] = useAtom(RateReferenceObject);
    let [isLoading, setIsLoading] = useState(false);
    let [modalOpen, setModalOpen] = useState(false);
    let [modalData, setModalData] = useState({});
    let { get, patch } = useApi();
    const initialExpectedReturns = getExpectedReturns(rateReference?.expectedReturn);
    const [investmentReturns, setInvestmentReturns] = useState(initialExpectedReturns);
    const [isSavingReturns, setIsSavingReturns] = useState(false);

    // Extract dynamic data references safely
    const ref = rateReference?.rateReference || {};
    const tax = rateReference?.taxRatesSchema || {};
    const brackets = tax.incomeTaxBrackets || [];
    const medicare = tax.medicareLevy || {};
    const lito = tax.lowIncomeTaxOffset || {};
    const saptoS = tax.saptoSingle || {};
    const saptoC = tax.saptoCouple || {};

    const parseVal = (val) => parseFloat(String(val || '').replace(/[^0-9.-]+/g, "")) || 0;

    // Computed Pension Values
    const singleBasis = parseVal(ref.fullPensionComponents?.basisPayment?.client);
    const singlePharm = parseVal(ref.fullPensionComponents?.pharmaceuticalBenefit?.client);
    const singleClean = parseVal(ref.fullPensionComponents?.cleanEnergySupplement?.client);
    const singleFortnightlyNum = singleBasis + singlePharm + singleClean;

    const coupleEachBasis = parseVal(ref.fullPensionComponents?.basisPayment?.partner);
    const coupleEachPharm = parseVal(ref.fullPensionComponents?.pharmaceuticalBenefit?.partner);
    const coupleEachClean = parseVal(ref.fullPensionComponents?.cleanEnergySupplement?.partner);
    const coupleEachFortnightlyNum = coupleEachBasis + coupleEachPharm + coupleEachClean;
    const coupleCombinedFortnightlyNum = coupleEachFortnightlyNum * 2;

    const renderTitleBlock = useTitleBlock({
        titleStyle: { fontFamily: 'Georgia, serif' },
    });

    const handleReturnChange = (key, value) => {
        setInvestmentReturns((prev) => ({
            ...prev,
            [key]: value === null || value === undefined ? '' : String(value)
        }));
    };

    const hasInvalidExpectedReturn = Object.keys(DEFAULT_EXPECTED_RETURNS).some(
        (key) => investmentReturns[key] === '' || !Number.isFinite(Number(investmentReturns[key]))
    );
    const hasExpectedReturnChanges = Object.keys(DEFAULT_EXPECTED_RETURNS).some(
        (key) =>
            investmentReturns[key] === '' ||
            Number(investmentReturns[key]) !== Number(initialExpectedReturns[key])
    );

    const handleResetDefaults = () => {
        setInvestmentReturns({ ...DEFAULT_EXPECTED_RETURNS });
    };

    const handleSaveExpectedReturns = async () => {
        if (hasInvalidExpectedReturn) return;
        const expectedReturn = Object.fromEntries(
            Object.keys(DEFAULT_EXPECTED_RETURNS).map((key) => [
                key,
                Number(investmentReturns[key]).toFixed(1)
            ])
        );
        setIsSavingReturns(true);
        try {
            await patch(`/reviewRateReference/Update`, {
                ...rateReference,
                expectedReturn
            });
            setRateReference((prev) => ({
                ...prev,
                expectedReturn
            }));
            message.success('Expected returns updated successfully.');
        } catch (error) {
            console.error('Error updating expected returns:', error);
            message.error('Failed to update expected returns. Please try again later.');
        } finally {
            setIsSavingReturns(false);
        }
    };

    useEffect(() => {
        const fetchInvestmentReturns = async () => {
            setIsLoading(true);
            try {
                const response = await get(`/reviewRateReference`);
                if (response && response.data) {
                    setRateReference(response.data);
                    setInvestmentReturns(getExpectedReturns(response.data.expectedReturn));
                }
            } catch (error) {
                console.error('Error fetching investment returns:', error);
                message.error('Failed to fetch investment returns. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvestmentReturns();
    }, [get, setRateReference]);

    const RateReferenceSave = async (updateValues) => {
        try {
            const response = await patch(`/reviewRateReference/Update`, {
                ...rateReference,
                rateReference: {
                    ...updateValues
                }
            });
            if (response && response.data) {
                setRateReference(prev => ({
                    ...prev,
                    rateReference: {
                        ...updateValues
                    }
                }));
                setModalOpen(false);
            }
        } catch (error) {
            console.error('Error patching rate reference:', error);
            message.error('Failed to update rate reference. Please try again later.');
        }
    };

    const TaxRateSave = async (updateValues) => {
        try {
            const response = await patch(`/reviewRateReference/Update`, {
                ...rateReference,
                taxRatesSchema: {
                    ...updateValues
                }
            });
            if (response && response.data) {
                setRateReference(prev => ({
                    ...prev,
                    taxRatesSchema: {
                        ...updateValues
                    }
                }));
                setModalOpen(false);
            }
        } catch (error) {
            console.error('Error patching rate reference:', error);
            message.error('Failed to update rate reference. Please try again later. ');
        }
    };

    const handleEditRates = (key) => {
        setModalOpen(true);
        setModalData({
            title: "Edit Rate Reference",
            Key: key
        });
    }

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Loading Rate Reference..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

            <AppModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                width={'50vw'}
                title={renderTitleBlock({
                    title: 'Edit Age Pension Rates & Thresholds',
                    icon: '⚙️',
                })}
            >
                {modalData.Key === "RateReference" && (
                    <RateReferenceEditForm
                        initialValue={rateReference?.rateReference || {}}
                        onClose={() => setModalOpen(false)}
                        onSave={RateReferenceSave}
                    />
                )}
                {modalData.Key === "TaxRates" && (
                    <TaxRates
                        initialValue={rateReference?.taxRatesSchema || {}}
                        onClose={() => setModalOpen(false)}
                        onSave={TaxRateSave}
                    />
                )}
            </AppModal>

            {/* ── TOP HEADER SUBTITLE ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                    📋 2025/26 Rate Reference
                </span>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                    Government and Centrelink rates used across the calculators — edit any value to override
                </span>
            </div>

            {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 2025/26 RATE REFERENCE
         ───────────────────────────────────────────────────────────── */}
            <Card
                style={{ borderRadius: 12, marginBottom: 24, borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                bodyStyle={{ padding: '20px 24px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        📋
                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase' }}>
                            2025/26 Rate Reference
                        </span>
                    </div>
                    <Button onClick={() => handleEditRates("RateReference")} icon={<EditOutlined />} size="small" style={{ fontSize: 12, borderRadius: 6, color: '#475569' }}>
                        Edit Rates
                    </Button>
                </div>

                {/* --- FULL AGE PENSION --- */}
                <SectionHeader title="FULL AGE PENSION (PER FORTNIGHT)" />
                <RowItem 
                    label="Single" 
                    rightContent={
                        <GreenHighlight 
                            fortnightly={`$${singleFortnightlyNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                            annual={`$${Math.round(singleFortnightlyNum * 26).toLocaleString()} p.a.`} 
                        />
                    } 
                />
                <RowItem 
                    label="Each of Couple" 
                    rightContent={
                        <GreenHighlight 
                            fortnightly={`$${coupleEachFortnightlyNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                            annual={`$${Math.round(coupleEachFortnightlyNum * 26).toLocaleString()} p.a.`} 
                        />
                    } 
                />
                <RowItem 
                    label="Couple Combined" 
                    rightContent={
                        <GreenHighlight 
                            fortnightly={`$${coupleCombinedFortnightlyNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                            annual={`$${Math.round(coupleCombinedFortnightlyNum * 26).toLocaleString()} p.a.`} 
                        />
                    } 
                />

                {/* --- ASSETS TEST THRESHOLDS (HOMEOWNER) --- */}
                <SectionHeader title="ASSETS TEST THRESHOLDS (HOMEOWNER)" />
                <RowItem label="Single — Lower / Upper" value={`${ref.assetsTestHomeowner?.client?.lower || ''} / ${ref.assetsTestHomeowner?.client?.upper || ''}`} />
                <RowItem label="Couple — Lower / Upper" value={`${ref.assetsTestHomeowner?.partner?.lower || ''} / ${ref.assetsTestHomeowner?.partner?.upper || ''}`} />

                {/* --- ASSETS TEST THRESHOLDS (NON-HOMEOWNER) --- */}
                <SectionHeader title="ASSETS TEST THRESHOLDS (NON-HOMEOWNER)" />
                <RowItem label="Single — Lower / Upper" value={`${ref.assetsTestNonHomeowner?.client?.lower || ''} / ${ref.assetsTestNonHomeowner?.client?.upper || ''}`} />
                <RowItem label="Couple — Lower / Upper" value={`${ref.assetsTestNonHomeowner?.partner?.lower || ''} / ${ref.assetsTestNonHomeowner?.partner?.upper || ''}`} />

                {/* --- ILLNESS-SEPARATED COUPLE --- */}
                <SectionHeader title="ILLNESS-SEPARATED COUPLE — ASSETS TEST" />
                <RowItem label="Payment rate" value="Single rate — each partner" />
                <RowItem label="Free area (homeowner / non-homeowner)" value={`${ref.assetsTestHomeowner?.partner?.lower || ''} / ${ref.assetsTestNonHomeowner?.partner?.lower || ''}`} />
                <RowItem label="Cut-off (homeowner / non-homeowner)" value={`${ref.illnessSeparatedAssetCutOff?.homeownerUpper || ''} / ${ref.illnessSeparatedAssetCutOff?.nonHomeownerUpper || ''}`} />

                {/* --- INCOME TEST FREE AREAS --- */}
                <SectionHeader title="INCOME TEST FREE AREAS (PER FORTNIGHT)" />
                <RowItem label="Single" value={`${ref.incomeTestFreeAreas?.client || ''} / fn ($${(parseVal(ref.incomeTestFreeAreas?.client) * 26).toLocaleString()} p.a.)`} />
                <RowItem label="Couple (combined)" value={`${ref.incomeTestFreeAreas?.partner || ''} / fn ($${(parseVal(ref.incomeTestFreeAreas?.partner) * 26).toLocaleString()} p.a.)`} />

                {/* --- INCOME TEST CUT-OFF POINT --- */}
                <SectionHeader title="INCOME TEST — FORTNIGHTLY CUT-OFF POINT (PENSION REDUCES TO $0)" />
                <RowItem label="Single" value={`${ref.incomeTestCutOffPoints?.client || ''} / fn ($${(parseVal(ref.incomeTestCutOffPoints?.client) * 26).toLocaleString()} p.a.)`} />
                <RowItem label="A couple living together (combined)" value={`${ref.incomeTestCutOffPoints?.partner || ''} / fn ($${(parseVal(ref.incomeTestCutOffPoints?.partner) * 26).toLocaleString()} p.a.)`} />
                <RowItem label="A couple living apart due to ill health (combined)" value={`${ref.incomeTestCutOffPoints?.illnessSeparatedCombined || ''} / fn ($${(parseVal(ref.incomeTestCutOffPoints?.illnessSeparatedCombined) * 26).toLocaleString()} p.a.)`} />

                {/* --- DEEMING RATES --- */}
                <SectionHeader title="DEEMING RATES" />
                <RowItem label={`Lower rate (first ${ref.deemingRates?.clientThreshold || ''} single / ${ref.deemingRates?.partnerThreshold || ''} couple)`} value={ref.deemingRates?.lowerRate || ''} />
                <RowItem label="Balance rate (above threshold)" value={ref.deemingRates?.upperRate || ''} />

                {/* --- ASSETS TAPER --- */}
                <SectionHeader title="ASSETS TAPER" />
                <RowItem label="Reduction rate" value={`${ref.assetsTaper?.reductionRate || ''}.00 / fn per $1,000 over lower ($${(parseVal(ref.assetsTaper?.reductionRate) * 26).toLocaleString()} p.a.)`} />

                {/* --- LOW-INCOME HEALTH CARE CARD --- */}
                <SectionHeader title="💳 LOW-INCOME HEALTH CARE CARD (8-WEEK INCOME TEST)" color="#0284c7" />
                <RowItem label="Single (per week)" value={`${ref.lowIncomeHealthCareCard?.clientPerWeek || ''} / wk ($${(parseVal(ref.lowIncomeHealthCareCard?.clientPerWeek) * 8).toLocaleString()} over 8wk)`} />
                <RowItem label="Couple combined (per week)" value={`${ref.lowIncomeHealthCareCard?.partnerCombinedPerWeek || ''} / wk ($${(parseVal(ref.lowIncomeHealthCareCard?.partnerCombinedPerWeek) * 8).toLocaleString()} over 8wk)`} />
                <RowItem label="+ per dependent child" value={`${ref.lowIncomeHealthCareCard?.perDependentChildPerWeek || ''} / wk ($${(parseVal(ref.lowIncomeHealthCareCard?.perDependentChildPerWeek) * 8).toLocaleString()} over 8wk)`} />

                {/* --- CONTRIBUTION CAPS --- */}
                <SectionHeader title="💼 CONTRIBUTION CAPS (ANNUAL, PER MEMBER)" color="#475569" />
                <RowItem label="Concessional cap" value={`${ref.contributionCaps?.concessionalCap || ''} p.a.`} />
                <RowItem label="Non-concessional cap" value={`${ref.contributionCaps?.nonConcessionalCap || ''} p.a.`} />
                <RowItem label="NCC bring-forward (3 yr)" value={`$${(parseVal(ref.contributionCaps?.nonConcessionalCap) * 3).toLocaleString()}`} />
            </Card>

            {/* ─────────────────────────────────────────────────────────────
          SECTION 2: TAX RATES (RESIDENT INDIVIDUALS)
         ───────────────────────────────────────────────────────────── */}
            <Card
                style={{ borderRadius: 12, marginBottom: 24, borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                bodyStyle={{ padding: '20px 24px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalculatorOutlined style={{ fontSize: 16, color: '#b45309' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase' }}>
                            Tax Rates (Resident Individuals)
                        </span>
                    </div>
                    <Button onClick={() => handleEditRates("TaxRates")} icon={<EditOutlined />} size="small" style={{ fontSize: 12, borderRadius: 6, color: '#475569' }}>
                        Edit Rates
                    </Button>
                </div>

                {/* --- INCOME TAX BRACKETS --- */}
                <SectionHeader title="INCOME TAX BRACKETS (2024–25)" />
                {brackets[0] && <RowItem label={`${brackets[0].min} – ${brackets[0].max}`} value="Tax-free threshold" />}
                {brackets[1] && <RowItem label={`${brackets[1].min} – ${brackets[1].max}`} value={`${Number(brackets[1].rate) * 100}% of excess over ${brackets[1].min}`} />}
                {brackets[2] && <RowItem label={`${brackets[2].min} – ${brackets[2].max}`} value={`${Number(brackets[2].rate) * 100}% of excess over ${brackets[2].min} + $${brackets[2].baseTax} base`} />}
                {brackets[3] && <RowItem label={`${brackets[3].min} – ${brackets[3].max}`} value={`${Number(brackets[3].rate) * 100}% of excess over ${brackets[3].min} + $${brackets[3].baseTax} base`} />}
                {brackets[4] && <RowItem label={`${brackets[4].min} – ${brackets[4].max === '$0' ? 'above' : brackets[4].max}`} value={`${Number(brackets[4].rate) * 100}% of excess over ${brackets[4].min} + $${brackets[4].baseTax} base`} />}

                {/* --- MEDICARE LEVY --- */}
                <SectionHeader title="MEDICARE LEVY" />
                <RowItem label="All taxpayers" value={`Exempt ≤ ${medicare.exemptBelow || ''} · Shade-in to ${medicare.fullRateAbove || ''} · ${(Number(medicare.fullRate || 0.02) * 100)}% above`} />

                {/* --- LITO --- */}
                <SectionHeader title="LOW INCOME TAX OFFSET (LITO)" />
                <RowItem label="All taxpayers" value={`Max ${lito.maxOffset || ''} ≤ ${lito.fullAtOrBelow || ''} · ${(Number(lito.band1Taper || 0.05) * 100)}%/$1 to ${lito.band1EndsAt || ''} · ${(Number(lito.band2Taper || 0.015) * 100)}%/$1 to nil at ${lito.phasesOutAt || ''}`} />

                {/* --- SAPTO --- */}
                <SectionHeader title="SAPTO (SENIOR AUSTRALIANS & PENSIONERS TAX OFFSET)" />
                <RowItem label="Single" value={`Max ${saptoS.maxOffset || ''} ≤ ${saptoS.fullBelow || ''}, nil ≥ ${saptoS.nilAbove || ''}`} />
                <RowItem label="Couple (each)" value={`Max ${saptoC.maxOffset || ''} ≤ ${saptoC.fullBelow || ''}, nil ≥ ${saptoC.nilAbove || ''} (each)`} />
            </Card>

            {/* ─────────────────────────────────────────────────────────────
          SECTION 3: INVESTMENT RETURNS BY RISK PROFILE
         ───────────────────────────────────────────────────────────── */}
            <Card
                style={{ borderRadius: 12, marginBottom: 16, borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                bodyStyle={{ padding: '20px 24px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RiseOutlined style={{ fontSize: 16, color: '#2563eb' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase' }}>
                            Investment Returns by Risk Profile
                        </span>
                    </div>
                    {hasExpectedReturnChanges == false ?
                        (<Button
                            icon={<ReloadOutlined />}
                            onClick={handleResetDefaults}
                            style={{ fontSize: 12, borderRadius: 6, color: '#475569' }}
                        >
                            Reset to defaults
                        </Button>)
                        :
                        (
                            <Button
                                type="primary"
                                loading={isSavingReturns}
                                disabled={hasInvalidExpectedReturn}
                                onClick={handleSaveExpectedReturns}
                            >
                                Submit
                            </Button>
                        )}
                </div>

                <SectionHeader title="EXPECTED RETURN P.A. (AFTER FEES, USED ACROSS PROJECTIONS)" />

                <EditableRow
                    label="Cash"
                    defaultValue="Default 3.00%"
                    value={investmentReturns.Cash}
                    onChange={(val) => handleReturnChange('Cash', val)}
                />
                <EditableRow
                    label="Conservative"
                    defaultValue="Default 3.80%"
                    value={investmentReturns.Conservative}
                    onChange={(val) => handleReturnChange('Conservative', val)}
                />
                <EditableRow
                    label="Moderately Conservative"
                    defaultValue="Default 4.50%"
                    value={investmentReturns.ModeratelyConservative}
                    onChange={(val) => handleReturnChange('ModeratelyConservative', val)}
                />
                <EditableRow
                    label="Balanced"
                    defaultValue="Default 5.00%"
                    value={investmentReturns.Balanced}
                    onChange={(val) => handleReturnChange('Balanced', val)}
                />
                <EditableRow
                    label="Growth"
                    defaultValue="Default 6.00%"
                    value={investmentReturns.Growth}
                    onChange={(val) => handleReturnChange('Growth', val)}
                />
                <EditableRow
                    label="High Growth"
                    defaultValue="Default 6.50%"
                    value={investmentReturns.HighGrowth}
                    onChange={(val) => handleReturnChange('HighGrowth', val)}
                />

                <div style={{ marginTop: 20, fontSize: 11, color: '#94a3b8' }}>
                    Values are used as the default investment return wherever a risk profile drives a projection. Submit changes to save them; use <strong>Reset to defaults</strong> to restore the defaults.
                </div>
            </Card>

        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
    HELPER SUB-COMPONENTS
   ───────────────────────────────────────────────────────────── */

const SectionHeader = ({ title, color = '#64748b' }) => (
    <div style={{
        backgroundColor: '#f8fafc',
        padding: '6px 12px',
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: color
    }}>
        {title}
    </div>
);

const RowItem = ({ label, value, rightContent }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '7px 12px',
        fontSize: 13,
        color: '#334155',
    }}>
        <span>{label}</span>
        {rightContent ? rightContent : <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>}
    </div>
);

const GreenHighlight = ({ fortnightly, annual }) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <span style={{ color: '#16a34a', fontWeight: 600 }}>{fortnightly}</span>
        <span style={{ color: '#475569', fontSize: 12, minWidth: 70, textAlign: 'right' }}>{annual}</span>
    </div>
);

const EditableRow = ({ label, defaultValue, value, onChange }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        fontSize: 13,
        color: '#334155'
    }}>
        <span>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', width: "50%", justifyContent: "space-between", }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{defaultValue}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    value={value}
                    onChange={onChange}
                    precision={1}
                    formatter={(inputValue) => inputValue === null || inputValue === undefined || inputValue === '' ? '' : `${inputValue}%`}
                    parser={(inputValue) => inputValue?.replace('%', '') ?? ''}
                    style={{ width: 75, borderRadius: 6, textAlign: 'right' }}
                />
            </div>
        </div>
    </div>
);

export default RateReference;