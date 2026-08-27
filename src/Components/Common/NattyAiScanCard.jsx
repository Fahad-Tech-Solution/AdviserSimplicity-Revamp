import React, { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Card, Button, Typography, Alert, Col, Avatar, Select } from "antd";
import nattyAvatar from "../../assets/image/ProfileImages/NattyAI.png";


// Set worker source via official CDN matching your installed package version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const { Title } = Typography;

const NATTY_SCAN_SELECT_STYLES = {
  root: {
    background: "rgb(26, 46, 94)",
    border: "1px solid rgba(148, 163, 184, 0.45)",
    borderRadius: 8,
    color: "#fff",
    minWidth: 88,
  },
  option: {
    color: "#fff",
  },
  suffix: {
    color: "#fff",
  },
  content: {
    color: "#fff",
  },
};

// Generic helper to extract raw PDF text
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

export default function NattyAiScanCard({
  title = "Natty AI - Scan Document",
  subtitle = "Drag & drop PDF here, or click Scan PDF. Auto-fills form fields.",
  onScanComplete,
  parseFunction, // <-- Pass custom parser function here
  avatarSrc = nattyAvatar,
  accept = "application/pdf",
  showRowSelector = true,
  rowLabel = "Next row:",
  rowOptions = 1,
  rowCount = 1,
  activeTargetRow = 1,
  setActiveTargetRow = () => { },
  disabled = false,
  clientReport = false,
  createPDFFunction = () => { },
  createPdf = false,

}) {
  const pdfInputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState({ show: false, type: "info", message: "" });

  const processFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ show: true, type: "warning", message: "Please select a valid PDF document." });
      return;
    }

    setIsScanning(true);
    setStatus({ show: false, type: "info", message: "" });

    try {
      // 1. Extract raw text from PDF
      const pdfText = await extractPdfText(file);

      // 2. Run custom parser passed via props (or fallback to raw text if no parser)
      const parsedData = typeof parseFunction === "function" ? parseFunction(pdfText) : { rawText: pdfText };

      setStatus({ show: true, type: "success", message: `Successfully extracted data from ${file.name}` });

      // 3. Send parsed data back to parent form handler
      if (typeof onScanComplete === "function") {
        onScanComplete(parsedData);
      }
    } catch (err) {
      console.error("[NattyAiScanCard] Extraction Error:", err);
      setStatus({ show: true, type: "error", message: err?.message || "Failed to parse PDF document." });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Col xs={24} style={{ padding: "0 0 16px 0" }}>
      {status.show && (
        <Alert
          type={status.type}
          message={status.message}
          showIcon
          closable
          onClose={() => setStatus({ show: false, type: "info", message: "" })}
          style={{ marginBottom: 12 }}
        />
      )}

      <Card
        style={{
          borderRadius: 14,
          background: "linear-gradient(135deg, rgb(15, 28, 58), rgb(26, 46, 94))",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.18)",
          color: "#fff",
        }}
      >
        <input
          ref={pdfInputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) processFile(e.target.files[0]);
            e.target.value = "";
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar src={avatarSrc} alt="Natty AI" size={44} style={{ background: "#fff", border: "2px solid #3b82f6" }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#fff" }}>{title}</Title>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255, 255, 255, 0.65)" }}>{subtitle}</p>
            </div>
          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            {showRowSelector ? (
              <>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    fontFamily: "Arial, serif",
                    color: "rgba(255, 255, 255, 0.55)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {rowLabel}
                </span>
                <Select
                  value={activeTargetRow}
                  onChange={setActiveTargetRow}
                  options={rowOptions}
                  styles={NATTY_SCAN_SELECT_STYLES}
                  popupMatchSelectWidth={false}
                  disabled={disabled || isScanning}
                />
              </>
            ) : null}

            {
              clientReport && <>
                <Button
                  type="primary"
                  icon={"📄"}
                  onClick={createPDFFunction}
                  loading={createPdf}
                  disabled={disabled || createPdf}
                  style={{
                    height: 32,
                    borderRadius: 8,
                    fontWeight: 700,
                    fontFamily: "Arial, serif",
                    background: "#22c55e",
                    borderColor: "#22c55e",
                    boxShadow: "0 6px 16px #22c55e3f",
                    paddingInline: 15,
                    fontSize: 12,
                  }}
                >
                  Client Report
                </Button>
                <Button
                  icon={"✉️"}
                  type="primary"
                  style={{
                    height: 32,
                    borderRadius: 8,
                    fontWeight: 700,
                    fontFamily: "Arial, serif",
                    background: "#3b82f6",
                    borderColor: "#3b82f6",
                    boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
                    paddingInline: 15,
                    fontSize: 12,
                  }}
                >
                  Email Report
                </Button>
              </>
            }



            <Button
              type="primary"
              loading={isScanning}
              onClick={() => pdfInputRef.current?.click()}
              style={{
                height: 36,
                borderRadius: 8,
                fontWeight: 700,
                background: "#3b82f6",
                borderColor: "#3b82f6",
              }}
            >
              {isScanning ? "Scanning PDF..." : "Scan PDF(s)"}
            </Button>

          </div>
        </div>
      </Card>
    </Col>
  );
}