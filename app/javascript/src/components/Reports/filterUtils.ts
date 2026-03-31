import { format, isValid, parseISO } from "date-fns";

export const formatReportApiDate = (date?: Date) =>
  date ? format(date, "dd/MM/yyyy") : undefined;

export const formatReportQueryDate = (date?: Date) =>
  date ? format(date, "yyyy-MM-dd") : undefined;

export const parseReportQueryDate = (value?: string | null) => {
  if (!value) return undefined;

  const parsed = parseISO(value);

  return isValid(parsed) ? parsed : undefined;
};

export const parseNumericListParam = (value?: string | null) =>
  (value || "")
    .split(",")
    .map(item => Number(item.trim()))
    .filter(item => Number.isFinite(item) && item > 0);

export const parseStringListParam = (value?: string | null) =>
  (value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

export const buildSearchParams = (
  values: Record<string, string | number | undefined | null | false>
) => {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === false
    ) {
      return;
    }

    params.set(key, String(value));
  });

  return params;
};

export const toggleNumberListValue = (values: number[], value: number) =>
  values.includes(value)
    ? values.filter(item => item !== value)
    : [...values, value];

export const getMultiFilterLabel = (
  baseLabel: string,
  count: number,
  selectedLabel?: string
) => {
  if (count === 0) return baseLabel;

  if (count === 1 && selectedLabel) return selectedLabel;

  return `${baseLabel} (${count})`;
};

export const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);

    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  return copied;
};
