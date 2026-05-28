(function () {
  if (window.__gkkAdminCursorInit) return;
  window.__gkkAdminCursorInit = true;

  var BASE_COLOR = "#22c55e";
  var defaultLabel = "Admin";

  var style = document.createElement("style");
  style.id = "admin-cursor-style";
  style.textContent = [
    "*{cursor:none !important;}",
    "#admin-custom-cursor{position:fixed;top:-100px;left:-100px;pointer-events:none;z-index:2147483647;display:flex;align-items:flex-end;gap:5px;will-change:left,top;opacity:0;visibility:hidden}",
    "#admin-custom-cursor .ac-badge{background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:4px 11px 4px 7px;display:flex;align-items:center;gap:6px;margin-bottom:3px;box-shadow:none;white-space:normal;max-width:min(72vw,440px)}",
    "#admin-custom-cursor .ac-dot{width:9px;height:9px;border-radius:50%;background:" + BASE_COLOR + ";box-shadow:0 0 6px rgba(34,197,94,0.6);flex-shrink:0}",
    "#admin-custom-cursor .ac-label{font-size:12px;font-weight:600;color:#f0fdf4;letter-spacing:0.02em;line-height:1.25;word-break:break-word}"
  ].join("");
  document.head.appendChild(style);

  var cursor = document.createElement("div");
  cursor.id = "admin-custom-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = ""
    + '<svg width="22" height="22" viewBox="0 0 20 20" fill="none" style="flex-shrink:0;mix-blend-mode:difference;filter:drop-shadow(0 0 1px rgba(255,255,255,0.85)) drop-shadow(0 0 1px rgba(0,0,0,0.9));">'
    + '  <path d="M3 1.5L16.5 9.5L9.5 11L7 18L3 1.5Z" fill="#ffffff" stroke="#ffffff" stroke-width="0.7" stroke-linejoin="round"></path>'
    + "</svg>"
    + '<div class="ac-badge">'
    + '  <div class="ac-dot"></div>'
    + '  <span class="ac-label">' + defaultLabel + "</span>"
    + "</div>";
  document.body.appendChild(cursor);

  var labelNode = cursor.querySelector(".ac-label");
  var arrowPath = cursor.querySelector("svg path");
  var visible = false;

  function showCursor() {
    if (visible) return;
    visible = true;
    cursor.style.opacity = "1";
    cursor.style.visibility = "visible";
  }

  function hideCursor() {
    visible = false;
    cursor.style.opacity = "0";
    cursor.style.visibility = "hidden";
  }

  function cleanText(text) {
    if (!text) return "";
    return String(text).replace(/\s+/g, " ").trim();
  }

  function getElementText(el) {
    if (!(el instanceof HTMLElement)) return "";

    var explicit = cleanText(
      el.getAttribute("data-cursor-label")
      || el.getAttribute("data-tooltip")
      || el.getAttribute("aria-label")
      || el.getAttribute("title")
      || el.getAttribute("placeholder")
      || ((el.tagName.toLowerCase() === "input") ? el.getAttribute("value") : "")
    );
    if (explicit) return explicit;

    return cleanText(el.innerText || el.textContent || "");
  }

  function findActionElement(target) {
    if (!(target instanceof HTMLElement)) return null;

    var selector = [
      "[data-cursor-label]",
      "[data-tooltip]",
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
      ".cursor-pointer"
    ].join(", ");

    var closest = target.closest(selector);
    if (closest instanceof HTMLElement) return closest;

    var node = target;
    while (node && node !== document.body) {
      if (window.getComputedStyle(node).cursor === "pointer") return node;
      node = node.parentElement;
    }

    return null;
  }

  function resolveTooltip(target) {
    var el = findActionElement(target);
    if (!(el instanceof HTMLElement)) return defaultLabel;

    var direct = getElementText(el);
    if (direct) return direct;

    var tag = el.tagName.toLowerCase();
    var type = (el.getAttribute("type") || "").toLowerCase();

    if (tag === "button") {
      return cleanText(el.textContent) || "Click";
    }
    if (tag === "a") {
      return cleanText(el.textContent) || "Open link";
    }
    if (tag === "input") {
      if (type === "submit" || type === "button" || type === "reset") {
        return cleanText(el.getAttribute("value")) || "Click";
      }
      if (type === "checkbox" || type === "radio") return "Select";
      if (type === "file") return "Upload";
      return "Type";
    }
    if (tag === "textarea") return "Write";
    if (tag === "select") return "Choose";
    if ((el.getAttribute("role") || "").toLowerCase() === "button") {
      return cleanText(el.textContent) || "Click";
    }

    return "Click";
  }

  function onMove(e) {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
    showCursor();

    var hovered = document.elementFromPoint(e.clientX, e.clientY) || e.target;
    var actionEl = findActionElement(hovered);
    if (arrowPath) {
      var hoverColor = actionEl ? "#dfffea" : "#ffffff";
      arrowPath.setAttribute("fill", hoverColor);
      arrowPath.setAttribute("stroke", hoverColor);
    }
    labelNode.textContent = resolveTooltip(hovered);
  }

  function onWindowOut(e) {
    if (!e.relatedTarget && !e.toElement) {
      hideCursor();
    }
  }

  function onVisibility() {
    if (document.hidden) hideCursor();
  }

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseout", onWindowOut);
  window.addEventListener("blur", hideCursor);
  document.addEventListener("mouseleave", hideCursor);
  document.addEventListener("visibilitychange", onVisibility);
})();
