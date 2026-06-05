import { useEffect, useRef, useState } from "react";

// ─── Hover state config ───────────────────────────────────────────────────────
// Add  data-cursor="scale"  (or glow / label / click / pulse) to any element
// to trigger that state when the cursor hovers over it.
//
// Examples:
//   <button data-cursor="glow">Buy now</button>
//   <a href="/about" data-cursor="label" data-cursor-label="Visit">About</a>
//   <div data-cursor="pulse">Hero section</div>
// ─────────────────────────────────────────────────────────────────────────────

const BASE_COLOR = "#22c55e";

const STATES = {
  default: {
    scale: 1,
    badgeBg: "#111",
    badgeBorder: "1px solid rgba(255,255,255,0.08)",
    badgeColor: "#f0fdf4",
    badgeShadow: "none",
    dotShadow: `0 0 6px ${BASE_COLOR}99`,
    label: null,
    showRing: false,
  },
  scale: {
    scale: 1.22,
    badgeBg: "#111",
    badgeBorder: "1px solid rgba(255,255,255,0.08)",
    badgeColor: "#f0fdf4",
    badgeShadow: "none",
    dotShadow: `0 0 6px ${BASE_COLOR}99`,
    label: null,
    showRing: false,
  },
  glow: {
    scale: 1,
    badgeBg: "#052e16",
    badgeBorder: `1px solid ${BASE_COLOR}55`,
    badgeColor: "#bbf7d0",
    badgeShadow: `0 0 12px ${BASE_COLOR}44`,
    dotShadow: `0 0 10px ${BASE_COLOR}`,
    label: null,
    showRing: false,
  },
  label: {
    scale: 1,
    badgeBg: "#111",
    badgeBorder: "1px solid rgba(255,255,255,0.08)",
    badgeColor: "#f0fdf4",
    badgeShadow: "none",
    dotShadow: `0 0 6px ${BASE_COLOR}99`,
    label: "Click",   // overridden by data-cursor-label if present
    showRing: false,
  },
  click: {
    scale: 0.85,
    badgeBg: "#111",
    badgeBorder: "1px solid rgba(255,255,255,0.08)",
    badgeColor: "#f0fdf4",
    badgeShadow: "none",
    dotShadow: "none",
    label: null,
    showRing: false,
  },
  pulse: {
    scale: 1,
    badgeBg: "#111",
    badgeBorder: "1px solid rgba(255,255,255,0.08)",
    badgeColor: "#f0fdf4",
    badgeShadow: "none",
    dotShadow: `0 0 6px ${BASE_COLOR}99`,
    label: null,
    showRing: true,
  },
};

const RING_CSS = `
@keyframes cc-pulse {
  0%   { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}
`;

function compactTooltip(text, max = 24) {
  if (!text) return "";
  return String(text).replace(/\s+/g, " ").trim();
}

function getElementText(el) {
  if (!(el instanceof HTMLElement)) return "";

  const explicit =
    el.getAttribute("data-cursor-label") ||
    el.getAttribute("data-tooltip") ||
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    el.getAttribute("placeholder") ||
    (el instanceof HTMLInputElement ? el.value : "");

  const explicitText = compactTooltip(explicit);
  if (explicitText) return explicitText;

  return compactTooltip(el.innerText || el.textContent || "");
}

function findActionElement(target) {
  if (!(target instanceof HTMLElement)) return null;

  const selector = [
    "[data-cursor]",
    "button",
    "a",
    "input",
    "textarea",
    "select",
    "summary",
    "[role='button']",
    "[role='link']",
    "[role='tab']",
    "[role='menuitem']",
    "[onclick]",
    "[data-action]",
    ".clickable",
    ".btn",
    ".button",
    ".cursor-pointer",
  ].join(", ");

  const closest = target.closest(selector);
  if (closest instanceof HTMLElement) return closest;

  // Fallback for custom components with pointer cursor but no semantic tag.
  let node = target;
  while (node && node !== document.body) {
    const hasPointer = window.getComputedStyle(node).cursor === "pointer";
    if (hasPointer) return node;
    node = node.parentElement;
  }

  return null;
}

function autoTooltip(target) {
  const el = findActionElement(target);
  if (!(el instanceof HTMLElement)) return null;

  const directHint = getElementText(el);
  if (directHint) return compactTooltip(directHint);

  const tag = el.tagName.toLowerCase();
  const type = (el.getAttribute("type") || "").toLowerCase();

  if (tag === "a") {
    return compactTooltip(el.textContent) || "Open link";
  }
  if (tag === "button" || el.getAttribute("role") === "button") {
    return compactTooltip(el.textContent) || "Click";
  }
  if (tag === "input") {
    if (["submit", "button", "reset"].includes(type)) {
      return compactTooltip(el.getAttribute("value")) || "Click";
    }
    if (["checkbox", "radio"].includes(type)) return "Select";
    if (type === "file") return "Upload";
    return "Type";
  }
  if (tag === "textarea") return "Write";
  if (tag === "select") return "Choose";

  if (["button", "link", "tab", "menuitem"].includes((el.getAttribute("role") || "").toLowerCase())) {
    return "Click";
  }

  return "Click";
}

