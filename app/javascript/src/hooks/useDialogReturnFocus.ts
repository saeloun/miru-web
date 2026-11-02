import { MouseEvent, useRef } from "react";

const useDialogReturnFocus = () => {
  const opener = useRef<HTMLButtonElement | null>(null);
  const fallbackRef = useRef<HTMLHeadingElement | null>(null);

  const remember = (event: MouseEvent<HTMLButtonElement>) => {
    opener.current = event.currentTarget;
  };

  const restore = (event: Event) => {
    event.preventDefault();
    const dialog = document.querySelector<HTMLElement>(
      '[role="dialog"][data-state="open"]'
    );
    const target = opener.current;
    if (
      target?.isConnected &&
      !target.disabled &&
      (!dialog || dialog.contains(target))
    ) {
      target.focus();
    } else if (dialog) {
      if (!dialog.contains(document.activeElement)) dialog.focus();
    } else {
      fallbackRef.current?.focus();
    }
  };

  return { remember, restore, fallbackRef };
};

export default useDialogReturnFocus;
