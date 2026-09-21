import React, { useState, useEffect, useRef } from 'react';
import { Card, Avatar, Button, Space, Typography, Badge, Modal, Select, Slider, Switch, message } from 'antd';
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

const { Text, Paragraph } = Typography;

const VCI_QUEUE = [
    { id: 'clientName', label: 'Client Name', question: 'What is the Primary Client’s full name?', icon: '👤' },
    { id: 'clientDob', label: 'Client Date of Birth', question: 'What is the Primary Client’s Date of Birth?', icon: '📅' },
    { id: 'partnerName', label: 'Partner Name', question: 'What is the Partner’s full name?', icon: '👥' },
    { id: 'partnerDob', label: 'Partner Date of Birth', question: 'What is the Partner’s Date of Birth?', icon: '📅' },
    { id: 'householdIncome', label: 'Household Income', question: 'What is the combined annual household income?', icon: '💰' }
];

const ReviewNattyAiSummary = () => {
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
            stopSpeaking();
            stopSpeechRecognition();
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

        const content = `Right, Client — let me wrap up where we've landed today in plain English. ` +
            `On super, we're boosting your contributions through salary sacrifice. ` +
            `On the Age Pension, you're entitled to approximately $31,000 a year at the full rate. ` +
            `Even without the Age Pension, you're likely eligible for a Low-Income Health Care Card. ` +
            `Client's and Partner's insurance cover look about right, so we'd keep them as is.`;

        speakText(content);
    };

    const handleCopy = () => {
        const content = `Right, Client — let me wrap up where we've landed today in plain English.\n\n` +
            `💼 On super, we're boosting your contributions through salary sacrifice. This builds your retirement savings while reducing the tax you pay along the way.\n` +
            `🏛️ On the Age Pension, you're entitled to about approximately $31,000 a year (around $1,200 a fortnight) at the full rate.\n` +
            `💳 Even without the Age Pension, you're likely eligible for a Low-Income Health Care Card, which gives cheaper prescriptions and other concessions.\n` +
            `🛡️ Client's insurance cover looks about right, so we'd keep it as is.\n` +
            `🛡️ Partner's insurance cover looks about right, so we'd keep it as is.`;

        navigator.clipboard.writeText(content);
        message.success('Summary copied to clipboard!');
    };

    const generatePdf = () => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const primaryColor = [15, 23, 42];     // Dark Slate
            const secondaryColor = [37, 99, 235];  // Blue
            const greenColor = [22, 101, 52];      // Dark Green
            const lightBg = [248, 250, 252];       // Light Gray/Blue

            // ── 1. HEADER SECTION ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(...primaryColor);
            doc.text('Your Annual Review Summary', 14, 18);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text("Prepared for asaawd  ·  21 September 2026", 14, 24);

            // Top Right Brand Logo / Text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...secondaryColor);
            doc.text('Denaro Wealth', 196, 18, { align: 'right' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            doc.text('Your Trusted Adviser', 196, 23, { align: 'right' });

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.4);
            doc.line(14, 28, 196, 28);

            // ── 2. SECTION TITLE ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...primaryColor);
            doc.text('KEY PROJECTIONS & STRATEGIES', 14, 36);

            // ── 3. HOME LOAN STRATEGY ──
            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);
            doc.text('HOME LOAN STRATEGY', 14, 44);

            autoTable(doc, {
                startY: 47,
                margin: { left: 14, right: 14 },
                head: [['CURRENT BALANCE', 'PAID OFF SOONER', 'INTEREST SAVED']],
                body: [['approximately $3,400', '29 yrs', 'approximately $3,900']],
                theme: 'grid',
                headStyles: {
                    fillColor: lightBg,
                    textColor: primaryColor,
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                bodyStyles: {
                    textColor: [30, 41, 59],
                    fontSize: 9,
                    halign: 'center',
                    fontStyle: 'bold'
                }
            });

            // ── 4. SUPERANNUATION PROJECTION ──
            let currentY = doc.lastAutoTable.finalY + 8;
            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);
            doc.text("ASAAWD'S SUPER — 15 YRS @ 5.23% P.A.", 14, currentY);

            autoTable(doc, {
                startY: currentY + 3,
                margin: { left: 14, right: 14 },
                head: [['WITHOUT STRATEGY', 'WITH STRATEGY']],
                body: [['$7,641,601,886,867,108,000,000,000', '$7,641,601,886,867,108,000,000']],
                theme: 'grid',
                headStyles: {
                    fillColor: lightBg,
                    textColor: primaryColor,
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                bodyStyles: {
                    textColor: greenColor,
                    fontSize: 8.5,
                    halign: 'center',
                    fontStyle: 'bold'
                }
            });

            // ── 5. PENSION & AGE PENSION ──
            currentY = doc.lastAutoTable.finalY + 8;

            // Two Column Layout for Pension & Age Pension
            autoTable(doc, {
                startY: currentY,
                margin: { left: 14, right: 14 },
                head: [["ASAAWD'S PENSION INCOME", 'AGE PENSION ENTITLEMENT']],
                body: [
                    [
                        'approximately $230\nLasts ~1 yrs (to age -1)',
                        'approximately $31,000/yr\nFull rate · $1,201 per fortnight'
                    ]
                ],
                theme: 'plain',
                headStyles: {
                    fillColor: lightBg,
                    textColor: secondaryColor,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                bodyStyles: {
                    textColor: [51, 65, 85],
                    fontSize: 8.5,
                    cellPadding: 4
                }
            });

            // ── 6. INSURANCE COVERAGE TABLE ──
            currentY = doc.lastAutoTable.finalY + 8;
            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);
            doc.text('INSURANCE COVERAGE (asaawd)', 14, currentY);

            autoTable(doc, {
                startY: currentY + 3,
                margin: { left: 14, right: 14 },
                head: [['TYPE', 'STATUS', 'COVERAGE RATIO']],
                body: [
                    ['Life', 'Adequate', '100% covered · 0% gap'],
                    ['TPD', 'Adequate', '100% covered · 0% gap'],
                    ['Trauma', 'Adequate', '91% covered · 9% gap']
                ],
                theme: 'striped',
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8.5
                },
                bodyStyles: {
                    fontSize: 8.5,
                    textColor: [30, 41, 59]
                },
                columnStyles: {
                    1: { fontStyle: 'bold', textColor: greenColor }
                }
            });

            // ── 7. YOUR NEXT STEPS ──
            currentY = doc.lastAutoTable.finalY + 8;
            doc.setFontSize(10);
            doc.setTextColor(...primaryColor);
            doc.text('YOUR NEXT STEPS', 14, currentY);

            autoTable(doc, {
                startY: currentY + 3,
                margin: { left: 14, right: 14 },
                body: [
                    ['1', 'Salary sacrifice arrangement with employer'],
                    ['2', 'Action insurance recommendations per ROA'],
                    ['3', 'Age Pension — $31,223 p.a.'],
                    ['4', 'Review home loan strategy with lender'],
                    ['5', 'Issue Record of Advice (ROA) document']
                ],
                theme: 'plain',
                bodyStyles: {
                    fontSize: 8.5,
                    cellPadding: 2,
                    textColor: [51, 65, 85]
                },
                columnStyles: {
                    0: { fontStyle: 'bold', textColor: secondaryColor, cellWidth: 10 }
                }
            });

            // ── 8. FOOTER DISCLAIMER ──
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setDrawColor(226, 232, 240);
            doc.line(14, pageHeight - 22, 196, pageHeight - 22);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);

            const disclaimer = "Disclaimer: This is a summary document only and does not constitute personal financial advice. All projections are illustrative and based on the assumptions discussed; actual returns will vary. Refer to your full Record of Advice (ROA) document for complete recommendations, assumptions, fees and disclosures.";

            doc.text(doc.splitTextToSize(disclaimer, 182), 14, pageHeight - 17);

            // Save PDF
            doc.save('Review_Summary_asaawd.pdf');
            message.success('PDF downloaded successfully!');
        } catch (err) {
            console.error(err);
            message.error('Failed to generate PDF document.');
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
                        <Badge status={isSpeaking ? "processing" : "success"} dot offset={[-4, 38]}>
                            <Avatar
                                size={54}
                                src={nattyAvatar}
                            />
                        </Badge>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', lineHeight: '1.2' }}>
                                NattyAI {isSpeaking && <span style={{ fontSize: 12, color: '#52c41a', marginLeft: 6 }}>🔊 Speaking</span>}
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
                            onClick={() => setActiveTab('review-summary')}
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
                        👏 Right, Client — let me wrap up where we've landed today in plain English.
                    </Paragraph>

                    <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 24 }}>
                        <div>
                            💼 <strong>On super,</strong> we're boosting your contributions through salary sacrifice. This builds your retirement savings while reducing the tax you pay along the way.
                        </div>

                        <div>
                            🏛️ <strong>On the Age Pension,</strong> you're entitled to about approximately $31,000 a year (around $1,200 a fortnight) at the full rate.
                        </div>

                        <div>
                            💳 Even without the Age Pension, you're likely eligible for a <strong>Low-Income Health Care Card</strong>, which gives cheaper prescriptions and other concessions.
                        </div>

                        <div>
                            🛡️ Client's insurance cover looks about right, so we'd keep it as is.
                        </div>

                        <div>
                            🛡️ Partner's insurance cover looks about right, so we'd keep it as is.
                        </div>
                    </Space>

                    <Paragraph style={{ color: '#374151', marginBottom: 28 }}>
                        That's the overview. Each area also has its own detailed analysis if you'd like to go deeper, and we'll follow up if we need anything else.
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