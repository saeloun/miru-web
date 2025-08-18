import React, {
  Suspense,
  useCallback,
  useEffect,
  useState,
  useTransition,
  useDeferredValue,
  useRef,
  forwardRef,
  memo,
} from "react";
import {
  MagnifyingGlass,
  X,
  CircleNotch,
  CaretDown,
  Buildings,
  Users,
  FolderOpen,
  Receipt,
  Clock,
  Funnel,
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { Input } from "./input";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { ScrollArea } from "./scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { useDebounce } from "helpers";

export interface SearchItem {
  id: string | number;
  label?: string;
  value?: string;
  name?: string;
  title?: string;
  // Enhanced properties for richer search results
  type?:
    | "client"
    | "project"
    | "team"
    | "invoice"
    | "payment"
    | "entry"
    | "expense"
    | "report"
    | "task";
  avatar?: string;
  subtitle?: string;
  description?: string;
  status?: string;
  amount?: string;
  date?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
  [key: string]: any;
}

export interface UnifiedSearchProps {
  searchAction: (query: string) => Promise<SearchItem[]>;
  placeholder?: string;
  className?: string;
  onSelect?: (item: SearchItem) => void;
  renderItem?: (item: SearchItem) => React.ReactNode;
  debounceMs?: number;
  minSearchLength?: number;
  maxResults?: number;
  emptyText?: string;
  errorText?: string;
  loadingText?: string;
  variant?: "input" | "combobox" | "command" | "modal";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  clearable?: boolean;
  autoFocus?: boolean;
  showSearchIcon?: boolean;
  // Command palette features
  showShortcut?: boolean;
  shortcutKeys?: string[];
  showRecentSearches?: boolean;
  recentSearches?: SearchItem[];
  categories?: string[];
  groupByType?: boolean;
  // Advanced styling
  highlightMatches?: boolean;
  theme?: "light" | "dark" | "auto";
  borderStyle?: "rounded" | "square" | "pill";
  // Legacy support
  handleEnter?: (query: string, shouldUpdate: boolean) => void;
  clearSearch?: () => void;
  // Mobile responsive
  fullWidthOnMobile?: boolean;
  modalOnMobile?: boolean;
}

const SearchSkeleton = memo(() => (
  <div className="p-3 space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
));

// Helper functions for enhanced search results
const getTypeIcon = (type?: SearchItem["type"]) => {
  const iconProps = { className: "h-4 w-4", "aria-hidden": true };

  switch (type) {
    case "client":
      return <Buildings {...iconProps} />;
    case "project":
      return <FolderOpen {...iconProps} />;
    case "team":
      return <Users {...iconProps} />;
    case "invoice":
    case "payment":
      return <Receipt {...iconProps} />;
    case "entry":
      return <Clock {...iconProps} />;
    case "expense":
      return <Receipt {...iconProps} className="h-4 w-4 text-red-500" />;
    case "report":
      return <Funnel {...iconProps} className="h-4 w-4 text-blue-500" />;
    case "task":
      return <Clock {...iconProps} className="h-4 w-4 text-green-500" />;
    default:
      return <MagnifyingGlass {...iconProps} />;
  }
};

const getTypeBadgeColor = (type?: SearchItem["type"]) => {
  switch (type) {
    case "client":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "project":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "team":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "invoice":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "payment":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    case "entry":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    case "expense":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "report":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
    case "task":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

const getPriorityColor = (priority?: SearchItem["priority"]) => {
  switch (priority) {
    case "urgent":
      return "bg-red-500 text-white";
    case "high":
      return "bg-orange-500 text-white";
    case "medium":
      return "bg-yellow-500 text-white";
    case "low":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const DefaultSearchResultItem = memo(
  ({
    item,
    onSelect,
    highlightMatches = false,
    searchQuery = "",
  }: {
    item: SearchItem;
    onSelect: (item: SearchItem) => void;
    highlightMatches?: boolean;
    searchQuery?: string;
  }) => {
    const displayText =
      item.label || item.name || item.title || String(item.id);

    const hasEnhancedData =
      item.type ||
      item.avatar ||
      item.subtitle ||
      item.status ||
      item.amount ||
      item.date ||
      item.priority ||
      item.tags;

    const highlightText = (text: string, query: string) => {
      if (!highlightMatches || !query) return text;

      const parts = text.split(new RegExp(`(${query})`, "gi"));

      return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0">
            {part}
          </mark>
        ) : (
          part
        )
      );
    };

    if (hasEnhancedData) {
      return (
        <div
          className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors group"
          onClick={() => onSelect(item)}
        >
          {/* Icon or Avatar */}
          <div className="flex-shrink-0">
            {item.avatar ? (
              <Avatar className="h-7 w-7">
                <AvatarImage src={item.avatar} alt={displayText} />
                <AvatarFallback className="text-xs font-semibold">
                  {displayText.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                {getTypeIcon(item.type)}
              </div>
            )}
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {highlightText(displayText, searchQuery)}
                </p>
                {item.type && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs px-1.5 py-0.5 font-medium shrink-0",
                      getTypeBadgeColor(item.type)
                    )}
                  >
                    {item.type}
                  </Badge>
                )}
              </div>
              {item.amount && (
                <span className="text-xs font-semibold text-primary shrink-0">
                  {item.amount}
                </span>
              )}
            </div>
            {(item.subtitle ||
              item.description ||
              item.status ||
              item.date) && (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground truncate">
                  {highlightText(
                    item.subtitle || item.description || "",
                    searchQuery
                  )}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {item.status && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {item.status}
                    </Badge>
                  )}
                  {item.date && (
                    <span className="text-xs text-muted-foreground">
                      {item.date}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Simple fallback for basic items
    return (
      <div
        className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors group"
        onClick={() => onSelect(item)}
      >
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <MagnifyingGlass className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-none">
            {highlightText(displayText, searchQuery)}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {highlightText(item.description, searchQuery)}
            </p>
          )}
        </div>
      </div>
    );
  }
);

export const UnifiedSearch = forwardRef<HTMLInputElement, UnifiedSearchProps>(
  (
    {
      searchAction,
      placeholder = "Search...",
      className,
      onSelect,
      renderItem,
      debounceMs = 300,
      minSearchLength = 2,
      maxResults = 10,
      emptyText = "No results found",
      errorText = "Something went wrong",
      loadingText = "Searching...",
      variant = "input",
      size = "md",
      disabled = false,
      clearable = true,
      autoFocus = false,
      showSearchIcon = true,
      highlightMatches = true,
      theme = "auto",
      borderStyle = "rounded",
      groupByType = false,
      fullWidthOnMobile = false,
      // Legacy support
      handleEnter,
      clearSearch,
    },
    ref
  ) => {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SearchItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [groupedResults, setGroupedResults] = useState<
      Record<string, SearchItem[]>
    >({});
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedQuery = useDebounce(query, debounceMs);
    const deferredQuery = useDeferredValue(debouncedQuery);

    // Use a ref to store the latest search action to avoid dependency issues
    const searchActionRef = useRef(searchAction);
    useEffect(() => {
      searchActionRef.current = searchAction;
    }, [searchAction]);

    // Add keyboard shortcut (Cmd+K / Ctrl+K) to focus search
    useEffect(() => {
      const handleKeyboardShortcut = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          inputRef.current?.focus();
        }
      };

      document.addEventListener("keydown", handleKeyboardShortcut);

      return () => {
        document.removeEventListener("keydown", handleKeyboardShortcut);
      };
    }, []);

    const performSearch = useCallback(
      async (searchQuery: string) => {
        if (searchQuery.length < minSearchLength) {
          setResults([]);
          setGroupedResults({});
          setError(null);

          return;
        }

        try {
          setError(null);
          const currentSearchAction = searchActionRef.current;
          const searchResults = await currentSearchAction(searchQuery);

          startTransition(() => {
            const limitedResults = searchResults.slice(0, maxResults);
            setResults(limitedResults);

            if (groupByType) {
              const grouped = limitedResults.reduce((acc, item) => {
                const type = item.type || "other";
                if (!acc[type]) acc[type] = [];
                acc[type].push(item);

                return acc;
              }, {} as Record<string, SearchItem[]>);
              setGroupedResults(grouped);
            }
          });
        } catch (err) {
          console.error("MagnifyingGlass error:", err);
          setError(errorText);
          setResults([]);
          setGroupedResults({});
        }
      },
      [minSearchLength, maxResults, errorText, groupByType]
    );

    useEffect(() => {
      if (deferredQuery) {
        performSearch(deferredQuery);
      } else {
        setResults([]);
        setError(null);
      }
    }, [deferredQuery, performSearch]);

    const handleInputChange = (value: string) => {
      setQuery(value);
      setIsOpen(value.length >= minSearchLength);
    };

    const handleClear = () => {
      setQuery("");
      setResults([]);
      setError(null);
      setIsOpen(false);
      inputRef.current?.focus();

      // Legacy support
      clearSearch?.();
    };

    const handleSelect = (item: SearchItem) => {
      onSelect?.(item);
      setIsOpen(false);
      setQuery(item.label || item.name || item.title || String(item.id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      // Legacy support for Enter key
      if (e.key === "Enter" && handleEnter) {
        handleEnter(deferredQuery, true);
      }
    };

    const showResults = isOpen && deferredQuery.length >= minSearchLength;
    const isLoading = query !== deferredQuery || isPending;

    const sizeClasses = {
      sm: "h-8 text-xs",
      md: "h-10 text-sm",
      lg: "h-12 text-base",
    };

    const borderClasses = {
      rounded: "rounded-md",
      square: "rounded-none",
      pill: "rounded-full",
    };

    const renderResultItem = (item: SearchItem) => {
      if (renderItem) {
        return (
          <div onClick={() => handleSelect(item)} className="cursor-pointer">
            {renderItem(item)}
          </div>
        );
      }

      return (
        <DefaultSearchResultItem
          item={item}
          onSelect={handleSelect}
          highlightMatches={highlightMatches}
          searchQuery={deferredQuery}
        />
      );
    };

    const renderResults = () => {
      if (error) {
        return (
          <div className="p-3 text-sm text-destructive flex items-center gap-2">
            <X className="h-4 w-4" />
            {errorText}
          </div>
        );
      }

      if (results.length === 0) {
        return (
          <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
            <MagnifyingGlass className="h-4 w-4" />
            {emptyText}
          </div>
        );
      }

      if (groupByType && Object.keys(groupedResults).length > 0) {
        return (
          <div className="py-1">
            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                  {type} ({items.length})
                </div>
                {items.map(item => (
                  <div key={item.id}>{renderResultItem(item)}</div>
                ))}
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="py-1">
          {results.map(item => (
            <div key={item.id}>{renderResultItem(item)}</div>
          ))}
        </div>
      );
    };

    if (variant === "combobox") {
      return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className={cn(
                "justify-between font-normal transition-all duration-200",
                sizeClasses[size],
                borderClasses[borderStyle],
                !query && "text-muted-foreground",
                fullWidthOnMobile && "w-full sm:w-auto",
                "hover:border-primary/50 focus:border-primary",
                className
              )}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2 flex-1 overflow-hidden">
                {showSearchIcon && (
                  <MagnifyingGlass className="h-4 w-4 shrink-0 opacity-50" />
                )}
                <span className="truncate">{query || placeholder}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                {isLoading && <CircleNotch className="h-4 w-4 animate-spin" />}
                {clearable && query && (
                  <X
                    className="h-4 w-4 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                    onClick={e => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  />
                )}
                <CaretDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(
              "p-0 shadow-lg border",
              fullWidthOnMobile ? "w-[95vw] sm:w-[400px]" : "w-[400px]"
            )}
            align="start"
          >
            <Command>
              <CommandInput
                placeholder={placeholder}
                value={query}
                onValueChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <CommandList className="max-h-[300px]">
                {showResults && (
                  <Suspense fallback={<SearchSkeleton />}>
                    {isLoading ? (
                      <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                        <CircleNotch className="h-4 w-4 animate-spin" />
                        {loadingText}
                      </div>
                    ) : groupByType &&
                      Object.keys(groupedResults).length > 0 ? (
                      Object.entries(groupedResults).map(([type, items]) => (
                        <CommandGroup
                          key={type}
                          heading={`${type} (${items.length})`}
                        >
                          {items.map(item => (
                            <CommandItem
                              key={item.id}
                              value={String(item.id)}
                              onSelect={() => handleSelect(item)}
                              className="cursor-pointer p-0"
                            >
                              <DefaultSearchResultItem
                                item={item}
                                onSelect={handleSelect}
                                highlightMatches={highlightMatches}
                                searchQuery={deferredQuery}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))
                    ) : results.length === 0 ? (
                      <CommandEmpty>
                        {error ? errorText : emptyText}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {results.map(item => (
                          <CommandItem
                            key={item.id}
                            value={String(item.id)}
                            onSelect={() => handleSelect(item)}
                            className="cursor-pointer p-0"
                          >
                            <DefaultSearchResultItem
                              item={item}
                              onSelect={handleSelect}
                              highlightMatches={highlightMatches}
                              searchQuery={deferredQuery}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </Suspense>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <div className={cn("relative w-full", className)}>
        <div className="relative">
          {showSearchIcon && (
            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            ref={ref || inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              // Only open if there's a query that meets min length requirement
              if (query.length >= minSearchLength) {
                setIsOpen(true);
              }
            }}
            className={cn(
              showSearchIcon && "pl-10",
              (clearable || isLoading) && "pr-10",
              sizeClasses[size],
              borderClasses[borderStyle]
            )}
            disabled={disabled}
            autoFocus={autoFocus}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            {isLoading ? (
              <CircleNotch className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : clearable && query ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={handleClear}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            ) : (
              !query && (
                <div className="hidden sm:flex items-center text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                  <span className="font-mono">
                    {typeof window !== "undefined" &&
                    window.navigator?.platform?.toLowerCase().includes("mac")
                      ? "⌘K"
                      : "Ctrl+K"}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
        {showResults && (
          <div className="absolute top-full mt-1 left-0 right-0 rounded-md border bg-background shadow-lg z-50 max-h-64 overflow-hidden">
            <Suspense fallback={<SearchSkeleton />}>
              <ScrollArea className="max-h-64">
                {error ? (
                  <div className="p-3 text-sm text-destructive flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {errorText}
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    {emptyText}
                  </div>
                ) : (
                  <div className="py-1">
                    {results.map(item => (
                      <div key={item.id}>
                        {renderItem ? (
                          <div
                            onClick={() => handleSelect(item)}
                            className="cursor-pointer"
                          >
                            {renderItem(item)}
                          </div>
                        ) : (
                          <DefaultSearchResultItem
                            item={item}
                            onSelect={handleSelect}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Suspense>
          </div>
        )}
      </div>
    );
  }
);

UnifiedSearch.displayName = "UnifiedSearch";
export default UnifiedSearch;
