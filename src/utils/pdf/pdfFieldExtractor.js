// pdf-parse is loaded on demand (browser build + worker). Do not add a top-level
// `import pdfParse from "pdf-parse"` — that can crash the app at startup.

const LINE_Y_TOLERANCE = 4;
const PDF_TEXT_PREVIEW_LENGTH = 1500;

let pdfParseReady;

function isPdfScanDebugEnabled(options = {}) {
  if (options.debug === true) return true;
  if (options.debug === false) return false;
  return import.meta.env.DEV;
}

function logPdfScan(title, data, options = {}) {
  if (!isPdfScanDebugEnabled(options)) return;
  console.groupCollapsed(`[Natty PDF Scan] ${title}`);
  console.log(data);
  console.groupEnd();
}

async function getPdfParseClass() {
  if (!pdfParseReady) {
    pdfParseReady = (async () => {
      const workerUrl = (
        await import(
          "../../../node_modules/pdf-parse/dist/pdf-parse/web/pdf.worker.mjs?url"
        )
      ).default;
      const { PDFParse } = await import("pdf-parse");
      PDFParse.setWorker(workerUrl);
      return PDFParse;
    })();
  }
  return pdfParseReady;
}

const FIELD_PATTERN_FALLBACKS = {
  platformName: [
    /(?:fund\s+name|superannuation\s+fund|super\s+fund|fund\s+provider|provider)\s*[:.\-\t]?\s*([A-Za-z][A-Za-z0-9\s&.'()-]{2,80})/i,
    /(?:your\s+)?fund\s*[:.\-\t]?\s*([A-Za-z][A-Za-z0-9\s&.'()-]{2,80})/i,
  ],
  memberNumber: [
    /(?:member|membership)\s*(?:no|number|#|id)?\s*[:.\-\t]?\s*([\d][\d\s-]{5,20})/i,
    /(?:member|membership)\s*(?:no|number|#|id)?\s*[\r\n\t]+\s*([\d][\d\s-]{5,20})/i,
    /(?:member|membership)\s*(?:no|number|#)?\s*[:.\-]?\s*(\d{4,15})/i,
  ],
  accountNumber: [
    /(?:account|acct)\s*(?:no|number|#)?\s*[:.\-\t]?\s*(\d{4,15})/i,
    /(?:account|acct)\s*(?:no|number|#)?\s*[\r\n\t]+\s*(\d{4,15})/i,
  ],
  balanceBenefit: [
    /(?:account\s+)?balance(?:\s+and\s+benefits)?(?:\s+as\s+at)?\s*[:.\-\t]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:total\s+)?(?:account\s+)?balance\s*[\r\n\t]+\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:total\s+)?benefit\s+amount\s*[:.\-\t]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:super\s+)?balance\s*[:.\-\t]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:closing|current)\s+balance\s*[:.\-\t]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
  ],
  portfolioValue: [
    /(?:portfolio|market)\s*value\s*[:.\-\t]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:total\s+)?(?:portfolio|market)\s*value\s*[\r\n\t]+\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
  ],
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function labelToFlexiblePattern(label) {
  const words = String(label || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  return words.map(escapeRegex).join("[\\s\\n\\t]+");
}

function preparePdfTextVariants(text) {
  const raw = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ");
  const normalized = raw.replace(/[ \t]+/g, " ");
  const flat = raw.replace(/[\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  const lines = raw
    .split(/\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
  return { raw, normalized, flat, lines };
}

function valuePatternForKey(fieldKey) {
  if (fieldKey === "memberNumber" || fieldKey === "accountNumber") {
    return "([\\d][\\d\\s-]{4,22})";
  }
  if (fieldKey === "platformName") {
    return "([A-Za-z][A-Za-z0-9\\s&.'()-]{2,80})";
  }
  return "([^\\n\\r\\t]{1,160})";
}

function extractValueAfterLabelFromLine(line, label, fieldKey) {
  const lineLower = line.toLowerCase();
  const labelLower = label.toLowerCase().trim();
  if (!labelLower || labelLower.length < 2) return "";

  const idx = lineLower.indexOf(labelLower);
  if (idx >= 0) {
    const after = line
      .slice(idx + label.length)
      .trim()
      .replace(/^[:.\-\s\t]+/, "");
    const refined = refineValueForKey(fieldKey, after);
    if (refined) return refined;
  }

  const cells = line.split("\t").map((cell) => cell.trim());
  for (let i = 0; i < cells.length; i += 1) {
    if (!cells[i].toLowerCase().includes(labelLower)) continue;
    const inline = cells[i]
      .slice(cells[i].toLowerCase().indexOf(labelLower) + label.length)
      .trim()
      .replace(/^[:.\-\s]+/, "");
    if (inline) {
      const refinedInline = refineValueForKey(fieldKey, inline);
      if (refinedInline) return refinedInline;
    }
    if (cells[i + 1]) {
      const refinedNext = refineValueForKey(fieldKey, cells[i + 1]);
      if (refinedNext) return refinedNext;
    }
  }

  return "";
}

function extractFromLines(lines, scanKeys = []) {
  const extracted = {};
  const normalizedKeys = normalizeScanKeys(scanKeys);

  normalizedKeys.forEach(({ key, labels }) => {
    for (const label of labels) {
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const value = extractValueAfterLabelFromLine(line, label, key);
        if (value) {
          extracted[key] = value;
          return;
        }

        const lineLower = line.toLowerCase();
        const labelLower = label.toLowerCase().trim();
        const isLabelOnly =
          lineLower === labelLower ||
          lineLower === `${labelLower}:` ||
          lineLower.replace(/[:.\-\s]+$/, "") === labelLower;

        if (isLabelOnly && lines[i + 1]) {
          const nextValue = refineValueForKey(key, lines[i + 1]);
          if (nextValue) {
            extracted[key] = nextValue;
            return;
          }
        }
      }
    }
  });

  return extracted;
}

function extractBalanceNearKeywords(lines = []) {
  const balanceLineRe =
    /balance|benefit|total\s+value|accumulation|closing|current/i;

  let largest = null;
  let largestNum = 0;

  for (let i = 0; i < lines.length; i += 1) {
    if (!balanceLineRe.test(lines[i])) continue;

    const chunk = [lines[i], lines[i + 1]].filter(Boolean).join(" ");
    const amounts = chunk.match(/\$?\s*[\d,]+(?:\.\d{2})?/g) || [];

    amounts.forEach((raw) => {
      const numeric = Number(String(raw).replace(/[^0-9.]/g, ""));
      if (numeric > largestNum) {
        largestNum = numeric;
        largest = raw.replace(/^\$/, "").trim();
      }
    });
  }

  return largest ? refineValueForKey("balanceBenefit", largest) : "";
}

function extractKnownPlatformNames(text, labels = []) {
  for (const label of labels) {
    const trimmed = String(label || "").trim();
    if (trimmed.length < 4) continue;
    if (!/[a-z]/i.test(trimmed)) continue;
    const pattern = new RegExp(`\\b${labelToFlexiblePattern(trimmed)}\\b`, "i");
    if (pattern.test(text)) {
      return trimmed;
    }
  }
  return "";
}

function humanizeFieldKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function cleanExtractedValue(value) {
  return String(value || "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^[$€£]\s*/i, "")
    .trim();
}

function refineValueForKey(key, value) {
  const cleaned = cleanExtractedValue(value);
  if (!cleaned) return "";

  if (key === "memberNumber" || key === "accountNumber") {
    const digitsOnly = cleaned.replace(/\D/g, "");
    if (digitsOnly.length >= 4 && digitsOnly.length <= 15) {
      return digitsOnly;
    }
    const digits = cleaned.match(/\d{4,15}/);
    return digits ? digits[0] : "";
  }

  if (
    key === "balanceBenefit" ||
    key === "portfolioValue" ||
    key === "totalPortfolioCost" ||
    key === "serviceFee"
  ) {
    const amount = cleaned.match(/\$?\s*[\d,]+(?:\.\d{2})?/);
    return amount ? amount[0].replace(/^\$/, "").trim() : cleaned;
  }

  if (key === "platformName") {
    const name = cleaned
      .replace(/\$[\d,]+(?:\.\d{2})?.*/g, "")
      .replace(/\d{6,}.*/g, "")
      .trim();
    if (name.length >= 2 && !/^[\d\s,.-]+$/.test(name)) {
      return name;
    }
    return "";
  }

  return cleaned;
}

function normalizeScanKey(entry) {
  if (typeof entry === "string") {
    const key = entry.trim();
    return {
      key,
      labels: [humanizeFieldKey(key)],
    };
  }

  const key = String(entry?.key || "").trim();
  const labels = Array.isArray(entry?.labels)
    ? entry.labels.filter(Boolean).map(String)
    : [humanizeFieldKey(key)];

  return { key, labels: labels.length ? labels : [humanizeFieldKey(key)] };
}

export function normalizeScanKeys(scanKeys = []) {
  if (!Array.isArray(scanKeys)) return [];
  return scanKeys.map(normalizeScanKey).filter((item) => item.key);
}

export function extractValueForLabel(text, label, fieldKey = "") {
  if (!text || !label) return "";

  const flexibleLabel = labelToFlexiblePattern(label);
  if (!flexibleLabel) return "";

  const valuePattern = valuePatternForKey(fieldKey);

  const sameLinePattern = new RegExp(
    `${flexibleLabel}\\s*[:.\\-]?\\s*${valuePattern}`,
    "i",
  );
  const sameLineMatch = text.match(sameLinePattern);
  if (sameLineMatch?.[1]) {
    return refineValueForKey(fieldKey, sameLineMatch[1]);
  }

  const nextLinePattern = new RegExp(
    `${flexibleLabel}\\s*[:.\\-]?\\s*[\\r\\n\\t]+\\s*${valuePattern}`,
    "i",
  );
  const nextLineMatch = text.match(nextLinePattern);
  if (nextLineMatch?.[1]) {
    return refineValueForKey(fieldKey, nextLineMatch[1]);
  }

  return "";
}

function extractWithPatternFallbacks(text, key) {
  console.log("extractWithPatternFallbacks", text, key);
  const patterns = FIELD_PATTERN_FALLBACKS[key] || [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const refined = refineValueForKey(key, match[1]);
      if (refined) return refined;
    }
  }
  return "";
}

function inferFieldsFromFileName(fileName = "", scanKeys = []) {
  const normalizedKeys = normalizeScanKeys(scanKeys);
  const inferred = {};
  const baseName = String(fileName)
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+\d{8,}$/g, "")
    .trim();

  if (!baseName || /^\d[\d\s-]*$/.test(baseName)) return inferred;

  const hasPlatformKey = normalizedKeys.some(
    (item) => item.key === "platformName",
  );
  if (hasPlatformKey && baseName.length >= 3) {
    inferred.platformName = baseName;
  }

  return inferred;
}

function mergeExtractedFields(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (!target[key] && String(value ?? "").trim()) {
      target[key] = value;
    }
  });
  return target;
}

export function extractFieldsFromPdfText(text, scanKeys = [], options = {}) {
  const normalizedKeys = normalizeScanKeys(scanKeys);
  const extracted = {};
  const { normalized, flat, lines } = preparePdfTextVariants(text);
  const debug = isPdfScanDebugEnabled(options);
  const searchTexts = [normalized, flat, String(text || "")];

  normalizedKeys.forEach(({ key, labels }) => {
    for (const searchText of searchTexts) {
      for (const label of labels) {
        const value = extractValueForLabel(searchText, label, key);
        if (value) {
          extracted[key] = value;
          break;
        }
      }
      if (extracted[key]) break;
    }

    if (!extracted[key]) {
      mergeExtractedFields(extracted, extractFromLines(lines, [{ key, labels }]));
    }

    if (!extracted[key]) {
      for (const searchText of searchTexts) {
        const fallbackValue = extractWithPatternFallbacks(searchText, key);
        if (fallbackValue) {
          extracted[key] = fallbackValue;
          break;
        }
      }
    }

    if (key === "platformName" && !extracted[key]) {
      const knownName = extractKnownPlatformNames(flat || normalized, labels);
      if (knownName) {
        extracted[key] = knownName;
      }
    }

    if (key === "balanceBenefit" && !extracted[key]) {
      const balanceGuess = extractBalanceNearKeywords(lines);
      if (balanceGuess) {
        extracted[key] = balanceGuess;
      }
    }
  });

  if (debug) {
    const expectedKeys = normalizedKeys.map((item) => item.key);
    const missingKeys = expectedKeys.filter(
      (key) => !String(extracted[key] ?? "").trim(),
    );
    logPdfScan("Fields matched from text", {
      extracted,
      missingKeys,
      lineCount: lines.length,
      textLength: String(text || "").length,
      textPreview: String(text || "").slice(0, PDF_TEXT_PREVIEW_LENGTH),
    }, options);
  }

  return extracted;
}

export async function extractTextFromPdfFile(file, options = {}) {
  if (!file) {
    throw new Error("No PDF file provided.");
  }

  const PDFParse = await getPdfParseClass();
  const buffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText({
      lineEnforce: true,
      cellSeparator: "\t",
      pageJoiner: "\n",
    });
    const text = String(result?.text || "").trim();

    if (isPdfScanDebugEnabled(options)) {
      logPdfScan(`Text read: ${file?.name || "PDF"}`, {
        fileName: file?.name,
        fileSize: file?.size,
        characterCount: text.length,
        hasText: Boolean(text),
        preview: text.slice(0, PDF_TEXT_PREVIEW_LENGTH),
      }, options);
    }

    return text;
  } finally {
    await parser.destroy();
  }
}

export async function extractFieldsFromPdfFiles(
  files = [],
  scanKeys = [],
  { useFileNameFallback = true, debug } = {},
) {
  const options = { debug };
  const merged = {};
  let hasReadableText = false;
  const perFileResults = [];

  if (isPdfScanDebugEnabled(options)) {
    logPdfScan("Scan started", {
      fileCount: files.length,
      fileNames: files.map((file) => file?.name),
      scanKeys: normalizeScanKeys(scanKeys).map(({ key, labels }) => ({
        key,
        labels,
      })),
    }, options);
  }

  for (const file of files) {
    const text = await extractTextFromPdfFile(file, options);
    if (String(text || "").trim()) {
      hasReadableText = true;
    }

    const extracted = extractFieldsFromPdfText(text, scanKeys, options);
    Object.assign(merged, extracted);

    const fileNameFields = useFileNameFallback
      ? inferFieldsFromFileName(file?.name, scanKeys)
      : {};

    if (useFileNameFallback) {
      Object.entries(fileNameFields).forEach(([key, value]) => {
        if (!String(merged[key] ?? "").trim() && value) {
          merged[key] = value;
        }
      });
    }

    perFileResults.push({
      fileName: file?.name,
      textLength: text.length,
      extractedFromText: extracted,
      fromFileName: fileNameFields,
      mergedAfterFile: { ...merged },
    });
  }

  if (isPdfScanDebugEnabled(options)) {
    logPdfScan("Per-file results", perFileResults, options);
    logPdfScan("Final data applied to form", merged, options);
  }

  const filledCount = Object.values(merged).filter((value) =>
    String(value ?? "").trim(),
  ).length;

  if (!hasReadableText && !filledCount) {
    throw new Error(
      "Could not read text from this PDF. It may be a scanned image statement — enter details manually or use a text-based PDF.",
    );
  }

  if (!filledCount) {
    throw new Error(
      "Could not find matching fields in the PDF. Check that labels match your statement wording.",
    );
  }

  return merged;
}

export function applyExtractedFieldsToFormRow({
  form,
  rowFieldName,
  targetRow,
  extracted = {},
  fieldFormatters = {},
  resolveFieldValue,
}) {
  if (!form || !rowFieldName) {
    return null;
  }

  const rowIndex = Math.max(0, Number(targetRow) - 1);
  const currentRows = form.getFieldValue(rowFieldName) || [];
  const currentRow = { ...(currentRows[rowIndex] || {}) };

  Object.entries(extracted).forEach(([key, rawValue]) => {
    if (!rawValue) return;

    let value = rawValue;
    if (typeof resolveFieldValue === "function") {
      value = resolveFieldValue(key, rawValue, {
        rowIndex,
        currentRow,
        form,
      });
    }
    if (typeof fieldFormatters?.[key] === "function") {
      value = fieldFormatters[key](value, { key, rowIndex, currentRow, form });
    }
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      currentRow[key] = value;
    }
  });

  const nextRows = [...currentRows];
  nextRows[rowIndex] = currentRow;
  form.setFieldValue(rowFieldName, nextRows);

  return { rowIndex, row: currentRow, rows: nextRows };
}
