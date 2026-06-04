import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Alert,
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Col,
  Select,
  Typography,
} from "antd";
import nattyAvatar from "../../assets/image/ProfileImages/NattyAI.png";
import {
  applyExtractedFieldsToFormRow,
  extractFieldsFromPdfFiles,
  normalizeScanKeys,
} from "../../utils/pdf/pdfFieldExtractor";

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

const DEFAULT_TITLE = "Natty AI - Scan Platform Investment Statement(s)";
const DEFAULT_SUBTITLE =
  "Drag & drop platform investment PDFs here, or click Scan PDF(s). Auto-fills holdings.";

const DROP_ZONE_BG_IDLE =
  "linear-gradient(135deg, rgb(15, 28, 58), rgb(26, 46, 94))";
const DROP_ZONE_BG_ACTIVE =
  "linear-gradient(135deg, rgb(28, 52, 102), rgb(42, 72, 138))";

export default function NattyAiScanCard({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  rowCount = 1,
  rowOptions: rowOptionsProp,
  targetRow,
  defaultTargetRow = 1,
  onTargetRowChange,
  scanKeys = [],
  form,
  rowFieldName = "managedFunds",
  fieldFormatters,
  resolveFieldValue,
  onScanComplete,
  onAfterFormUpdate,
  onFilesSelected,
  onScanClick,
  showRowSelector = true,
  rowLabel = "Next row:",
  avatarSrc = nattyAvatar,
  buttonText = "Scan PDF(s)",
  scanButtonLoading = false,
  disabled = false,
  debugScan = import.meta.env.DEV,
  accept = "application/pdf,.pdf",
  multiple = true,
  style,
}) {
  const { message } = AntdApp.useApp();
  const pdfInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [scanDragActive, setScanDragActive] = useState(false);
  const [scanStatus, setScanStatus] = useState({ show: false, type: "error", message: "" });
  const [isScanning, setIsScanning] = useState(false);
  const [internalTargetRow, setInternalTargetRow] = useState(defaultTargetRow);

  const normalizedScanKeys = useMemo(
    () => normalizeScanKeys(scanKeys),
    [scanKeys],
  );
  const canExtractFields = normalizedScanKeys.length > 0;

  const isControlled = targetRow !== undefined;
  const activeTargetRow = isControlled ? targetRow : internalTargetRow;

  const setActiveTargetRow = (value) => {
    if (isControlled) {
      onTargetRowChange?.(value);
      return;
    }
    setInternalTargetRow(value);
  };

  const rowOptions = useMemo(() => {
    if (Array.isArray(rowOptionsProp) && rowOptionsProp.length) {
      return rowOptionsProp;
    }

    return Array.from(
      { length: Math.max(Number(rowCount) || 1, 1) },
      (_, index) => ({
        value: index + 1,
        label: `Row ${index + 1}`,
      }),
    );
  }, [rowCount, rowOptionsProp]);

  useEffect(() => {
    const maxRow = rowOptions[rowOptions.length - 1]?.value || 1;
    if (activeTargetRow > maxRow) {
      setActiveTargetRow(maxRow);
    }
  }, [activeTargetRow, rowOptions]);

  const hideStatus = () => {
    setScanStatus({ show: false, type: "error", message: "" });
  };

  const runPdfScan = async (fileList) => {
    const files = Array.from(fileList || []).filter(
      (file) =>
        String(file?.type || "").includes("pdf") ||
        String(file?.name || "").toLowerCase().endsWith(".pdf"),
    );

    if (!files.length) {
      message.warning("Please upload PDF files only.");
      return;
    }

    if (!canExtractFields) {
      onFilesSelected?.(files, activeTargetRow);
      message.info(
        `Selected ${files.length} PDF(s) for row ${activeTargetRow}. Pass scanKeys to enable auto-fill.`,
      );
      return;
    }

    setIsScanning(true);
    hideStatus();

    try {
      const extracted = await extractFieldsFromPdfFiles(files, normalizedScanKeys, {
        debug: debugScan,
      });

      if (debugScan) {
        console.log("[Natty PDF Scan] Extracted fields for form:", extracted);
      }
      const filledKeys = Object.keys(extracted).filter((key) =>
        String(extracted[key] ?? "").trim(),
      );

      if (!filledKeys.length) {
        setScanStatus({
          show: true,
          type: "warning",
          message:
            "Could not find matching fields in the PDF. Check scanKeys labels match the statement.",
        });
        return;
      }

      let formUpdate = null;
      if (form) {
        formUpdate = applyExtractedFieldsToFormRow({
          form,
          rowFieldName,
          targetRow: activeTargetRow,
          extracted,
          fieldFormatters,
          resolveFieldValue,
        });
        onAfterFormUpdate?.(formUpdate?.rows, activeTargetRow, extracted, formUpdate);
      }

      onScanComplete?.({
        targetRow: activeTargetRow,
        extracted,
        files,
        formUpdate,
      });

      message.success(
        `Filled ${filledKeys.length} field(s) on row ${activeTargetRow} from PDF.`,
      );
    } catch (error) {
      setScanStatus({
        show: true,
        type: "error",
        message: error?.message || "Failed to read PDF. Please try another file.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handlePdfFiles = (fileList) => {
    if (disabled || isScanning) return;
    runPdfScan(fileList);
  };

  const handleScanPdfClick = () => {
    if (disabled || isScanning) return;

    if (onScanClick) {
      onScanClick(activeTargetRow);
      return;
    }

    pdfInputRef.current?.click();
  };

  const resetDragState = () => {
    dragDepthRef.current = 0;
    setScanDragActive(false);
  };

  const handleDragEnter = (event) => {
    if (disabled) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    if (dragDepthRef.current === 1) {
      setScanDragActive(true);
    }
  };

  const handleDragLeave = (event) => {
    if (disabled) return;

    const nextTarget = event.relatedTarget;
    if (nextTarget && dropZoneRef.current?.contains(nextTarget)) {
      return;
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setScanDragActive(false);
    }
  };

  const handleDragOver = (event) => {
    if (disabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event) => {
    if (disabled) return;
    event.preventDefault();
    resetDragState();
    handlePdfFiles(event.dataTransfer?.files);
  };

  const isButtonLoading = scanButtonLoading || isScanning;

  return (
    <Col xs={24} md={24}>
      {scanStatus.show ? (
        <motion.div
          initial={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Alert
            type={scanStatus.type}
            showIcon
            description={scanStatus.message}
            style={{ padding: 10, marginBottom: 10 }}
            closable
            onClose={hideStatus}
            styles={{
              close: {
                width: "auto",
                height: "auto",
              },
              root: {
                width: "auto",
                height: "auto",
                color: "#000",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            }}
          />
        </motion.div>
      ) : null}
      <Card
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "none",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.18)",
          ...style,
        }}
        styles={{
          body: {
            padding: 0,
            background: "transparent",
          },
        }}
      >
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            background: scanDragActive
              ? DROP_ZONE_BG_ACTIVE
              : DROP_ZONE_BG_IDLE,
            border: scanDragActive
              ? "1px solid #60a5fa"
              : "1px solid rgba(59, 130, 246, 0.25)",
            boxShadow: scanDragActive
              ? "0 0 0 2px rgba(59, 130, 246, 0.25)"
              : "none",
            transition:
              "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          <input
            ref={pdfInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            style={{ display: "none" }}
            disabled={disabled || isScanning}
            onChange={(event) => {
              handlePdfFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
                flex: "1 1 280px",
              }}
            >
              <Avatar
                src={avatarSrc}
                alt="Natty AI"
                size={44}
                style={{
                  flexShrink: 0,
                  background: "#ffffff",
                  border: "2px solid #3b82f6",
                  scale: 1.1,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Arial, serif",
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </Title>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 11,
                    fontWeight: 400,
                    fontFamily: "Arial, serif",
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.55)",
                  }}
                >
                  {subtitle}
                </p>
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
              <Button
                type="primary"
                onClick={handleScanPdfClick}
                loading={isButtonLoading}
                disabled={disabled || isScanning}
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
                {buttonText}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Col>
  );
}
