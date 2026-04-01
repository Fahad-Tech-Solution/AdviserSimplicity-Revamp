import { Button, Divider, Modal, Typography } from "antd";

const { Text, Title } = Typography;

export default function AppModal({
  open,
  onClose = () => {},
  title = "",
  subtitle,
  icon,
  width = 1100,
  children,
  footer = null,
  className = "",
  centered = true,
  blur = true,
  destroyOnClose = true,
}) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={width}
      centered={centered}
      footer={footer}
      mask={{ enabled: true, blur: blur, closable: false }}
      destroyOnHidden={destroyOnClose} // ❗ new prop
      className={`${className}`.trim()}
      styles={{
        container: {
          borderRadius: 16,
        },
        title: {
          fontFamily: "Georgia,serif",
          fontWeight: 600,
          fontSize: 20,
        },
      }}
    >
      <Divider />
      {children}
    </Modal>
  );
}
