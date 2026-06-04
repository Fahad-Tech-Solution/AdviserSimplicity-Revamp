import "./ActiveDot.css";

const DEFAULT_SIZE = 7;
const DEFAULT_COLOR = "#22c55e";
const DEFAULT_SCALE_END = 2.5;
const DEFAULT_DURATION = "1s";

export default function ActiveDot({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  marginRight = 6,
  scaleEnd = DEFAULT_SCALE_END,
  duration = DEFAULT_DURATION,
  className = "",
}) {
  return (
    <span
      className={`active-dot ${className}`.trim()}
      style={{
        width: size,
        height: size,
        marginRight,  
        "--active-dot-size": `${size}px`,
        "--active-dot-color": color,
        "--active-dot-scale-end": scaleEnd,
        "--active-dot-duration": duration,
      }}
      aria-hidden
    >
      <span className="active-dot__ripple" />
      <span className="active-dot__core" />
    </span>
  );
}
