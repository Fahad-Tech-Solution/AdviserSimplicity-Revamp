import { useMemo, useState } from 'react'
import {
    Button,
    Col,
    Collapse,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Typography,
    Upload,
    message,
    Spin
} from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { CloseOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons'
import React from 'react'
import { SelectedCategory } from './knowledgeBaseData'
import { extractPdfText, parsePdfIntoFormValues } from '../../../../utils/pdf/pdfFieldExtractor'
import useApi from '../../../../hooks/useApi'


const { Title, Text } = Typography
const { Panel } = Collapse
const { Dragger } = Upload

// Turns "Non-concessional contributions cap" into "non-concessional-contributions-cap"
const slugify = (value = '') =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

const KnowledgeEntryForm = ({
    ADD_FORM_ID,
    form,
    handleAddEntry,
    FieldLabel,
    KNOWLEDGE_CATEGORIES, // Topic options: [{ label, value }]
    SUBCATEGORY_OPTIONS = [], // Subcategory options: [{ label, value }]
    onExtractPdf, // optional handler(file) -> extracted text
    entry = {
        "title": "",
        "topic": "",
        "subcategory": "",
        "slugId": "",
        "tag": "",
        "boost": "",
        "keywords": [],
        "snippet": "",
        "explanation": "",
        "note": "",
        "example": "",
        "relatedEntries": "",
        "statBoxes": [
            {
                "key": "",
                "value": ""
            },
        ]
    }, // optional existing entry to pre-fill the form for editing
    isEdit = false, // optional flag indicating if this is an edit form
}) => {
    // Track whether the ID / Tag fields have been hand-edited so we stop
    // overwriting them once the adviser has typed their own value in.
    const [idTouched, setIdTouched] = useState(false)
    const [tagTouched, setTagTouched] = useState(false)
    const [preview, setPreview] = useState(null)
    const { post } = useApi();

    // inside your component, where `form` is your Form instance:
    const [extractedText, setExtractedText] = useState('');
    const [pdfLoading, setPdfLoading] = useState(false);

    const categoryOptions = SelectedCategory.map((category) => ({
        value: category.value,
        label: category.label,
        subCategories: category.subCategories,
    }))

    const [subcategoryOptions, setSubcategoryOptions] = useState(SUBCATEGORY_OPTIONS)


    const handleTitleChange = (e) => {
        const title = e.target.value
        if (!idTouched) {
            form.setFieldValue('id', slugify(title))
        }
    }

    const handleTopicChange = (topicValue) => {
        if (!tagTouched) {
            const topicLabel =
                KNOWLEDGE_CATEGORIES?.find((c) => c.value === topicValue)?.label ?? topicValue
            form.setFieldValue('tag', topicLabel)
        }
        // Update subcategory options based on selected topic
        const subs = categoryOptions.find((c) => c.value === topicValue)?.subCategories ?? []
        // map subs to Select options if needed (assume subs are { label, value } or strings)
        const mapped = subs.map((s) => (typeof s === 'string' ? { label: s, value: s } : s))
        setSubcategoryOptions(mapped)
        // clear any previously selected subcategory
        form.setFieldValue('subcategory', undefined)
    }

    const handleValuesChange = () => {
        setPreview(form.getFieldsValue())
    }


    const draggerProps = {
        accept: '.pdf',
        multiple: false,
        showUploadList: false,
        beforeUpload: async (file) => {
            setPdfLoading(true);
            try {
                // 1. Prepare the requested keys to extract
                const fieldsArray = [
                    "Title",
                    "Topic",
                    "Subcategory",
                    "ID",
                    "Tag",
                    "Boost",
                    "Keywords",
                    "Snippet",
                    "Explanation",
                    "Note",
                    "Example",
                    "RelatedEntries",
                    "stat boxes",
                    "Plain-English explaination"
                ];

                // 2. Wrap file and fields inside FormData for multipart/form-data request
                const formData = new FormData();
                formData.append("file", file);

                // Since your Express backend expects a comma-separated string for 'fields_to_extract':
                formData.append("fields_to_extract", JSON.stringify(fieldsArray));

                // 3. Hit your new Express backend API
                const response = await post("/ai/extractData", formData)

                console.log(response)

                // Your original string
                const rawString = response.data?.["stat boxes"];

                // Regex to capture everything up to the dollar amount, and the dollar amount itself
                const regex = /(.*?\$[0-9,]+)/g;

                // Match all pairs and map them into your desired object structure
                const statBoxesArray = (rawString.match(regex) || []).map(item => {
                    // Split each match at the "$" sign
                    const [key, value] = item.split('$');

                    return {
                        key: key.trim(),        // e.g., "MLS Free (Families)"
                        value: `$${value.trim()}` // e.g., "$202,000"
                    };
                });

                let data = {

                    "title": response.data.Title || "",
                    "topic": response.data.Topic || "",
                    "subcategory": response.data.Subcategory || "",
                    "slugId": response.data.ID || "",
                    "tag": response.data.Tag || "",
                    "boost": response.data.Boost || "",
                    "keywords": response.data.Keywords.split(',').map(item => item.trim()) || [],
                    "snippet": response.data.Snippet || "",
                    "explanation": response.data.Explanation || "",
                    "note": response.data.Note || "",
                    "example": response.data.Example || "",
                    "relatedEntries": response.data.RelatedEntries || "",
                    "statBoxes": statBoxesArray,
                    explanation: response.data?.["Plain-English explaination"]
                }

                // 4. (Optional) Store raw response if your UI needs it
                if (setExtractedText) {

                    setExtractedText(JSON.stringify(response.data));
                }

                // 5. Populate form values with the exact keys returned from Groq
                form.setFieldsValue(data);

                message.success('Form fields populated from PDF — please review before saving.');
            } catch (err) {
                console.error(err);
                message.error(err.message || 'Could not read that PDF. Try pasting the text manually.');
            } finally {
                setPdfLoading(false);
            }
            return false; // Stop AntD's default upload POST behavior
        },
    };


    // const draggerProps = {
    //     accept: '.pdf',
    //     multiple: false,
    //     showUploadList: false,
    //     beforeUpload: async (file) => {
    //         setPdfLoading(true);
    //         try {
    //             const text = await extractPdfText(file);
    //             setExtractedText(text);

    //             const values = parsePdfIntoFormValues(text);
    //             form.setFieldsValue(values);

    //             message.success('Form fields populated from PDF — please review before saving.');
    //         } catch (err) {
    //             console.error(err);
    //             message.error('Could not read that PDF. Try pasting the text manually.');
    //         } finally {
    //             setPdfLoading(false);
    //         }
    //         return false; // stop antd's default upload behavior — we handle it ourselves
    //     },
    // };

    const livePreviewTitle = preview?.title
    const livePreviewSnippet = preview?.snippet

    return (
        <Form
            id={ADD_FORM_ID}
            form={form}
            layout="vertical"
            onFinish={handleAddEntry}
            onValuesChange={handleValuesChange}
            requiredMark={false}
            initialValues={entry}
        >
            <Collapse defaultActiveKey={[]} style={{ marginBottom: 16 }}>
                <Panel header="Open a reference PDF alongside the form (optional)" key="pdf">
                    <Spin spinning={pdfLoading} tip="Extracting fields...">
                        <Dragger {...draggerProps} style={{ padding: '24px 0' }}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ color: '#2563eb' }} />
                            </p>
                            <p style={{ fontWeight: 500 }}>Click to choose a PDF or drop one here</p>
                            <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                                We'll try to auto-fill the form below from matching headings
                            </Text>
                        </Dragger>
                    </Spin>

                    {extractedText && (
                        <>
                            <TextArea
                                value={extractedText}
                                readOnly
                                autoSize={{ minRows: 4, maxRows: 10 }}
                                style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}
                            />
                            <Button
                                style={{ marginTop: 8, width: '100%' }}
                                onClick={() => {
                                    console.log('Parsed values from PDF:', extractedText);
                                    const values = parsePdfIntoFormValues(extractedText);
                                    console.log('Parsed values from PDF:', values);
                                    form.setFieldsValue(values);
                                    message.success('Form fields populated from PDF — please review before saving.');
                                }}
                            >
                                Add text to form
                            </Button>
                        </>
                    )}
                </Panel>
            </Collapse>

            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item
                        style={{ marginBottom: 10 }}
                        name="title"
                        label={<FieldLabel required>Title</FieldLabel>}
                        rules={[{ required: true, message: 'Enter a title' }]}
                    >
                        <Input
                            placeholder="e.g. Non-concessional contributions cap"
                            onChange={handleTitleChange}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        style={{ marginBottom: 10 }}

                        name="topic"
                        label={<FieldLabel required>Topic</FieldLabel>}
                        rules={[{ required: true, message: 'Select a topic' }]}
                    >
                        <Select
                            placeholder="— select —"
                            options={categoryOptions}
                            onChange={handleTopicChange}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        style={{ marginBottom: 10 }}

                        name="subcategory"
                        label={<FieldLabel required>Subcategory</FieldLabel>}
                        rules={[{ required: true, message: 'Select a subcategory' }]}
                    >
                        <Select placeholder="— select —" options={subcategoryOptions} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item
                        style={{ marginBottom: 10 }}
                        name="slugId"
                        label={
                            <FieldLabel required>
                                ID <Text style={{ fontWeight: 400, color: '#9ca3af' }}>(unique slug)</Text>
                            </FieldLabel>
                        }
                        rules={[{ required: true, message: 'Enter an ID' }]}
                    >
                        <Input
                            placeholder="auto-generated from title"
                            onChange={() => setIdTouched(true)}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        style={{ marginBottom: 10 }}
                        name="tag"
                        label={
                            <FieldLabel>
                                Tag <Text style={{ fontWeight: 400, color: '#9ca3af' }}>(display label)</Text>
                            </FieldLabel>
                        }
                    >
                        <Input
                            placeholder="auto-filled from topic"
                            onChange={() => setTagTouched(true)}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        style={{ marginBottom: 10 }}
                        name="boost"
                        label={
                            <FieldLabel>
                                Boost <Text style={{ fontWeight: 400, color: '#9ca3af' }}>(&ge;30 = FAQ card)</Text>
                            </FieldLabel>
                        }
                        initialValue={0}
                    >
                        <InputNumber placeholder="0" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                style={{ marginBottom: 10 }}
                name="keywords"
                label={
                    <FieldLabel>
                        Keywords <Text style={{ fontWeight: 400, color: '#9ca3af' }}>(space-separated search terms)</Text>
                    </FieldLabel>
                }
            >
                <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="e.g. NCC, cap, contributions, non-concessional, after-tax"
                    tokenSeparators={[',', ' ', "tab", '\n']}
                    allowClear
                    open={false} // prevents dropdown from popping up since there are no predefined options
                />
            </Form.Item>

            <Form.Item
                style={{ marginBottom: 10 }}
                name="snippet"
                label={
                    <FieldLabel required>
                        Snippet <Text style={{ fontWeight: 400, color: '#9ca3af' }}>(one-line summary shown in results)</Text>
                    </FieldLabel>
                }
                rules={[{ required: true, message: 'Enter a snippet' }]}
            >
                <TextArea rows={2} placeholder="One short sentence that summarises the entry" />
            </Form.Item>

            <Form.Item
                name="explanation"
                label={<FieldLabel required>Plain-English explanation</FieldLabel>}
                rules={[{ required: true, message: 'Enter an explanation' }]}
            >
                <TextArea rows={6} placeholder="Full explanation written for a client or adviser audience..." />
            </Form.Item>

            <div
                style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16,
                    background: '#f9fafb',
                }}
            >
                <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
                    Key-value stat boxes{' '}
                    <Text style={{ fontWeight: 400, fontSize: 12, color: '#9ca3af' }}>
                        (the pairs shown on the answer card)
                    </Text>
                </Title>

                <Form.List name="statBoxes">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <div key={key} className="d-flex align-items-center justify-content-start gap-2 mb-2">
                                    <div style={{ width: "47%", }} >
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'key']}
                                            style={{ marginBottom: 0, width: "100%" }}
                                        >
                                            <Input placeholder="Key (e.g. Daily fee)" />
                                        </Form.Item>
                                    </div>
                                    <div style={{ width: "47%", }} >
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'value']}
                                            style={{ marginBottom: 0, width: "100%" }}
                                        >
                                            <Input placeholder="Value (e.g. $65.55)" />
                                        </Form.Item>
                                    </div>
                                    <div>
                                        <Button
                                            className="border"
                                            style={{ backgroundColor: "#fff" }}
                                            danger
                                            type="text"
                                            icon={<CloseOutlined />}
                                            onClick={() => remove(name)}
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button style={{ borderColor: "#22c55e", color: "#15803d", backgroundColor: "#d5f7e1", fontWeight: "600" }} type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                                Add row
                            </Button>
                        </>
                    )}
                </Form.List>

            </div>

            <Collapse defaultActiveKey={[]} style={{ marginBottom: 16 }}>
                <Panel header="Optional fields (note, example, related entries)" key="optional">
                    <Form.Item
                        name="note"
                        label={
                            <FieldLabel>
                                Note <Text style={{ fontWeight: 400, color: '#9ca3af' }}>(highlighted caveat or reminder)</Text>
                            </FieldLabel>
                        }
                    >
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                        name="example"
                        label={
                            <FieldLabel>
                                Example <Text style={{ fontWeight: 400, color: '#9ca3af' }}>(worked example with figures)</Text>
                            </FieldLabel>
                        }
                    >
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                        name="relatedEntries"
                        label={
                            <FieldLabel>
                                Related entries{' '}
                                <Text style={{ fontWeight: 400, color: '#9ca3af' }}>
                                    (comma-separated IDs, e.g. cc-cap, tsb, faq-super-tax)
                                </Text>
                            </FieldLabel>
                        }
                    >
                        <Input />
                    </Form.Item>
                </Panel>
            </Collapse>

            <div
                style={{
                    border: '1px solid #bbf7d0',
                    background: '#f0fdf4',
                    borderRadius: 8,
                    padding: 16,
                }}
            >
                <Text strong style={{ fontSize: 11, color: '#16a34a', letterSpacing: 0.5 }}>
                    LIVE PREVIEW
                </Text>
                <div style={{ marginTop: 8 }}>
                    <Form.Item shouldUpdate style={{ marginTop: 8, marginBottom: 0 }}>
                        {() => {
                            const title = form.getFieldValue('title');
                            const explanation = form.getFieldValue('explanation');
                            const hasPreviewData = Boolean((title && title.trim()) || (explanation && explanation.trim()));

                            return hasPreviewData ? (
                                <>
                                    {title?.trim() && <Text strong>{title}</Text>}
                                    {explanation?.trim() && (
                                        <div style={{ color: '#4b5563', fontSize: 13 }}>{explanation}</div>
                                    )}
                                </>
                            ) : (
                                <Text type="secondary" italic>
                                    Start filling in the form — the entry will appear here as it would in results.
                                </Text>
                            );
                        }}
                    </Form.Item>
                </div>
            </div>
        </Form>
    )
}

export default KnowledgeEntryForm