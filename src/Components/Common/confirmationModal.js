import { Modal } from "antd";

export function confirmRemoveData(onOk, overrides = {}) {
  return Modal.confirm({
    centered: true,
    title: "Remove Data?",
    content:
      "This action will permanently remove the data. This action cannot be undone. Do you want to proceed?",
    onOk,
    onCancel: () => {},
    okText: "Proceed",
    cancelText: "Cancel",
    okButtonProps: {
      type: "default",
      danger: true,
    },
    cancelButtonProps: {
      type: "default",
    },
    ...(overrides && typeof overrides === "object" ? overrides : {}),
  });
}

