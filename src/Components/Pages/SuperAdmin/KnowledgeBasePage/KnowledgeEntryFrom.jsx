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
} from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { CloseOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons'
import React from 'react'
import { SelectedCategory } from './knowledgeBaseData'

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
}) => {
    // Track whether the ID / Tag fields have been hand-edited so we stop
    // overwriting them once the adviser has typed their own value in.
    const [idTouched, setIdTouched] = useState(false)
    const [tagTouched, setTagTouched] = useState(false)
    const [preview, setPreview] = useState(null)

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
        multiple: false,
        accept: '.pdf',
        showUploadList: false,
        beforeUpload: (file) => {
            onExtractPdf?.(file)
            return false // prevent antd from trying to auto-upload
        },
    }

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
        >
            <Collapse ghost defaultActiveKey={[]} style={{ marginBottom: 16 }}>
                <Panel header="Open a reference PDF alongside the form (optional)" key="pdf">
                    <Dragger {...draggerProps} style={{ padding: '24px 0' }}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined style={{ color: '#2563eb' }} />
                        </p>
                        <p style={{ fontWeight: 500 }}>Click to choose a PDF or drop one here</p>
                        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                            Extracted text appears below for copy-paste into the form
                        </Text>
                    </Dragger>
                </Panel>
            </Collapse>

            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item
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
                        name="id"
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
                name="keywords"
                label={
                    <FieldLabel>
                        Keywords <Text style={{ fontWeight: 400, color: '#9ca3af' }}>(space-separated search terms)</Text>
                    </FieldLabel>
                }
            >
                <Input placeholder="e.g. NCC cap contributions non-concessional after-tax" />
            </Form.Item>

            <Form.Item
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
                                <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8, width: '100%' }}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'key']}
                                        style={{ marginBottom: 0, width: 300 }}
                                    >
                                        <Input placeholder="Key (e.g. Daily fee)" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'value']}
                                        style={{ marginBottom: 0, width: 300 }}
                                    >
                                        <Input placeholder="Value (e.g. $65.55)" />
                                    </Form.Item>
                                    <Button
                                        danger
                                        type="text"
                                        icon={<CloseOutlined />}
                                        onClick={() => remove(name)}
                                    />
                                </Space>
                            ))}
                            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                                Add row
                            </Button>
                        </>
                    )}
                </Form.List>
            </div>

            <Collapse ghost defaultActiveKey={[]} style={{ marginBottom: 16 }}>
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
                    {livePreviewTitle || livePreviewSnippet ? (
                        <>
                            {livePreviewTitle && <Text strong>{livePreviewTitle}</Text>}
                            {livePreviewSnippet && (
                                <div style={{ color: '#4b5563', fontSize: 13 }}>{livePreviewSnippet}</div>
                            )}
                        </>
                    ) : (
                        <Text type="secondary" italic>
                            Start filling in the form — the entry will appear here as it would in results.
                        </Text>
                    )}
                </div>
            </div>
        </Form>
    )
}

export default KnowledgeEntryForm