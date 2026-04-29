import { Button, Col, Form, Row, Select, message } from "antd";
import React, { useState } from "react";
import AdviceGoalCard from "../../../../Common/AdviceGoalCard";
import {
  goalsSectionQuestionsAtom,
  SelectedClient,
} from "../../../../../store/authState";
import { useAtomValue, useSetAtom } from "jotai";
import useApi from "../../../../../hooks/useApi";

const GoalsObjectivesQuestionsModal = ({ modalData }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const selectedClient = useAtomValue(SelectedClient);
  const goalsQuestions = useAtomValue(goalsSectionQuestionsAtom);
  const setGoalsQuestions = useSetAtom(goalsSectionQuestionsAtom);
  const { post, patch } = useApi();
  const cards = modalData?.cards || [];
  const initialValues = {
    ...goalsQuestions,
  };

  const handleScopeChange = (nextValues = []) => {
    const selectedValues = Array.isArray(nextValues) ? nextValues : [];
    if (selectedValues.includes("All Areas")) {
      const isOnlyAllAreas = selectedValues.length === 1;
      const indexOfAllAreas = selectedValues.indexOf("All Areas");
      if (indexOfAllAreas == 0) {
        form.setFieldValue(
          "scope",
          isOnlyAllAreas
            ? ["All Areas"]
            : selectedValues.filter((value) => value !== "All Areas"),
        );
        return;
      } else {
        form.setFieldValue("scope", ["All Areas"]);
        return;
      }
    }

    form.setFieldValue("scope", selectedValues);
  };

  const onFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    setSubmitting(true);

    const payload = {
      ...goalsQuestions,
      ...values,
      ...formValues,
      clientFK: goalsQuestions?.clientFK || selectedClient?._id,
    };

    try {
      const saved = goalsQuestions?.clientFK
        ? await patch("/api/goalsQuestions/Update", payload)
        : await post("/api/goalsQuestions/Add", payload);

      setGoalsQuestions(saved && typeof saved === "object" ? saved : payload);
      message.success("Goals questions updated successfully");
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update goals questions",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div>
      <Form form={form} initialValues={initialValues} onFinish={onFinish}>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={24} className="mt-4">
            <Form.Item name="scope" label="Scope of Advice" className="mb-0">
              <Select
                mode="multiple"
                allowClear
                placeholder="Select your goals"
                suffixIcon="🔍"
                style={{ width: "100%" }}
                options={[
                  { label: "All Areas", value: "All Areas" },
                  ...(cards.map((card) => ({
                    label: card.title,
                    value: card.key,
                  })) || []),
                ]}
                onChange={handleScopeChange}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={24} className="mt-4">
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues !== currentValues
              }
            >
              {({ getFieldValue }) => {
                const selectedScope = getFieldValue("scope") || [];
                const selectedCards = selectedScope.includes("All Areas")
                  ? cards
                  : cards.filter((card) => selectedScope.includes(card.key));

                const selectedSections = selectedCards.flatMap(
                  (card) => card.sections || [],
                );

                if (selectedSections.length === 0) {
                  return <div />;
                }

                return (
                  <Row gutter={[16, 16]}>
                    {selectedSections.map((section) => {
                      const currentStatus =
                        form.getFieldValue(section.key) || "No";

                      return (
                        <Col key={section.key} xs={24} md={8}>
                          <AdviceGoalCard
                            label={section.title}
                            Icon={section.icon}
                            status={currentStatus}
                            info={section.info}
                            onClick={() => {
                              form.setFieldValue(
                                section.key,
                                currentStatus === "Yes" ? "No" : "Yes",
                              );
                            }}
                          />
                        </Col>
                      );
                    })}
                  </Row>
                );
              }}
            </Form.Item>
          </Col>
          <Col xs={24} md={24} className="mt-4 d-flex justify-content-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={submitting}
            >
              Submit
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default GoalsObjectivesQuestionsModal;
