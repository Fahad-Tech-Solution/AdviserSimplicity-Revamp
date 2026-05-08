import { Button, Col, Form, Row, Select, message } from "antd";
import React, { useState } from "react";
import AdviceGoalCard from "../../../../Common/AdviceGoalCard";
import {
  goalsSectionQuestionsAtom,
  SelectedClient,
} from "../../../../../store/authState";
import { useAtomValue, useSetAtom } from "jotai";
import useApi from "../../../../../hooks/useApi";
import { GOALS_OBJECTIVES_CARDS } from "./goalsCatalog.js";

function applyScopeToGoalSectionValues(mergedValues, scope, catalog) {
  const out = { ...(mergedValues && typeof mergedValues === "object" ? mergedValues : {}) };
  const scopeArr = Array.isArray(scope) ? scope : [];
  const allInScope = scopeArr.includes("All Areas");

  (catalog || []).forEach((card) => {
    const cardInScope = allInScope || scopeArr.includes(card.key);
    (card.sections || []).forEach((section) => {
      if (!section?.key) return;
      out[section.key] =
        cardInScope && out[section.key] === "Yes" ? "Yes" : "No";
    });
  });

  return out;
}

function syncFormSectionFieldsToScope(formInstance, scope, catalog) {
  const scopeArr = Array.isArray(scope) ? scope : [];
  const allInScope = scopeArr.includes("All Areas");
  (catalog || []).forEach((card) => {
    const cardInScope = allInScope || scopeArr.includes(card.key);
    (card.sections || []).forEach((section) => {
      if (!section?.key) return;
      if (!cardInScope) {
        formInstance.setFieldValue(section.key, "No");
      }
    });
  });
}

const GoalsObjectivesQuestionsModal = ({ modalData }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const selectedClient = useAtomValue(SelectedClient);
  const goalsQuestions = useAtomValue(goalsSectionQuestionsAtom);
  const setGoalsQuestions = useSetAtom(goalsSectionQuestionsAtom);
  const { post, patch } = useApi();
  const cards = modalData?.cards || [];

  // console.log("cards", cards);
  // console.log("goalsQuestions", goalsQuestions);

  const initialValues = {
    ...goalsQuestions,
  };

  const handleScopeChange = (nextValues = []) => {
    const selectedValues = Array.isArray(nextValues) ? nextValues : [];

    if (selectedValues.includes("All Areas")) {
      const isOnlyAllAreas = selectedValues.length === 1;
      const indexOfAllAreas = selectedValues.indexOf("All Areas");
      if (indexOfAllAreas == 0) {
        const nextScope = isOnlyAllAreas
          ? ["All Areas"]
          : selectedValues.filter((value) => value !== "All Areas");
        form.setFieldValue("scope", nextScope);
        syncFormSectionFieldsToScope(form, nextScope, GOALS_OBJECTIVES_CARDS);
        return;
      } else {
        form.setFieldValue("scope", ["All Areas"]);
        syncFormSectionFieldsToScope(form, ["All Areas"], GOALS_OBJECTIVES_CARDS);
        return;
      }
    }

    form.setFieldValue("scope", selectedValues);
    syncFormSectionFieldsToScope(form, selectedValues, GOALS_OBJECTIVES_CARDS);
  };

  const onFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    setSubmitting(true);

    const scope = formValues?.scope ?? values?.scope ?? [];
    const merged = { ...goalsQuestions, ...values, ...formValues };
    const synced = applyScopeToGoalSectionValues(
      merged,
      scope,
      GOALS_OBJECTIVES_CARDS,
    );

    const payload = {
      ...synced,
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
