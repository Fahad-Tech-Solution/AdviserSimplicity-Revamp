import React, { useEffect, useRef, useState } from "react";
import { Avatar, Button, message, Modal, Typography } from "antd";
import { CloseOutlined, SoundOutlined, WarningOutlined } from "@ant-design/icons";
import nattyAvatar from "../../../../../../../../assets/image/ProfileImages/NattyAI.png";
import parse from "html-react-parser";

const { Text } = Typography;

const DEFAULT_DISCLAIMER =
    "Projections and estimates are based on the assumptions and inputs provided and are <strong>not guaranteed</strong>. Actual outcomes may differ due to investment returns, legislative changes, taxation rules, inflation, contribution caps, market volatility, or personal circumstances. This information is general in nature and is not personal financial product advice.";

function getAnalysisText(item) {
    if (typeof item === "string" || typeof item === "number") return String(item);
    if (typeof item?.text === "string") return item.text;
    if (typeof item?.content === "string") return item.content;
    return "";
}

export default function AnalysisModal({
    title = "NattyAI",
    subtitle = "",
    avatar = nattyAvatar,
    content = {},
    disclaimer = DEFAULT_DISCLAIMER,
    onReadAgain,
    onClose,
    readAgainLabel = "Read again",
    closeLabel = "Close",
    openAnalysisModal = false
}) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef(null);
    const { metrics = [], analysis = [], readAloud = "" } = content;
    const resolvedMetrics = Array.isArray(metrics) ? metrics : [];
    const resolvedAnalysis = Array.isArray(analysis) ? analysis : [analysis];
    const metricSummary = resolvedMetrics
        .map((metric) => `${metric?.label ?? ""}: ${metric?.value ?? ""}`)
        .filter(Boolean)
        .join(". ");
    const analysisSummary = resolvedAnalysis.map(getAnalysisText).filter(Boolean).join(". ");
    const speechText = readAloud || [title, subtitle, metricSummary, analysisSummary].filter(Boolean).join(". ");

    useEffect(() => () => {
        if (
            utteranceRef.current &&
            typeof window !== "undefined" &&
            "speechSynthesis" in window
        ) {
            window.speechSynthesis.cancel();
        }
    }, []);

    const handleReadAgain = () => {
        if (onReadAgain) {
            onReadAgain(speechText);
            return;
        }

        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            message.error("Text-to-speech is not supported in this browser.");
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            utteranceRef.current = null;
            setIsSpeaking(false);
            return;
        }

        if (!speechText) {
            message.info("There is no analysis text to read.");
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            utteranceRef.current = null;
            setIsSpeaking(false);
        };
        utterance.onerror = () => {
            utteranceRef.current = null;
            setIsSpeaking(false);
            message.error("Unable to read the analysis aloud.");
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    return (
        <Modal
            open={openAnalysisModal}
            width={"40vw"}
            centered={true}
            closable={true}
            mask={{ enabled: true, blur: true, closable: false }}
            destroyOnHidden={true}
            styles={{
                container: {
                    padding: 0,
                    borderRadius: 18,
                },
                close: {
                    display: "none"
                }
            }}
            footer={null}
        >
            <section
                aria-label={`${title} analysis`}
                style={{
                    width: "100%",
                    overflow: "hidden",
                    borderRadius: 18,
                    background: "#fff",
                    color: "#1f2937",
                }}
            >
                <header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minHeight: 88,
                        padding: "14px 18px",
                        color: "#fff",
                        background: "linear-gradient(110deg, #14285e 0%, #1e4385 55%, #16a765 100%)",
                    }}
                >
                    <Avatar
                        src={avatar}
                        size={66}
                        style={{
                            flex: "0 0 auto",
                            border: "3px solid #fff",
                            boxShadow: "0 0 0 2px #22c55e",
                            background: "#fff",
                        }}
                    >
                        {typeof title === "string" ? title.slice(0, 1) : "A"}
                    </Avatar>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{title}</div>
                        {subtitle ? (
                            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.9 }}>{subtitle}</div>
                        ) : null}
                    </div>
                    {onClose ? (
                        <Button
                            type="text"
                            aria-label="Close analysis"
                            icon={<CloseOutlined />}
                            onClick={onClose}
                            style={{
                                flex: "0 0 auto",
                                width: 36,
                                height: 36,
                                color: "#fff",
                                background: "rgba(255,255,255,0.18)",
                                borderRadius: "50%",
                            }}
                        />
                    ) : null}
                </header>

                <div style={{ display: "grid", gap: 14, padding: "16px 18px" }}>
                    {resolvedMetrics.length > 0 ? (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
                                gap: 8,
                            }}
                        >
                            {resolvedMetrics.map((metric, index) => (
                                <div
                                    key={metric?.key ?? metric?.label ?? index}
                                    style={{
                                        minWidth: 0,
                                        padding: "10px 12px",
                                        textAlign: "center",
                                        border: "1px solid #dbe3ef",
                                        borderRadius: 11,
                                        background: "#f8fafc",
                                    }}
                                >
                                    <div
                                        style={{
                                            marginBottom: 4,
                                            color: "#64748b",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: "0.55px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {metric?.label}
                                    </div>
                                    <div
                                        style={{
                                            color: metric?.color || "#172554",
                                            fontSize: 17,
                                            fontWeight: 800,
                                            lineHeight: 1.25,
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {metric?.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {resolvedAnalysis.length > 0 ? (
                        <div
                            style={{
                                padding: "13px 15px",
                                border: "1px solid #a7f3d0",
                                borderRadius: 11,
                                background: "#f0fdf4",
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: 7,
                                    color: "#166534",
                                    fontSize: 11,
                                    fontWeight: 800,
                                    letterSpacing: "0.4px",
                                    textTransform: "uppercase",
                                }}
                            >
                                ✨ Analysis
                            </div>
                            <ul style={{ display: "grid", gap: 5, margin: 0, paddingLeft: 18, color: "#14532d" }}>
                                {resolvedAnalysis.map((item, index) => {
                                    const content = typeof item === "object" && item !== null
                                        ? item.content ?? item.text
                                        : item;
                                    return (
                                        <li
                                            key={item?.key ?? index}
                                            style={{
                                                fontSize: 12,
                                                lineHeight: 1.55,
                                                fontWeight: item?.emphasis ? 600 : 400,
                                            }}
                                        >
                                            {parse(content)}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : null}

                    {disclaimer ? (
                        <div
                            role="note"
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "12px 14px",
                                border: "1px solid #f59e0b",
                                borderRadius: 11,
                                background: "#fffbeb",
                                color: "#92400e",
                            }}
                        >
                            <WarningOutlined style={{ marginTop: 2, fontSize: 15, color: "#d97706" }} />
                            <div style={{ minWidth: 0 }}>
                                <Text strong style={{ color: "#92400e", fontSize: 11 }}>Important — Projections only</Text>
                                <div style={{ marginTop: 3, fontSize: 11, lineHeight: 1.5 }}>{parse(disclaimer)}</div>
                            </div>
                        </div>
                    ) : null}

                    <footer
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        <Button
                            icon={<SoundOutlined />}
                            onClick={handleReadAgain}
                            aria-pressed={isSpeaking}
                        >
                            {isSpeaking ? "Stop reading" : readAgainLabel}
                        </Button>
                        {onClose ? (
                            <Button type="primary" onClick={onClose} style={{ background: "#14285e" }}>
                                {closeLabel}
                            </Button>
                        ) : null}
                    </footer>
                </div>
            </section>
        </Modal>
    );
}
