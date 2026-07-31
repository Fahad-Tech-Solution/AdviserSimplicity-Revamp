import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// --- Step 1: Extract text preserving layout lines ---
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

const collapseSpaces = (s) => (s || "").replace(/\s+/g, " ").trim();

// Extract currency strings
function extractCurrencyValues(text) {
  if (!text) return [];

  // Match standard positive currency tokens like $412,775.88 or 412,775.88
  // ignoring leading dash separators from pipe splits
  const matches = text.match(/\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g) || [];

  return matches.map((val) => {
    // Clean any stray characters and format consistently
    const cleanNum = val.replace(/[^0-9.]/g, "");
    const numeric = parseFloat(cleanNum);
    return Number.isFinite(numeric)
      ? `$${numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : val;
  });
}

// Split table line by Pipe (|), Tab (\t), or 2+ consecutive spaces
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

// Detect column indices based on header matches
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

// pdfFieldExtractor.js

// export function parseTableRows(text, scanKeys) {
//   const lines = text
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);
//   if (!lines.length) return [];

//   // Declare variables in outer scope so they are available after the loop
//   let headerLineIndex = -1;
//   let maxMatches = 0;
//   let headerCells = [];

//   lines.forEach((line, idx) => {
//     const cells = splitLineIntoCells(line);
//     let matches = 0;

//     scanKeys.forEach(({ labels }) => {
//       const matched = cells.some((cell) =>
//         labels.some((label) =>
//           cell.toLowerCase().includes(label.toLowerCase()),
//         ),
//       );
//       if (matched) matches++;
//     });

//     if (matches > maxMatches) {
//       maxMatches = matches;
//       headerLineIndex = idx;
//       headerCells = cells; // Assigned here and accessible below
//     }
//   });

//   if (headerLineIndex === -1 || maxMatches < 2) {
//     console.warn("[PDF parser] Could not find header line matching scanKeys");
//     return [];
//   }

//   // headerCells is now defined and populated
//   const columnMapping = detectHeaderColumns(headerCells, scanKeys);
//   const rows = [];

//   for (let i = headerLineIndex + 1; i < lines.length; i++) {
//     const line = lines[i];

//     // Skip summary / aggregate / footer rows
//     if (/^(total|aggregate|combined|subtotal|heritage|generated)/i.test(line))
//       continue;

//     const cells = splitLineIntoCells(line);
//     const cleanedCells = cells.filter((c) => !/^\d+$/.test(c));

//     if (cleanedCells.length < 2) continue;

//     const row = {};
//     let hasData = false;

//     scanKeys.forEach((keyObj) => {
//       const { key, type } = keyObj;
//       const colIndex = columnMapping[key];

//       if (colIndex !== undefined && colIndex < cleanedCells.length) {
//         let cellValue = cleanedCells[colIndex] || "";

//         if (type === "currency") {
//           const currencies = extractCurrencyValues(cellValue);
//           if (currencies.length > 0) {
//             cellValue = currencies[0];
//           }
//         } else if (type === "id") {
//           cellValue = cellValue.replace(/^#\s*/, "").trim();
//         }

//         if (cellValue) {
//           row[key] = collapseSpaces(cellValue);
//           hasData = true;
//         }
//       }
//     });

//     // Fallback for unstructured single-string lines
//     if (
//       !hasData ||
//       (!row.platformName && !row.memberNumber && !row.accountNumber)
//     ) {
//       const rawText = cleanedCells.join(" ");
//       const currencies = extractCurrencyValues(rawText);

//       if (currencies.length > 0) {
//         const idMatch = rawText.match(/([A-Z0-9]{3,12}-\d+|[A-Z]{2,6}\d{5,})/i);
//         if (idMatch) {
//           const idKeyObj = scanKeys.find((k) => k.type === "id") || scanKeys[1];
//           const currencyKeyObj =
//             scanKeys.find((k) => k.type === "currency") || scanKeys[2];

//           if (idKeyObj) row[idKeyObj.key] = idMatch[1];

//           const namePart = rawText
//             .split(idMatch[1])[0]
//             .replace(/^\d+\s*/, "")
//             .trim();
//           if (namePart) row.platformName = collapseSpaces(namePart);

//           if (currencyKeyObj) row[currencyKeyObj.key] = currencies[0];
//           hasData = true;
//         }
//       }
//     }

//     if (hasData) {
//       rows.push(row);
//     }
//   }

//   return rows;
// }

// pdfFieldExtractor.js

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
    console.warn("[PDF parser] Could not find header line matching scanKeys");
    return [];
  }

  const columnMapping = detectHeaderColumns(headerCells, scanKeys);
  const rows = [];

  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip summary / aggregate / footer rows
    if (/^(total|aggregate|combined|subtotal|heritage|generated)/i.test(line))
      continue;

    // Keep raw split cells so column indexes match header mapping 1:1
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

    // Fallback for un-delimited lines
    if (
      !hasData ||
      (!row.platformName && !row.memberNumber && !row.accountNumber)
    ) {
      const rawText = cells.join(" ");
      const currencies = extractCurrencyValues(rawText);

      if (currencies.length > 0) {
        const idMatch = rawText.match(/([A-Z0-9]{3,12}-\d+|[A-Z]{2,6}\d{5,})/i);
        if (idMatch) {
          const idKeyObj = scanKeys.find((k) => k.type === "id") || scanKeys[1];
          const currencyKeyObj =
            scanKeys.find((k) => k.type === "currency") || scanKeys[2];

          if (idKeyObj) row[idKeyObj.key] = idMatch[1];

          const namePart = rawText
            .split(idMatch[1])[0]
            .replace(/^\d+\s*/, "")
            .trim();
          if (namePart) row.platformName = collapseSpaces(namePart);

          if (currencyKeyObj) row[currencyKeyObj.key] = currencies[0];
          hasData = true;
        }
      }
    }

    if (hasData) {
      rows.push(row);
    }
  }

  return rows;
}

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
    const rows = parseTableRows(pdfText, scanKeys);
    results[file.name] = rows;
    if (debug)
      console.log(
        `[PDF parser] Extracted ${rows.length} rows from ${file.name}`,
        rows,
      );
  }

  return results;
}

// pdfFieldExtractor.js
export function applyExtractedRowsToForm({
  form,
  rowFieldName = "superFunds",
  rows = [],
  rowCountToFill = rows.length, // 3rd argument specifies HOW MANY rows to fill
  resolveFieldValue,
  fieldFormatters,
}) {
  if (!form || !rows.length) return null;

  try {
    const currentValues = form.getFieldValue(rowFieldName) || [];

    // Take only the specified number of rows from the extracted PDF rows
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

    // Fill/overwrite form rows starting from index 0 up to rowCountToFill
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
