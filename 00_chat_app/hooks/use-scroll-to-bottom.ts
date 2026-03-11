import { useRef, useState, useEffect, useCallback } from "react";

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollBehaviorRef = useRef<ScrollBehavior | false>(false);

  useEffect(() => {
    if (scrollBehaviorRef.current) {
      const behavior = scrollBehaviorRef.current;
      scrollBehaviorRef.current = false;
      endRef.current?.scrollIntoView({
        behavior,
        block: "nearest",
      });
    }
  });

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      scrollBehaviorRef.current = behavior;
      // Trigger a re-render so the effect runs
      setIsAtBottom((prev) => prev);
      // Also do an immediate scroll for responsiveness
      endRef.current?.scrollIntoView({
        behavior,
        block: "nearest",
      });
    },
    [],
  );

  function onViewportEnter() {
    setIsAtBottom(true);
  }

  function onViewportLeave() {
    setIsAtBottom(false);
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
