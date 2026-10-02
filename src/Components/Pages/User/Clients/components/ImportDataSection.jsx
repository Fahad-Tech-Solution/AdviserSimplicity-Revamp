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
    // {
    //     id: 'australian-date-format',
    //     ruleMessage: 'Must follow Australian date format (DD/MM/YYYY), e.g., 25/12/1990.',
    //     // Dynamic key matcher: matches fields containing "date" or "dob"
    //     matchColumn: (colName) => {
    //         const lower = colName.toLowerCase();
    //         return lower.includes('date') || lower.includes('dob');
    //     },
    //     // Validation function: returns true if VALID, false if INVALID
    //     validate: (value) => isValidAustralianDate(value),
    // },
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

const REQUIRED_COLUMNS = ['Last Name', 'Preferred Name', 'Date of Birth', "Gender", 'Marital Status', 'Home Address', 'Home Postcode', 'Email', 'Mobile Phone', 'Postal Address', 'Postal Postcode',]; // Define your required column names here
const PARTNER_REQUIRED_COLUMNS = ['Partner Last Name', 'Partner Preferred Name', 'Partner Date of Birth', 'Partner Gender', 'Marital Status', 'Partner Home Address', 'Partner Postcode', 'Partner Email', 'Partner Mobile', 'Partner Postal Address', 'Partner Postal Postcode',]; // Define your required column names here

