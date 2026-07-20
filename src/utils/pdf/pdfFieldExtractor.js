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

const collapseSpaces = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * WHY THE OLD APPROACH FAILED ON THESE PDFs
 * ------------------------------------------
 * The previous extractor (`extractFieldsByCustomKeys`) was built for
 * "Label: value" prose, e.g. "Title: My Article". It searched for a
 * label + colon, then grabbed text up to the next label-like line.
 *
 * Your statements don't have that shape at all - they have TABLE rows:
 *   1 Netwealth Wrap NW-883921 $540,000.00 $430,000.00 $2,700.00
 * There's no colon, and each row holds 5-6 different values, not one.
 * No regex built around "label:" will ever match a table row, and even
 * if it did, the old code only ever stored a single scalar per key -
 * there's nowhere to put holding #2, #3, #4.
 *
 * This version instead:
 *   1. Finds the header row by matching your scanKey labels against it
 *      (using ALL labels you list, not just the first guess) - so it
 *      still works if the PDF says "Policy Ref" or "Asset Value"
 *      instead of the exact words you expected.
 *   2. Reads off the column ORDER from that header row.
 *   3. Walks every data row, strips the currency values out (in the
 *      order the header told us), and treats what's left as
 *      "name" + "id" (the id is the trailing policy/account code).
 *   4. Returns an ARRAY of row objects - one per holding - instead of
 *      a single flat object.
 *   5. Skips totals/aggregate rows automatically (they don't carry an
 *      account/policy id).
 */

// --- find currency-looking tokens in a line, e.g. $540,000.00 or 1,050.00 ---
function extractCurrencyValues(line) {
    return line.match(/\$?-?[\d,]+\.\d{2}/g) || [];
}

// --- figure out which scanKey column appears first, second, third... in a header line ---
function detectColumnOrder(headerLine, scanKeys) {
    const order = [];
    scanKeys.forEach(({ key, labels }) => {
        let bestIndex = Infinity;
        labels.forEach((label) => {
            const idx = headerLine.toLowerCase().indexOf(label.toLowerCase());
            if (idx !== -1 && idx < bestIndex) bestIndex = idx;
        });
        if (bestIndex !== Infinity) order.push({ key, index: bestIndex });
    });
    order.sort((a, b) => a.index - b.index);
    return order.map((o) => o.key);
}

/**
 * Parse every holding/account row out of statement text.
 *
 * @param {string} text - full text from extractPdfText()
 * @param {Array<{key: string, labels: string[]}>} scanKeys - same shape you already use
 * @returns {Array<Object>} one object per table row, keyed by scanKey `key`
 */
export function parseTableRows(text, scanKeys) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // The name/id columns don't have fixed labels in the header (they're
    // free text), so only use the "value-like" columns to locate + order the header.
    const valueKeys = scanKeys.filter((k) => k.key !== 'platformName' && k.key !== 'accountNumber');

    // Whichever line matches the most distinct value-column labels is the header.
    let headerLine = '';
    let headerScore = 0;
    lines.forEach((line) => {
        const order = detectColumnOrder(line, valueKeys);
        if (order.length > headerScore) {
            headerScore = order.length;
            headerLine = line;
        }
    });

    if (!headerScore) {
        console.warn('[PDF parser] Could not find a header row matching any scanKey labels');
        return [];
    }

    const columnOrder = detectColumnOrder(headerLine, valueKeys);

    const rows = [];
    lines.forEach((line) => {
        if (line === headerLine) return;

        const currencies = extractCurrencyValues(line);
        if (currencies.length < 2) return; // a real holding row has at least value + cost

        if (/^(total|aggregate|combined|subtotal)/i.test(line)) return; // skip summary rows

        let labelPart = line;
        currencies.forEach((c) => {
            labelPart = labelPart.replace(c, '').trim();
        });
        labelPart = labelPart.replace(/^\d+\s+/, '').replace(/\$\s*$/, '').trim();

        // the trailing token that looks like a policy/account/member id, e.g. NW-883921, CFS-7728109
        const idMatch =
            labelPart.match(/([A-Z]{2,6}-\d{4,})\s*$/) || labelPart.match(/([A-Z]{2,}\d{4,})\s*$/);
        if (!idMatch) return; // rows without an id are almost always totals/footers, not holdings

        const accountNumber = idMatch[1];
        const platformName = collapseSpaces(labelPart.slice(0, idMatch.index));

        const row = { platformName, accountNumber };
        columnOrder.forEach((key, i) => {
            if (currencies[i] !== undefined) row[key] = currencies[i];
        });
        rows.push(row);
    });

    return rows;
}

// --- Step: extract table rows from multiple PDF files, returning { fileName: rows[] } ---
export async function extractTableRowsFromPdfFiles(files, scanKeys, options = {}) {
    const { debug = false } = options;
    const results = {};

    if (!files || !files.length) {
        if (debug) console.log('[PDF parser] No files provided');
        return results;
    }

    for (const file of files) {
        if (debug) console.log(`[PDF parser] Processing file: ${file.name}`);
        const pdfText = await extractPdfText(file);
        const rows = parseTableRows(pdfText, scanKeys);
        results[file.name] = rows;
        if (debug) console.log(`[PDF parser] Extracted ${rows.length} rows from ${file.name}`, rows);
    }

    return results;
}

// --- apply extracted rows to a dynamic form field (e.g. Ant Design Form.List) ---
export function applyExtractedRowsToForm({ form, rowFieldName = 'managedFunds', rows = [] }) {
    if (!form || !rows.length) return null;

    try {
        form.setFieldValue(rowFieldName, rows);
        return { success: true, rows, rowCount: rows.length };
    } catch (error) {
        console.error('[PDF parser] Error applying extracted rows to form:', error);
        throw error;
    }
}