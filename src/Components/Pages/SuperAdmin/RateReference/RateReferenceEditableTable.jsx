import { Form, Input, InputNumber, Table } from 'antd';

function formatCellValue(value, column, record) {
    if (typeof column.renderView === 'function') {
        return column.renderView({ value, column, record });
    }

    return value ?? '--';
}

export default function RateReferenceEditableTable({
    editing = false,
    columns = [],
    data = [],
    rowPathKey = 'formPath',
}) {
    const form = Form.useFormInstance();
    const resolvedColumns = columns.map((column) => ({
        ...column,
        align: column.align || (column.type === 'number' ? 'right' : 'left'),
        render: (value, record) => {
            const name = [record[rowPathKey] ?? record.key, column.dataIndex];
            const formValue = form.getFieldValue(name);
            const currentValue = formValue === undefined ? value : formValue;
            const isEditable =
                typeof column.editable === 'function'
                    ? column.editable(record)
                    : column.editable !== false;
            if (!editing || !isEditable) {
                return formatCellValue(currentValue, column, record);
            }

            const sharedFieldProps = {
                ...column.fieldProps,
                style: { ...column.fieldProps?.style, width: '100%' },
            };
            const handleChange = (nextValue) => {
                column.onChange?.(nextValue, record, column);
            };
            const field =
                column.type === 'number' ? (
                    <InputNumber {...sharedFieldProps} onChange={handleChange} />
                ) : (
                    <Input {...sharedFieldProps} onChange={handleChange} />
                );

            return (
                <Form.Item name={name} initialValue={value} rules={column.rules} noStyle>
                    {field}
                </Form.Item>
            );
        },
    }));

    return (
        <Table
            rowKey="key"
            columns={resolvedColumns}
            dataSource={data}
            bordered
            size="small"
            pagination={false}
            tableLayout="fixed"
            scroll={{ x: true }}
        />
    );
}