export default function CustomCursor({ label = "You", color = BASE_COLOR }) {
  const cursorRef = useRef(null);
  const [state, setState]     = useState("default");
  const [dynLabel, setDynLabel] = useState(null);
  const [pressing, setPressing] = useState(false);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const stateRef = useRef("default");
  const dynLabelRef = useRef(null);
  const rafRef = useRef(null);
  const lastPointRef = useRef({ x: -100, y: -100, target: null });
  const lastHoverRef = useRef(null);
  const nextHoverProbeRef = useRef(0);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    dynLabelRef.current = dynLabel;
  }, [dynLabel]);

  // inject pulse keyframe once
  useEffect(() => {
    if (document.getElementById("cc-ring-style")) return;
    const tag = document.createElement("style");
    tag.id = "cc-ring-style";
    tag.textContent = RING_CSS;
    document.head.appendChild(tag);
  }, []);

  // hide native cursor
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const style = document.createElement("style");
    style.id = "cc-hide";
    style.textContent = "* { cursor: none !important; }";
    document.head.appendChild(style);
    return () => {
      document.getElementById("cc-hide")?.remove();
    };
  }, []);

  // mouse tracking + hover detection
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const processMove = () => {
      rafRef.current = null;
      const { x, y } = lastPointRef.current;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
    };

    const onMove = (e) => {
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(processMove);
    };

    const onMouseOver = (e) => {
      const rawTarget = e.target;
      const target = rawTarget instanceof HTMLElement ? rawTarget.closest("[data-cursor]") : null;
      const actionEl = findActionElement(rawTarget);

      const nextHover = target || actionEl || null;
      if (lastHoverRef.current === nextHover) return;
      lastHoverRef.current = nextHover;

      const hoverLabel = autoTooltip(actionEl || rawTarget);

      let nextState = "default";
      let nextLabel = hoverLabel;

      if (target) {
        const s = target.getAttribute("data-cursor");
        nextState = STATES[s] ? s : "default";
        nextLabel = target.getAttribute("data-cursor-label") || hoverLabel;
      } else if (actionEl) {
        nextState = "scale";
        nextLabel = hoverLabel;
      }

      if (stateRef.current !== nextState) {
        stateRef.current = nextState;
        setState(nextState);
      }

      if (dynLabelRef.current !== nextLabel) {
        dynLabelRef.current = nextLabel;
        setDynLabel(nextLabel);
      }
    };

    const onDown = () => setPressing(true);
    const onUp   = () => setPressing(false);
    const hide   = () => {
      visibleRef.current = false;
      lastHoverRef.current = null;
      setVisible(false);
    };
    const onWindowOut = (e) => {
      if (!e.relatedTarget && !e.toElement) hide();
    };
    const onVisibility = () => {
      if (document.hidden) hide();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mouseout", onWindowOut);
    window.addEventListener("blur", hide);
    document.addEventListener("mouseleave", hide);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mouseout", onWindowOut);
      window.removeEventListener("blur", hide);
      document.removeEventListener("mouseleave", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const s            = STATES[pressing ? "click" : state];
  const displayLabel = dynLabel ?? s.label ?? label;
  const arrowColor = state === "default" ? "#ffffff" : "#dfffea";

  return (
    <div
      ref={cursorRef}
      style={{
        position:      "fixed",
        top:           0,
        left:          0,
        pointerEvents: "none",
        zIndex:        2147483647,
        display:       "flex",
        alignItems:    "center",
        gap:           "8px",
        willChange:    "transform",
        transform:     "translate3d(-100px, -100px, 0)",
        opacity:       visible ? 1 : 0,
        visibility:    visible ? "visible" : "hidden",
      }}
    >
      {/* Pulse ring */}
      {s.showRing && (
        <div
          style={{
            position:      "absolute",
            width:         "36px",
            height:        "36px",
            borderRadius:  "50%",
            border:        `1.5px solid ${color}66`,
            top:           "-8px",
            left:          "-8px",
            animation:     "cc-pulse 1.4s ease-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Arrow */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 20 20"
        fill="none"
        style={{
          flexShrink: 0,
          mixBlendMode: "difference",
          filter: "drop-shadow(0 0 1px rgba(255,255,255,0.85)) drop-shadow(0 0 1px rgba(0,0,0,0.9))",
          transition: "transform 0.15s ease",
          transform:  `scale(${pressing ? 0.9 : 1})`,
        }}
      >
        <path
          d="M3 1.5L16.5 9.5L9.5 11L7 18L3 1.5Z"
          fill={arrowColor}
          stroke={arrowColor}
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      </svg>

      {/* Badge */}
      <div
        style={{
          background:      s.badgeBg,
          border:          s.badgeBorder,
          borderRadius:    "999px",
          padding:         "5px 12px 5px 8px",
          display:         "flex",
          alignItems:      "center",
          gap:             "8px",
          boxShadow:       s.badgeShadow,
          whiteSpace:      "nowrap",
          maxWidth:        "min(72vw, 480px)",
          transform:       `scale(${s.scale})`,
          transformOrigin: "left center",
          transition:      "transform 0.15s ease, background 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        <div
          style={{
            width:        "9px",
            height:       "9px",
            borderRadius: "50%",
            background:   color,
            boxShadow:    s.dotShadow,
            flexShrink:   0,
            transition:   "box-shadow 0.2s ease",
          }}
        />
        <span
          style={{
            fontSize:      "12px",
            fontWeight:    600,
            color:         s.badgeColor,
            letterSpacing: "0.02em",
            lineHeight:    1.25,
            wordBreak:     "break-word",
            transition:    "color 0.2s ease",
          }}
        >
          {displayLabel}
        </span>
      </div>
    </div>
  );
}
