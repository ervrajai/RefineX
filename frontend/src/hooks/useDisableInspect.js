import { useEffect } from "react";

/**
 * Custom React Hook to block DevTools and Element Inspection
 * on sensitive Authentication pages across all modern web browsers.
 */
export function useDisableInspect() {
  useEffect(() => {
    // 1. Prevent Right-Click Context Menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 2. Prevent Keyboard Inspection Shortcuts
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAltOrOption = e.altKey;
      const key = e.key ? e.key.toUpperCase() : "";

      // F12 (DevTools)
      if (e.keyCode === 123 || key === "F12") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      // Ctrl+Shift+C / Cmd+Option+C (Select Element)
      if (isCtrlOrCmd && isShift && (key === "I" || key === "J" || key === "C")) {
        e.preventDefault();
        return false;
      }

      // macOS Cmd+Alt/Option+I, Cmd+Alt/Option+J, Cmd+Alt/Option+C, Cmd+Alt/Option+U
      if (isCtrlOrCmd && isAltOrOption && (key === "I" || key === "J" || key === "C" || key === "U")) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U / Cmd+U (View Page Source)
      if (isCtrlOrCmd && key === "U") {
        e.preventDefault();
        return false;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if (isCtrlOrCmd && key === "S") {
        e.preventDefault();
        return false;
      }
    };

    // 3. DevTools Outer Height/Width Tampering Protection
    const devToolsCheck = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        // DevTools opened
        try {
          console.clear();
        } catch (_) {}
      }
    }, 1000);

    // Attach Event Listeners
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup Listeners on Unmount
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsCheck);
    };
  }, []);
}

export default useDisableInspect;
