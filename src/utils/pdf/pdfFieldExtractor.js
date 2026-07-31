import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// --- HELPER FUNCTIONS ---
const collapseSpaces = (s) => (s || "").replace(/\s+/g, " ").trim();

// Clean and extract currency values
function extractCurrencyValues(text) {
  if (!text) return [];
  const matches = text.match(/\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g) || [];
  return matches.map((val) => {
    const cleanNum = val.replace(/[^0-9.]/g, "");
    const numeric = parseFloat(cleanNum);
    return Number.isFinite(numeric)
      ? `$${numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : val;
  });
}

// Split line into cells
function splitLineIntoCells(line) {
  if (line.includes("|")) {
    return line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
  }
  if (line.includes("\t")) {
    return line
      .split("\t")
      .map((cell) => cell.trim())
      .filter(Boolean);
  }
  return line
    .split(/\s{2,}/)
    .map((cell) => cell.trim())
    .filter(Boolean);
}

// Detect header column indices
function detectHeaderColumns(headerCells, scanKeys) {
  const mapping = {};
  scanKeys.forEach(({ key, labels }) => {
    const index = headerCells.findIndex((cell) => {
      const cellLower = cell.toLowerCase();
      return labels.some((label) => cellLower.includes(label.toLowerCase()));
    });
    if (index !== -1) {
      mapping[key] = index;
    }
  });
  return mapping;
}

// ---------------------------------------------------------------------------
// 1. EXTRACT TEXT PRESERVING LAYOUT
// ---------------------------------------------------------------------------
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
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
        fullText += line.trim() + "\n";
        line = "";
      }
      line += item.str + " ";
      lastY = item.transform[5];
    });
    fullText += line.trim() + "\n";
  }

  return fullText;
}

// ---------------------------------------------------------------------------
// 2. NON-TABLE / UNSTRUCTURED KEY-VALUE EXTRACTION
// Uses the `scanKeys` dynamically passed from NattyAiScanCard
// ---------------------------------------------------------------------------
export function extractFieldsFromText(text, scanKeys) {
  const result = {};
  if (!text || !scanKeys || !scanKeys.length) return result;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  scanKeys.forEach((keyConfig) => {
    const { key, labels, type } = keyConfig;
    if (!labels || !labels.length) return;

    // Escaped label strings for regex matching
    const labelPattern = labels
      .map((l) => l.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
      .join("|");

    // Strategy A: Match on the same line or next line (e.g. "Account number: 0100 0909 3186")
    const sameLineRegex = new RegExp(
      `(?:${labelPattern})[:\\s|]+([^\\n|]+)`,
      "i",
    );
    const sameLineMatch = text.match(sameLineRegex);

    if (sameLineMatch && sameLineMatch[1]) {
      let rawVal = sameLineMatch[1].trim();

      // Clean value based on type
      if (type === "currency") {
        const currencies = extractCurrencyValues(rawVal);
        if (currencies.length > 0) rawVal = currencies[0];
      } else if (type === "id") {
        rawVal = rawVal.replace(/^[:\s|]+/, "").trim();
      }

      if (rawVal && !rawVal.toLowerCase().includes("page")) {
        result[key] = collapseSpaces(rawVal);
        return;
      }
    }

    // Strategy B: Search line-by-line for labels followed immediately by values on the next line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matchedLabel = labels.some((label) =>
        line.toLowerCase().startsWith(label.toLowerCase()),
      );

      if (matchedLabel && lines[i + 1]) {
        let candidateVal = lines[i + 1].replace(/^[|:\s]+/, "").trim();

        if (type === "currency") {
          const currencies = extractCurrencyValues(candidateVal);
          if (currencies.length > 0) candidateVal = currencies[0];
        }

        if (candidateVal && !result[key]) {
          result[key] = collapseSpaces(candidateVal);
          break;
        }
      }
    }
  });

  // Fallback for platformName if not found via specific labels
  if (!result.platformName) {
    const platformMatch = text.match(
      /(FirstChoice\s+[A-Za-z\s]+|AustralianSuper|Australian Retirement Trust|Hostplus|Colonial First State|AMP|BT Super)/i,
    );
    if (platformMatch) {
      result.platformName = collapseSpaces(platformMatch[1]);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// 3. TABLE ROW EXTRACTOR (Original logic kept intact)
// ---------------------------------------------------------------------------
export function parseTableRows(text, scanKeys) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  let headerLineIndex = -1;
  let maxMatches = 0;
  let headerCells = [];

  lines.forEach((line, idx) => {
    const cells = splitLineIntoCells(line);
    let matches = 0;

    scanKeys.forEach(({ labels }) => {
      const matched = cells.some((cell) =>
        labels.some((label) =>
          cell.toLowerCase().includes(label.toLowerCase()),
        ),
      );
      if (matched) matches++;
    });

    if (matches > maxMatches) {
      maxMatches = matches;
      headerLineIndex = idx;
      headerCells = cells;
    }
  });

  if (headerLineIndex === -1 || maxMatches < 2) {
    return [];
  }

  const columnMapping = detectHeaderColumns(headerCells, scanKeys);
  const rows = [];

  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    if (/^(total|aggregate|combined|subtotal|heritage|generated)/i.test(line))
      continue;

    const cells = splitLineIntoCells(line);
    if (cells.length < 2) continue;

    const row = {};
    let hasData = false;

    scanKeys.forEach((keyObj) => {
      const { key, type } = keyObj;
      const colIndex = columnMapping[key];

      if (colIndex !== undefined && colIndex < cells.length) {
        let cellValue = cells[colIndex] || "";

        if (type === "currency") {
          const currencies = extractCurrencyValues(cellValue);
          if (currencies.length > 0) {
            cellValue = currencies[0];
          }
        } else if (type === "id") {
          cellValue = cellValue.replace(/^#\s*/, "").trim();
        }

        if (cellValue) {
          row[key] = collapseSpaces(cellValue);
          hasData = true;
        }
      }
    });

    if (hasData) {
      rows.push(row);
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// 4. COMBINED EXTRACTION (Checks Non-Table Text + Table Rows)
// ---------------------------------------------------------------------------
export async function extractTableRowsFromPdfFiles(
  files,
  scanKeys,
  options = {},
) {
  const { debug = false } = options;
  const results = {};

  if (!files || !files.length) return results;

  for (const file of files) {
    if (debug) console.log(`[PDF parser] Processing file: ${file.name}`);
    const pdfText = await extractPdfText(file);

    // 1. Try non-table key-value field extraction
    const formFields = extractFieldsFromText(pdfText, scanKeys);

    // 2. Try table row extraction
    let rows = parseTableRows(pdfText, scanKeys);

    // 3. If no table rows matched, wrap the non-table form fields into a single record
    if (rows.length === 0 && Object.keys(formFields).length > 0) {
      rows = [formFields];
    } else if (rows.length > 0 && Object.keys(formFields).length > 0) {
      // Merge extracted form fields into row 0 if table row is missing some fields
      rows[0] = { ...formFields, ...rows[0] };
    }

    results[file.name] = rows;
    if (debug) {
      console.log(
        `[PDF parser] Extracted ${rows.length} rows/records from ${file.name}`,
        rows,
      );
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 5. FORM APPLICATION HELPER
// ---------------------------------------------------------------------------
export function applyExtractedRowsToForm({
  form,
  rowFieldName = "superFunds",
  rows = [],
  rowCountToFill = rows.length,
  resolveFieldValue,
  fieldFormatters,
}) {
  if (!form || !rows.length) return null;

  try {
    const currentValues = form.getFieldValue(rowFieldName) || [];
    const rowsToApply = rows.slice(0, Number(rowCountToFill) || rows.length);

    const processedRows = rowsToApply.map((row) => {
      const updatedRow = { ...row };

      Object.keys(updatedRow).forEach((key) => {
        if (typeof resolveFieldValue === "function") {
          updatedRow[key] = resolveFieldValue(key, updatedRow[key]);
        }
        if (fieldFormatters && typeof fieldFormatters[key] === "function") {
          updatedRow[key] = fieldFormatters[key](updatedRow[key]);
        }
      });

      return updatedRow;
    });

    const newFormValues = [...currentValues];
    processedRows.forEach((row, idx) => {
      newFormValues[idx] = {
        ...(newFormValues[idx] || {}),
        ...row,
      };
    });

    form.setFieldValue(rowFieldName, newFormValues);
    return {
      success: true,
      rows: newFormValues,
      rowCount: newFormValues.length,
    };
  } catch (error) {
    console.error("[PDF parser] Error applying extracted rows to form:", error);
    throw error;
  }
}
