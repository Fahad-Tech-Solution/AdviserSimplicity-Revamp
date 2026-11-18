// Builds the short, chat-style "plain English" summary shown by NattyAI.
// Ported from plainOverview()/buildSummary() in AdviserSimplicity_Review.html.
// Expects `summary` (from buildReviewSummaryData) to expose, where available:
//   summary.clientName, summary.partnerName
//   summary.superByPerson: [{ who, ctype, firstYearSSA, firstYearNCC, annualTaxSavingYr1,
//                             extraFromStrategy, years, returnRate, finalWith, finalWithout }]
//   summary.loan: { termSaved, interestSaved, extra, freqLabel, rate }
//   summary.agePension: { isNoPension, isFullPension, totalWithSuppPA }
//   summary.insurance: [{ person, cover:[{type,gap}], ip:{gap} }]   (already in your code)
const fmt$ = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-AU");
const fmtApprox = (n) =>
  `approximately ${fmt$(Math.round((Number(n) || 0) / 1000) * 1000)}`;
const firstName = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)[0] || "";

export const buildPlainSummaryLines = (summary) => {
  const name = summary.clientName || firstName(summary.householdName);
  const partner = summary.partnerName;
  const isCouple = !!partner;
  const lines = [
    isCouple
      ? `👋 Right, ${firstName(name)} and ${firstName(partner)} — let me wrap up where we've landed today in plain English.`
      : `👋 Right, ${firstName(name)} — let me wrap up where we've landed today in plain English.`,
  ];

  // ── Super ──
  const people = summary.superByPerson || [];
  let anyTax = false,
    anyProj = false;
  people.forEach((sc) => {
    const amt = sc.firstYearSSA || 0;
    const isSS = (sc.ctype || "ss") === "ss";
    let intro;
    if (amt > 0) {
      intro = isSS
        ? `you're putting an extra ${fmt$(amt)} a year into your super through salary sacrifice`
        : `you're making a personal contribution of ${fmt$(amt)} into your super this year`;
    } else if ((sc.firstYearNCC || 0) > 0) {
      intro = `you're adding ${fmt$(sc.firstYearNCC)} into your super as an after-tax contribution`;
    } else return;
    let line = `💼 ${firstName(sc.who)}, ${intro}`;
    if (amt > 0 && sc.annualTaxSavingYr1 > 0) {
      line += `, which saves you about ${fmtApprox(sc.annualTaxSavingYr1)} in tax this year`;
      anyTax = true;
    }
    if (sc.extraFromStrategy > 1000) {
      line += `. Over the next ${sc.years} years, this is projected to add around ${fmtApprox(sc.extraFromStrategy)} to your super. Based on an assumed return of ${sc.returnRate}% a year, that points to a projected balance of about ${fmtApprox(sc.finalWith)} — compared with about ${fmtApprox(sc.finalWithout)} without the extra contributions`;
      anyProj = true;
    }
    lines.push(line + ".");
  });
  if (anyTax)
    lines.push(
      `ℹ️ In plain terms, money going into super is taxed more lightly than your normal income, so these contributions cut the tax you pay now while building your retirement savings.`,
    );
  if (anyProj)
    lines.push(
      `⚠️ These super projections are a guide only — they're based on the assumptions used, including the assumed investment return, and can't be guaranteed.`,
    );

  // ── Age Pension ──
  const ap = summary.agePension;
  if (ap) {
    lines.push(
      ap.isNoPension
        ? `🏛️ On the Age Pension, your income and assets are currently above the limits, so there's no payment at this stage — we'll keep it under review.`
        : `🏛️ On the Age Pension, you're entitled to about ${fmtApprox(ap.totalWithSuppPA)} a year at the ${ap.isFullPension ? "full" : "part"} rate.`,
    );
  }

  // ── Home loan ──
  const l = summary.loan;
  if (l && (l.termSaved > 0 || l.interestSaved > 0)) {
    const bits = [];
    if (l.termSaved > 0)
      bits.push(
        `pay your home loan off about ${Math.round(l.termSaved)} years sooner`,
      );
    if (l.interestSaved > 0)
      bits.push(
        `save around ${fmtApprox(l.interestSaved)} in interest over the life of the loan`,
      );
    let line = `🏠 ${firstName(name)}, on your home loan, the plan could ${bits.join(" and ")}`;
    if (l.rate)
      line += `. That's based on an interest rate of ${Number(l.rate).toFixed(1)}% a year — if rates change, the actual saving will differ`;
    lines.push(line + ".");
  }

  // ── Insurance (only gaps, one line per person) ──
  (summary.insurance || []).forEach((p) => {
    const gaps = (p.cover || [])
      .filter((c) => c.gap > 50000)
      .map(
        (c) => `about ${fmtApprox(c.gap)} more ${c.type.toLowerCase()} cover`,
      );
    if (p.ip?.gap > 100)
      gaps.push(`around ${fmt$(p.ip.gap)} a month more income protection`);
    if (gaps.length)
      lines.push(
        `🛡️ ${firstName(p.person)} could do with ${gaps.join(", ")} to be fully protected.`,
      );
  });

  lines.push(
    `That's the overview. Each area also has its own detailed analysis if you'd like to go deeper, and we'll follow up if we need anything else.`,
  );
  return lines;
};
