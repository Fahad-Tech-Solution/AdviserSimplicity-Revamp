import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import React, { useState } from 'react'
import "./DenaroDeck.css"
import DenaroDeckCards from './DenaroDeckCards';
import { IoEyeOutline, IoReloadOutline, IoSwapHorizontalOutline, IoSwapVerticalOutline } from 'react-icons/io5';
import DenaroDeckPresent from './DenaroDeckPresent';

const DenaroDeck = () => {
    let { Title, Text } = Typography;
    let [activeSection, setActiveSection] = useState("Personal Insurance Strategy");
    let [selectedCards, setSelectedCards] = useState([]);
    let [flippedCards, setFlippedCards] = useState([]);
    let [flipAllSelectedFlag, setFlipAllSelectedFlag] = useState(false);
    const [isPresenting, setIsPresenting] = useState(false)

    const DECK_DATA = {
        insurance: {
            label: "Personal Insurance Strategy", icon: "🛡️",
            cards: [
                { n: 1, title: "Life Insurance", emoji: "❤️‍🔥", body: "Life insurance provides a lump sum payment to your beneficiaries in the event of your death, helping to protect the financial future of your family. It is essential for individuals with dependents, mortgages, or other financial obligations that need to be covered in their absence. Life insurance is typically used to pay off debts, provide for living expenses, cover education costs, or ensure a stable financial future for loved ones." },
                { n: 2, title: "Total & Permanent Disability (TPD)", emoji: "🩼", body: "TPD insurance provides a lump sum payment if you become totally and permanently disabled and can no longer work. It is used to cover the long-term financial consequences of a severe injury or illness, such as paying down debts, medical treatment, rehabilitation, home modifications, and ongoing living expenses." },
                { n: 3, title: "Trauma Insurance", emoji: "🏥", body: "Trauma insurance, also known as critical illness insurance, provides a lump sum payment if you are diagnosed with a specific serious illness, such as cancer, heart attack, or stroke. This insurance is designed to help with the high medical costs and rehabilitation expenses that come with major illnesses." },
                { n: 4, title: "Income Protection Insurance", emoji: "💼", body: "Income protection insurance replaces up to 70% of your income if you're unable to work due to illness or injury. It is crucial for individuals who rely on their salary to meet everyday living expenses. Income protection insurance held outside of super is typically tax-deductible." },
                { n: 5, title: "Bundling Insurance Products", emoji: "📦", body: "Bundling life, TPD, trauma, and income protection insurance with the same provider can simplify policy management and may reduce your premiums. Some providers offer discounts for holding multiple policies, making it easier to keep track of your insurance and ensure comprehensive coverage." },
                { n: 6, title: "Nominating Beneficiaries", emoji: "👨‍👩‍👧‍👦", body: "Ensure your life insurance payout is directed to the right individuals by keeping your beneficiaries updated. By nominating beneficiaries, you can avoid delays and ensure that your loved ones receive the financial support they need when it matters most." },
                { n: 7, title: "Funding Insurance Through Super", emoji: "🔄", body: "Holding life, TPD, or income protection insurance through super can be tax efficient. Premiums are often paid using pre-tax contributions, reducing the impact on your cash flow. You can also arrange to pay premiums through super rollover, preserving your personal cash flow." },
                { n: 8, title: "Stepped vs Level Premiums", emoji: "📊", body: "Stepped premiums increase each year as you get older. Level premiums remain constant throughout the policy but are more expensive initially. Level premiums are often better for long-term insurance needs, while stepped premiums may be more cost-effective for shorter-term coverage." },
                { n: 9, title: "Retail vs Group Cover", emoji: "🏢", body: "Retail cover is a personalised insurance policy purchased directly or through a financial adviser — it offers flexible benefits and tailored coverage with full underwriting. Group cover, usually through superannuation, has lower premiums but may have limited benefits and less flexibility." },
                { n: 10, title: "Reviewing Insurance Regularly", emoji: "🔍", body: "Your personal insurance needs change as your life evolves — whether you're starting a family, buying a home, or retiring. Regularly reviewing your life, income protection, and other insurance policies ensures you're adequately covered and your policies are still cost-effective." },
            ]
        },
        retirement: {
            label: "Retirement Planning Strategy", icon: "🏖️",
            cards: [
                { n: 1, title: "Reevaluating Retirement", emoji: "⏰", body: "Delaying retirement can have a significant impact on your financial security. By working longer, you allow your super to continue growing through additional contributions and investment returns. This extra time enables compounding growth to work in your favour, providing a larger retirement fund." },
                { n: 2, title: "Part-Time Work", emoji: "👷", body: "Working part-time during retirement can provide additional income, reducing your reliance on superannuation and other savings. This strategy helps extend the life of your retirement assets. Combined with an account-based pension, it enables you to enjoy a more flexible retirement." },
                { n: 3, title: "Account-Based Pensions", emoji: "💳", body: "An account-based pension is a flexible and tax-effective way to turn your superannuation savings into a retirement income stream. Earnings in the pension phase are generally tax-free, and withdrawals are flexible, allowing you to adjust based on your income needs." },
                { n: 4, title: "Lifetime Annuities", emoji: "🔒", body: "Lifetime annuities provide a guaranteed income for life, helping you manage the risk of outliving your savings. They are designed to offer stable, predictable payments regardless of market conditions — especially appealing for conservative investors seeking financial stability." },
                { n: 5, title: "Age Pension", emoji: "🏛️", body: "To maximise your Age Pension entitlement, reduce assessable assets by gifting within Centrelink's limits of $10,000 annually or $30,000 over five years. Couples can shift assets to a younger spouse's super (if below Age Pension age) to make those funds exempt." },
                { n: 6, title: "Managing Income", emoji: "💵", body: "Start with your superannuation, which becomes tax-free once you reach age 60. Combine income streams like an account-based pension, the Age Pension, and savings to meet your living costs. Aim for a sustainable withdrawal rate — typically 5–6% annually — to ensure your savings last." },
                { n: 7, title: "Sequencing Risk", emoji: "📉", body: "Sequencing risk occurs when you need to withdraw from your investments during a market downturn, potentially depleting your savings faster. Mitigating this risk involves diversifying your portfolio and maintaining a cash buffer to avoid withdrawing from investments at a loss." },
                { n: 8, title: "Health Care Cards", emoji: "💊", body: "Health Care Cards, such as the Low Income Health Care Card and the Commonwealth Seniors Health Card, provide retirees with access to concessions on medical expenses and prescriptions. Applying for these cards can help you manage healthcare expenses in retirement." },
                { n: 9, title: "Estate Planning", emoji: "📜", body: "Your superannuation doesn't automatically become part of your estate upon passing. Using a recontribution strategy can reduce the tax payable by adult children who inherit your super. This involves withdrawing a tax-free lump sum and recontributing it as a non-concessional contribution." },
                { n: 10, title: "Reversionary Pensions", emoji: "🤝", body: "A reversionary pension allows you to nominate a beneficiary, such as your spouse, to continue receiving your pension payments if you pass away. This strategy provides financial security for your loved ones and ensures they maintain a stable income. It can also offer tax advantages." },
            ]
        },
        investment: {
            label: "Investment Strategy", icon: "📈",
            cards: [
                { n: 1, title: "Risk vs Return", emoji: "⚖️", body: "Investments involve varying levels of risk, and higher potential returns are generally associated with higher risks. Knowing your risk tolerance and aligning it with your investment goals can help build a portfolio that matches your comfort level, helping you stay invested even during volatile times." },
                { n: 2, title: "Investment Time Horizon", emoji: "⏱️", body: "An investment time horizon is the length of time you expect to hold an investment. Shorter horizons (1–5 years) suit lower-risk investments like bonds or cash. Longer horizons (10+ years) can tolerate higher-risk investments such as shares, which may fluctuate but offer higher potential returns." },
                { n: 3, title: "Diversification", emoji: "🌐", body: "Diversification is the practice of spreading your investments across different asset classes — shares, bonds, property, and cash. By diversifying, you reduce your overall risk because the performance of one asset class often offsets the fluctuations of another, making it essential for sound investing." },
                { n: 4, title: "Growth vs Income", emoji: "🌱", body: "Growth investments such as shares focus on capital appreciation. Income investments like bonds or term deposits provide regular cash flow through interest. Balancing growth and income in your portfolio can help meet both short-term cash flow needs and long-term growth objectives." },
                { n: 5, title: "Rebalancing", emoji: "🔃", body: "Rebalancing is the process of realigning your investment portfolio to match your original asset allocation strategy. Over time, different assets grow at varying rates, causing your portfolio to drift from its target mix. By periodically rebalancing, you maintain your desired level of risk." },
                { n: 6, title: "Compound Interest", emoji: "📈", body: "Compound interest is when the returns on an investment generate their own earnings. A $1,000 investment compounding at 7% annually will grow to nearly $2,000 in ten years, and over $7,000 in 30 years. Starting early and staying invested can lead to substantial wealth accumulation." },
                { n: 7, title: "Dollar-Cost Averaging", emoji: "💰", body: "Dollar-cost averaging involves investing a fixed amount at regular intervals, regardless of market conditions. By consistently investing, you buy more shares when prices are low and fewer when prices are high. This approach helps you avoid trying to time the market and focus on steady growth." },
                { n: 8, title: "The Impact of Fees", emoji: "💸", body: "Investment fees can significantly affect your returns over time. A 1% annual fee on a $100,000 portfolio can cost over $60,000 in lost value over 30 years due to compounding. Choosing low-cost investments such as index funds and minimising unnecessary fees can substantially boost your returns." },
                { n: 9, title: "Tax-Effective Investing", emoji: "🧾", body: "Tax-effective investing strategies can help minimise taxes and enhance returns. Super contributions can reduce your taxable income, while franking credits from Australian dividend-paying shares can offset tax liabilities. Holding investments for over a year may also reduce capital gains tax." },
                { n: 10, title: "Active vs Passive Investing", emoji: "🎯", body: "Active investing involves frequent buying and selling to outperform the market, while passive investing aims to match market returns using low-cost funds that track indices. Active investing may provide higher returns but comes with increased costs and risks. Passive investing offers a simpler, cost-effective approach." },
            ]
        },
        super: {
            label: "Superannuation Strategy", icon: "🐷",
            cards: [
                { n: 1, title: "Retail Super Funds", emoji: "🏪", body: "Retail super funds are typically offered by financial institutions and provide a wide variety of investment options. These funds often come with advanced administration services and allow you to work directly with a financial adviser, avoiding call centres. Ideal for personalised advice and comprehensive investment choices." },
                { n: 2, title: "Industry Super Funds", emoji: "🏗️", body: "Industry super funds operate on a not-for-profit basis, reinvesting any profits back into the fund to benefit members. They are particularly suited for individuals seeking a straightforward, no-frills approach with minimal need for ongoing reviews or active management." },
                { n: 3, title: "Self-Managed Super Funds (SMSF)", emoji: "🔐", body: "An SMSF offers full control over how your super is invested, allowing you to choose from a wide range of assets including shares and direct property. SMSFs are ideal for those who seek flexibility and control, as well as business owners looking to purchase their business premises through super." },
                { n: 4, title: "Concessional Contributions", emoji: "🟢", body: "Concessional contributions include employer SG payments, salary sacrifice, and personal tax-deductible contributions. These are taxed at a reduced rate of 15%, helping lower your taxable income. The annual cap is $30,000, with carry-forward provisions if your balance is under $500,000." },
                { n: 5, title: "Super Splitting with Spouse", emoji: "👫", body: "Super splitting allows you to split your concessional contributions with your spouse, helping balance super balances between partners. This is useful when one partner has a lower balance or is not working, and can reduce the combined tax impact in retirement." },
                { n: 6, title: "Non-Concessional Contributions", emoji: "💵", body: "Non-concessional contributions (NCCs) are after-tax contributions to your superannuation. You can contribute up to $120,000 annually, or use the bring-forward rule to make a lump-sum of up to $360,000. This strategy is beneficial for individuals looking to significantly grow their super balance before retirement." },
                { n: 7, title: "Government Co-Contribution", emoji: "🏅", body: "Low and middle-income earners who make non-concessional contributions to their super may qualify for the Government Co-Contribution scheme. The government may contribute up to $500 to your super fund based on your income and the amount of your personal contribution — a great way to boost super at no extra cost." },
                { n: 8, title: "Spouse Super Contributions", emoji: "👩‍❤️‍👨", body: "You can contribute to your spouse's super fund and receive a tax offset of up to $540. This strategy helps boost the retirement savings of a lower-earning or non-working spouse, providing a tax-efficient way to support your partner's financial future while reducing your overall tax liability." },
                { n: 9, title: "Downsizer Contribution", emoji: "🏠", body: "Australians aged 55 or older can make a one-off contribution of up to $300,000 from the sale of their home into their super. This contribution does not count towards the non-concessional contributions cap and is an effective way to significantly boost your super balance as you approach retirement." },
                { n: 10, title: "Transition to Retirement (TTR)", emoji: "🌅", body: "Once you've reached your preservation age (60), you can access part of your super (up to 10%) while continuing to work using a TTR pension. This strategy allows you to supplement your income, reduce work hours, increase salary sacrifice contributions, or use additional income to help reduce debt." },
            ]
        },
    };

    const count = Object.values(selectedCards || {}).reduce(
        (total, cards) => total + (cards?.length || 0),
        0
    );

    const onClear = () => {
        setSelectedCards([])
        // setFlippedCards
    }

    const onFlipBack = () => {
        // setSelectedCards([])
        setFlippedCards([])
        setFlipAllSelectedFlag(false)
    }

    const onFlipSelected = () => {
        // setSelectedCards([])
        setFlippedCards(selectedCards)
        setFlipAllSelectedFlag(true)
    }

    return (
        <div
            className="DenaroDeckHeader"
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 18,
                    marginTop: 18,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <Text
                        style={{
                            display: "block",
                            fontSize: 11,
                            letterSpacing: 3,
                            color: "#22c55e",
                            textTransform: "uppercase",
                            marginBottom: 6,
                            fontWeight: 400,
                        }}
                    >
                        Strategy
                    </Text>
                    <Title
                        style={{
                            margin: 0,
                            fontFamily: "Georgia,serif",
                            fontWeight: 500,
                            fontSize: 28,
                        }}
                    >
                        Denaro Deck
                    </Title>
                </div>
            </div>
            <Row gutter={[16, 16]}>
                <Col md={24}>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {Object.entries(DECK_DATA).map(([key, deck]) => (
                            <Button
                                key={key}
                                style={{ marginBottom: 16 }}
                                onClick={() => {
                                    setActiveSection(deck.label)
                                }}
                                className={activeSection === deck.label ? "Denaro_active" : ""}
                            >
                                {deck.label} {deck.icon}
                            </Button>
                        ))}
                    </div>
                </Col>
                <Col md={24} className="p-0">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center", justifyContent: "center" }}>
                        {(Object.values(DECK_DATA).find(deck => deck.label === activeSection) || Object.values(DECK_DATA)[0])?.cards.map(card => (
                            <DenaroDeckCards key={card.name} card={card} width={"200px"} height={"350px"}
                                selectedCards={selectedCards?.[card.title] || []}
                                paraVisibleLines={8}
                                icon={(Object.values(DECK_DATA).find(deck => deck.label === activeSection) || Object.values(DECK_DATA)[0]).icon}
                                onToggleSelect={(c) => {
                                    if (selectedCards?.[c.title] && selectedCards[c.title].includes(c.n)) {
                                        setSelectedCards((prev) => {
                                            const updated = { ...prev };
                                            updated[c.title] = updated[c.title].filter(num => num !== c.n);
                                            return updated;
                                        });
                                    } else {
                                        setSelectedCards((prev) => {
                                            const updated = { ...prev };
                                            if (!updated[c.title]) {
                                                updated[c.title] = [];
                                            }
                                            updated[c.title].push(c.n);
                                            return updated;
                                        });
                                    }
                                }}


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
                        ))}
                    </div>
                </Col>
                {Object.values(selectedCards || {}).some((cards) => cards?.length > 0) && (
                    <Col md={24} >
                        <Card
                            style={{
                                borderRadius: 16,
                                marginBottom: 20,
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                            }}
                            bodyStyle={{ padding: '16px 24px' }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 12
                                }}
                            >
                                {/* Left Side: Title & Tag */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', maxWidth: "32vW", }}>
                                    <Title
                                        level={5}
                                        style={{
                                            margin: 0,
                                            textTransform: 'uppercase',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            letterSpacing: '2px',
                                            color: '#16a34a'
                                        }}
                                        onClick={() => { console.log(selectedCards) }}
                                    >
                                        {count} {count === 1 ? 'CARD SELECTED' : 'CARDS SELECTED'}
                                    </Title>

                                    {/* <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', maxWidth: "30vW", border: "1px solid red" }}> */}
                                    {Object.entries(selectedCards)
                                        .filter(([_, numbers]) => Array.isArray(numbers) && numbers.length > 0)
                                        .map(([title, numbers], index) => {
                                            // Sequentially counts rendered tags: 1, 2, 3...
                                            const displayCount = index + 1
                                            const formattedNumber = `#${String(displayCount).padStart(2, '0')}`

                                            return (
                                                <Tag
                                                    key={title}
                                                    style={{
                                                        borderRadius: 6,
                                                        padding: '2px 10px',
                                                        backgroundColor: '#f0fdf4',
                                                        borderColor: '#bbf7d0',
                                                        color: '#374151',
                                                        fontSize: 13,
                                                        margin: 0,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: '#16a34a',
                                                            fontWeight: 700,
                                                            marginRight: 6,
                                                        }}
                                                    >
                                                        {formattedNumber}
                                                    </span>
                                                    {title}
                                                </Tag>
                                            )
                                        })}
                                    {/* </div> */}
                                </div>

                                {/* Right Side: Action Buttons */}
                                <div style={{ marginLeft: 'auto' }}>
                                    <Space size={10}>
                                        <Button
                                            onClick={onClear}
                                            style={{
                                                borderRadius: 8,
                                                fontWeight: 600,
                                                color: '#374151'
                                            }}
                                        >
                                            Clear
                                        </Button>

                                        {flipAllSelectedFlag ?
                                            <Button
                                                icon={<IoReloadOutline />}
                                                onClick={onFlipBack}
                                                style={{
                                                    borderRadius: 8,
                                                    fontWeight: 600,
                                                    color: '#374151'
                                                }}
                                            >
                                                Flip All Back
                                            </Button> :


                                            <Button
                                                icon={<IoReloadOutline />}
                                                onClick={onFlipSelected}
                                                style={{
                                                    borderRadius: 8,
                                                    fontWeight: 600,
                                                    borderColor: '#16a34a',
                                                    color: '#16a34a',
                                                    backgroundColor: '#f0fdf4'
                                                }}
                                            >
                                                Flip All Selected
                                            </Button>
                                        }

                                        <Button
                                            type="primary"
                                            icon={"🎴"}
                                            onClick={() => { setIsPresenting(true) }}
                                            style={{
                                                borderRadius: 8,
                                                fontWeight: 600,
                                                backgroundColor: '#16a34a',
                                                borderColor: '#16a34a'
                                            }}
                                        >
                                            Present Selected Cards
                                        </Button>
                                    </Space>
                                </div>
                            </div>
                        </Card>
                    </Col>
                )}
                <Col>
                    <Text style={{
                        marginTop: 12,
                        fontSize: 10,
                        color: "rgb(156, 163, 175)",
                        letterSpacing: 1,
                    }}>CLICK A CARD TO FLIP · TICK ✓ TO SELECT</Text>
                </Col>
            </Row>

            <DenaroDeckPresent
                isOpen={isPresenting}
                onClose={() => setIsPresenting(false)}
                cardsList={DECK_DATA}
                selectedCards={selectedCards}
                onToggleSelect={(c) => { }}
                flippedCards={flippedCards}
                setFlippedCards={setFlippedCards}
            />

        </div>
    )
}

export default DenaroDeck