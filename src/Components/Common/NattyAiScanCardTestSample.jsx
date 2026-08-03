import React, { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Card, Button, Typography, Alert, Col, Avatar } from "antd";
import nattyAvatar from "../../assets/image/ProfileImages/NattyAI.png";

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const { Title } = Typography;

const collapseSpaces = (s) => (s || "").replace(/\s+/g, " ").trim();

function extractCurrency(text) {
    if (!text) return "";
    const match = text.match(/\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})|\$\d+/);
    if (!match) return "";
    const cleanNum = match[0].replace(/[^0-9.]/g, "");
    const numeric = parseFloat(cleanNum);
    return Number.isFinite(numeric)
        ? `$${numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : match[0];
}

function parseDateToISO(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.match(/(\d{1,2})\s*([A-Za-z]+|\d{1,2})[\s\/\-\.]*(\d{2,4})/);
    if (!parts) return "";

    let [, day, month, year] = parts;
    if (year.length === 2) year = `20${year}`;

    const pad = (n) => String(n).padStart(2, "0");

    if (isNaN(month)) {
        const monthIndex = new Date(Date.parse(`${month} 1, 2000`)).getMonth() + 1;
        if (!isNaN(monthIndex)) month = pad(monthIndex);
    } else {
        month = pad(month);
    }

    return `${year}-${month}-${pad(day)}T07:00:00.000Z`;
}

async function extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let lastY = null;
        let line = "";

        content.items.forEach((item) => {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
                fullText += line.trim() + "\n";
                line = "";
            }
            line += item.str + " ";
            lastY = item.transform[5];
        });
        fullText += line.trim() + "\n";
    }
    return fullText;
}

export function parseSuperStatement(pdfText) {
    const normalizedText = pdfText.replace(/\x00/g, "").replace(/\uFB01/g, "fi").replace(/\uFB02/g, "fl");

    const extractedData = {
        platformName: "",
        memberNumber: "",
        balanceBenefit: "",
        balanceBenefitDetails: {
            fundType: "Accumulation",
            portfolioArray: [],
            portfolioValueArray: [],
            portfolioValue: "",
            commencementDate: "",
            eligibleServiceDate: "",
            taxFreeComponent: "",
            taxableComponent: "",
            preservedAmount: "",
            restrictedNonPreserved: "",
            unrestrictedNonPreserved: "",
        },
        groupInsurance: "No",
        groupInsuranceDetails: {
            lifeCover: "",
            TPDCover: "",
            coverType: "Unitised",
            cost: "",
            monthlyIncome: "",
            waitingPeriod: null,
            BenefitPeriod: "",
            coverType2: "",
            cost2: "",
        },
        contributions: "No",
        contributionsArray: [],
        contributionsStartYear: null,
        nominatedBeneficiaries: "No",
        nominatedBeneficiariesDetails: {
            nominatedBeneficiariesArray: [],
            nominationType: "",
            NumberOfMap: 0,
        },
        annualAdvice: "",
        annualAdviceArray: {
            serviceFee: "",
            frequency: "",
            annualAdviserServiceFee: "",
        },
    };

    // Platform & Member Number
    const platformMatch = normalizedText.match(/(FirstChoice\s+Personal\s+Super|AustralianSuper|REST\s+Super|Cbus|Hostplus|Aware\s*Super|HESTA|Colonial\s*First\s*State|CFS\s*Edge|HUB24|Expand\s+Essential|IOOF)/i);
    if (platformMatch) extractedData.platformName = platformMatch[1];

    const memberMatch = normalizedText.match(/(?:Account\s*number|Member\s*number|Policy\s*number)[:\s|]+([a-z0-9\s\-]{4,20})/i);
    if (memberMatch) extractedData.memberNumber = collapseSpaces(memberMatch[1]);

    // Balance & Benefit
    const balanceMatch = normalizedText.match(/(?:Your\s*balance\s*as\s*at|Total\s*account\s*balance|Current\s*estimated\s*balance|Total\s*Benefit\s*Value|Closing\s*balance)[^\$\n]*\n?[\s|]*\$?([\d,]+\.?\d*)/i);
    if (balanceMatch) {
        const balVal = extractCurrency(balanceMatch[0]);
        extractedData.balanceBenefit = balVal;
        extractedData.balanceBenefitDetails.portfolioValue = balVal;
    }

    // Reset arrays before parsing
    extractedData.balanceBenefitDetails.portfolioArray = [];
    extractedData.balanceBenefitDetails.portfolioValueArray = [];

    // Split text into individual lines to prevent cross-line regex swallowing
    const lines = normalizedText.split('\n');

    // Line Regex Match Groups:
    // 1: Option Name
    // 2: Option Code / APIR Code (Optional - flexible 2-4 chars + 7-9 chars)
    // 3: Units
    // 4: Unit Price
    // 5: Total Value
    // 6: Allocation % (Optional)
    const lineInvestmentRegex = /^([A-Za-z0-9\s&\-\/\.\(\)]+?)\s+(?:([\w\d]{2,4}\s+[\w\d]{7,9})\s+)?([\d,]+\.\d{4})\s+\$?([\d,]+\.\d{4})\s+\$?([\d,]+\.\d{2})(?:\s+([\d\.]+%))?$/i;

    lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const match = trimmedLine.match(lineInvestmentRegex);

        if (match) {
            const optionName = collapseSpaces(match[1]);
            const optionCode = match[2] ? collapseSpaces(match[2]) : "";
            const units = match[3];
            const unitPrice = `$${match[4]}`;
            const value = `$${match[5]}`;
            const allocation = match[6] || "";

            // Filter out headers, footers, or subtotal lines
            if (
                optionName &&
                !/Account valuation|Your account valuation|Investments|Option code|APIR code|Total/i.test(optionName)
            ) {
                const item = {
                    key: `${optionName}-${units}`, // Unique key
                    investmentOption: optionName,
                    investmentCode: optionCode,
                    units: units,
                    investmentValue: unitPrice,
                    value: value,
                    allocation: allocation
                };

                extractedData.balanceBenefitDetails.portfolioArray.push(item);
                extractedData.balanceBenefitDetails.portfolioValueArray.push(item);
            }
        }
    });

    // Tax Components
    const taxFreeMatch = normalizedText.match(/(?:Tax\s*Free|Tax[- ]?free\s*component)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (taxFreeMatch) extractedData.balanceBenefitDetails.taxFreeComponent = extractCurrency(taxFreeMatch[0]);

    const taxableMatch = normalizedText.match(/(?:Taxable|Taxable\s*component)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (taxableMatch) extractedData.balanceBenefitDetails.taxableComponent = extractCurrency(taxableMatch[0]);

    // Preserved Components
    const preservedMatch = normalizedText.match(/(?:Preserved\s*amount|Preserved)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (preservedMatch) extractedData.balanceBenefitDetails.preservedAmount = extractCurrency(preservedMatch[0]);

    const restrictedMatch = normalizedText.match(/(?:Restricted\s*non[- ]?preserved)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (restrictedMatch) extractedData.balanceBenefitDetails.restrictedNonPreserved = extractCurrency(restrictedMatch[0]);

    const unrestrictedMatch = normalizedText.match(/(?:Unrestricted\s*non[- ]?preserved)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (unrestrictedMatch) extractedData.balanceBenefitDetails.unrestrictedNonPreserved = extractCurrency(unrestrictedMatch[0]);

    // Dates
    const commDateMatch = normalizedText.match(/(?:Commencement\s*date|Date\s*joined\s*fund|Account\s*start\s*date)[:\s|]*(\d{1,2}[\s\/\-\.][A-Za-z0-9]+[\s\/\-\.]\d{2,4})/i);
    if (commDateMatch) extractedData.balanceBenefitDetails.commencementDate = parseDateToISO(commDateMatch[1]);

    const eligibleDateMatch = normalizedText.match(/(?:Eligible\s*Service\s*Date|ETP\s*eligible\s*service\s*date)[:\s|]*(\d{1,2}[\s\/\-\.][A-Za-z0-9]+[\s\/\-\.]\d{2,4})/i);
    if (eligibleDateMatch) extractedData.balanceBenefitDetails.eligibleServiceDate = parseDateToISO(eligibleDateMatch[1]);

    // Fund Type
    if (/Pension|TTR|TRIS/i.test(normalizedText)) {
        extractedData.balanceBenefitDetails.fundType = "Pension";
    } else if (/Accumulation|Super|FirstChoice\s+Personal\s+Super/i.test(normalizedText)) {
        extractedData.balanceBenefitDetails.fundType = "Accumulation";
    }

    return extractedData;
}

export default function NattyAiScanCardTestSample({
    title = "Natty AI - Scan Super Fund Statement(s)",
    subtitle = "Drag & drop super fund PDFs here, or click Scan PDF(s). Auto-fills fund, member number, and balance.",
    onScanComplete,
    avatarSrc = nattyAvatar,
}) {
    const pdfInputRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState({ show: false, type: "info", message: "" });

    const processFile = async (file) => {
        if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
            setStatus({ show: true, type: "warning", message: "Please select a valid PDF document." });
            return;
        }

        setIsScanning(true);
        setStatus({ show: false, type: "info", message: "" });

        try {
            const pdfText = await extractPdfText(file);
            const parsedData = parseSuperStatement(pdfText);

            setStatus({ show: true, type: "success", message: `Successfully extracted data from ${file.name}` });

            if (typeof onScanComplete === "function") {
                onScanComplete(parsedData);
            }
        } catch (err) {
            console.error("[NattyAiScanCardTestSample] Extraction Error:", err);
            setStatus({ show: true, type: "error", message: err?.message || "Failed to parse PDF statement." });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <Col xs={24} md={24} style={{ padding: "0 0 16px 0" }}>
            {status.show && (
                <Alert
                    type={status.type}
                    message={status.message}
                    showIcon
                    closable
                    onClose={() => setStatus({ show: false, type: "info", message: "" })}
                    style={{ marginBottom: 12 }}
                />
            )}

            <Card
                style={{
                    borderRadius: 14,
                    background: "linear-gradient(135deg, rgb(15, 28, 58), rgb(26, 46, 94))",
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.18)",
                    color: "#fff",
                }}
            >
                <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => {
                        if (e.target.files?.[0]) processFile(e.target.files[0]);
                        e.target.value = "";
                    }}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar src={avatarSrc} alt="Natty AI" size={44} style={{ background: "#fff", border: "2px solid #3b82f6" }} />
                        <div>
                            <Title level={5} style={{ margin: 0, color: "#fff" }}>{title}</Title>
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255, 255, 255, 0.65)" }}>{subtitle}</p>
                        </div>
                    </div>

                    <Button
                        type="primary"
                        loading={isScanning}
                        onClick={() => pdfInputRef.current?.click()}
                        style={{
                            height: 36,
                            borderRadius: 8,
                            fontWeight: 700,
                            background: "#3b82f6",
                            borderColor: "#3b82f6",
                        }}
                    >
                        {isScanning ? "Scanning PDF..." : "Scan PDF(s)"}
                    </Button>
                </div>
            </Card>
        </Col>
    );
}