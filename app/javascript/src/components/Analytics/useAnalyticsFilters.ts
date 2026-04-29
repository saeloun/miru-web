import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DateRange } from "react-day-picker";

import {
  buildSearchParams,
  formatReportQueryDate,
  parseNumericListParam,
  parseReportQueryDate,
} from "components/Reports/filterUtils";

import { DEFAULT_ANALYTICS_PRESET, resolveAnalyticsPreset } from "./utils";

type FilterKey = "members" | "clients" | "projects";

type UseAnalyticsFiltersProps = {
  filterKey?: FilterKey;
  defaultPreset?: string;
};

export const useAnalyticsFilters = ({
  filterKey,
  defaultPreset = DEFAULT_ANALYTICS_PRESET,
}: UseAnalyticsFiltersProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPreset = searchParams.get("preset") || defaultPreset;
  const initialFrom = parseReportQueryDate(searchParams.get("from"));
  const initialTo = parseReportQueryDate(searchParams.get("to"));
  const initialDateRange: DateRange | undefined =
    initialFrom || initialTo
      ? { from: initialFrom, to: initialTo || initialFrom }
      : resolveAnalyticsPreset(initialPreset);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange
  );
  const [preset, setPreset] = useState(initialPreset);
  const [selectedIds, setSelectedIds] = useState<number[]>(
    filterKey ? parseNumericListParam(searchParams.get(filterKey)) : []
  );

  useEffect(() => {
    const nextParams = buildSearchParams({
      preset,
      from: formatReportQueryDate(dateRange?.from),
      to: formatReportQueryDate(dateRange?.to),
      ...(filterKey
        ? {
            [filterKey]:
              selectedIds.length > 0 ? selectedIds.join(",") : undefined,
          }
        : {}),
    });

    setSearchParams(nextParams, { replace: true });
  }, [
    dateRange?.from,
    dateRange?.to,
    filterKey,
    preset,
    selectedIds,
    setSearchParams,
  ]);

  useEffect(() => {
    const nextPreset = searchParams.get("preset") || defaultPreset;
    const nextFrom = parseReportQueryDate(searchParams.get("from"));
    const nextTo = parseReportQueryDate(searchParams.get("to"));
    const nextDateRange =
      nextFrom || nextTo
        ? { from: nextFrom, to: nextTo || nextFrom }
        : resolveAnalyticsPreset(nextPreset);

    const nextSelectedIds = filterKey
      ? parseNumericListParam(searchParams.get(filterKey))
      : [];

    setPreset(current => (current === nextPreset ? current : nextPreset));
    setDateRange(current => {
      const currentFrom = formatReportQueryDate(current?.from);
      const currentTo = formatReportQueryDate(current?.to);
      const nextFromString = formatReportQueryDate(nextDateRange?.from);
      const nextToString = formatReportQueryDate(nextDateRange?.to);

      if (currentFrom === nextFromString && currentTo === nextToString) {
        return current;
      }

      return nextDateRange;
    });

    setSelectedIds(current =>
      current.join(",") === nextSelectedIds.join(",")
        ? current
        : nextSelectedIds
    );
  }, [defaultPreset, filterKey, searchParams]);

  return {
    dateRange,
    setDateRange,
    preset,
    setPreset,
    selectedIds,
    setSelectedIds,
    from: formatReportQueryDate(dateRange?.from),
    to: formatReportQueryDate(dateRange?.to),
  };
};
