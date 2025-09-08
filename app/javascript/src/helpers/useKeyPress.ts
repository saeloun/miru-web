import { useEffect } from "react";

export default function useKeypress(key, action) {
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === key) action();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, action]);
}
