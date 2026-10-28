import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, Avatar, Button, Space, Typography, Badge, Modal, Select, Slider, Switch, message } from 'antd';
import { useAtomValue } from 'jotai';
import {
    CommentOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    SoundOutlined,
    MailOutlined,
    CopyOutlined,
    SettingOutlined,
    AudioOutlined,
    AudioMutedOutlined,
    SyncOutlined,
    LeftOutlined,
    RightOutlined,
    CloseOutlined
} from '@ant-design/icons';
import nattyAvatar from "../../../../../../../../assets/image/ProfileImages/NattyAI.png";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Document, Packer, Paragraph as DocxParagraph, TextRun, Table, TableRow, TableCell,
    WidthType, ShadingType, HeadingLevel, AlignmentType, Footer, PageNumber,
} from 'docx';
import { saveAs } from 'file-saver';
import { RateReferenceObject, SelectedClient, SelectedReviewAllData } from '../../../../../../../../store/authState.js';
import { buildReviewSummaryData, formatMoney } from './reviewSummaryDocuments.js';


const { Text, Paragraph } = Typography;

const VCI_QUEUE = [
    { id: 'clientName', label: 'Client Name', question: 'What is the Primary Client’s full name?', icon: '👤' },
    { id: 'clientDob', label: 'Client Date of Birth', question: 'What is the Primary Client’s Date of Birth?', icon: '📅' },
    { id: 'partnerName', label: 'Partner Name', question: 'What is the Partner’s full name?', icon: '👥' },
    { id: 'partnerDob', label: 'Partner Date of Birth', question: 'What is the Partner’s Date of Birth?', icon: '📅' },
    { id: 'householdIncome', label: 'Household Income', question: 'What is the combined annual household income?', icon: '💰' }
];

