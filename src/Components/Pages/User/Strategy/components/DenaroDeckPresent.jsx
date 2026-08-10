import React from 'react'
import { Modal, Button, Tag, Typography } from 'antd'
import DenaroDeckCards from './DenaroDeckCards'

const { Title, Text } = Typography

const DenaroDeckPresent = ({
  isOpen,
  onClose,
  cardsList = {},
  selectedCards = {},
  onToggleSelect,
  flippedCards,
  setFlippedCards
}) => {
  // 1. Flatten all cards from DECK_DATA object
  const allCards = Array.isArray(cardsList)
    ? cardsList
    : Object.values(cardsList).flatMap((category) => category.cards || [])

  // 2. Filter active selected cards
  const selectedCardsList = allCards.filter((card) => {
    const cardId = card.n ?? card.number ?? card.id
    return Object.entries(selectedCards).some(
      ([title, arr]) => title == card.title
    )
  })

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      centered
      width="80vw"
      maxHeight="90vh"
      destroyOnClose
      maskClosable={false}
      styles={{
        container: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
        body: {
          padding: 0,
          background: 'transparent',
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <div className="w-100 d-flex flex-column align-items-center justify-content-between p-3 select-none">

        {/* Header Bar */}
        <div className="w-100 d-flex align-items-center justify-content-between mb-4 px-2">

          {/* Left Title Group */}
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.5rem' }}>🎴</span>

            <Title
              level={3}
              className="m-0"
              style={{
                color: '#22c55e', fontFamily: 'Georgia, serif',
                fontWeight: "400",

              }}
            >
              Denaro Deck
            </Title>

            <Text
              className="fw-light ms-1"
              style={{ color: '#fff', fontSize: '1.5rem' }}
            >
              — Presentation Mode &nbsp;
              <span style={{ fontSize: "13px" }}>

                {selectedCardsList.length} cards
              </span>
            </Text>


          </div>

          {/* Right Exit Button */}
          <Button
            type="primary"
            onClick={onClose}
            className="d-flex align-items-center gap-2 px-4 py-3 rounded-3 fw-semibold shadow"
            style={{
              backgroundColor: 'rgba(6, 78, 59, 0.9)',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#ffffff',
            }}
          >
            <span>✕</span> Show All Cards
          </Button>
        </div>

        {/* Cards Container Layer */}
        <div
          className="w-100 flex-grow-1 d-flex align-items-center justify-content-center gap-2 flex-wrap overflow-y-auto py-3 px-2"
          style={{ maxHeight: '75vh' }}
        >
          {selectedCardsList.length > 0 ? (
            selectedCardsList.map((card) => (
              <DenaroDeckCards
                width={"15vw"} height={"40vh"}
                paraVisibleLines={8}

                icon={Object.values(cardsList).find((cat) => cat.cards.some((c) => c.title === card.title))?.icon}
                key={`${card.title}-${card.n ?? card.id}`}
                card={card}
                selectedCards={Object.values(selectedCards).flat()}
                // onToggleSelect={onToggleSelect}
                flippedCards={flippedCards?.[card.title] || []}
                onToggleFlipped={(c) => {
                  if (flippedCards?.[c.title] && flippedCards[c.title].includes(c.n)) {
                    setFlippedCards((prev) => {
                      const updated = { ...prev };
                      updated[c.title] = updated[c.title].filter(num => num !== c.n);
                      return updated;
                    });
                  } else {
                    setFlippedCards((prev) => {
                      const updated = { ...prev };
                      if (!updated[c.title]) {
                        updated[c.title] = [];
                      }
                      updated[c.title].push(c.n);
                      return updated;
                    });
                  }
                }}
              />
            ))
          ) : (
            <div
              className="text-center py-5 fs-5"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              No cards selected for presentation mode.
            </div>
          )}
        </div>

        {/* Footer Text */}
        <div
          className="mt-4 text-center fw-semibold text-uppercase"
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.15em',
          }}
        >
          CLICK A CARD TO FLIP · CLICK "SHOW ALL CARDS" TO EXIT
        </div>

      </div>
    </Modal>
  )
}

export default DenaroDeckPresent