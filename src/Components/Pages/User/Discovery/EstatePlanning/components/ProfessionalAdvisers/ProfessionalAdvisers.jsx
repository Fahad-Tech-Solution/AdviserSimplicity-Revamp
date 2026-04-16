import { Col, Divider, Form, Input, Row, Tabs } from "antd";
import React, { useMemo } from "react";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock";
import { discoveryDataAtom } from "../../../../../../../store/authState";
import { useAtomValue } from "jotai";

const InnerForm = ({ form, key }) => {
  return (
    <Form.Item
      name={["professionalAdvisers", key]}
      rules={[{ required: false }]}
    >
      <Input placeholder="Enter professional adviser's name" />
    </Form.Item>
  );
};

const ProfessionalAdvisers = () => {
  const headingStyle = { fontFamily: "Georgia,serif" };
  const renderTitleBlock = useTitleBlock({
    titleStyle: headingStyle,
  });
  const discoveryData = useAtomValue(discoveryDataAtom);
  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName ||
    discoveryData?.personaldetails?.client?.clientPreferredName ||
    "Client";
  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName ||
    discoveryData?.personaldetails?.partner?.partnerPreferredName ||
    "Partner";

  const [form] = Form.useForm();
  const initialValues = useMemo(
    () => ({
      professionalAdvisers: "",
    }),
    [],
  );
  return (
    <div style={{ padding: "0px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        requiredMark={false}
        colon={false}
        layout="vertical"
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} className={"px-2"}>
            {renderTitleBlock({
              title: "Professional Advisers",
              icon: "👔",
            })}
            <Divider style={{ margin: "8px 0px 0px 0px" }} />
          </Col>

          <Col xs={24}>
            <Tabs
              defaultActiveKey="client"
              items={[
                {
                  key: "client",
                  label: clientName,
                  children: <InnerForm form={form} key="client"  />,
                },
                {
                  key: "partner",
                  label: partnerName,
                  children: <InnerForm form={form} key="partner"  />,
                },
              ]}
            />
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ProfessionalAdvisers;