const ReviewNattyAiSummary = () => {
    const selectedReviewAllData = useAtomValue(SelectedReviewAllData);
    const selectedClient = useAtomValue(SelectedClient);
    const rateReferenceObject = useAtomValue(RateReferenceObject);
    const summary = useMemo(
        () => buildReviewSummaryData(
            selectedReviewAllData,
            selectedClient,
            rateReferenceObject?.taxRatesSchema,
        ),
        [selectedReviewAllData, selectedClient, rateReferenceObject],
    );

    // Navigation & Content States
    const [activeTab, setActiveTab] = useState('review-summary');

    // Speech Synth & Recognition States
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [speechSpeed, setSpeechSpeed] = useState(0.85);
    const [autoSpeak, setAutoSpeak] = useState(true);

    // Guided Voice Setup (VCI) States
    const [isVciOpen, setIsVciOpen] = useState(false);
    const [vciIndex, setVciIndex] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [appliedLogs, setAppliedLogs] = useState([]);

    // Settings Modal State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const recognitionRef = useRef(null);

    const summaryNarrative = useMemo(() => {
        const lines = [
            `Annual review summary for ${summary.householdName}, prepared ${summary.date}.`,
            ...summary.highlights.map(({ label, value }) => `${label}: ${value}.`),
            ...summary.nextSteps.map((step, index) => `Next step ${index + 1}: ${step}`),
        ];
        return lines.join(' ');
    }, [summary]);

    // 1. Initialize Speech Synthesis Voices
    useEffect(() => {
        const updateVoices = () => {
            if ('speechSynthesis' in window) {
                const available = window.speechSynthesis.getVoices();
                setVoices(available);
                if (available.length > 0 && !selectedVoice) {
                    setSelectedVoice(available[0].name);
                }
            }
        };

        updateVoices();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }, [selectedVoice]);

    // Clean up speech on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            recognitionRef.current?.stop();
        };
    }, []);

    // 2. Speech Synthesis Handlers
    const speakText = (text, onEndCallback = null) => {
        if (!('speechSynthesis' in window)) {
            message.error('Text-to-speech is not supported in this browser.');
            return;
        }
        window.speechSynthesis.cancel(); // Reset active speech

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
        utterance.rate = parseFloat(speechSpeed);

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEndCallback) onEndCallback();
        };
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    // 3. Speech Recognition Handlers
    const startSpeechRecognition = (onResultCallback) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            message.error('Speech recognition is not supported in this browser.');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);
            if (onResultCallback) {
                onResultCallback(currentTranscript, event.results[event.results.length - 1].isFinal);
            }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopSpeechRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // 4. Guided Setup Flow Logic
    const startVciSetup = () => {
        setIsVciOpen(true);
        setVciIndex(0);
        setAppliedLogs([]);
        askVciQuestion(0);
    };

    const askVciQuestion = (index) => {
        const item = VCI_QUEUE[index];
        if (!item) return;

        setTranscript('🎤 Listening for your answer…');
        speakText(item.question, () => {
            startSpeechRecognition((userSpeech, isFinal) => {
                if (isFinal && userSpeech.trim()) {
                    handleVciAnswer(userSpeech.trim(), index);
                }
            });
        });
    };

    const handleVciAnswer = (speechText, currentIndex) => {
        const lowerText = speechText.toLowerCase();

        // Voice Command Triggers
        if (lowerText.includes('stop') || lowerText.includes('done') || lowerText.includes('cancel')) {
            stopVciSetup();
            return;
        }
        if (lowerText.includes('skip')) {
            handleVciNext(currentIndex);
            return;
        }
        if (lowerText.includes('previous') || lowerText.includes('back')) {
            handleVciPrev(currentIndex);
            return;
        }
        if (lowerText.includes('repeat')) {
            askVciQuestion(currentIndex);
            return;
        }

        const currentItem = VCI_QUEUE[currentIndex];
        setAppliedLogs(prev => [...prev, `${currentItem.label}: "${speechText}"`]);
        handleVciNext(currentIndex);
    };

    const handleVciNext = (currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < VCI_QUEUE.length) {
            setVciIndex(nextIndex);
            askVciQuestion(nextIndex);
        } else {
            stopVciSetup();
            message.success('Voice guided setup completed!');
        }
    };

    const handleVciPrev = (currentIndex) => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setVciIndex(prevIndex);
            askVciQuestion(prevIndex);
        }
    };

    const stopVciSetup = () => {
        stopSpeechRecognition();
        stopSpeaking();
        setIsVciOpen(false);
    };

    // 5. Speak Current Summary Content
    const handleSpeakSummary = () => {
        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        speakText(summaryNarrative);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryNarrative)
            .then(() => message.success('Summary copied to clipboard!'))
            .catch((error) => {
                console.error('Unable to copy review summary', error);
                message.error('Unable to copy the summary. Check clipboard permissions and try again.');
            });
    };

    const generatePdf = () => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const primaryColor = [5, 28, 100];      // Midnight Blue (#051C64)
            const secondaryColor = [37, 99, 235];   // Blue (#2563eb)
            const greenColor = [22, 101, 52];       // Dark Green (#166534)
            const redColor = [185, 28, 28];         // Shortfall red
            const lightBg = [248, 250, 252];        // Light Gray/Blue
            const cardBg = [239, 246, 255];         // Light Blue Tint (#eff6ff)
            const borderCol = [191, 219, 254];      // Soft Blue Border (#bfdbfe)
            const hairline = [226, 232, 240];       // Neutral hairline / card border
            const mutedText = [100, 116, 139];      // Slate muted
            const textDark = [30, 41, 59];          // Slate Dark

            const MARGIN = 14;
            const CONTENT_W = 182;
            const PAGE_BOTTOM = 268;                // keep clear of the footer

            // ── 1. CURVED HEADER BANNER WITH SMOOTH CANVAS GRADIENT (unchanged) ──
            const bannerX = 14;
            const bannerY = 12;
            const bannerWidth = 182;
            const bannerHeight = 28;
            const radius = 4;

            const canvas = document.createElement('canvas');
            const scale = 4;
            canvas.width = bannerWidth * scale;
            canvas.height = bannerHeight * scale;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#051C64');
                gradient.addColorStop(1, '#166534');
                ctx.fillStyle = gradient;

                ctx.beginPath();
                ctx.roundRect(0, 0, canvas.width, canvas.height, radius * scale);
                ctx.fill();

                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', bannerX, bannerY, bannerWidth, bannerHeight);
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('Your Annual Review Summary', bannerX + 6, bannerY + 11);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(226, 232, 240);
            doc.text(`Prepared for ${summary.householdName}`, bannerX + 6, bannerY + 19);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(255, 255, 255);
            doc.text(summary.date || '23 October 2026', bannerX + bannerWidth - 6, bannerY + 11, { align: 'right' });
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(203, 213, 225);
            doc.text('Denaro Wealth', bannerX + bannerWidth - 6, bannerY + 18, { align: 'right' });

            let currentY = bannerY + bannerHeight + 12;

            // ── Helpers ──────────────────────────────────────────────
            const ensureSpace = (needed) => {
                if (currentY + needed > PAGE_BOTTOM) {
                    doc.addPage();
                    currentY = 20;
                }
            };

            // Soft card: faint offset "shadow" + hairline border + rounded corners
            const drawCard = (x, y, w, h, opts = {}) => {
                const { fill = [255, 255, 255], border = hairline, r = 2.5, shadow = true } = opts;
                if (shadow) {
                    doc.setFillColor(241, 245, 249);
                    doc.roundedRect(x + 0.2, y + 0.5, w, h, r, r, 'F');
                }
                doc.setFillColor(...fill);
                doc.setDrawColor(...border);
                doc.setLineWidth(0.25);
                doc.roundedRect(x, y, w, h, r, r, 'FD');
            };

            // Rounded progress bar (track + fill)
            const drawProgress = (x, y, w, pct, color) => {
                const h = 1.8;
                doc.setFillColor(226, 232, 240);
                doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
                const fillW = Math.max(h, w * Math.min(Math.max(pct, 0), 1));
                if (pct > 0) {
                    doc.setFillColor(...color);
                    doc.roundedRect(x, y, fillW, h, h / 2, h / 2, 'F');
                }
            };

            // Vector status icon (standard PDF fonts can't render the ✓ glyph)
            const drawStatusIcon = (cx, cy, ok) => {
                const color = ok ? greenColor : redColor;
                doc.setFillColor(...color);
                doc.circle(cx, cy, 1.6, 'F');
                doc.setDrawColor(255, 255, 255);
                doc.setLineWidth(0.35);
                doc.setLineCap('round');
                doc.setLineJoin('round');
                if (ok) {
                    doc.line(cx - 0.75, cy + 0.05, cx - 0.2, cy + 0.65);
                    doc.line(cx - 0.2, cy + 0.65, cx + 0.8, cy - 0.6);
                } else {
                    doc.line(cx, cy - 0.85, cx, cy + 0.25);
                    doc.line(cx, cy + 0.85, cx, cy + 0.86);
                }
                doc.setLineCap('butt');
            };

            // Section header: green accent bar + title + light hairline with short green accent
            const addSectionHeader = (titleText) => {
                ensureSpace(16);
                doc.setFillColor(...greenColor);
                doc.roundedRect(MARGIN, currentY - 4, 1.2, 5, 0.6, 0.6, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.setTextColor(...primaryColor);
                doc.text(titleText.toUpperCase(), MARGIN + 4, currentY);

                doc.setDrawColor(...hairline);
                doc.setLineWidth(0.3);
                doc.line(MARGIN, currentY + 3, MARGIN + CONTENT_W, currentY + 3);

                doc.setDrawColor(...greenColor);
                doc.setLineWidth(0.6);
                doc.setLineCap('round');
                doc.line(MARGIN, currentY + 3, MARGIN + 22, currentY + 3);
                doc.setLineCap('butt');

                currentY += 10;
            };

            const clamp01 = (n) => Math.min(Math.max(n, 0), 1);
            const coveragePct = (existing, required, gap) => {
                if (!(gap > 0)) return 1;
                if (required > 0) return clamp01(existing / required);
                return 0.5; // shortfall but no target available
            };

            // ── 2. KEY PROJECTIONS & STRATEGIES ──────────────────────
            addSectionHeader('Key Projections & Strategies');

            // 3. Home loan strategy — three metric cards
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...secondaryColor);
            doc.text('HOME LOAN STRATEGY', MARGIN, currentY);
            currentY += 3.5;

            const loanMetrics = [
                {
                    label: 'CURRENT BALANCE',
                    value: summary.loan
                        ? formatMoney(selectedReviewAllData?.loanSimulatorDetails?.loanSetup?.homeLoanTotal)
                        : 'Not provided',
                    color: primaryColor
                },
                {
                    label: 'PAID OFF SOONER',
                    value: summary.loan ? `${summary.loan.termSaved} yrs` : 'Not calculated',
                    color: primaryColor
                },
                {
                    label: 'INTEREST SAVED',
                    value: summary.loan ? formatMoney(summary.loan.interestSaved) : 'Not calculated',
                    color: summary.loan ? greenColor : primaryColor
                }
            ];

            const loanGap = 5;
            const loanW = (CONTENT_W - loanGap * 2) / 3;
            const loanH = 18;
            ensureSpace(loanH + 6);

            loanMetrics.forEach((m, i) => {
                const x = MARGIN + i * (loanW + loanGap);
                drawCard(x, currentY, loanW, loanH);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(6.5);
                doc.setTextColor(...mutedText);
                doc.text(m.label, x + 4.5, currentY + 6.5);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(...m.color);
                doc.text(String(m.value), x + 4.5, currentY + 13.5);
            });
            currentY += loanH + 7;

            // 4. Age pension highlight card
            const agePensionRow = summary.sections.find((s) => s.title === 'Age Pension Assessment')?.rows?.[0];
            const pensionValue = agePensionRow ? String(agePensionRow.value) : 'Approximately $31,000/yr';
            const pensionLabel = agePensionRow ? String(agePensionRow.label) : '';
            const pensionH = pensionLabel ? 25 : 21;

            ensureSpace(pensionH + 6);
            drawCard(MARGIN, currentY, CONTENT_W, pensionH, { fill: cardBg, border: borderCol, r: 3, shadow: false });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...secondaryColor);
            doc.text('AGE PENSION ENTITLEMENT', MARGIN + 6, currentY + 7);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.setTextColor(...primaryColor);
            doc.text(pensionValue, MARGIN + 6, currentY + 16);

            if (pensionLabel) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(...mutedText);
                doc.text(pensionLabel, MARGIN + 6, currentY + 21.5);
            }
            currentY += pensionH + 10;

            // ── 5. INSURANCE COVERAGE ────────────────────────────────
            addSectionHeader(`Insurance Coverage (${summary.householdName})`);

            const cardGap = 5;
            const cardWidth = (CONTENT_W - cardGap * 2) / 3;
            const cardHeight = 27;

            summary.insurance.forEach((person) => {
                ensureSpace(5 + cardHeight + 4);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(...textDark);
                doc.text(person.person, MARGIN, currentY);
                currentY += 4;

                const allCovers = [
                    ...person.cover.map((c) => ({
                        name: c.type,
                        ok: !(c.gap > 0),
                        pct: coveragePct(c.existing, c.required ?? c.needed, c.gap),
                        detail: `${formatMoney(c.existing)} held`
                    })),
                    {
                        name: 'Income Protection',
                        ok: !(person.ip.gap > 0),
                        pct: coveragePct(person.ip.existing, person.ip.required ?? person.ip.needed, person.ip.gap),
                        detail: `${formatMoney(person.ip.existing)}/mo`
                    }
                ];

                allCovers.forEach((item, idx) => {
                    const col = idx % 3;
                    if (idx > 0 && col === 0) {
                        currentY += cardHeight + 5;
                    }
                    ensureSpace(cardHeight);

                    const x = MARGIN + col * (cardWidth + cardGap);
                    const y = currentY;
                    const innerX = x + 4.5;
                    const innerW = cardWidth - 9;
                    const accent = item.ok ? greenColor : redColor;
                    const pctRounded = Math.round(item.pct * 100);

                    drawCard(x, y, cardWidth, cardHeight);

                    // Name + held amount
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(...textDark);
                    doc.text(item.name, innerX, y + 7);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(...mutedText);
                    doc.text(item.detail, innerX, y + 11.5);

                    // Status (vector icon + text)
                    drawStatusIcon(innerX + 1.6, y + 16.2, item.ok);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.5);
                    doc.setTextColor(...accent);
                    doc.text(item.ok ? 'Adequate' : 'Shortfall', innerX + 5, y + 17);

                    // Progress bar
                    drawProgress(innerX, y + 20, innerW, item.pct, accent);

                    // Captions under the bar
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(6.3);
                    doc.setTextColor(...mutedText);
                    doc.text(`${pctRounded}% covered`, innerX, y + 24.5);
                    doc.text(`${100 - pctRounded}% gap`, innerX + innerW, y + 24.5, { align: 'right' });
                });

                currentY += cardHeight + 8;
            });

            // ── 6. YOUR NEXT STEPS (two-column grid, wrapped text, page-safe) ──
            addSectionHeader('Your Next Steps');

            const stepGap = 6;
            const colWidth = (CONTENT_W - stepGap) / 2;
            const badgeSpace = 15;                  // left room for number badge
            const lineH = 3.5;
            const minStepH = 12;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);

            const prepared = summary.nextSteps.map((step) => {
                let lines = doc.splitTextToSize(String(step), colWidth - badgeSpace - 4);
                if (lines.length > 3) {
                    lines = lines.slice(0, 3);
                    lines[2] = lines[2].replace(/\s*\S{0,3}$/, '') + '...';
                }
                return { lines, h: Math.max(minStepH, lines.length * lineH + 6) };
            });

            for (let i = 0; i < prepared.length; i += 2) {
                const pair = prepared.slice(i, i + 2);
                const rowH = Math.max(...pair.map((p) => p.h));
                ensureSpace(rowH);

                pair.forEach((p, k) => {
                    const index = i + k;
                    const x = MARGIN + k * (colWidth + stepGap);
                    const y = currentY;

                    drawCard(x, y, colWidth, rowH);

                    // Circular number badge
                    const bx = x + 7;
                    const by = y + rowH / 2;
                    doc.setFillColor(219, 234, 254);
                    doc.circle(bx, by, 3.2, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.5);
                    doc.setTextColor(...secondaryColor);
                    doc.text(String(index + 1), bx, by + 1, { align: 'center' });

                    // Step text, vertically centred
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(...textDark);
                    const textBlockH = (p.lines.length - 1) * lineH;
                    const ty = y + rowH / 2 - textBlockH / 2 + 1;
                    doc.text(p.lines, x + badgeSpace, ty, { lineHeightFactor: lineH / (7.5 * 0.3528) });
                });

                currentY += rowH + 4;
            }

            // ── 7. FOOTER (drawn on every page) ──────────────────────
            const pageHeight = doc.internal.pageSize.getHeight();
            const totalPages = doc.getNumberOfPages();
            const disclaimer = "Disclaimer: This is a summary document only and does not constitute personal financial advice. All projections are illustrative and based on the assumptions discussed; actual returns will vary. Refer to your full Record of Advice (ROA) document for complete recommendations, assumptions, fees and disclosures.";

            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);

                doc.setDrawColor(...hairline);
                doc.setLineWidth(0.3);
                doc.line(MARGIN, pageHeight - 18, MARGIN + CONTENT_W, pageHeight - 18);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6.5);
                doc.setTextColor(148, 163, 184);
                doc.text(doc.splitTextToSize(disclaimer, 140), MARGIN, pageHeight - 13);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(...primaryColor);
                doc.text('Denaro Wealth', MARGIN + CONTENT_W, pageHeight - 13, { align: 'right' });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(...mutedText);
                doc.text('Your Trusted Adviser', MARGIN + CONTENT_W, pageHeight - 9, { align: 'right' });

                if (totalPages > 1) {
                    doc.setFontSize(6.5);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Page ${p} of ${totalPages}`, MARGIN + CONTENT_W, pageHeight - 5, { align: 'right' });
                }
            }

            // Save PDF
            const filename = summary.householdName.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
            doc.save(`Review_Summary_${filename || 'Client'}.pdf`);
            message.success('PDF downloaded successfully!');
        } catch (err) {
            console.error(err);
            message.error('Failed to generate PDF document.');
        }
    };

    const generateWordDocument = async () => {
        try {
            // A4 with 900-twip margins -> 11906 - 1800 = 10106 twips of usable width
            const MARGIN = 900;
            const CONTENT_W = 11906 - MARGIN * 2;
            const COL_WIDTHS = [3400, CONTENT_W - 3400];
            const BRAND = '051C64';

            // Show 0 as "0"; only truly empty values become a dash
            const display = (v) => (v === null || v === undefined || String(v).trim() === '' ? '—' : String(v));

            const cell = (text, width, header = false) => new TableCell({
                width: { size: width, type: WidthType.DXA },
                shading: header ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EAF1F8' } : undefined,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new DocxParagraph({
                    children: [new TextRun({
                        text: display(text),
                        bold: header,
                        font: 'Arial',
                        size: 20,
                    })],
                })],
            });

            const tableForRows = (rows) => new Table({
                width: { size: CONTENT_W, type: WidthType.DXA },
                columnWidths: COL_WIDTHS,
                rows: [
                    new TableRow({
                        tableHeader: true,
                        cantSplit: true,
                        children: [cell('Item', COL_WIDTHS[0], true), cell('Details', COL_WIDTHS[1], true)],
                    }),
                    ...rows.map(({ label, value }) => new TableRow({
                        cantSplit: true,
                        children: [cell(label, COL_WIDTHS[0]), cell(value, COL_WIDTHS[1])],
                    })),
                ],
            });

            const highlights = summary.highlights || [];
            const sections = (summary.sections || []).filter((s) => s.rows && s.rows.length);
            const nextSteps = summary.nextSteps || [];
            const dateText = summary.date || '23 October 2026';

            const children = [
                new DocxParagraph({
                    text: 'Review Meeting Summary',
                    heading: HeadingLevel.TITLE,
                }),
                new DocxParagraph({
                    children: [
                        new TextRun({ text: `Prepared for ${summary.householdName}`, bold: true, font: 'Arial' }),
                        new TextRun({ text: `  |  ${dateText}`, font: 'Arial' }),
                    ],
                    spacing: { after: 280 },
                }),
                new DocxParagraph({
                    text: 'Summary of the information and projections available in this review.',
                    spacing: { after: 240 },
                }),
            ];

            if (highlights.length) {
                children.push(new DocxParagraph({ text: 'Key Outcomes', heading: HeadingLevel.HEADING_1 }));
                children.push(tableForRows(highlights));
            } else {
                children.push(new DocxParagraph({
                    text: 'No calculated outcomes are available yet. Complete the relevant review sections to include projections.',
                    spacing: { after: 240 },
                }));
            }

            sections.forEach((section) => {
                children.push(new DocxParagraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));
                children.push(tableForRows(section.rows));
            });

            if (nextSteps.length) {
                children.push(new DocxParagraph({ text: 'Recommended Next Steps', heading: HeadingLevel.HEADING_1 }));
                nextSteps.forEach((step) => {
                    children.push(new DocxParagraph({
                        text: step,
                        bullet: { level: 0 },
                        spacing: { after: 60 },
                    }));
                });
            }

            children.push(new DocxParagraph({
                children: [new TextRun({
                    text: 'Important: This summary is based on the data and assumptions recorded in the review. Projections are estimates, are not guaranteed, and do not replace the formal Record of Advice or personal financial product advice.',
                    italics: true,
                    color: '64748B',
                    size: 18,
                    font: 'Arial',
                })],
                spacing: { before: 400 },
            }));

            const wordDoc = new Document({
                creator: 'Denaro Wealth',
                title: 'Review Meeting Summary',
                styles: {
                    default: { document: { run: { font: 'Arial', size: 20 } } },
                    paragraphStyles: [
                        {
                            id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal',
                            run: { font: 'Arial', size: 40, bold: true, color: BRAND },
                            paragraph: { spacing: { after: 120 } },
                        },
                        {
                            id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                            run: { font: 'Arial', size: 26, bold: true, color: BRAND },
                            paragraph: { spacing: { before: 320, after: 120 }, keepNext: true, keepLines: true, outlineLevel: 0 },
                        },
                    ],
                },
                sections: [{
                    properties: {
                        page: {
                            size: { width: 11906, height: 16838 }, // A4
                            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
                        },
                    },
                    footers: {
                        default: new Footer({
                            children: [new DocxParagraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({ text: 'Denaro Wealth  |  Page ', font: 'Arial', size: 16, color: '64748B' }),
                                    new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '64748B' }),
                                ],
                            })],
                        }),
                    },
                    children,
                }],
            });

            const blob = await Packer.toBlob(wordDoc);
            const filename = summary.householdName.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
            saveAs(blob, `Review_Meeting_Summary_${filename || 'Client'}.docx`);
            message.success('Word review summary downloaded successfully!');
        } catch (error) {
            console.error('Unable to generate Word review summary', error);
            message.error('Failed to generate the Word review summary.');
        }
    };

    return (
        <>
            <Card
                style={{
                    borderRadius: 12,
                    borderColor: '#e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                }}
                bodyStyle={{
                    padding: 24
                }}
            >
                {/* ── TOP HEADER / TAB NAVIGATION ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>

                    {/* Avatar & Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Badge status={isSpeaking || isListening ? "processing" : "success"} dot offset={[-4, 38]}>
                            <Avatar
                                size={54}
                                src={nattyAvatar}
                            />
                        </Badge>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', lineHeight: '1.2' }}>
                                NattyAI {(isSpeaking || isListening) && <span style={{ fontSize: 12, color: '#52c41a', marginLeft: 6 }}>{isSpeaking ? '🔊 Speaking' : '🎙 Listening'}</span>}
                            </div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Summary ready — replay any time</Text>
                        </div>
                    </div>

                    {/* Tab Buttons */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                        {/* Tab 1 */}
                        <Button
                            onClick={() => { setActiveTab('summary'); handleSpeakSummary() }}
                            style={{
                                height: 52,
                                minWidth: 160,
                                borderRadius: 10,
                                backgroundColor: activeTab === 'summary' ? '#ffffff' : '#fafafa',
                                borderColor: activeTab === 'summary' ? '#d9d9d9' : '#f0f0f0',
                                fontWeight: 500
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <CommentOutlined style={{ fontSize: 16, color: activeTab === 'summary' ? '#1890ff' : '#8c8c8c' }} />
                                <span style={{ fontSize: 12, marginTop: 2 }}>Summary & next steps</span>
                            </div>
                        </Button>

                        {/* Tab 2 */}
                        <Button
                            onClick={() => { setActiveTab('pdf'); generatePdf(); }}
                            style={{
                                height: 52,
                                minWidth: 160,
                                borderRadius: 10,
                                backgroundColor: activeTab === 'pdf' ? '#ffffff' : '#fffbe6',
                                borderColor: activeTab === 'pdf' ? '#ffe58f' : '#ffe58f',
                                fontWeight: 500
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <FilePdfOutlined style={{ fontSize: 16, color: '#d48806' }} />
                                <span style={{ fontSize: 12, marginTop: 2, color: '#1f1f1f' }}>Client 1-page PDF</span>
                            </div>
                        </Button>

                        {/* Tab 3 */}
                        <Button
                            onClick={() => { setActiveTab('review-summary'); generateWordDocument(); }}
                            style={{
                                height: 52,
                                minWidth: 160,
                                borderRadius: 10,
                                backgroundColor: activeTab === 'review-summary' ? '#ffffff' : '#f6ffed',
                                borderColor: activeTab === 'review-summary' ? '#b7eb8f' : '#b7eb8f',
                                fontWeight: 500
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <FileTextOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                                <span style={{ fontSize: 12, marginTop: 2, color: '#1f1f1f' }}>Review Meeting Summary</span>
                            </div>
                        </Button>
                    </div>
                </div>

                {/* ── TAB CONTENT RENDERING ── */}

                <div style={{ padding: '8px 4px', fontSize: 14, color: '#1f2937', lineHeight: '1.7' }}>
                    <Paragraph style={{ marginBottom: 20 }}>
                        Annual review summary for <strong>{summary.householdName}</strong>, prepared {summary.date}.
                    </Paragraph>

                    <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 24 }}>
                        {summary.highlights.length > 0 ? summary.highlights.map(({ label, value }) => (
                            <div key={label}><strong>{label}:</strong> {value}</div>
                        )) : (
                            <div>Complete review sections to see calculated outcomes here.</div>
                        )}
                        {summary.sections.map((section) => (
                            <div key={section.title} style={{ width: '100%' }}>
                                <strong>{section.title}</strong>
                                <ul style={{ margin: '4px 0 0', paddingLeft: 24 }}>
                                    {section.rows.map(({ label, value }) => (
                                        <li key={label}>{label}: {value}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        <div>
                            <strong>Recommended next steps</strong>
                            <ol style={{ margin: '4px 0 0', paddingLeft: 24 }}>
                                {summary.nextSteps.map((step) => <li key={step}>{step}</li>)}
                            </ol>
                        </div>
                    </Space>

                    <Paragraph style={{ color: '#374151', marginBottom: 28 }}>
                        Projections are estimates based on the data recorded in the review and should be considered with the formal Record of Advice.
                    </Paragraph>
                </div>






                {/* ── BOTTOM ACTIONS BAR ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, paddingTop: 12 }}>
                    <Button
                        type="primary"
                        icon={isSpeaking ? <AudioMutedOutlined /> : <SoundOutlined />}
                        size="large"
                        onClick={handleSpeakSummary}
                        style={{
                            background: isSpeaking ? '#ff4d4f' : 'linear-gradient(135deg, #46c455 0%, #2a8d35 100%)',
                            borderColor: isSpeaking ? '#ff4d4f' : '#2e7d32',
                            borderRadius: 8,
                            height: 42,
                            fontSize: 13,
                            fontWeight: 600
                        }}
                    >
                        {isSpeaking ? 'Stop Speaking' : 'Speak to client'}
                    </Button>

                    <Button
                        type="primary"
                        icon={<AudioOutlined />}
                        size="large"
                        onClick={startVciSetup}
                        style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', borderColor: '#096dd9', borderRadius: 8, height: 42, fontSize: 13, fontWeight: 600 }}
                    >
                        Voice Guided Setup
                    </Button>

                    <Button
                        icon={<CopyOutlined style={{ color: '#d48806' }} />}
                        size="large"
                        onClick={handleCopy}
                        style={{ borderRadius: 8, height: 42, fontSize: 13, fontWeight: 500 }}
                    >
                        Copy Summary
                    </Button>

                    <Button
                        icon={<SettingOutlined style={{ color: '#8c8c8c' }} />}
                        size="large"
                        onClick={() => setIsSettingsOpen(true)}
                        style={{ borderRadius: 8, height: 42, fontSize: 13, fontWeight: 500 }}
                    >
                        Voice Settings
                    </Button>
                </div>
            </Card>

            {/* ── GUIDED VOICE SETUP MODAL (VCI) ── */}
            <Modal
                open={isVciOpen}
                onCancel={stopVciSetup}
                footer={null}
                closable={false}
                centered
                width={540}
                bodyStyle={{ padding: 0, borderRadius: 16, overflow: 'hidden' }}
            >
                <div style={{ background: 'linear-gradient(135deg, #0f1e4c 0%, #1e3a8a 100%)', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        🎤
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>NattyAI — Guided Voice Setup</div>
                        <div style={{ fontSize: 12, opacity: 0.85 }}>Step {vciIndex + 1} of {VCI_QUEUE.length}</div>
                    </div>
                    <Button type="text" icon={<CloseOutlined style={{ color: '#fff' }} />} onClick={stopVciSetup} />
                </div>

                <div style={{ padding: 20 }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 20 }}>{VCI_QUEUE[vciIndex]?.icon}</span>
                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#1d4ed8' }}>
                                Natty is asking
                            </Text>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#0f1e4c' }}>
                            {VCI_QUEUE[vciIndex]?.question}
                        </div>
                    </div>

                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        You said
                    </Text>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', minHeight: 44, fontSize: 14, color: '#1e293b', marginBottom: 16 }}>
                        {transcript}
                    </div>

                    {appliedLogs.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                                Captured Fields
                            </Text>
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#166534', maxHeight: 90, overflowY: 'auto' }}>
                                {appliedLogs.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 20 }}>
                        <Button icon={<LeftOutlined />} onClick={() => handleVciPrev(vciIndex)} disabled={vciIndex === 0}>
                            Previous
                        </Button>
                        <Button icon={<SyncOutlined />} onClick={() => askVciQuestion(vciIndex)}>
                            Repeat
                        </Button>
                        <Button icon={<RightOutlined />} onClick={() => handleVciNext(vciIndex)}>
                            Skip
                        </Button>
                        <Button type="primary" onClick={stopVciSetup} style={{ background: '#0f1e4c', borderColor: '#0f1e4c' }}>
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── VOICE SETTINGS MODAL ── */}
            <Modal
                title="Voice & Speech Settings"
                open={isSettingsOpen}
                onOk={() => setIsSettingsOpen(false)}
                onCancel={() => setIsSettingsOpen(false)}
                okText="Save & Close"
                cancelButtonProps={{ style: { display: 'none' } }}
            >
                <Space direction="vertical" size={20} style={{ width: '100%', paddingTop: 10 }}>
                    <div>
                        <Text bold style={{ display: 'block', marginBottom: 6 }}>Voice Synthesis Voice</Text>
                        <Select
                            style={{ width: '100%' }}
                            value={selectedVoice}
                            onChange={value => setSelectedVoice(value)}
                            options={voices.map(v => ({ label: `${v.name} (${v.lang})`, value: v.name }))}
                        />
                    </div>

                    <div>
                        <Text bold style={{ display: 'block', marginBottom: 6 }}>Speech Rate ({speechSpeed}x)</Text>
                        <Slider
                            min={0.5}
                            max={1.5}
                            step={0.05}
                            value={speechSpeed}
                            onChange={value => setSpeechSpeed(value)}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <Text bold style={{ display: 'block' }}>Auto-speak Guided Questions</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>Automatically read aloud questions during setup</Text>
                        </div>
                        <Switch checked={autoSpeak} onChange={checked => setAutoSpeak(checked)} />
                    </div>
                </Space>
            </Modal>
        </>
    );
};

export default ReviewNattyAiSummary;