import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Slider, Checkbox, Button, Avatar, ConfigProvider, Typography, Space } from 'antd';
import {
    SearchOutlined,
    AudioOutlined,
    SoundOutlined,
    StopOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    DownOutlined,
} from '@ant-design/icons';
import NattyImage from '../../assets/image/ProfileImages/NattyAI.png';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { RiBrushAiFill } from 'react-icons/ri';

const { Text } = Typography;

export function AudioWaveform() {
    const bars = [6, 12, 8, 16, 10, 14, 8, 12, 6];

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 3,
                marginTop: 10,
                height: 16
            }}
        >
            <style>{`
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
      `}</style>

            {bars.map((_, i) => (
                <span
                    key={i}
                    style={{
                        width: 3,
                        height: 16,
                        backgroundColor: '#4A90E2',
                        borderRadius: 2,
                        transformOrigin: 'center',
                        animation: `waveform ${0.6 + (i % 4) * 0.2}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.1}s`
                    }}
                />
            ))}
        </div>
    );
}


const NattyAiSpeakingCard = ({
    loading,
    filteredArticles = [],
    topicAndSubCategories = [],
    searchText = '',
}) => {
    const {
        speechState,
        currentText,
        currentTopic,
        speed,
        setSpeed,
        voiceURI,
        setVoiceURI,
        toggle,
        stop,
        speak,
    } = useTextToSpeech();

    const [autoSpeak, setAutoSpeak] = useState(false);
    const [availableVoices, setAvailableVoices] = useState([]);

    // Fetch Web Speech synthesis voices on mount
    useEffect(() => {
        if (!('speechSynthesis' in window)) return;

        const updateVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
            if (voices.length > 0 && !voiceURI) {
                setVoiceURI(voices[0].voiceURI);
            }
        };

        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
    }, []);

    const isSpeaking = speechState === 'speaking';
    const isPaused = speechState === 'paused';
    const isActive = isSpeaking || isPaused;

    return (
        <div
            className="d-flex justify-content-center align-items-center p-3"
            style={{ height: '100%', maxHeight: '100vh' }}
        >
            <Card
                className="natty-ai-card"
                bordered={false}
                bodyStyle={{ padding: 0 }}
                style={{
                    width: 380,
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#ffffff',
                }}
            >
                {/* Header Section (Dark Blue Background) */}
                <div
                    style={{
                        backgroundColor: '#0F2547',
                        backgroundImage: 'radial-gradient(circle at top, #1E3A60 0%, #0F2547 100%)',
                        padding: '24px 20px 20px 20px',
                        textAlign: 'center',
                        color: '#ffffff',
                        position: 'relative',
                    }}
                >
                    {/* Avatar Container with Rings & Online Badge */}
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                        <div
                            style={{
                                padding: 6,
                                borderRadius: '50%',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <Avatar size={80} src={NattyImage} style={{ background: '#fff' }} />
                        </div>

                        {/* Status Badge */}
                        <span
                            style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 6,
                                width: 16,
                                height: 16,
                                backgroundColor: isActive ? '#3b82f6' : '#22c55e',
                                borderRadius: '50%',
                                border: '2px solid #0F2547',
                                boxShadow: isActive ? '0 0 8px #3b82f6' : '0 0 8px #22c55e',
                            }}
                        />
                    </div>

                    {/* AI Info Status */}
                    <h3 style={{ color: '#ffffff', margin: 0, fontSize: 20, fontWeight: 700 }}>
                        Natty AI
                    </h3>
                    <div style={{ color: '#82A3CD', fontSize: 13, marginTop: 2, fontWeight: 500 }}>
                        {isSpeaking ? 'Speaking...' : isPaused ? 'Paused' : 'Ready'}
                    </div>

                    {/* Audio Waveform Indicator */}
                    <AudioWaveform isPlaying={isSpeaking} />
                </div>

                {/* Body Content Section */}
                <div style={{ padding: 16 }}>
                    {/* SEARCH / VOICE INPUT BOX */}
                    <Input
                        placeholder='Ask a question, or "explain to...'
                        prefix={<SearchOutlined style={{ color: '#8c8c8c', fontSize: 18, marginRight: 4 }} />}
                        suffix={<AudioOutlined style={{ color: '#1890ff', fontSize: 18, cursor: 'pointer' }} />}
                        style={{
                            borderRadius: 12,
                            padding: '10px 14px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            marginBottom: 14,
                            borderColor: '#f0f0f0',
                        }}
                    />

                    {/* DYNAMIC TOPIC & PLAYBACK SECTION (Appears when text is provided globally) */}
                    {currentText && (
                        <div
                            style={{
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                padding: '12px 14px',
                                marginBottom: 14,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >

                            <div className='d-flex justify-content-center align-items-center gap-2'>
                                <div
                                    style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: 999,
                                        background: "#22c55e",
                                    }}
                                />

                                <Text
                                    ellipsis={{ tooltip: currentTopic || currentText }}
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        display: 'block',
                                    }}
                                >

                                    NattyAI is answering…
                                    {/* {currentTopic || currentText} */}
                                </Text>
                            </div>

                            {/* Playback Controls */}
                            {speechState == "stopped" ?
                                <Button
                                    icon={<RiBrushAiFill />}
                                    onClick={() => stop()}
                                    danger
                                >
                                    clear
                                </Button>
                                :
                                <Button
                                    type="primary"
                                    icon={isSpeaking ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                    onClick={() => toggle()}
                                    style={{
                                        backgroundColor: isPaused ? '#ca8a04' : '#0f172a',
                                        borderColor: isPaused ? '#ca8a04' : '#0f172a',
                                        borderRadius: 6,
                                        fontSize: 12,
                                        height: 32,
                                        maxWidth: 80,
                                        flex: 1,
                                    }}
                                >
                                    {isSpeaking ? 'Pause' : 'Resume'}
                                </Button>
                            }
                        </div>
                    )}

                    {/* SETTINGS PANEL CARD */}
                    <div
                        style={{
                            border: '1px solid #f0f0f0',
                            borderRadius: 12,
                            padding: '12px 12px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        }}
                    >
                        {/* Voice Selector & Preview Button */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 14,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                <SoundOutlined style={{ fontSize: 12, color: '#333' }} />
                                <span style={{ fontWeight: 600, fontSize: 12, color: '#333' }}>Voice</span>

                                <Select
                                    value={voiceURI}
                                    onChange={(val) => setVoiceURI(val)}
                                    suffixIcon={<DownOutlined style={{ fontSize: 8 }} />}
                                    style={{ flex: 1, marginLeft: 4, maxWidth: '120px' }}
                                    options={availableVoices.map((v) => ({
                                        value: v.voiceURI,
                                        label: `${v.lang.slice(0, 2).toUpperCase()} - ${v.name.slice(0, 10)}...`,
                                    }))}
                                />
                            </div>

                            <Button
                                size="small"
                                onClick={() => speak('This is a test preview of the selected voice.', 'Voice Preview')}
                                style={{
                                    marginLeft: 8,
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: '#434343',
                                    borderColor: '#d9d9d9',
                                    height: 32,
                                }}
                            >
                                Preview
                            </Button>
                        </div>

                        {/* Speed Slider */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ width: 65, fontWeight: 600, fontSize: 12, color: '#333' }}>
                                Speed
                            </span>
                            <div style={{ flex: 1, paddingRight: 10 }}>
                                <ConfigProvider theme={{ token: { colorPrimary: '#0e1f3d' } }}>
                                    <Slider
                                        min={0.5}
                                        max={2.0}
                                        step={0.1}
                                        value={speed}
                                        onChange={(val) => setSpeed(val)}
                                    />
                                </ConfigProvider>
                            </div>
                            <span
                                style={{
                                    fontSize: 13,
                                    color: '#666',
                                    width: 32,
                                    textAlign: 'right',
                                    fontWeight: 500,
                                }}
                            >
                                {speed}x
                            </span>
                        </div>

                        <div style={{ borderTop: '1px dashed #e8e8e8', margin: '12px 0' }} />

                        {/* Checkbox Option */}
                        <Checkbox
                            checked={autoSpeak}
                            onChange={(e) => setAutoSpeak(e.target.checked)}
                            style={{ fontSize: 13, color: '#666', alignItems: 'flex-start' }}
                        >
                            <span style={{ lineHeight: '1.4', display: 'inline-block' }}>
                                Auto-speak the answer when I ask a question by voice
                            </span>
                        </Checkbox>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default NattyAiSpeakingCard;