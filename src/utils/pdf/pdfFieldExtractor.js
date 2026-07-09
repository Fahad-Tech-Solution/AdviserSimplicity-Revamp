import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// --- Step 1: pull text out of the PDF, preserving line breaks ---
export async function extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let lastY = null;
        let line = '';

        content.items.forEach((item) => {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
                fullText += line.trim() + '\n';
                line = '';
            }
            line += item.str + ' ';
            lastY = item.transform[5];
        });
        fullText += line.trim() + '\n';
    }

    return fullText;
}

// --- small string helpers ---
const collapseSpaces = (s) => s.replace(/\s+/g, ' ').trim();
const fixHyphenatedSlug = (s) => s.replace(/\s*-\s*/g, '-').trim();

// --- fuzzy match: tolerates stray whitespace between letters (PDF kerning artifacts) ---
function fuzzyPattern(str) {
    return str
        .split('')
        .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\s*');
}

const HEADING_DEFS = [
    { key: 'title', pattern: `${fuzzyPattern('Title')}\\s*:` },
    { key: 'topic', pattern: `${fuzzyPattern('Topic')}\\s*:` },
    { key: 'subcategory', pattern: `${fuzzyPattern('Subcategory')}\\s*:` },
    { key: 'slugId', pattern: `${fuzzyPattern('ID')}\\s*(?:\\([^)]*\\))?\\s*:` },
    { key: 'tag', pattern: `${fuzzyPattern('Tag')}\\s*:` },
    { key: 'boost', pattern: `${fuzzyPattern('Boost')}\\s*:` },
    { key: 'keywords', pattern: `${fuzzyPattern('Keywords')}\\s*:` },
    { key: 'snippet', pattern: `${fuzzyPattern('Snippet')}\\s*:` },
    {
        key: 'explanation',
        pattern: `${fuzzyPattern('Plain')}\\s*-?\\s*${fuzzyPattern('English')}\\s*${fuzzyPattern('explanation')}\\s*:`,
    },
    { key: 'note', pattern: `${fuzzyPattern('Note')}\\s*:` },
    { key: 'example', pattern: `${fuzzyPattern('Example')}\\s*:` },
    { key: 'statBoxes', pattern: `${fuzzyPattern('stat')}\\s*${fuzzyPattern('box')}[a-zA-Z]*` },
    { key: 'relatedEntries', pattern: `${fuzzyPattern('Related')}\\s*${fuzzyPattern('entries')}\\s*:` },
];

// --- Step 3: locate every heading in the raw text, slice content between them ---
function splitIntoSections(text) {
    const found = [];

    HEADING_DEFS.forEach(({ key, pattern }) => {
        const re = new RegExp(pattern, 'i');
        const match = re.exec(text);
        if (match) {
            found.push({ key, start: match.index, end: match.index + match[0].length });
        } else {
            console.warn(`[PDF parser] heading not found for "${key}"`);
        }
    });

    found.sort((a, b) => a.start - b.start);

    const sections = {};
    found.forEach((m, i) => {
        const contentEnd = i + 1 < found.length ? found[i + 1].start : text.length;
        sections[m.key] = text.slice(m.end, contentEnd).trim();
    });

    if (!sections.statBoxes) {
        const lines = text.split('\n');
        const valuePattern = /(\$?-?[\d,]+(?:\.\d+)?%?)\s*$/;
        let bestRun = [];
        let currentRun = [];

        lines.forEach((line) => {
            if (valuePattern.test(line.trim()) && line.trim().length > 0) {
                currentRun.push(line.trim());
            } else {
                if (currentRun.length > bestRun.length) bestRun = currentRun;
                currentRun = [];
            }
        });
        if (currentRun.length > bestRun.length) bestRun = currentRun;

        if (bestRun.length >= 2) {
            sections.statBoxes = bestRun.join('\n');
            console.warn('[PDF parser] statBoxes recovered via fallback shape-match');
        }
    }

    return sections;
}

// --- Step 4: parse stat box lines into { key, value } pairs ---
function parseStatBoxes(content) {
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    const boxes = [];
    const valuePattern = /(\$?-?[\d,]+(?:\.\d+)?%?)\s*$/;

    lines.forEach((line) => {
        const match = line.match(valuePattern);

        if (match) {
            const value = match[1].trim();
            const key = line.slice(0, match.index).trim();
            if (key && value) boxes.push({ key, value });
            return;
        }

        const parts = line.split(/\s{2,}|\t|\s*:\s*/).filter(Boolean);
        if (parts.length >= 2) {
            boxes.push({
                key: collapseSpaces(parts[0]),
                value: collapseSpaces(parts.slice(1).join(' ')),
            });
        }
    });

    return boxes;
}

// --- Step 5: turn sections into a Form.setFieldsValue-ready object ---
export function parsePdfIntoFormValues(text) {
    const sections = splitIntoSections(text);
    const values = {};

    ['title', 'topic', 'subcategory', 'tag', 'snippet', 'explanation', 'note', 'example'].forEach((key) => {
        if (sections[key]) values[key] = collapseSpaces(sections[key]);
    });

    if (sections.slugId) {
        values.slugId = fixHyphenatedSlug(sections.slugId);
    }

    if (sections.boost) {
        const num = parseFloat(sections.boost.replace(/[^\d.-]/g, ''));
        values.boost = Number.isNaN(num) ? 0 : num;
    }

    if (sections.keywords) {
        values.keywords = sections.keywords
            .split(/[,•\n]/)
            .map((k) => collapseSpaces(k))
            .filter(Boolean);
    }

    if (sections.statBoxes) {
        values.statBoxes = parseStatBoxes(sections.statBoxes);
    }

    if (sections.relatedEntries) {
        values.relatedEntries = sections.relatedEntries
            .split(',')
            .map((s) => fixHyphenatedSlug(s))
            .filter(Boolean)
            .join(', ');
    }

    return values;
}