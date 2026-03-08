import { useMemo, useState } from "react";

export const useLoadMore = <T>(items: T[], pageSize = 20) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
  };

  const reset = () => {
    setVisibleCount(pageSize);
  };

  return { visibleItems, hasMore, remaining, loadMore, reset };
};
