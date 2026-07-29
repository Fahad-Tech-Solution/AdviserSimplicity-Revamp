import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates a landscape Personal Insurance PDF report based on form table data.
 *
 * @param {Array} columns - Array of column definitions from your React component.
 * @param {Array|Object} formData - Form records (rows) to render in the table.
 * @param {Object} options - Additional options like title, subtitle, owner name, etc.
 */
export const generatePersonalInsurancePdf = (
  columns = [],
  formData = [],
  options = {},
) => {
  const {
    title = "Personal Insurance Statement",
    subtitle = "Comprehensive overview mapped strictly to PERSONAL_INSURANCE_PDF_SCAN_KEYS schema",
    fileName = "personal_insurance_keys.pdf",
    ownerLabel = "Client",
    providerOptions = [],
  } = options;

  // Initialize PDF in Landscape A4 mode to fit all columns on 1 line
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Filter out non-data columns (like No# or Action buttons)
  const validColumns = columns.filter(
    (col) =>
      col.key !== "index" && col.key !== "action" && col.title !== "Action",
  );

  // Extract table headers
  const tableHeaders = [validColumns.map((col) => col.title)];

  // Ensure formData is an array
  const rowsData = Array.isArray(formData) ? formData : [];

  // Extract table body rows
  const tableRows = rowsData.map((row) => {
    return validColumns.map((col) => {
      const dataIndex = col.dataIndex;
      let rawValue = row?.[dataIndex];

      // Format provider values if ID is present
      if (dataIndex === "provider" && providerOptions.length > 0) {
        const matched = providerOptions.find(
          (opt) => String(opt.value) === String(rawValue),
        );
        if (matched) rawValue = matched.value || matched.label;
      }

      // Format Owner value fallback
      if (dataIndex === "Owner" && !rawValue) {
        rawValue = ownerLabel.toLowerCase();
      }

      // Convert boolean/switches to Yes/No
      if (typeof rawValue === "boolean") {
        rawValue = rawValue ? "Yes" : "No";
      }

      return rawValue ?? "";
    });
  });

  // --- Document Header ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text(title, 14, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(subtitle, 14, 21);

  // Divider Line
  doc.setDrawColor(2, 132, 199); // #0284c7
  doc.setLineWidth(0.5);
  doc.line(14, 24, 283, 24);

  // --- Render Table ---
  autoTable(doc, {
    startY: 28,
    head: tableHeaders,
    body: tableRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      halign: "left",
      valign: "middle",
      textColor: [51, 65, 85], // #334155
    },
    headStyles: {
      fillColor: [15, 23, 42], // Dark Header (#0f172a)
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Subtle striping (#f8fafc)
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // --- Footer ---
      const pageHeight =
        doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // #94a3b8
      doc.text(
        "Generated directly from PERSONAL_INSURANCE_PDF_SCAN_KEYS schema • Confidential",
        14,
        pageHeight - 10,
      );
    },
  });

  // Save the generated PDF
  doc.save(fileName);
};
