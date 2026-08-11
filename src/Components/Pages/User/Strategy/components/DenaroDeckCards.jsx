import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Typography, Flex } from 'antd'

import denaroDeckCardSvg from '../../../../../assets/svg/DenaroDeck.svg'

const { Title, Paragraph, Text } = Typography

const DenaroDeckCards = ({ card, width = "11vw", height = "35vh", paraVisibleLines = 6, icon = "🛡️", selectedCards = [], onToggleSelect, flippedCards, onToggleFlipped }) => {
    // false = SVG (default) view, true = text detail view
    // const [isFlipped, setIsFlipped] = useState(false)

    const cardId = card.n ?? card.number ?? card.id
    const isSelected = selectedCards.includes(cardId)
    const isFlipped = flippedCards?.includes(cardId)

    const handleCardClick = (e) => {
        // setIsFlipped((prev) => !prev)
        e.stopPropagation()
        onToggleFlipped?.(card)
    }

    const handleCheckboxClick = (e) => {
        e.stopPropagation() // don't flip the card when toggling selection
        onToggleSelect?.(card)
    }

    const formattedNumber = String(cardId ?? '01').padStart(2, '0')

    const faceBaseStyle = {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        backgroundColor: '#fff',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        overflow: 'hidden',
    }

    const checkboxStyle = (selected) => ({
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: `2px solid #d9d9d9`,
        backgroundColor: selected ? '#24ab55' : '#fafafa',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 900,
        fontSize: 12,
    })

    return (
        <div style={{ width, height, marginBottom: 40 }}>
            <motion.div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                    transformStyle: 'preserve-3d',
                    // border: isSelected ? "" : "3px solid #22c55e"

                }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                onClick={handleCardClick}
            >
                {/* ========================================================= */}
                {/* FRONT FACE - SVG (default view)                          */}
                {/* ========================================================= */}
                <div
                    style={{
                        ...faceBaseStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected ? "3px solid #22c55e" : ""
                    }}
                >
                    <div
                        role="button"
                        onClick={handleCheckboxClick}
                        style={{
                            ...checkboxStyle(isSelected),
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 1,
                        }}
                    >
                        {isSelected && '✓'}
                    </div>

                    <img
                        src={denaroDeckCardSvg}
                        alt="Denaro Deck Card"
                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                    />
                </div>


                {/* ========================================================= */}
                {/* BACK FACE - text detail view                             */}
                {/* ========================================================= */}
                <Flex
                    vertical
                    justify="space-between"
                    style={{
                        ...faceBaseStyle,
                        transform: 'rotateY(180deg)',
                        padding: 8,
                        border: isSelected ? "3px solid #22c55e" : ""

                    }}
                >
                    <Flex
                        vertical
                        justify="space-between"
                        style={{
                            border: '1px solid rgba(0, 0, 0, 0.18)',
                            borderRadius: 12,
                            padding: 9,
                            height: '100%',
                        }}
                    >
                        {/* Header */}
                        <Flex align="center" justify="space-between">
                            <Flex align="center" gap={6}>
                                <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
                                <Text strong style={{ color: '#24ab55', fontSize: 18 }}>
                                    {formattedNumber}
                                </Text>
                            </Flex>

                            <div
                                role="button"
                                onClick={handleCheckboxClick}
                                style={checkboxStyle(isSelected)}
                            >
                                {isSelected && '✓'}
                            </div>
                        </Flex>

                        {/* Content */}
                        <Flex vertical align="center" justify="center" gap={8} style={{ flex: 1, textAlign: 'center' }}>
                            <Title
                                // level={5}
                                style={{
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    maxWidth: '85%',
                                    lineHeight: 1.2,
                                    fontSize: 'clamp(9px, 1.2vw, 14px)',
                                    fontWeight: 900,
                                }}
                            >
                                {card.title}
                            </Title>

                            <div style={{ fontSize: 'clamp(26px, 14cqw, 33px)', margin: '4px 0' }}>
                                {card.emoji || '💼'}
                            </div>

                            <Paragraph
                                ellipsis={{ rows: paraVisibleLines, }}
                                style={{
                                    fontSize: "clamp(2px, 3.2cqw, 10px)",
                                    color: 'rgba(0,0,0,0.65)',
                                    lineHeight: 1.6,
                                    textAlign: 'left',
                                    margin: 0,
                                    padding: '0 4px',
                                    textAlign: 'justify',
                                }}
                            >
                                {card.body}
                            </Paragraph>
                        </Flex>

                        {/* Footer */}
                        <Flex align="center" justify="flex-end" gap={6}>
                            <span style={{ fontSize: 12, lineHeight: 1 }}>🛡️</span>
                            <Text strong style={{ color: '#24ab55', fontSize: 14 }}>
                                {formattedNumber}
                            </Text>
                        </Flex>
                    </Flex>
                </Flex>
            </motion.div>
            <Title level={5} style={{ textAlign: 'center', fontSize: 14, color: '#333' }}>
                {card.title}
            </Title>
        </div>
    )
}

export default DenaroDeckCards