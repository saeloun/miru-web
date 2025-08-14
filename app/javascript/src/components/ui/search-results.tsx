import React from "react";
import { cn } from "../../lib/utils";
import { ApiStatus } from "constants/index";

interface SearchResultsProps {
  results: any[];
  status?: string;
  isOpen: boolean;
  onClose?: () => void;
  renderItem: (item: any) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
  containerRef?: React.RefObject<HTMLElement>;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results = [],
  status,
  isOpen,
  onClose,
  renderItem,
  emptyMessage = "No matching results found",
  className,
  containerRef,
}) => {
  if (!isOpen) return null;

  const isEmpty = status === ApiStatus.SUCCESS && results.length === 0;

  return (
    <section
      ref={containerRef}
      className={cn(
        "absolute z-50 w-full overflow-hidden rounded-lg bg-white shadow-lg border",
        isEmpty ? "py-4" : "max-h-96 overflow-y-auto",
        className
      )}
      style={{ top: "calc(100% + 4px)" }}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="py-1">
          {results.map((item, index) => (
            <div key={item.id || index} className="hover:bg-muted/50">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SearchResults;
