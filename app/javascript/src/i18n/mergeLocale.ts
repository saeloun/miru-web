type LocaleRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is LocaleRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const mergeLocale = <T extends LocaleRecord, U extends LocaleRecord>(
  base: T,
  override: U
): T & U => {
  const result: LocaleRecord = { ...base };

  Object.entries(override).forEach(([key, value]) => {
    const baseValue = result[key];

    result[key] =
      isRecord(baseValue) && isRecord(value)
        ? mergeLocale(baseValue, value)
        : value;
  });

  return result as T & U;
};

export default mergeLocale;
