import { useEffect } from "react";

export function useModalBackHandler(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    const key = `modal-${Date.now()}`;
    window.history.pushState({ modal: key }, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.modal === key) {
        window.history.back();
      }
    };
  }, [open, onClose]);
}
