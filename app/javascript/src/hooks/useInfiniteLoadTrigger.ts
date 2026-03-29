import { useEffect, useRef } from "react";

interface UseInfiniteLoadTriggerProps {
  enabled: boolean;
  loading: boolean;
  onLoadMore: () => void;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
}

const useInfiniteLoadTrigger = ({
  enabled,
  loading,
  onLoadMore,
  root = null,
  rootMargin = "320px 0px",
  threshold = 0.1,
}: UseInfiniteLoadTriggerProps) => {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      !enabled ||
      loading ||
      typeof window === "undefined" ||
      !window.IntersectionObserver
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    const currentTarget = targetRef.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [enabled, loading, onLoadMore, root, rootMargin, threshold]);

  return targetRef;
};

export default useInfiniteLoadTrigger;
