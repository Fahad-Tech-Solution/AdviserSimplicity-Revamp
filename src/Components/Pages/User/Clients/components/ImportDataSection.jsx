import React, { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { Upload, message, Card, Typography, Button, Space, Alert, Table, Tag } from 'antd';
import { InboxOutlined, FileExcelOutlined, WarningOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { MdCloudDownload, MdOutlineSync } from 'react-icons/md';
import AppModal from '../../../../Common/AppModal';
import useApi from '../../../../../hooks/useApi';
import IncompleteRowsEditor from './IncompleteRowsEditor';

const { Dragger } = Upload;
const { Text } = Typography;

// Helper: Check Australian Date Format (DD/MM/YYYY)
const isValidAustralianDate = (dateStr) => {
    if (!dateStr) return false;
    const dateString = String(dateStr).trim();
    const dateRegex = /^([0-2]?[0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(dateString)) return false;

    const [day, month, year] = dateString.split('/').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    return (
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getDate() === day
    );
};

// -------------------------------------------------------------
// CENTRALIZED VALIDATION RULES ARRAY
// Add, remove, or modify any validation rules directly here!
// -------------------------------------------------------------
const validationRules = [
    {
        id: 'australian-date-format',
        ruleMessage: 'Must follow Australian date format (DD/MM/YYYY), e.g., 25/12/1990.',
        // Dynamic key matcher: matches fields containing "date" or "dob"
        matchColumn: (colName) => {
            const lower = colName.toLowerCase();
            return lower.includes('date') || lower.includes('dob');
        },
        // Validation function: returns true if VALID, false if INVALID
        validate: (value) => isValidAustralianDate(value),
    },
    {
        id: 'valid-email-format',
        ruleMessage: 'Must contain a valid email address (e.g., user@example.com).',
        matchColumn: (colName) => colName.toLowerCase().includes('email'),
        validate: (value) => {
            if (!value) return true; // Skip empty if optional
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
        },
    },
    {
        id: 'australian-phone-format',
        ruleMessage: 'Must be a valid Australian phone number (e.g., 0412 345 678, +61412345678, or 02 1234 5678).',
        matchColumn: (colName) => {
            const lower = colName.toLowerCase();
            return lower.includes('phone') || lower.includes('contact') || lower.includes('mobile');
        },
        validate: (value) => {
            if (!value) return true; // Skip if optional/empty

            // Converts numeric values from Excel into strings before regex testing
            const stringVal = String(value).trim();

            return /^(?:\+61|0)[2-478](?:[ ]?\d){8}$/.test(stringVal);
        },
    },
    {
        id: 'australian-title-format',
        ruleMessage: 'Title must be one of: "Dr.", "Miss", "Mr.", "Mrs.", "Ms.", "Prof."',
        matchColumn: (colName) => colName.toLowerCase().includes('title'),
        validate: (value) => {
            if (!value) return true; // Skip if optional/empty

            const validTitles = ["Dr.", "Miss", "Mr.", "Mrs.", "Ms.", "Prof."];
            const stringVal = String(value).trim();

            return validTitles.includes(stringVal);
        },
    },
    {
        id: 'australian-MaritalStatus-formate',
        ruleMessage: 'Marital Status must be one of: "De Facto", "Married", "Partnered", "Single", "Widowed"',
        matchColumn: (colName) => colName.toLowerCase().includes('marital'),
        validate: (value) => {
            if (!value) return true; // Skip if optional/empty

            const validTitles = ["De Facto", "Married", "Partnered", "Single", "Widowed",];
            const stringVal = String(value).trim();

            return validTitles.includes(stringVal);
        },
    },
    {
        id: 'australian-workStatus-formate',
        ruleMessage: 'Marital Status must be one of:"Centrelink Recipient", "Centrelink Retiree", "Employee", "Homemaker", "Not Working", "Self Employed", "Self-funded Retiree", "Student", "Unemployed",',
        matchColumn: (colName) => colName.toLowerCase().includes('Work Status'),
        validate: (value) => {
            if (!value) return true; // Skip if optional/empty

            const validTitles = ["Centrelink Recipient",
                "Centrelink Retiree",
                "Employee",
                "Homemaker",
                "Not Working",
                "Self Employed",
                "Self-funded Retiree",
                "Student",
                "Unemployed",];
            const stringVal = String(value).trim();

            return validTitles.includes(stringVal);
        },
    },
    {
        id: 'australian-yes-no-format',
        ruleMessage: 'Value must be either "Yes" or "No".',
        matchColumn: (colName) => {
            const lower = colName.toLowerCase();
            return (
                lower.includes('tax resident') ||
                lower.includes('help debt') ||
                lower.includes('smoker') ||
                lower.includes('private health')
            );
        },
        validate: (value) => {
            if (!value) return true; // Skip if optional/empty

            const validValues = ["Yes", "No"];
            const stringVal = String(value).trim();

            return validValues.includes(stringVal);
        },
    },
    {
        id: 'australian-health-status-format',
        ruleMessage: 'Health status must be one of: "Average", "Excellent", "Good", "Poor".',
        matchColumn: (colName) => {
            const lower = colName.toLowerCase().trim();
            // Matches exact "health" or "partner health", but excludes anything with "cover" or "private"
            return lower.includes('health') && !lower.includes('cover') && !lower.includes('private');
        },
        validate: (value) => {
            if (!value) return true; // Skip if optional/empty

            const validHealthOptions = ["Average", "Excellent", "Good", "Poor"];
            const stringVal = String(value).trim();

            return validHealthOptions.includes(stringVal);
        },
    },
    {
        id: 'australian-Gender-formate',
        ruleMessage: 'Gender must be one of: "Female", "Male", "Other"',
        matchColumn: (colName) => colName.toLowerCase().includes('gender'),
        validate: (value) => {
            if (!value) return true; // Skip if optional/empty

            const validTitles = ["Female", "Male", "Other"];
            const stringVal = String(value).trim();

            return validTitles.includes(stringVal);
        },
    },
];

const ImportDataSection = ({ open, onClose, title, width = '40vw' }) => {
    const [fileInfo, setFileInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const { getBlob, post } = useApi();

    // Generic Dynamic Validator Engine
    const validateExcelData = (jsonData) => {
        const errors = [];
        const seenErrors = new Set();

        jsonData.forEach((row) => {
            Object.keys(row).forEach((colName) => {
                const value = row[colName];

                // Run each rule against the current column
                validationRules.forEach((rule) => {
                    if (rule.matchColumn(colName)) {
                        const isValid = rule.validate(value);

                        if (!isValid) {
                            const errorKey = `${colName}-${rule.id}`;
                            if (!seenErrors.has(errorKey)) {
                                seenErrors.add(errorKey);
                                errors.push({
                                    key: errorKey,
                                    columnName: colName,
                                    rule: rule.ruleMessage,
                                });
                            }
                        }
                    }
                });
            });
        });

        return errors;
    };

    const processExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', raw: false });

                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                    // Check max 40 entries
                    if (jsonData.length > 40) {
                        message.error(`File contains ${jsonData.length} entries. Maximum allowed is 40 entries.`);
                        return reject(new Error('Exceeds entry limit'));
                    }

                    // Dynamic Validation Check
                    const errors = validateExcelData(jsonData);
                    if (errors.length > 0) {
                        setValidationErrors(errors);
                        return reject(new Error('Validation errors found'));
                    }

                    const parsedInfo = {
                        name: file.name,
                        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                        rowCount: jsonData.length,
                        sheetName: firstSheetName,
                        data: jsonData,
                    };

                    resolve(parsedInfo);
                } catch (error) {
                    if (error.message !== 'Validation errors found' && error.message !== 'Exceeds entry limit') {
                        message.error('Failed to parse the Excel file.');
                    }
                    reject(error);
                }
            };

            reader.onerror = () => {
                message.error('Error reading file.');
                reject(new Error('Read error'));
            };

            reader.readAsArrayBuffer(file);
        });
    };

    const handleParsing = async (file) => {
        setLoading(true);
        setValidationErrors([]);

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('File size must be smaller than 5 MB!');
            setLoading(false);
            return;
        }

        try {
            const parsedInfo = await processExcelFile(file);
            // console.log(parsedInfo.data)
            setFileInfo(parsedInfo);
            message.success(`${file.name} uploaded and processed successfully.`);
        } catch (error) {
            if (error.response) {
                message.error(error.response?.data?.message || 'Failed to upload the file.');
            }
        } finally {
            setLoading(false);
        }
    };

    const uploadProps = {
        name: 'file',
        multiple: false,
        accept: '.xlsx, .xls',
        showUploadList: false,
        beforeUpload: (file) => {
            const isExcel =
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel' ||
                file.name.endsWith('.xlsx') ||
                file.name.endsWith('.xls');

            if (!isExcel) {
                message.error('You can only upload Excel files (.xlsx or .xls)!');
                return Upload.LIST_IGNORE;
            }

            handleParsing(file);
            return false;
        },
    };

    const handleReset = () => {
        setFileInfo(null);
        setValidationErrors([]);
    };

    const handleDownloadTemplate = async () => {
        try {
            // 1. Fetch file as Blob
            const response = await getBlob("/clientImport/template"); // Update with your actual endpoint

            // 2. Extract filename from headers (Optional) or hardcode it
            const contentDisposition = response.headers["content-disposition"];
            let filename = "Client_Import_Template.xlsx";
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";]+)"?/);
                if (match && match[1]) filename = match[1];
            }

            // 3. Create URL and trigger download
            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();

            // 4. Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download template:", error);
        }
    };

    const errorColumns = [
        {
            title: 'Column Name',
            dataIndex: 'columnName',
            key: 'columnName',
            width: '35%',
            render: (text) => <Tag color="red" style={{ fontWeight: 'bold' }}>{text}</Tag>,
        },
        {
            title: 'Required Formatting Rule',
            dataIndex: 'rule',
            key: 'rule',
        },
    ];

    // Helper to calculate age from DD/MM/YYYY format
    const calculateAge = (dobString) => {
        if (!dobString) return null;
        const parts = dobString.split('/');
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
        const year = parseInt(parts[2], 10);

        const dob = new Date(year, month, day);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        return age;
    };

    const handleImportSubmit = async (finalRows) => {
        // Transform each row into the required payload structure
        const payload = finalRows.filter((row) => !row._isSkipped).map((row) => {
            return ({
                clientTitle: row["Title"] || "",
                clientGivenName: row["First Name"] || "",
                clientMiddleName: row["Middle Name"] || "",
                clientLastName: row["Last Name"] || "",
                clientPreferredName: row["Preferred Name"] || "",
                clientGender: row["Gender"] || "",
                clientDOB: row["Date of Birth"] || "",
                clientAge: calculateAge(row["Date of Birth"]),
                clientMaritalStatus: row["Marital Status"] || "",
                clientEmploymentStatus: row["Work Status"] || "",
                clientHealth: row["Health"] || "",
                clientSmoker: row["Smoker"] || "",
                clientPlannedRetirementAge: row["Retirement Age"] ? parseInt(row["Retirement Age"], 10) : null,
                clientHomeAddress: row["Home Address"] || "",
                clientPostcode: row["Home Postcode"] || "",
                clientHomePhone: row["Home Phone"] || "",
                clientWorkPhone: row["Work Phone"] || "",
                clientMobile: row["Mobile Phone"] || "",
                Email: row["Email"] || "",
                clientPostalAddress: row["Postal Address"] || "",
                clientPostalPostCode: row["Postal Postcode"] || "",
                clientOccupationID: row["Occupation"] || "",
                clientTaxResidentRadio: row["Tax Resident"] || "No",
                clientPrivateHealthCoverRadio: row["Private Health Cover"] || "No",
                clientHELPSDebtRadio: row["HELP Debt"] || "No",
                clientSameAsAbove: false,

                partnerTitle: row["Partner Title"] || "",
                partnerGivenName: row["Partner First Name"] || "",
                partnerMiddleName: row["Partner Middle Name"] || "",
                partnerLastName: row["Partner Last Name"] || "",
                partnerPreferredName: row["Partner Preferred Name"] || "",
                partnerGender: row["Partner Gender"] || "",
                partnerDOB: row["Partner Date of Birth"] || "",
                partnerAge: calculateAge(row["Partner Date of Birth"]),
                partnerMaritalStatus: row["Partner Marital Status"] || "",
                partnerEmploymentStatus: row["Partner Work Status"] || "",
                partnerHealth: row["Partner Health"] || "",
                partnerSmoker: row["Partner Smoker"] || "",
                partnerPlannedRetirementAge: row["Partner Retirement Age"] ? parseInt(row["Partner Retirement Age"], 10) : null,
                partnerHomeAddress: row["Partner Home Address"] || "",
                partnerPostcode: row["Partner Postcode"] || "",
                partnerHomePhone: row["Partner Home Phone"] || "",
                partnerWorkPhone: row["Partner Work Phone"] || "",
                partnerMobile: row["Partner Mobile"] || "",
                partnerEmail: row["Partner Email"] || "",
                partnerPostalAddress: row["Partner Postal Address"] || "",
                partnerPostalPostCode: row["Partner Postal Postcode"] || "",
                partnerOccupationID: row["Partner Occupation"] || "",
                partnerTaxResidentRadio: row["Partner Tax Resident"] || "No",
                partnerPrivateHealthCoverRadio: row["Partner Private Health Cover"] || "No",
                partnerHELPSDebtRadio: row["Partner HELP Debt"] || "No",
                partnerSameAsClient: row["Home Address"] === row["Partner Home Address"] && Boolean(row["Partner Home Address"])
            })
        });

        try {
            const response = await post('/clientImport', payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            return error.response?.data
        }
    };

    // Inside your component:
    const enrichedData = useMemo(() => {
        if (!fileInfo?.data) return [];

        return fileInfo.data.map((row, idx) => ({
            ...row,
            _key: row.key || `row_${idx}`,
            _isSkipped: false,
            _status: 'pending',
        }));
    }, [fileInfo?.data]);

    return (
        <AppModal
            open={open}
            onClose={() => {
                setValidationErrors([]);
                setFileInfo("");
                onClose()
            }}
            title={title}
            width={validationErrors.length > 0 ? '50vw' : fileInfo ? '80vw' : width}
        >
            <div className="mt-3">
                {!fileInfo ? (
                    <>
                        <Dragger {...uploadProps} disabled={loading}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Click or drag Excel file to this area to upload</p>
                            <p className="ant-upload-hint">
                                Please upload an <strong>.xlsx</strong> or <strong>.xls</strong> file. Up to <strong>40 entries</strong> and maximum file size of <strong>5 MB</strong> allowed.
                            </p>
                        </Dragger>

                        {validationErrors.length > 0 && (
                            <Card
                                style={{ marginTop: 16, borderColor: '#ff4d4f' }}
                                title={
                                    <Space style={{ color: '#ff4d4f' }}>
                                        <WarningOutlined />
                                        <span>File Validation Rules Failed</span>
                                    </Space>
                                }
                            >
                                <Alert
                                    message="Please fix the following formatting issues in your Excel file and try uploading again:"
                                    type="error"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                                <Table
                                    columns={errorColumns}
                                    dataSource={validationErrors}
                                    pagination={false}
                                    size="small"
                                    bordered
                                />
                            </Card>
                        )}

                        <Button
                            style={{ margin: '10px 0px 0px 0px', width: '100%' }}
                            type="primary"
                            icon={<MdCloudDownload />}
                            onClick={handleDownloadTemplate}
                            loading={downloadingTemplate}
                        >
                            Download Template
                        </Button>
                    </>
                ) : (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <IncompleteRowsEditor
                            data={enrichedData}
                            onProceed={handleImportSubmit}
                            handleReset={handleReset}
                        />
                    </Space>
                )}
            </div>
        </AppModal>
    );
};

export default ImportDataSection;