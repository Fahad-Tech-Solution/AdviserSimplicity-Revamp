import React, { useState } from 'react';
import { Card, Button, InputNumber, Space } from 'antd';
import {
    EditOutlined,
    ReloadOutlined,
    BookOutlined,
    CalculatorOutlined,
    RiseOutlined
} from '@ant-design/icons';

const RateReference = () => {
    // Initial state for Investment Returns so they can be edited and reset
    const defaultInvestmentReturns = {
        cash: 3.0,
        conservative: 3.8,
        moderatelyConservative: 4.5,
        balanced: 5.0,
        growth: 6.0,
        highGrowth: 6.5
    };

    const [investmentReturns, setInvestmentReturns] = useState(defaultInvestmentReturns);

    const handleReturnChange = (key, value) => {
        setInvestmentReturns((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleResetDefaults = () => {
        setInvestmentReturns(defaultInvestmentReturns);
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

            {/* ── TOP HEADER SUBTITLE ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 13, color: '#334155' }}>
                    2025/26 Rate Reference
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
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOutlined style={{ fontSize: 16, color: '#475569' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase' }}>
                            2025/26 Rate Reference
                        </span>
                    </div>
                    <Button icon={<EditOutlined />} size="small" style={{ fontSize: 12, borderRadius: 6, color: '#475569' }}>
                        Edit Rates
                    </Button>
                </div>

                {/* --- FULL AGE PENSION --- */}
                <SectionHeader title="FULL AGE PENSION (PER FORTNIGHT)" />
                <RowItem label="Single" rightContent={<GreenHighlight fortnightly="$1,200.90" annual="$31,223 p.a." />} />
                <RowItem label="Each of Couple" rightContent={<GreenHighlight fortnightly="$905.20" annual="$23,535 p.a." />} />
                <RowItem label="Couple Combined" rightContent={<GreenHighlight fortnightly="$1,810.40" annual="$47,070 p.a." />} />

                {/* --- ASSETS TEST THRESHOLDS (HOMEOWNER) --- */}
                <SectionHeader title="ASSETS TEST THRESHOLDS (HOMEOWNER)" />
                <RowItem label="Single — Lower / Upper" value="$333,000 / $733,500" />
                <RowItem label="Couple — Lower / Upper" value="$499,000 / $1,102,500" />

                {/* --- ASSETS TEST THRESHOLDS (NON-HOMEOWNER) --- */}
                <SectionHeader title="ASSETS TEST THRESHOLDS (NON-HOMEOWNER)" />
                <RowItem label="Single — Lower / Upper" value="$600,000 / $1,000,500" />
                <RowItem label="Couple — Lower / Upper" value="$766,000 / $1,369,500" />

                {/* --- ILLNESS-SEPARATED COUPLE --- */}
                <SectionHeader title="ILLNESS-SEPARATED COUPLE — ASSETS TEST" />
                <RowItem label="Payment rate" value="Single rate — each partner" />
                <RowItem label="Free area (homeowner / non-homeowner)" value="$499,000 / $766,000" />
                <RowItem label="Cut-off (homeowner / non-homeowner)" value="$1,300,000 / $1,567,000" />

                {/* --- INCOME TEST FREE AREAS --- */}
                <SectionHeader title="INCOME TEST FREE AREAS (PER FORTNIGHT)" />
                <RowItem label="Single" value="$226 / fn ($5,876 p.a.)" />
                <RowItem label="Couple (combined)" value="$396 / fn ($10,296 p.a.)" />

                {/* --- INCOME TEST CUT-OFF POINT --- */}
                <SectionHeader title="INCOME TEST — FORTNIGHTLY CUT-OFF POINT (PENSION REDUCES TO $0)" />
                <RowItem label="Single" value="$2,627.80 / fn ($68,323 p.a.)" />
                <RowItem label="A couple living together (combined)" value="$4,016.80 / fn ($104,437 p.a.)" />
                <RowItem label="A couple living apart due to ill health (combined)" value="$5,199.60 / fn ($135,190 p.a.)" />

                {/* --- DEEMING RATES --- */}
                <SectionHeader title="DEEMING RATES" />
                <RowItem label="Lower rate (first $66,800 single / $110,600 couple)" value="1.25%" />
                <RowItem label="Balance rate (above threshold)" value="3.25%" />

                {/* --- ASSETS TAPER --- */}
                <SectionHeader title="ASSETS TAPER" />
                <RowItem label="Reduction rate" value="$3.00 / fn per $1,000 over lower ($78 p.a.)" />

                {/* --- LOW-INCOME HEALTH CARE CARD --- */}
                <SectionHeader title="💳 LOW-INCOME HEALTH CARE CARD (8-WEEK INCOME TEST)" color="#0284c7" />
                <RowItem label="Single (per week)" value="$811 / wk ($6,488 over 8wk)" />
                <RowItem label="Couple combined (per week)" value="$1,385 / wk ($11,080 over 8wk)" />
                <RowItem label="+ per dependent child" value="$43 / wk ($344 over 8wk)" />

                {/* --- CONTRIBUTION CAPS --- */}
                <SectionHeader title="💼 CONTRIBUTION CAPS (ANNUAL, PER MEMBER)" color="#475569" />
                <RowItem label="Concessional cap" value="$32,500 p.a." />
                <RowItem label="Non-concessional cap" value="$130,000 p.a." />
                <RowItem label="NCC bring-forward (3 yr)" value="$390,000" />
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
                    <Button icon={<EditOutlined />} size="small" style={{ fontSize: 12, borderRadius: 6, color: '#475569' }}>
                        Edit Rates
                    </Button>
                </div>

                {/* --- INCOME TAX BRACKETS --- */}
                <SectionHeader title="INCOME TAX BRACKETS (2024–25)" />
                <RowItem label="$0 – $18,200" value="Tax-free threshold" />
                <RowItem label="$18,201 – $45,000" value="16% of excess over $18,200" />
                <RowItem label="$45,001 – $135,000" value="30% of excess over $45,000 + $4,288 base" />
                <RowItem label="$135,001 – $190,000" value="37% of excess over $135,000 + $31,288 base" />
                <RowItem label="$190,001 – $0" value="45% of excess over $190,000 + $51,638 base" />

                {/* --- MEDICARE LEVY --- */}
                <SectionHeader title="MEDICARE LEVY" />
                <RowItem label="All taxpayers" value="Exempt ≤ $23,365 · Shade-in to $29,206 · 2% above" />

                {/* --- LITO --- */}
                <SectionHeader title="LOW INCOME TAX OFFSET (LITO)" />
                <RowItem label="All taxpayers" value="Max $700 ≤ $37,500 · 5%/ $1 to $45,000 · 1.5%/ $1 to nil at $66,667" />

                {/* --- SAPTO --- */}
                <SectionHeader title="SAPTO (SENIOR AUSTRALIANS & PENSIONERS TAX OFFSET)" />
                <RowItem label="Single" value="Max $2,230 ≤ $32,279, nil ≥ $50,119" />
                <RowItem label="Couple (each)" value="Max $1,602 ≤ $28,974, nil ≥ $41,790 (each)" />
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
                    <Button
                        icon={<ReloadOutlined />}
                        size="small"
                        onClick={handleResetDefaults}
                        style={{ fontSize: 12, borderRadius: 6, color: '#475569' }}
                    >
                        Reset to defaults
                    </Button>
                </div>

                <SectionHeader title="EXPECTED RETURN P.A. (AFTER FEES, USED ACROSS PROJECTIONS)" />

                <EditableRow
                    label="Cash"
                    defaultValue="Default 3.00%"
                    value={investmentReturns.cash}
                    onChange={(val) => handleReturnChange('cash', val)}
                />
                <EditableRow
                    label="Conservative"
                    defaultValue="Default 3.80%"
                    value={investmentReturns.conservative}
                    onChange={(val) => handleReturnChange('conservative', val)}
                />
                <EditableRow
                    label="Moderately Conservative"
                    defaultValue="Default 4.50%"
                    value={investmentReturns.moderatelyConservative}
                    onChange={(val) => handleReturnChange('moderatelyConservative', val)}
                />
                <EditableRow
                    label="Balanced"
                    defaultValue="Default 5.00%"
                    value={investmentReturns.balanced}
                    onChange={(val) => handleReturnChange('balanced', val)}
                />
                <EditableRow
                    label="Growth"
                    defaultValue="Default 6.00%"
                    value={investmentReturns.growth}
                    onChange={(val) => handleReturnChange('growth', val)}
                />
                <EditableRow
                    label="High Growth"
                    defaultValue="Default 6.50%"
                    value={investmentReturns.highGrowth}
                    onChange={(val) => handleReturnChange('highGrowth', val)}
                />

                <div style={{ marginTop: 20, fontSize: 11, color: '#94a3b8' }}>
                    Values are saved automatically and used as the default investment return wherever a risk profile drives a projection. Edit any cell to override; click <strong>Reset to defaults</strong> to revert.
                </div>
            </Card>

        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
    HELPER SUB-COMPONENTS
   ───────────────────────────────────────────────────────────── */

// Section Sub-header
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

// Standard Key-Value Row
const RowItem = ({ label, value, rightContent }) => (
    <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: '7px 12px',
        fontSize: 13,
        color: '#334155'
    }}>
        <span>{label}</span>
        {rightContent ? rightContent : <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>}
    </div>
);

// Green Highlight for Age Pension
const GreenHighlight = ({ fortnightly, annual }) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <span style={{ color: '#16a34a', fontWeight: 600 }}>{fortnightly}</span>
        <span style={{ color: '#475569', fontSize: 12, minWidth: 70, textAlign: 'right' }}>{annual}</span>
    </div>
);

// Editable Input Row for Investment Returns
const EditableRow = ({ label, defaultValue, value, onChange }) => (
    <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        fontSize: 13,
        color: '#334155'
    }}>
        <span>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{defaultValue}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    value={value}
                    onChange={onChange}
                    precision={2}
                    style={{ width: 75, borderRadius: 6, textAlign: 'right' }}
                />
                <span style={{ fontSize: 12, color: '#64748b' }}>%</span>
            </div>
        </div>
    </div>
);

export default RateReference;