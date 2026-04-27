import { useCallback } from "react";
import { Button, Modal, Typography } from "antd";
import { IoCloseOutline } from "react-icons/io5";

const { Title } = Typography;

export default function useTitleBlock(defaultOptions = {}) {
  return useCallback(
    ({
      title,
      icon = null,
      gap = 16,
      iconSize = 24,
      iconBoxSize = 44,
      iconBorderRadius = 12,
      iconBackground = "rgb(240, 253, 244)",
      iconBorder = "2px solid rgb(187, 247, 208)",
      titleLevel = 3,
      titleStyle = {},
      wrapperClassName = "w-100 d-flex align-items-center justify-content-start position-relative",
      iconClassName = "d-flex align-items-center justify-content-center",
      clossButton = false,
      isEditing = false,
      onClose = () => {},
    } = {}) => {
      const mergedTitleStyle = {
        margin: 0,
        fontWeight: "700",
        fontSize: 17,
        fontFamily: "Georgia,serif",
        ...(defaultOptions.titleStyle || {}),
        ...titleStyle,
      };

      return (
        <div className={wrapperClassName} style={{ gap }}>
          {icon && (
            <div
              className={iconClassName}
              style={{
                width: iconBoxSize,
                height: iconBoxSize,
                borderRadius: iconBorderRadius,
                background: iconBackground,
                border: iconBorder,
                fontSize: iconSize,
              }}
            >
              {icon}
            </div>
          )}
          <Title level={titleLevel} style={mergedTitleStyle}>
            {title}
          </Title>

          {clossButton && (
            <Button
              className="ModalCloseButtonHover"
              onClick={() => {
                if (isEditing) {
                  Modal.confirm({
                    centered: true,
                    title: "Discard changes?",
                    content:
                      "You have unsaved changes. If you close now, all unsaved changes will be lost. Do you want to discard them?",
                    onOk: onClose,
                    onCancel: () => {},
                    okText: "Discard",
                    cancelText: "Keep Editing",
                    okButtonProps: {
                      type: "default",
                      danger: true,
                    },
                    cancelButtonProps: {
                      type: "default",
                    },
                  });
                } else {
                  onClose();
                }
              }}
            >
              <IoCloseOutline size={25} />
            </Button>
          )}
        </div>
      );
    },
    [defaultOptions],
  );
}