// Helper to check for missing/empty values
const isValueEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const ImportDataSection = ({ open, onClose, title, width = '40vw' }) => {
    const [fileInfo, setFileInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [downloadingCSVTemplate, setDownloadingCSVTemplate] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [ErrorDetails, setErrorDetails] = useState([]);
    const { getBlob, post } = useApi();

    // Generic Dynamic Validator Engine
    const validateExcelData = (jsonData) => {
        const errors = [];
        const seenErrors = new Set();

        jsonData.forEach((row, rowIndex) => {
            const rowNumber = rowIndex + 1;

            // 1. Validate Standard Required Columns
            REQUIRED_COLUMNS.forEach((colName) => {
                if (isValueEmpty(row[colName])) {
                    const errorKey = `${colName}-required-row-${rowNumber}`;
                    if (!seenErrors.has(errorKey)) {
                        seenErrors.add(errorKey);
                        errors.push({
                            key: errorKey,
                            columnName: colName,
                            rule: `Column "${colName}" is required and cannot be empty (Row ${rowNumber + 1}).`,
                        });
                    }
                }
            });


            // 3. Dynamic Rule Validation for Available Columns
            Object.keys(row).forEach((colName) => {
                const value = row[colName];

                validationRules.forEach((rule) => {
                    if (rule.matchColumn(colName)) {
                        const isValid = rule.validate(value);

                        if (!isValid) {
                            const errorKey = `${colName}-${rule.id}-row-${rowNumber}`;
                            if (!seenErrors.has(errorKey)) {
                                seenErrors.add(errorKey);
                                errors.push({
                                    key: errorKey,
                                    columnName: colName,
                                    rule: `${rule.ruleMessage} (Row ${rowNumber})`,
                                });
                            }
                        }
                    }
                });

            });

            // 2. Conditional Check for Partner Required Columns
            const maritalStatus = String(row['Marital Status'] || '').trim();
            const partnerNotRequired = ['', 'Single', 'Widowed'];
            const AllowedValues = ["De Facto", "Married", "Partnered", "Single", "Widowed"];

            // If marital status is filled and is NOT in partnerNotRequired list
            if (maritalStatus && AllowedValues.includes(maritalStatus) && !partnerNotRequired.includes(maritalStatus)) {
                PARTNER_REQUIRED_COLUMNS.forEach((colName) => {
                    if (isValueEmpty(row[colName])) {
                        const errorKey = `${colName}-required-row-${rowNumber}`;
                        if (!seenErrors.has(errorKey)) {
                            seenErrors.add(errorKey);
                            errors.push({
                                key: errorKey,
                                columnName: colName,
                                rule: `Column "${colName}" is required when Marital Status is "${maritalStatus}" (Row ${rowNumber}).`,
                            });
                        }
                    }
                });
            }

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
                    // if (jsonData.length > 40) {
                    //     message.error({
                    //         content: `File contains ${jsonData.length} entries. Maximum allowed is 40 entries.`,
                    //         key: "data_extraction_status",
                    //         duration: 5,
                    //     });
                    //     return reject(new Error('Exceeds entry limit'));
                    // }

                    // Dynamic Validation Check
                    const errors = validateExcelData(jsonData);
                    if (errors.length > 0) {
                        setValidationErrors(errors);
                        message.error({
                            content: 'Validation errors found in the file.',
                            key: "data_extraction_status",
                            duration: 5,
                        });
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
                        message.error({
                            content: 'Failed to parse the Excel file.',
                            key: "data_extraction_status",
                            duration: 5,
                        });
                    }
                    reject(error);
                }
            };

            reader.onerror = () => {
                message.error({
                    content: 'Error reading file.',
                    key: "data_extraction_status",
                    duration: 5,
                });
                reject(new Error('Read error'));
            };

            reader.readAsArrayBuffer(file);
        });
    };

    const handleParsing = async (file) => {
        setLoading(true);
        setValidationErrors([]);
        setErrorDetails([]);

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error({
                content: 'File size must be smaller than 5 MB!',
                key: "data_extraction_status",
                duration: 5,
            });
            setLoading(false);
            return;
        }

        message.loading({
            content: `Extracting data from uploaded file...`,
            key: "data_extraction_status",
            duration: 0,
        });

        try {
            const parsedInfo = await processExcelFile(file);
            setFileInfo(parsedInfo);

            // Upload to backend
            const formData = new FormData();
            formData.append('file', file);
            let response = await post('/clientImport', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response?.success) {
                message.success({
                    content: `${response?.message || file.name + ' uploaded successfully!'}`,
                    key: "data_extraction_status",
                    duration: 5,
                });
            } else {
                message.error({
                    content: response?.message || 'Upload failed.',
                    key: "data_extraction_status",
                    duration: 5,
                });
            }

        } catch (error) {
            // If it's a backend API response error
            if (error.response) {
                message.error({
                    content: error.response?.data?.message || 'Failed to upload the file.',
                    key: "data_extraction_status",
                    duration: 5,
                });
                setErrorDetails(error.response?.data?.errors || []);
            } else if (
                error.message !== 'Validation errors found' &&
                error.message !== 'Exceeds entry limit' &&
                error.message !== 'Read error'
            ) {
                // Fallback clear for any unhandled client-side runtime errors
                message.error({
                    content: error.message || 'An unexpected error occurred.',
                    key: "data_extraction_status",
                    duration: 5,
                });
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

    const handleDownloadTemplate = async (fileType) => {
        try {
            if (fileType === "xlsx") {
                setDownloadingTemplate(true);
            }
            else {
                setDownloadingCSVTemplate(true);
            }
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
        finally {
            setDownloadingTemplate(false);
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
            title: 'Validation Rule',
            dataIndex: 'rule',
            key: 'rule',
        },
    ];

    const apiErrorColumns = [
        // {
        //     title: 'Email',
        //     dataIndex: 'email',
        //     key: 'email',
        //     width: '35%',
        //     render: (text) => <Tag color="red" style={{ fontWeight: 'bold' }}>{text}</Tag>,
        // },
        {
            title: 'Column Name',
            dataIndex: 'column',
            key: 'column',
            width: '35%',
        },
        {
            title: 'Message',
            dataIndex: 'message',
            key: 'message',
            render: (text, record) => {
                return (
                    <>
                        {record?.row &&
                            <Tag color="yellow" style={{ fontWeight: 'bold' }}>row #{record?.row}</Tag>
                        }
                        {text}
                        {record?.email &&
                            <Tag color="red" style={{ fontWeight: 'bold' }}>{record?.email}</Tag>
                        }
                    </>
                )
            },
        },
    ];


    return (
        <AppModal
            open={open}
            onClose={() => {
                setValidationErrors([]);
                setErrorDetails([]);
                setFileInfo("");
                onClose()
            }}
            title={title}
            width={validationErrors.length > 0 ? '50vw' : width}
        >
            <div className="mt-3">
                <Dragger {...uploadProps} disabled={loading}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag Excel file to this area to upload</p>
                    <p className="ant-upload-hint">
                        Please upload an <strong>.xlsx</strong>,
                        or <strong>.xls </strong>
                        {/* <strong>.xls</strong> or <strong>.csv</strong> */}

                        file. Up to <strong>40 entries</strong> and maximum file size of <strong>5 MB</strong> allowed.
                        <br />
                        All red columns in excel sheet are required for the <strong>client</strong>.
                        <br />
                        All green columns in excel sheet are required for the <strong>partner</strong>, if a partner exists.
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

                {ErrorDetails.length > 0 && (
                    <Card
                        style={{ marginTop: 16, borderColor: '#ff4d4f' }}
                        title={
                            <Space style={{ color: '#ff4d4f' }}>
                                <WarningOutlined />
                                <span>Upload Errors</span>
                            </Space>
                        }
                    >
                        <Alert
                            message="The following errors were encountered while processing your file:"
                            type="error"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <Table
                            columns={apiErrorColumns}
                            dataSource={ErrorDetails}
                            pagination={false}
                            size="small"
                            bordered
                        />
                    </Card>
                )}
                {/* <div className='d-flex justify-content-center align-items-center gap-4'> */}
                <Button
                    style={{
                        margin: '10px 0px 0px 0px', width: '100%',
                        height: '40px'
                    }}
                    type="primary"
                    icon={<MdCloudDownload />}
                    onClick={() => handleDownloadTemplate("xlsx")}
                    loading={downloadingTemplate}
                >
                    Download .xlsx Template
                </Button>
                {/* <Button
                        style={{ margin: '10px 0px 0px 0px', width: '50%' }}
                        type="primary"
                        icon={<MdCloudDownload />}
                        onClick={() => handleDownloadTemplate("csv")}
                        loading={downloadingCSVTemplate}
                    >
                        Download .csv Template
                    </Button>
                </div> */}
            </div>
        </AppModal>
    );
};

export default ImportDataSection;