import * as pdfjsLib from "pdfjs-dist";

// CDN worker avoids bundler-specific import paths (works with CRA, Vite, etc.)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// --- Step 1: pull text out of the PDF, preserving line breaks ---
export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY = null;
    let line = "";

    content.items.forEach((item) => {
      // a big jump in Y position means we've moved to a new line
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
        fullText += line.trim() + "\n";
        line = "";
      }
      line += item.str + " ";
      lastY = item.transform[5];
    });
    fullText += line.trim() + "\n";
  }
  console.log("RAW PDF TEXT:\n", fullText);
  return fullText;
}

// --- Step 2: map form field -> heading text as it appears in the PDF ---
const FIELD_HEADINGS = [
  { key: "title", heading: "Title" },
  { key: "topic", heading: "Topic" },
  { key: "subcategory", heading: "Subcategory" },
  { key: "slugId", heading: "ID" },
  { key: "tag", heading: "Tag" },
  { key: "boost", heading: "Boost" },
  { key: "keywords", heading: "Keywords" },
  { key: "snippet", heading: "Snippet" },
  { key: "explanation", heading: "Plain - English explanation" },
  { key: "note", heading: "Note" },
  { key: "example", heading: "Example" },
  { key: "relatedEntries", heading: "Related Entries" },
  { key: "statBoxes", heading: "Stat Box" },
];

// --- Step 3: split the raw text into sections by heading (robust version) ---
function splitIntoSections(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Build a regex per heading: matches "Heading", "Heading:", "1. Heading", etc.,
  // optionally followed by inline content on the same line.
  const headingRegexes = FIELD_HEADINGS.map(({ key, heading }) => ({
    key,
    heading,
    regex: new RegExp(
      `^(?:\\d+[.)]\\s*)?${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:?\\s*(.*)$`,
      "i",
    ),
  }));

  const matches = [];
  lines.forEach((line, idx) => {
    for (const { key, regex } of headingRegexes) {
      const m = line.match(regex);
      // require the matched heading portion to be short relative to the line,
      // so we don't accidentally match a heading word buried in a sentence
      if (m && m[0].length <= line.length + 1) {
        matches.push({ key, idx, inline: m[1]?.trim() || "" });
        break;
      }
    }
  });

  matches.sort((a, b) => a.idx - b.idx);

  const sections = {};
  matches.forEach((m, i) => {
    const start = m.idx + 1;
    const end = i + 1 < matches.length ? matches[i + 1].idx : lines.length;
    const bodyLines = lines.slice(start, end);
    // if there was inline content right after the heading on the same line, prepend it
    sections[m.key] = m.inline ? [m.inline, ...bodyLines] : bodyLines;
  });

  return sections;
}

// --- Step 4: parse stat box lines into { key, value } pairs ---
function parseStatBoxes(content) {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const boxes = [];

  // matches a trailing currency/number/percent token at the end of the line
  // e.g. "$101,000", "1,200", "50%", "-3.5"
  const valuePattern = /(\$?-?[\d,]+(?:\.\d+)?%?)\s*$/;

  lines.forEach((line) => {
    const match = line.match(valuePattern);

    if (match) {
      const value = match[1].trim();
      const key = line.slice(0, match.index).trim();
      if (key && value) boxes.push({ key, value });
      return;
    }

    // fallback for non-numeric stat values (e.g. "Status: Active")
    const parts = line.split(/\s{2,}|\t|\s*:\s*/).filter(Boolean);
    if (parts.length >= 2) {
      boxes.push({
        key: collapseSpaces(parts[0]),
        value: collapseSpaces(parts.slice(1).join(" ")),
      });
    }
  });

  return boxes;
}

// --- Step 5: turn sections into a Form.setFieldsValue-ready object ---
export function parsePdfIntoFormValues(text) {
  console.log("Parsed text from PDF:", text);
  const sections = splitIntoSections(text);

  console.log("Parsed sections from PDF:", sections);
  const values = {};

  [
    "title",
    "topic",
    "subcategory",
    "slugId",
    "tag",
    "snippet",
    "explanation",
    "note",
    "example",
    "relatedEntries",
  ].forEach((key) => {
    if (sections[key]) values[key] = sections[key].join(" ").trim();
  });

  if (sections.boost) {
    const num = parseFloat(sections.boost.join(" ").replace(/[^\d.-]/g, ""));
    values.boost = Number.isNaN(num) ? 0 : num;
  }

  if (sections.keywords) {
    values.keywords = sections.keywords
      .join(" ")
      .split(/[,•\-\n]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }

  if (sections.statBoxes) {
    values.statBoxes = parseStatBoxes(sections.statBoxes);
  }

  return values;
}
