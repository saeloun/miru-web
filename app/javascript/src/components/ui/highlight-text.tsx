import React from "react";
import { useDataTableSearch } from "./data-table";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Highlights matching portions of text based on a search query.
 * Similar to browser Ctrl+F highlighting behavior.
 *
 * If query is empty or text is empty, renders the text as-is.
 * Escapes regex special characters in the query for safe matching.
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query,
  className,
  highlightClassName = "bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0",
}) => {
  if (!query || !text) {
    return <span className={className}>{text}</span>;
  }

  // Escape regex special characters in the query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let parts: string[];
  try {
    parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  } catch {
    // If regex fails for any reason, return text as-is
    return <span className={className}>{text}</span>;
  }

  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </span>
  );
};

interface HighlightedCellProps {
  text: string;
  className?: string;
}

/**
 * A convenience component for use inside DataTable cell renderers.
 * Automatically reads the current search query from DataTable context
 * and highlights matching text.
 */
export const HighlightedCell: React.FC<HighlightedCellProps> = ({
  text,
  className,
}) => {
  const searchQuery = useDataTableSearch();

  return (
    <HighlightText text={text} query={searchQuery} className={className} />
  );
};

export default HighlightText;
